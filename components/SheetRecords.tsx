'use client';

import { useRef } from 'react';
import { hex32 } from '@/lib/provision';
import type { Provisioner } from './useProvisioner';

export default function SheetRecords({ p }: { p: Provisioner }) {
  const fileRef = useRef<HTMLInputElement>(null);

  if (p.sheetRecords === null) return null;

  return (
    <section className="panel mt18">
      <div className="reg-head">
        <h2 className="flush">
          <span className="num">04</span> Sheet records
        </h2>
        <span className="count">
          <b>{p.sheetRecords.length}</b> devices on sheet
        </span>
      </div>

      <div className="btnrow flush-top mb14">
        <button type="button" className="act ghost" onClick={p.loadRecords} disabled={p.recordsLoading}>
          {p.recordsLoading ? 'Refreshing…' : 'Refresh'}
        </button>
        <label className="act ghost filelabel">
          Import .xlsx / .csv
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) p.importFile(f);
              if (fileRef.current) fileRef.current.value = '';
            }}
          />
        </label>
        <button type="button" className="act ghost" onClick={p.exportXlsx}>
          Export .xlsx
        </button>
      </div>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Device ID</th>
              <th>HW version</th>
              <th>Mfg number</th>
              <th>Firmware ID</th>
              <th>Comments</th>
              <th>32-bit ID</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {p.sheetRecords.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={7}>No devices on the sheet yet.</td>
              </tr>
            ) : (
              p.sheetRecords.map((d) => (
                <tr key={d.id}>
                  <td className="mono">{d.id}</td>
                  <td className="mono">{d.hwv || '—'}</td>
                  <td className="mono">{d.hwn || '—'}</td>
                  <td className="mono">{d.fwid || '—'}</td>
                  <td>{d.comment || '—'}</td>
                  <td className="mono">{hex32(d.idInt)}</td>
                  <td>
                    <button type="button" className="rowbin" onClick={() => p.downloadDevice(d)}>
                      ↓ bin
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="note">
        Read-only view of the Google Sheet. Edit Firmware ID and Comments directly in the sheet —
        press <strong>Refresh</strong> to see the latest values.
      </p>
    </section>
  );
}
