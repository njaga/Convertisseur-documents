import {
  PDFButton,
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFField,
  PDFOptionList,
  PDFRadioGroup,
  PDFSignature,
  PDFTextField,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import type { PdfOutput } from './pdfTools';

export type PdfFormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'list' | 'button' | 'signature' | 'unknown';
export type PdfFormValue = string | boolean | string[];

export interface PdfFormFieldSnapshot {
  name: string;
  type: PdfFormFieldType;
  value: PdfFormValue;
  options: string[];
  readOnly: boolean;
  required: boolean;
  multiline: boolean;
}

export interface PdfFormInspection {
  fields: PdfFormFieldSnapshot[];
  pageCount: number;
  hasXfa: boolean;
  signatureCount: number;
}

export type NewPdfFormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown';

export interface NewPdfFormField {
  id: string;
  type: NewPdfFormFieldType;
  name: string;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  options: string[];
  defaultValue: string;
  checked: boolean;
  multiline: boolean;
  required: boolean;
}

export interface PdfFormEdits {
  values: Record<string, PdfFormValue>;
  removedFields: string[];
  newFields: NewPdfFormField[];
  flatten: boolean;
  removeXfa: boolean;
}

function fieldType(field: PDFField): PdfFormFieldType {
  if (field instanceof PDFTextField) return 'text';
  if (field instanceof PDFCheckBox) return 'checkbox';
  if (field instanceof PDFRadioGroup) return 'radio';
  if (field instanceof PDFDropdown) return 'dropdown';
  if (field instanceof PDFOptionList) return 'list';
  if (field instanceof PDFButton) return 'button';
  if (field instanceof PDFSignature) return 'signature';
  return 'unknown';
}

function fieldValue(field: PDFField): PdfFormValue {
  if (field instanceof PDFTextField) return field.getText() ?? '';
  if (field instanceof PDFCheckBox) return field.isChecked();
  if (field instanceof PDFRadioGroup) return field.getSelected() ?? '';
  if (field instanceof PDFDropdown) return field.getSelected();
  if (field instanceof PDFOptionList) return field.getSelected();
  return '';
}

function fieldOptions(field: PDFField): string[] {
  if (field instanceof PDFRadioGroup) return field.getOptions();
  if (field instanceof PDFDropdown) return field.getOptions();
  if (field instanceof PDFOptionList) return field.getOptions();
  return [];
}

export async function inspectPdfForm(file: File): Promise<PdfFormInspection> {
  const document = await PDFDocument.load(await file.arrayBuffer());
  const form = document.getForm();
  const fields = form.getFields().map(field => ({
    name: field.getName(),
    type: fieldType(field),
    value: fieldValue(field),
    options: fieldOptions(field),
    readOnly: field.isReadOnly(),
    required: field.isRequired(),
    multiline: field instanceof PDFTextField ? field.isMultiline() : false,
  }));

  return {
    fields,
    pageCount: document.getPageCount(),
    hasXfa: form.hasXFA(),
    signatureCount: fields.filter(field => field.type === 'signature').length,
  };
}

function setExistingValue(field: PDFField, value: PdfFormValue): void {
  if (field instanceof PDFTextField) {
    field.setText(typeof value === 'string' ? value : '');
    return;
  }
  if (field instanceof PDFCheckBox) {
    if (value === true) field.check();
    else field.uncheck();
    return;
  }
  if (field instanceof PDFRadioGroup) {
    if (typeof value === 'string' && value) field.select(value);
    return;
  }
  if (field instanceof PDFDropdown) {
    if (Array.isArray(value)) {
      if (value.length) field.select(value[0]);
      else field.clear();
    } else if (typeof value === 'string' && value) field.select(value);
    else field.clear();
    return;
  }
  if (field instanceof PDFOptionList) {
    if (Array.isArray(value)) field.select(value);
    else if (typeof value === 'string' && value) field.select(value);
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function toPageRect(field: NewPdfFormField, pageWidth: number, pageHeight: number) {
  const width = pageWidth * clamp(field.width, 2, 95) / 100;
  const height = pageHeight * clamp(field.height, 2, 95) / 100;
  const x = pageWidth * clamp(field.x, 0, 100 - field.width) / 100;
  const yFromTop = pageHeight * clamp(field.y, 0, 100 - field.height) / 100;
  return { x, y: pageHeight - yFromTop - height, width, height };
}

function safeFieldName(name: string, fallback: string): string {
  const cleaned = name.trim().replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
  return cleaned || fallback;
}

function uniqueFieldName(form: ReturnType<PDFDocument['getForm']>, requested: string): string {
  if (!form.getFieldMaybe(requested)) return requested;
  let index = 2;
  while (form.getFieldMaybe(`${requested}.${index}`)) index += 1;
  return `${requested}.${index}`;
}

function drawFieldLabel(page: ReturnType<PDFDocument['getPage']>, label: string, x: number, y: number, height: number, font: Awaited<ReturnType<PDFDocument['embedFont']>>): void {
  if (!label.trim()) return;
  page.drawText(label.trim(), {
    x,
    y: Math.min(page.getHeight() - 10, y + height + 4),
    size: 9,
    font,
    color: rgb(0.2, 0.23, 0.28),
    maxWidth: Math.max(40, page.getWidth() - x - 12),
  });
}

export async function applyPdfFormEdits(file: File, edits: PdfFormEdits): Promise<PdfOutput> {
  const document = await PDFDocument.load(await file.arrayBuffer());
  const form = document.getForm();
  const font = await document.embedFont(StandardFonts.Helvetica);

  if (edits.removeXfa && form.hasXFA()) form.deleteXFA();

  for (const name of edits.removedFields) {
    const field = form.getFieldMaybe(name);
    if (field) form.removeField(field);
  }

  Object.entries(edits.values).forEach(([name, value]) => {
    const field = form.getFieldMaybe(name);
    if (!field || edits.removedFields.includes(name)) return;
    setExistingValue(field, value);
  });

  for (let index = 0; index < edits.newFields.length; index += 1) {
    const specification = edits.newFields[index];
    const pageIndex = clamp(Math.round(specification.page) - 1, 0, document.getPageCount() - 1);
    const page = document.getPage(pageIndex);
    const rect = toPageRect(specification, page.getWidth(), page.getHeight());
    const requestedName = safeFieldName(specification.name, `doxali.field.${index + 1}`);
    const name = uniqueFieldName(form, requestedName);
    const appearance = {
      ...rect,
      borderColor: rgb(0.42, 0.47, 0.55),
      backgroundColor: rgb(1, 1, 1),
      borderWidth: 1,
    };

    drawFieldLabel(page, specification.label, rect.x, rect.y, rect.height, font);

    if (specification.type === 'text') {
      const field = form.createTextField(name);
      if (specification.multiline) field.enableMultiline();
      if (specification.required) field.enableRequired();
      if (specification.defaultValue) field.setText(specification.defaultValue);
      field.addToPage(page, { ...appearance, font });
      continue;
    }

    if (specification.type === 'checkbox') {
      const field = form.createCheckBox(name);
      if (specification.required) field.enableRequired();
      field.addToPage(page, appearance);
      if (specification.checked) field.check();
      continue;
    }

    if (specification.type === 'dropdown') {
      const field = form.createDropdown(name);
      const options = specification.options.map(value => value.trim()).filter(Boolean);
      field.setOptions(options.length ? options : ['Option 1', 'Option 2']);
      if (specification.required) field.enableRequired();
      if (specification.defaultValue) field.select(specification.defaultValue);
      field.addToPage(page, { ...appearance, font });
      continue;
    }

    const field = form.createRadioGroup(name);
    const options = specification.options.map(value => value.trim()).filter(Boolean);
    const radioOptions = options.length ? options : ['Oui', 'Non'];
    if (specification.required) field.enableRequired();
    const radioSize = Math.max(10, Math.min(rect.height, 16));
    const slotWidth = rect.width / radioOptions.length;
    radioOptions.forEach((option, optionIndex) => {
      const optionX = rect.x + optionIndex * slotWidth;
      field.addOptionToPage(option, page, {
        x: optionX,
        y: rect.y + Math.max(0, (rect.height - radioSize) / 2),
        width: radioSize,
        height: radioSize,
        borderColor: rgb(0.42, 0.47, 0.55),
        backgroundColor: rgb(1, 1, 1),
        borderWidth: 1,
      });
      page.drawText(option, {
        x: optionX + radioSize + 4,
        y: rect.y + Math.max(0, (rect.height - 9) / 2),
        size: 9,
        font,
        color: rgb(0.2, 0.23, 0.28),
        maxWidth: Math.max(10, slotWidth - radioSize - 6),
      });
    });
    if (specification.defaultValue && radioOptions.includes(specification.defaultValue)) field.select(specification.defaultValue);
  }

  form.updateFieldAppearances(font);
  if (edits.flatten) form.flatten();

  const bytes = await document.save();
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  return {
    name: `${file.name.replace(/\.pdf$/i, '')}-formulaire.pdf`,
    url: URL.createObjectURL(blob),
  };
}
