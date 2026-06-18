// Google Apps Script web-app client.

import { Device, hex32 } from './provision';

export type SyncConfig = { url: string };

export type SheetDevice = {
  id: string;
  hwv?: string;
  hwn?: string;
  fwid?: string;
  comment?: string;
  idHex?: string;
  createdAt?: string;
};

export type SheetResponse = {
  ok: boolean;
  error?: string;
  devices?: SheetDevice[];
  hardwareVersions?: string[];
};

export type PostAction = 'addDevice' | 'updateDevice' | 'addHwVersion';

export function devicePayload(d: Device): SheetDevice {
  return {
    id: d.id,
    hwv: d.hwv,
    hwn: d.hwn,
    fwid: d.fwid,
    comment: d.comment,
    idHex: hex32(d.idInt),
    createdAt: d.createdAt || '',
  };
}

async function parseJSON(res: Response): Promise<SheetResponse> {
  const text = await res.text();
  // Apps Script redirects to a Google login page (HTML) when access is
  // restricted to domain users. Detect this and give a clear error.
  if (text.trimStart().startsWith('<')) {
    throw new Error(
      'Got HTML instead of JSON — the Apps Script deployment is likely restricted to domain users. ' +
        'Redeploy with "Who has access: Anyone".'
    );
  }
  const data: SheetResponse = JSON.parse(text);
  if (!data.ok) throw new Error(data.error || 'Apps Script returned ok:false');
  return data;
}

export async function apiGet(cfg: SyncConfig): Promise<SheetResponse> {
  let res: Response;
  try {
    res = await fetch(cfg.url, { method: 'GET', redirect: 'follow' });
  } catch (e) {
    throw new Error('Network error (CORS or offline): ' + (e instanceof Error ? e.message : String(e)));
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return parseJSON(res);
}

export async function apiPost(
  cfg: SyncConfig,
  action: PostAction,
  payload: unknown
): Promise<SheetResponse> {
  // text/plain avoids a CORS preflight — Apps Script handles it as a simple request.
  let res: Response;
  try {
    res = await fetch(cfg.url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }),
    });
  } catch (e) {
    throw new Error('Network error (CORS or offline): ' + (e instanceof Error ? e.message : String(e)));
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return parseJSON(res);
}
