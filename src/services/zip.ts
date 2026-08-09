function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function write16(view: DataView, offset: number, value: number) { view.setUint16(offset, value, true); }
function write32(view: DataView, offset: number, value: number) { view.setUint32(offset, value, true); }

export async function createZip(entries: Array<{ name: string; blob: Blob }>): Promise<Blob> {
  const encoder = new TextEncoder();
  const prepared = await Promise.all(entries.map(async entry => {
    const name = encoder.encode(entry.name.replace(/[\\/:*?"<>|]/g, '-'));
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    return { name, data, crc: crc32(data) };
  }));

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of prepared) {
    const local = new Uint8Array(30 + entry.name.length + entry.data.length);
    const localView = new DataView(local.buffer);
    write32(localView, 0, 0x04034b50); write16(localView, 4, 20); write16(localView, 6, 0x0800);
    write16(localView, 8, 0); write16(localView, 10, 0); write16(localView, 12, 0);
    write32(localView, 14, entry.crc); write32(localView, 18, entry.data.length); write32(localView, 22, entry.data.length);
    write16(localView, 26, entry.name.length); write16(localView, 28, 0);
    local.set(entry.name, 30); local.set(entry.data, 30 + entry.name.length);
    localParts.push(local);

    const central = new Uint8Array(46 + entry.name.length);
    const centralView = new DataView(central.buffer);
    write32(centralView, 0, 0x02014b50); write16(centralView, 4, 20); write16(centralView, 6, 20);
    write16(centralView, 8, 0x0800); write16(centralView, 10, 0); write16(centralView, 12, 0); write16(centralView, 14, 0);
    write32(centralView, 16, entry.crc); write32(centralView, 20, entry.data.length); write32(centralView, 24, entry.data.length);
    write16(centralView, 28, entry.name.length); write16(centralView, 30, 0); write16(centralView, 32, 0);
    write16(centralView, 34, 0); write16(centralView, 36, 0); write32(centralView, 38, 0); write32(centralView, 42, offset);
    central.set(entry.name, 46); centralParts.push(central);
    offset += local.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50); write16(endView, 4, 0); write16(endView, 6, 0);
  write16(endView, 8, prepared.length); write16(endView, 10, prepared.length);
  write32(endView, 12, centralSize); write32(endView, 16, offset); write16(endView, 20, 0);

  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}
