'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Device,
  DEFAULT_HW,
  downloadBin,
  fnv1a32,
  hex32,
  hwVersionInt,
  uniqueId,
} from '@/lib/provision';
import { loadState, saveState } from '@/lib/storage';
import { apiGet, apiPost, devicePayload } from '@/lib/sheet';
import { SYNC } from '@/lib/config';
import { useToast } from './Toast';

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'ok' | 'error';

export function useProvisioner() {
  const toast = useToast();

  // pending = locally generated but not yet confirmed on the sheet.
  // Once a device is confirmed, it's removed from here (lives on the sheet).
  const [pending, setPending] = useState<Device[]>([]);
  const [hwVersions, setHwVersions] = useState<string[]>(DEFAULT_HW.slice());
  const [current, setCurrent] = useState<Device | null>(null);
  const [selectedHw, setSelectedHw] = useState<string>(DEFAULT_HW[0]);
  const [mfg, setMfg] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);
  const [hwLoading, setHwLoading] = useState(!!SYNC.url);

  // Sheet records — null = not loaded yet, [] = loaded but empty.
  const [sheetRecords, setSheetRecords] = useState<Device[] | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SYNC.url ? 'idle' : 'off');
  const [syncMsg, setSyncMsg] = useState(SYNC.url ? 'Press Push to send pending devices to sheet' : 'No sync URL configured');

  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const hwRef = useRef(hwVersions);
  hwRef.current = hwVersions;

  const syncEnabled = !!SYNC.url;

  /* ---- hydrate from localStorage ---- */
  useEffect(() => {
    const s = loadState();
    setPending(s.devices);
    setHwVersions(s.hwVersions);
    if (s.hwVersions.length) setSelectedHw(s.hwVersions[0]);
    setHydrated(true);
  }, []);

  /* ---- persist pending + hw list ---- */
  useEffect(() => {
    if (!hydrated) return;
    saveState({ devices: pending, hwVersions });
  }, [pending, hwVersions, hydrated]);

  /* ---- keep selected HW valid ---- */
  useEffect(() => {
    if (hwVersions.length && !hwVersions.includes(selectedHw)) setSelectedHw(hwVersions[0]);
  }, [hwVersions, selectedHw]);

  /* ---- fetch HW versions from sheet on startup ---- */
  useEffect(() => {
    if (!hydrated || !SYNC.url) return;
    apiGet(SYNC)
      .then((data) => {
        if (Array.isArray(data.hardwareVersions) && data.hardwareVersions.length) {
          setHwVersions(data.hardwareVersions.slice());
          setSelectedHw(data.hardwareVersions[0]);
        }
      })
      .catch(() => {/* keep localStorage values on failure */})
      .finally(() => setHwLoading(false));
  }, [hydrated]);

  const hwHex = useMemo(() => hex32(hwVersionInt(selectedHw)), [selectedHw]);

  /* ----------------------------- load sheet records ---- */
  const loadRecords = useCallback(async () => {
    if (!SYNC.url) return;
    setRecordsLoading(true);
    try {
      const data = await apiGet(SYNC);
      if (Array.isArray(data.hardwareVersions) && data.hardwareVersions.length)
        setHwVersions(data.hardwareVersions.slice());
      setSheetRecords(
        (data.devices || []).map((d) => ({
          id: d.id, hwv: d.hwv || '', hwn: d.hwn || '',
          fwid: d.fwid || '', comment: d.comment || '',
          idInt: fnv1a32(d.id), createdAt: d.createdAt || '', synced: true,
        }))
      );
    } catch (err) {
      toast('Could not load records: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRecordsLoading(false);
    }
  }, [toast]);

  /* ----------------------------- resync ---- */
  // Push all pending to sheet (sheet wins on any conflict).
  // Removes successfully pushed devices from pending.
  const resync = useCallback(async () => {
    if (!SYNC.url) return;
    setSyncStatus('syncing');
    setSyncMsg('Pushing pending devices…');

    // Pull HW versions + records fresh first.
    try {
      const data = await apiGet(SYNC);
      if (Array.isArray(data.hardwareVersions) && data.hardwareVersions.length)
        setHwVersions(data.hardwareVersions.slice());
      // Update records view if it was already open.
      if (sheetRecords !== null)
        setSheetRecords(
          (data.devices || []).map((d) => ({
            id: d.id, hwv: d.hwv || '', hwn: d.hwn || '',
            fwid: d.fwid || '', comment: d.comment || '',
            idInt: fnv1a32(d.id), createdAt: d.createdAt || '', synced: true,
          }))
        );
    } catch (err) {
      setSyncStatus('error');
      setSyncMsg('Pull failed: ' + (err instanceof Error ? err.message : String(err)));
      return;
    }

    const current = pendingRef.current;
    if (!current.length) {
      setSyncStatus('ok');
      setSyncMsg('Nothing pending — sheet is up to date');
      return;
    }

    let pushed = 0, failed = 0;
    await Promise.all(
      current.map(async (d) => {
        try {
          await apiPost(SYNC, 'addDevice', devicePayload(d));
          // Remove from pending — it's on the sheet now.
          setPending((prev) => prev.filter((x) => x.id !== d.id));
          pushed++;
        } catch {
          failed++;
        }
      })
    );

    if (failed === 0) {
      setSyncStatus('ok');
      setSyncMsg('Pushed ' + pushed + ' device' + (pushed === 1 ? '' : 's') + ' to sheet');
      // Reload records to reflect the newly pushed rows.
      if (sheetRecords !== null) loadRecords();
    } else {
      setSyncStatus('error');
      setSyncMsg(pushed + ' pushed · ' + failed + ' still pending (push failed)');
    }
  }, [sheetRecords, loadRecords]);

  /* ----------------------------- generate ---- */
  const generate = useCallback(() => {
    const id = uniqueId(new Set(pendingRef.current.map((d) => d.id)));
    const hwv = selectedHw.trim() || '(none)';
    const dev: Device = {
      id, hwv, hwn: mfg.trim(), fwid: '', comment: '',
      idInt: fnv1a32(id), createdAt: new Date().toISOString(), synced: false,
    };
    setPending((prev) => [...prev, dev]);
    setCurrent(dev);
    toast('Device ' + id + ' created');

    if (!SYNC.url) return;

    setSyncStatus('syncing');
    setSyncMsg('Pushing ' + id + ' to sheet…');
    apiPost(SYNC, 'addDevice', devicePayload(dev))
      .then(() => {
        setPending((prev) => prev.filter((x) => x.id !== id));
        setSyncStatus('ok');
        setSyncMsg(id + ' saved to sheet');
        if (sheetRecords !== null) loadRecords();
      })
      .catch((err) => {
        setSyncStatus('error');
        setSyncMsg(id + ' push failed — stays in pending: ' + (err instanceof Error ? err.message : String(err)));
      });
  }, [selectedHw, mfg, toast, sheetRecords, loadRecords]);

  /* ----------------------------- hw versions ---- */
  const addHwVersion = useCallback((raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const isNew = !hwRef.current.includes(v);
    if (isNew) setHwVersions((prev) => [...prev, v]);
    setSelectedHw(v);
    toast('Added "' + v + '"');
    if (isNew && SYNC.url) apiPost(SYNC, 'addHwVersion', { version: v }).catch(() => {});
  }, [toast]);

  /* ----------------------------- pending actions ---- */
  const deletePending = useCallback((id: string) => {
    setPending((prev) => prev.filter((d) => d.id !== id));
    if (current?.id === id) setCurrent(null);
    toast(id + ' removed from pending');
  }, [current, toast]);

  const updatePending = useCallback((id: string, field: 'fwid' | 'comment', value: string) => {
    setPending((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  }, []);

  /* ----------------------------- records actions ---- */
  const closeRecords = useCallback(() => setSheetRecords(null), []);

  /* ----------------------------- xlsx export ---- */
  const exportXlsx = useCallback(async () => {
    const source = sheetRecords ?? pendingRef.current;
    const XLSX = await import('xlsx');
    const devAoa = [
      ['Device ID', 'Hardware Version', 'Manufacturing Number', 'Firmware ID', 'Comments', '32-bit ID', 'Created At'],
      ...source.map((d) => [d.id, d.hwv, d.hwn, d.fwid, d.comment, hex32(d.idInt), d.createdAt || '']),
    ];
    const hwAoa = [['Hardware Version'], ...hwRef.current.map((v) => [v])];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(devAoa), 'Devices');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hwAoa), 'HardwareVersions');
    XLSX.writeFile(wb, 'devices.xlsx');
    toast('devices.xlsx exported');
  }, [toast, sheetRecords]);

  const importFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    try {
      let rows: unknown[][] = [];
      if (name.endsWith('.csv')) {
        rows = (await file.text()).split(/\r?\n/).map((l) => l.split(','));
      } else {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as unknown[][];
      }
      const cell = (r: unknown[], i: number) => (r[i] != null ? String(r[i]).trim() : '');
      const taken = new Set(pendingRef.current.map((d) => d.id));
      const add: Device[] = [];
      rows.slice(1).filter(Array.isArray).forEach((r) => {
        const id = cell(r, 0);
        if (!id || taken.has(id)) return;
        taken.add(id);
        add.push({ id, hwv: cell(r, 1), hwn: cell(r, 2), fwid: cell(r, 3), comment: cell(r, 4), idInt: fnv1a32(id), synced: false });
      });
      if (add.length) setPending((prev) => [...prev, ...add]);
      toast('Imported ' + add.length + ' device' + (add.length === 1 ? '' : 's') + ' to pending');
    } catch {
      toast('Could not read that file');
    }
  }, []);

  const downloadDevice = useCallback((d: Device) => {
    downloadBin(d);
    toast(d.id + '.bin downloaded');
  }, [toast]);

  return {
    pending, hwVersions, hwLoading, current, selectedHw, mfg, hwHex,
    syncEnabled, syncStatus, syncMsg,
    sheetRecords, recordsLoading,
    setSelectedHw, setMfg,
    generate, addHwVersion, deletePending, updatePending,
    resync, loadRecords, closeRecords,
    importFile, exportXlsx, downloadDevice,
  };
}

export type Provisioner = ReturnType<typeof useProvisioner>;
