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
- Add text or image watermarks with opacity, rotation, repetition and page selection.
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
- Browser OCR for French and English using direct PDF text extraction when possible and Tesseract WebAssembly for scans and images.
- Simple PDF document generation.
- Batch conversion with sequential processing to limit memory pressure.
- Local history for recent outputs from conversion, PDF, optimization and document workflows.

## Architecture

```text
Browser
├── React application
│   ├── pages          route-level workflows
│   ├── components     reusable UI and editors
│   ├── services       conversion and document engines
│   ├── utils          format registry and shared helpers
│   └── content        route metadata and editorial content
├── pdf-lib / PDF.js   PDF editing, rendering and text extraction
├── Tesseract.js/WASM  OCR for scanned pages and images
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

## OCR runtime assets

OCR no longer depends on an experimental browser text-detection API. For text-native PDFs, Doxali first extracts the embedded text layer with PDF.js. Scanned PDF pages and image files are recognized in the browser with Tesseract.js 7 and WebAssembly.

To keep the application bundle smaller, the OCR engine, its Web Worker/core and the French/English trained-data files are downloaded on demand from pinned public endpoints when OCR is first used. The document itself is not uploaded to those endpoints; only runtime assets are fetched. A network connection is therefore required the first time those assets are not already available in the browser cache.

The URLs and pinned OCR version live in `src/services/ocrEngine.ts` so this network boundary is explicit and easy to replace with self-hosted assets in deployments that require it.

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
| PDF watermarking | Browser |
| Image conversion and optimization | Browser |
| Audio and video conversion | Browser via FFmpeg.wasm |
| TXT / Markdown / HTML conversion | Browser |
| OCR | Browser; OCR runtime/language assets are fetched on demand |
| Local drafts and history | IndexedDB on the device |
| Office → PDF | Optional configured LibreOffice service |

The Office service is stateless by design and removes temporary files after conversion. Browser-based operations can still consume significant memory for large PDF, image or video files.

## Known limitations

- PDF compression currently rebuilds pages from their rendered appearance. Interactive elements such as links or form behavior may therefore be flattened.
- A watermark is a visual mark, not encryption, DRM or a certified electronic signature.
- OCR accuracy depends on scan quality, typography and resolution. Large multi-page scans can use significant CPU and memory.
- The first OCR run needs access to the pinned runtime and language assets unless they are already cached by the browser.
- Office conversion is available only when the optional LibreOffice service is deployed and configured.
- Large media files and long PDFs may be constrained by browser memory, especially on mobile devices.

These limitations are documented intentionally so the interface does not promise behavior that the underlying engines cannot guarantee.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes, especially when adding a new conversion pair or document engine.

For security-sensitive reports, see [SECURITY.md](SECURITY.md).

## License

Doxali is licensed under the [Apache License 2.0](LICENSE). The license permits commercial and private use, modification and redistribution while preserving the license and required notices. It also includes an explicit patent grant from contributors.

See [NOTICE](NOTICE) for project attribution information.

## Maintainer

Ndiaga Ndiaye

- https://ndiagandiaye.com
- https://github.com/njaga
