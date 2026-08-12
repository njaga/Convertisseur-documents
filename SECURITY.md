# Security policy

Please do not disclose a suspected vulnerability in a public issue before it has been reviewed.

## Reporting

Send security reports to `contact@ndiagandiaye.com` with:

- a short description of the issue;
- the affected route, component or service;
- steps to reproduce;
- the expected and observed behavior;
- any relevant browser, operating system or deployment information.

If the issue involves a document sample, remove sensitive or personal information before sharing it whenever possible.

## Security boundaries

Doxali contains two distinct processing models:

- browser-side document processing;
- the optional `server/office-converter` service for Office → PDF conversion.

Reports concerning file validation, cross-origin behavior, temporary-file handling, browser storage, unsafe document rendering, dependency vulnerabilities or denial-of-service conditions are in scope.

Public discussions can be opened after a fix is available or the report has been determined not to expose users to a security risk.
