// Pure provisioning logic — no DOM, no React. Mirrors the original HTML app.

export type Device = {
  id: string;
  hwv: string;
  hwn: string;
  fwid: string;
  comment: string;
  idInt: number;
  createdAt?: string;
  /** true once the row is confirmed written to the Google Sheet. */
  synced?: boolean;
};

export const DEFAULT_HW = ['Rev A', 'Rev B', 'Rev C', '1.0', '2.0'];

/** FNV-1a 32-bit hash → the device ID's 32-bit value (and the HW fallback). */
export function fnv1a32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** Dotted versions ("1.0", "2.3.4") pack into 32 bits; anything else is hashed. */
export function hwVersionInt(s: string): number {
  s = String(s).trim();
  if (/^\d+(\.\d+)*$/.test(s)) {
    const p = s.split('.').map((n) => parseInt(n, 10) || 0);
    return (((((p[0] || 0) & 0xffff) << 16) | (((p[1] || 0) & 0xff) << 8) | ((p[2] || 0) & 0xff)) >>> 0);
  }
  return fnv1a32(s);
}

export const hex32 = (n: number): string =>
  '0x' + (n >>> 0).toString(16).toUpperCase().padStart(8, '0');

/** 8-byte payload: bytes 0–3 device ID, bytes 4–7 hardware version, little-endian. */
export function buildBin(dev: Device): ArrayBuffer {
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  dv.setUint32(0, dev.idInt, true);
  dv.setUint32(4, hwVersionInt(dev.hwv), true);
  return buf;
}

export function makeId(len = 5): string {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

/** A device id unique against the given set. */
export function uniqueId(taken: Set<string>): string {
  let id: string;
  do {
    id = makeId();
  } while (taken.has(id));
  return id;
}

export function downloadBin(dev: Device): void {
  const blob = new Blob([buildBin(dev)], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dev.id + '.bin';
  a.click();
  URL.revokeObjectURL(a.href);
}
