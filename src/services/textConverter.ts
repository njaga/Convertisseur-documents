function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function stripHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('script, style').forEach(node => node.remove());
  return document.body.textContent?.trim() ?? '';
}

function htmlToMarkdown(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('script, style').forEach(node => node.remove());

  document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(node => {
    const level = Number(node.tagName.substring(1));
    node.replaceWith(`${'#'.repeat(level)} ${node.textContent ?? ''}\n\n`);
  });
  document.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
  document.querySelectorAll('p').forEach(node => node.replaceWith(`${node.textContent ?? ''}\n\n`));
  document.querySelectorAll('li').forEach(node => node.replaceWith(`- ${node.textContent ?? ''}\n`));
  return (document.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}

function markdownToHtml(markdown: string): string {
  // Deliberately small safe subset. A full Markdown library can replace this provider later.
  const escaped = escapeHtml(markdown);
  const lines = escaped.split(/\r?\n/);
  const body = lines.map(line => {
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      return `<h${level}>${heading[2]}</h${level}>`;
    }
    if (!line.trim()) return '';
    return `<p>${line}</p>`;
  }).join('\n');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Document converti</title></head><body>${body}</body></html>`;
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
  onProgress(60);

  let result: string;
  let mimeType: string;

  if (input === 'txt' && output === 'html') {
    result = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(file.name)}</title></head><body><pre>${escapeHtml(content)}</pre></body></html>`;
    mimeType = 'text/html';
  } else if (input === 'txt' && output === 'md') {
    result = content;
    mimeType = 'text/markdown';
  } else if (input === 'md' && output === 'html') {
    result = markdownToHtml(content);
    mimeType = 'text/html';
  } else if (input === 'md' && output === 'txt') {
    result = content.replace(/^#{1,6}\s+/gm, '').replace(/[*_`~]/g, '');
    mimeType = 'text/plain';
  } else if (input === 'html' && output === 'txt') {
    result = stripHtml(content);
    mimeType = 'text/plain';
  } else if (input === 'html' && output === 'md') {
    result = htmlToMarkdown(content);
    mimeType = 'text/markdown';
  } else {
    throw new Error(`Conversion ${input.toUpperCase()} vers ${output.toUpperCase()} non supportee.`);
  }

  onProgress(90);
  const url = URL.createObjectURL(new Blob([result], { type: mimeType }));
  onProgress(100);
  return url;
}
