import http from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 8080);
const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const SUPPORTED = new Set(['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp']);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-File-Name');
  res.setHeader('Vary', 'Origin');
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readRequestBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) {
      const error = new Error(`File exceeds ${Math.round(MAX_BYTES / 1024 / 1024)} MB limit.`);
      error.code = 'FILE_TOO_LARGE';
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function sanitizeFileName(value) {
  let decoded = value || 'document';
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original header value if it was not URI encoded correctly.
  }
  const raw = basename(decoded);
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned || `document-${randomUUID()}`;
}

function runLibreOffice(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    const child = spawn('libreoffice', [
      '--headless',
      '--nologo',
      '--nodefault',
      '--nofirststartwizard',
      '--convert-to', 'pdf',
      '--outdir', outputDir,
      inputPath,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, HOME: outputDir },
    });

    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Conversion timed out.'));
    }, 60_000);

    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', code => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(stderr || `LibreOffice exited with code ${code}.`));
    });
  });
}

const server = http.createServer(async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, { status: 'ok', service: 'office-converter' });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/convert/pdf') {
    json(res, 404, { error: 'Not found.' });
    return;
  }

  const suppliedName = req.headers['x-file-name'];
  const fileName = sanitizeFileName(Array.isArray(suppliedName) ? suppliedName[0] : suppliedName);
  const extension = extname(fileName).toLowerCase();
  if (!SUPPORTED.has(extension)) {
    json(res, 415, { error: `Unsupported Office format: ${extension || 'unknown'}.` });
    return;
  }

  let workDir;
  try {
    const body = await readRequestBody(req);
    if (body.length === 0) {
      json(res, 400, { error: 'Empty file.' });
      return;
    }

    workDir = await mkdtemp(join(tmpdir(), 'fileconvert-'));
    const inputPath = join(workDir, fileName);
    await writeFile(inputPath, body, { flag: 'wx' });
    await runLibreOffice(inputPath, workDir);

    const outputName = `${fileName.slice(0, -extension.length)}.pdf`;
    const outputPath = join(workDir, outputName);
    const pdf = await readFile(outputPath);

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length,
      'Content-Disposition': `attachment; filename="${outputName.replace(/"/g, '')}"`,
      'Cache-Control': 'no-store',
    });
    res.end(pdf);
  } catch (error) {
    const tooLarge = error && typeof error === 'object' && error.code === 'FILE_TOO_LARGE';
    json(res, tooLarge ? 413 : 500, {
      error: tooLarge ? error.message : 'Document conversion failed.',
    });
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Office converter listening on :${PORT}`);
});
