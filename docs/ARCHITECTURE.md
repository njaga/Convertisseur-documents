# Doxali architecture

This document describes the main runtime boundaries and the conventions that keep document processing predictable.

## Application layers

### Route layer

`src/pages` contains route-level workflows. A page is responsible for orchestration and user interaction, not for implementing the underlying file format itself.

Examples:

- `PdfTools.tsx` selects the appropriate PDF workflow from the current route.
- `OptimizeTools.tsx` exposes PDF, image and video optimization modes.
- `DocumentLab.tsx` hosts signing, OCR and simple PDF generation.
- `ConverterPage.tsx` manages the general conversion workflow.

### UI layer

`src/components` contains reusable interface elements and visual editors. Editors expose state changes through typed props and leave file serialization to service modules where practical.

Important components include:

- `FileDropZone` for drag-and-drop input;
- `FilePreview` and `ResultPreview` for source/result inspection;
- `PdfVisualEditor` for page-level operations;
- `PdfPageContentEditor` for overlays and annotations;
- `PdfAnnotationEditor` for visual signature placement;
- `PdfFormEditor` for AcroForm workflows;
- `ToolEditorial` for route-specific help and internal linking.

### Service layer

`src/services` contains document and conversion engines.

The main rule is that services should receive explicit inputs, return explicit outputs and avoid hidden network behavior.

Browser-side engines include:

- Canvas and browser image APIs;
- FFmpeg WebAssembly;
- `pdf-lib`;
- PDF.js;
- Marked, DOMPurify and Turndown;
- IndexedDB-backed draft/history helpers.

The Office integration is deliberately separate under `server/office-converter`.

### Format registry

`src/utils/formats.ts` is the source of truth for the generic converter’s supported input/output pairs.

A format should not appear as available merely because a filename extension is known. It must have a working conversion path.

## Processing boundaries

### Browser-first operations

PDF tools, image conversion, media conversion and text conversion are executed in the browser when supported.

This provides two useful properties:

1. files do not need to be uploaded for routine operations;
2. infrastructure does not become a hidden requirement for basic workflows.

The trade-off is memory pressure. Large PDF files and media conversions can exceed the practical limits of a mobile browser.

### Office → PDF

Office conversion requires LibreOffice and therefore runs in the optional service located in `server/office-converter`.

The frontend only exposes this conversion when `VITE_OFFICE_CONVERTER_URL` is configured.

The service:

- validates the input extension;
- enforces an upload-size limit;
- invokes LibreOffice without shell interpolation;
- applies a conversion timeout;
- stores work in a temporary directory;
- removes temporary files after success or failure;
- can restrict CORS with `ALLOWED_ORIGIN`.

## PDF model

Doxali uses two different approaches depending on the task.

### Structural edits

Merging, splitting, reordering, rotating and copying pages use the original PDF page objects through `pdf-lib` where possible.

### Visual overlays

Text, signatures, images, shapes and other annotations are represented as normalized page coordinates in the editor and then drawn onto the source PDF during export.

Normalized coordinates make the editor independent of the preview’s rendered pixel size.

### Compression

The current PDF compression mode renders pages and rebuilds the document using compressed page images. This is effective for visual documents but can flatten interactive features and remove selectable text semantics.

That trade-off is documented in the product UI and editorial content.

## Local persistence

Editing drafts and recent history use browser storage rather than a user account.

Draft data must be treated as recoverable convenience state, not as the user’s only copy of a document. The application should continue to make it clear that important originals belong in normal persistent storage.

## SEO and route metadata

SEO data is intentionally data-driven:

- `content/route-metadata.json` defines title, description and indexing policy;
- `content/tool-editorial.json` defines visible guide content, FAQ entries and related links;
- `SeoManager` updates metadata during client-side navigation;
- `scripts/prerender-seo.mjs` emits route-specific HTML before deployment;
- the same build step generates `sitemap.xml` from indexable route metadata;
- FAQ structured data is generated only when the corresponding FAQ is also visible on the page.

This avoids maintaining separate route metadata in React, `index.html`, the sitemap and the prerender script.

## Deployment

The reference deployment uses Vercel.

`vercel.json` maps known routes to the HTML files generated in `dist/__prerender`. Static assets are served normally, and the optional social-image endpoint is implemented as a Vercel Function under `api/`.

The client application itself remains a Vite/React application and does not require a Node.js web server for normal browser-side document operations.

## Engineering invariants

Changes should preserve these constraints:

- no unsupported conversion pair should be advertised;
- server-side processing must not be introduced silently;
- file-object URLs must be revoked when results are replaced or discarded;
- expensive media operations should avoid unnecessary parallelism;
- visual editor coordinates must remain independent from display scale;
- route metadata and editorial content should have a single source of truth;
- build, lint, type-check and test failures block merge.
