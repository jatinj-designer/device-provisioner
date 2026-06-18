'use client';

import { useState } from 'react';
import type { Provisioner } from './useProvisioner';

export default function HardwarePanel({ p }: { p: Provisioner }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newHw, setNewHw] = useState('');

  const commitHw = () => {
    if (!newHw.trim()) return;
    p.addHwVersion(newHw);
    setNewHw('');
    setShowAdd(false);
  };

  return (
    <section className="panel">
      <h2>
        <span className="num">01</span> Hardware
      </h2>

      <div className="field">
        <label htmlFor="hwver">
          Hardware version <span className="accent">· in binary</span>
        </label>
        <div className="hwrow">
          <select
            id="hwver"
            className="grow"
            value={p.selectedHw}
            onChange={(e) => p.setSelectedHw(e.target.value)}
          >
            {p.hwVersions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="iconbtn"
            title="Add a new hardware version"
            aria-label="Add hardware version"
            onClick={() => setShowAdd((s) => !s)}
          >
            +
          </button>
        </div>

        {showAdd && (
          <div className="hwrow addhw">
            <input
              className="grow"
              placeholder="New version, e.g. Rev D or 3.0"
              autoComplete="off"
              autoFocus
              value={newHw}
              onChange={(e) => setNewHw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitHw();
                }
              }}
            />
            <button type="button" className="act primary narrow" onClick={commitHw}>
              Add
            </button>
          </div>
        )}
        <div className="hint">
          Pick a version, or click + to add a new one. The list lives in the <code>HardwareVersions</code> sheet.
        </div>
      </div>

      <div className="field">
        <label htmlFor="hwnum">
          Manufacturing number <span className="dim">· not in binary</span>
        </label>
        <input
          id="hwnum"
          type="number"
          min={0}
          placeholder="e.g. 4021"
          value={p.mfg}
          onChange={(e) => p.setMfg(e.target.value)}
        />
        <div className="hint">Stored in the registry only — never written to the .bin.</div>
      </div>

      <div className="combined">
        <span className="k">HW version (32-bit)</span>
        <span className="v">{p.hwHex}</span>
      </div>
    </section>
  );
}
