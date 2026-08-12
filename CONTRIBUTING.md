# Contributing to Doxali

Thank you for contributing. Doxali favors small, verifiable changes over broad feature claims.

## Development setup

```bash
npm ci
npm run dev
```

Node.js 22.12 or newer is required.

## Before opening a pull request

Run the complete verification suite:

```bash
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
node --check server/office-converter/server.mjs
npm run build
```

A pull request should not be merged while one of these checks is failing.

## Project conventions

### Conversion support

Do not add a format to the UI unless a real conversion engine can produce a valid output for it.

When adding a conversion pair:

1. update the format registry in `src/utils/formats.ts`;
2. implement or extend the corresponding service;
3. validate MIME type and output extension;
4. add tests for support detection and edge cases;
5. update the Formats page only through the shared registry when possible.

### Local-first boundary

Browser-capable operations should remain browser-side unless there is a clear technical reason to introduce a server dependency.

If a server-side integration is required:

- make it explicit in the UI and documentation;
- keep it optional when practical;
- define upload size and timeout limits;
- avoid persistent document storage by default;
- document the privacy impact.

### UI and copy

- Keep interfaces task-focused and accessible with keyboard and touch when relevant.
- Prefer reusable components over duplicated workflow code.
- Do not claim capabilities that depend on an unavailable browser API or optional backend.
- User-facing copy is primarily French; code identifiers and technical documentation may be English.
- Avoid decorative effects that reduce readability or obscure the primary action.

### SEO content

Route metadata lives in `content/route-metadata.json` and tool editorial content lives in `content/tool-editorial.json`.

Keep FAQ answers visible in the page when they are also emitted as `FAQPage` structured data. Do not add FAQ schema for hidden or unrelated content.

## Pull requests

Keep pull requests focused. A useful description should explain:

- the user or technical problem;
- the chosen approach;
- notable trade-offs;
- how the change was tested.

Avoid unrelated refactors in a feature pull request unless they are necessary for the implementation.
