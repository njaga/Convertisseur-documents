# Office Converter Service

Small stateless HTTP service used by FileConvert for Office → PDF conversion.

## Supported inputs

- DOC / DOCX
- XLS / XLSX
- PPT / PPTX
- ODT / ODS / ODP

Output is currently PDF only.

## Run with Docker

```bash
docker build -t fileconvert-office ./server/office-converter
docker run --rm -p 8080:8080 \
  -e ALLOWED_ORIGIN=http://localhost:5173 \
  fileconvert-office
```

Health check:

```bash
curl http://localhost:8080/health
```

Test conversion:

```bash
curl -X POST http://localhost:8080/convert/pdf \
  -H 'X-File-Name: sample.docx' \
  -H 'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document' \
  --data-binary @sample.docx \
  --output sample.pdf
```

Then configure the frontend:

```env
VITE_OFFICE_CONVERTER_URL=http://localhost:8080
```

## Security model

- Raw file body instead of multipart parsing.
- Allowed extensions are validated server-side.
- Filenames are sanitized and never interpolated into a shell command.
- LibreOffice is executed through `spawn()` with separate arguments.
- Temporary working directories are removed after success or failure.
- Upload size is limited to 50 MB by default (`MAX_UPLOAD_BYTES`).
- Conversion timeout is 60 seconds.
- Responses are marked `Cache-Control: no-store`.
- CORS can be restricted with `ALLOWED_ORIGIN`.

The service is intentionally stateless and does not persist uploaded documents.
