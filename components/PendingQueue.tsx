'use client';

import { hex32 } from '@/lib/provision';
import type { Provisioner } from './useProvisioner';

export default function PendingQueue({ p }: { p: Provisioner }) {
  if (!p.pending.length) return null;

  return (
    <section className="panel mt18">
      <div className="reg-head">
        <h2 className="flush">
          <span className="num">03</span> Pending — not yet on sheet
        </h2>
        <span className="count">
          <b>{p.pending.length}</b> waiting
        </span>
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
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {p.pending.map((d) => (
              <tr key={d.id}>
                <td className="mono">{d.id}</td>
                <td className="mono">{d.hwv}</td>
                <td className="mono">{d.hwn || '—'}</td>
                <td>
                  <input
                    className="cellin"
                    value={d.fwid}
                    placeholder="—"
                    onChange={(e) => p.updatePending(d.id, 'fwid', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="cellin"
                    value={d.comment}
                    placeholder="—"
                    onChange={(e) => p.updatePending(d.id, 'comment', e.target.value)}
                  />
                </td>
                <td className="mono">{hex32(d.idInt)}</td>
                <td>
                  <button type="button" className="rowbin" onClick={() => p.downloadDevice(d)}>
                    ↓ bin
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className="rowdel"
                    title={'Discard ' + d.id}
                    onClick={() => {
                      if (confirm('Discard ' + d.id + '?\n\nThis removes it from the pending queue only. It has not been saved to the sheet.')) {
                        p.deletePending(d.id);
                      }
                    }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note">
        Fill in Firmware ID and Comments here before pressing <strong>Push</strong> — these values
        will be included when the row is pushed to the sheet.
      </p>
    </section>
  );
}
