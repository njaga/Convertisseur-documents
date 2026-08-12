# Doxali

Doxali is an open-source document toolkit for common PDF, image, audio, video and text operations. The web application follows a browser-first approach: when an operation can be performed reliably on the client, the file stays on the user’s device.

Production: https://convertisseur-documents.vercel.app

## Principles

- Expose only conversions that have a working implementation.
- Prefer local processing for privacy and predictable infrastructure costs.
- Keep the main workflows usable without an account.
- Make document operations visual when ordering or positioning matters.
- Treat optional server-side capabilities as explicit integrations, not silent fallbacks.

## Main features

### PDF

- Merge and split PDF files.
- Reorder pages with drag and drop.
- Rotate, duplicate, remove and extract pages.
- Add text, images, signatures, shapes, highlights, redaction areas and freehand annotations.
- Fill existing AcroForm fields and create new form fields.
- Convert PDF pages to PNG.
- Convert images to PDF with visual ordering.
- Compress PDF files with configurable quality levels.
- Store and restore local editing drafts.

### File conversion

- Images: PNG, JPG/JPEG, WebP and ICO.
- Video: MP4, WebM, AVI, MKV, MOV and GIF outputs where supported.
- Audio: MP3, WAV, OGG, FLAC, M4A and AAC.
- Text: TXT, Markdown and HTML.
- Office → PDF through the optional LibreOffice service.

### Document utilities

- Visual PDF signing.
- Local OCR when the browser exposes the required text-detection API.
- Simple PDF document generation.
- Batch conversion with sequential processing to limit memory pressure.
- Local history for recent outputs.

## Architecture

```text
Browser
├── React application
│   ├── pages          route-level workflows
│   ├── components     reusable UI and editors
│   ├── services       conversion and document engines
│   ├── utils          format registry and shared helpers
│   └── content        route metadata and editorial content
├── pdf-lib / PDF.js   PDF editing and rendering
├── Canvas             image processing
├── FFmpeg.wasm        audio and video processing
└── IndexedDB          local drafts and history

Build / deployment assets
├── content                       SEO and editorial source data
├── scripts/prerender-seo.mjs     route HTML and sitemap generation
└── public/og-image.png           social preview image

Optional service
└── server/office-converter       LibreOffice Headless → PDF
```

Route metadata and FAQ content are stored as data files in `content/`. The production build generates route-specific HTML documents so crawlers receive the correct title, description, canonical URL, Open Graph data and structured data before React starts.

For a more detailed technical overview, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Local development

Requirements:

- Node.js 22.12 or newer
- npm

```bash
git clone https://github.com/njaga/Convertisseur-documents.git
cd Convertisseur-documents
npm ci
npm run dev
```

The application is then available through the local Vite development server.

## Quality checks

Run the same checks used by CI before opening a pull request:

```bash
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
node --check server/office-converter/server.mjs
npm run build
```

`npm run build` runs Vite and then generates the SEO prerendered documents and sitemap.

## Optional Office → PDF service

Office conversion is deliberately separated from browser-only processing. The frontend exposes Office inputs only when `VITE_OFFICE_CONVERTER_URL` is configured.

```env
VITE_OFFICE_CONVERTER_URL=https://office-converter.example.com
```

The service lives in `server/office-converter` and uses LibreOffice Headless in Docker. It validates input extensions, limits upload size, uses a conversion timeout and removes temporary working directories after each request.

See [server/office-converter/README.md](server/office-converter/README.md) for deployment details.

## Privacy model

| Operation | Processing location |
| --- | --- |
| PDF editing and page tools | Browser |
| Image conversion and optimization | Browser |
| Audio and video conversion | Browser via FFmpeg.wasm |
| TXT / Markdown / HTML conversion | Browser |
| OCR | Browser when the native API is available |
| Local drafts and history | IndexedDB on the device |
| Office → PDF | Optional configured LibreOffice service |

The Office service is stateless by design and removes temporary files after conversion. Browser-based operations can still consume significant memory for large PDF, image or video files.

## Known limitations

- PDF compression currently rebuilds pages from their rendered appearance. Interactive elements such as links or form behavior may therefore be flattened.
- OCR depends on a browser capability that is not available everywhere.
- Office conversion is available only when the optional LibreOffice service is deployed and configured.
- Large media files and long PDFs may be constrained by browser memory, especially on mobile devices.

These limitations are documented intentionally so the interface does not promise behavior that the underlying engines cannot guarantee.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes, especially when adding a new conversion pair or document engine.

For security-sensitive reports, see [SECURITY.md](SECURITY.md).

## Maintainer

Ndiaga Ndiaye

- https://ndiagandiaye.com
- https://github.com/njaga
