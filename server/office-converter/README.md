# Doxali Office converter

Stateless HTTP service used by Doxali for Office → PDF conversion through LibreOffice Headless.

The service is optional. The frontend only exposes Office formats when `VITE_OFFICE_CONVERTER_URL` points to a deployed instance.

## Supported input formats

- DOC / DOCX
- XLS / XLSX
- PPT / PPTX
- ODT / ODS / ODP

The current output format is PDF.

## Run with Docker

```bash
docker build -t doxali-office ./server/office-converter
docker run --rm -p 8080:8080 \
  -e ALLOWED_ORIGIN=http://localhost:5173 \
  doxali-office
```

Health check:

```bash
curl http://localhost:8080/health
```

Example conversion:

```bash
curl -X POST http://localhost:8080/convert/pdf \
  -H 'X-File-Name: sample.docx' \
  -H 'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document' \
  --data-binary @sample.docx \
  --output sample.pdf
```

Configure the frontend with:

```env
VITE_OFFICE_CONVERTER_URL=http://localhost:8080
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP listen port |
| `MAX_UPLOAD_BYTES` | `52428800` | Maximum accepted request body |
| `ALLOWED_ORIGIN` | unset | Optional CORS origin restriction |

The conversion timeout is enforced by the service implementation.

## Security model

- The request body is handled as a raw document rather than through a multipart upload directory.
- Input extensions are validated server-side.
- Filenames are sanitized and are never interpolated into a shell command.
- LibreOffice is started with `spawn()` and separate arguments.
- Each request receives an isolated temporary working directory.
- Temporary files are removed after success or failure.
- Upload size is limited.
- Conversion time is bounded.
- Responses use `Cache-Control: no-store`.
- CORS can be restricted with `ALLOWED_ORIGIN`.

The service does not intentionally persist uploaded documents. Operators are still responsible for securing the host, transport layer, logs and surrounding infrastructure.
