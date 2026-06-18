// localStorage persistence (SSR-safe — every call guards on `window`).

import { Device, DEFAULT_HW, fnv1a32 } from './provision';

const K_DEVICES = 'dp_devices';
const K_HW = 'dp_hwversions';

const hasWindow = () => typeof window !== 'undefined';

export type PersistState = {
  devices: Device[];
  hwVersions: string[];
};

export function loadState(): PersistState {
  const fallback: PersistState = { devices: [], hwVersions: DEFAULT_HW.slice() };
  if (!hasWindow()) return fallback;
  try {
    const rawD = JSON.parse(localStorage.getItem(K_DEVICES) || '[]');
    const devices: Device[] = Array.isArray(rawD)
      ? rawD
          .filter((x) => x && x.id)
          .map((x) => ({ ...x, idInt: x.idInt != null ? x.idInt : fnv1a32(x.id), synced: x.synced ?? false }))
      : [];
    const rawH = JSON.parse(localStorage.getItem(K_HW) || 'null');
    const hwVersions = Array.isArray(rawH) && rawH.length ? rawH.slice() : DEFAULT_HW.slice();
    return { devices, hwVersions };
  } catch {
    return fallback;
  }
}

export function saveState(state: PersistState): void {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(K_DEVICES, JSON.stringify(state.devices));
    localStorage.setItem(K_HW, JSON.stringify(state.hwVersions));
  } catch {
    /* quota or private mode — ignore */
  }
}
