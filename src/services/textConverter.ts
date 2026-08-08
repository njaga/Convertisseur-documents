import DOMPurify from 'dompurify';
import { marked } from 'marked';
import TurndownService from 'turndown';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

function stripHtml(html: string): string {
  const safe = sanitizeHtml(html);
  const document = new DOMParser().parseFromString(safe, 'text/html');
  return document.body.textContent?.trim() ?? '';
}

async function markdownToHtml(markdown: string): Promise<string> {
  const rendered = await marked.parse(markdown, {
    gfm: true,
    breaks: false,
  });
  const safe = sanitizeHtml(rendered);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Document converti</title></head><body>${safe}</body></html>`;
}

function htmlToMarkdown(html: string): string {
  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  });
  return service.turndown(sanitizeHtml(html)).trim();
}

export async function convertTextDocument(
  file: File,
  outputFormat: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const input = file.name.split('.').pop()?.toLowerCase() || '';
  const output = outputFormat.toLowerCase();
  onProgress(20);
  const content = await file.text();
  onProgress(55);

  let result: string;
  let mimeType: string;

  if (input === 'txt' && output === 'html') {
    result = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(file.name)}</title></head><body><pre>${escapeHtml(content)}</pre></body></html>`;
    mimeType = 'text/html';
  } else if (input === 'txt' && output === 'md') {
    result = content;
    mimeType = 'text/markdown';
  } else if (input === 'md' && output === 'html') {
    result = await markdownToHtml(content);
    mimeType = 'text/html';
  } else if (input === 'md' && output === 'txt') {
    const html = await markdownToHtml(content);
    result = stripHtml(html);
    mimeType = 'text/plain';
  } else if (input === 'html' && output === 'txt') {
    result = stripHtml(content);
    mimeType = 'text/plain';
  } else if (input === 'html' && output === 'md') {
    result = htmlToMarkdown(content);
    mimeType = 'text/markdown';
  } else {
    throw new Error(`Conversion ${input.toUpperCase()} vers ${output.toUpperCase()} non supportée.`);
  }

  onProgress(90);
  const url = URL.createObjectURL(new Blob([result], { type: mimeType }));
  onProgress(100);
  return url;
}
