'use client';

import { hex32, hwVersionInt } from '@/lib/provision';
import type { Provisioner } from './useProvisioner';

export default function GeneratePanel({ p }: { p: Provisioner }) {
  const d = p.current;
  return (
    <section className="panel">
      <h2>
        <span className="num">02</span> New device
      </h2>
      <button className="act primary" onClick={p.generate}>
        Generate device ID
      </button>

      {d && (
        <div className="result show">
          <div className="id">{d.id}</div>
          <div className="kv">
            <span className="k">Device ID (32-bit)</span>
            <span className="v">{hex32(d.idInt)}</span>
          </div>
          <div className="kv">
            <span className="k">Hardware version</span>
            <span className="v">
              {d.hwv} {hex32(hwVersionInt(d.hwv))}
            </span>
          </div>
          <div className="kv">
            <span className="k">Manufacturing number</span>
            <span className="v">{d.hwn === '' ? '—' : d.hwn}</span>
          </div>
          <div className="btnrow">
            <button className="act primary" onClick={() => p.downloadDevice(d)}>
              Download .bin
            </button>
          </div>
        </div>
      )}

      <p className="note">
        IDs are 5 characters (A–Z, 0–9), checked for uniqueness so every device — and every binary — is different.
      </p>
    </section>
  );
}
