'use client';

import { buildBin } from '@/lib/provision';
import type { Provisioner } from './useProvisioner';

export default function HexDump({ p }: { p: Provisioner }) {
  const d = p.current;
  const bytes = d ? Array.from(new Uint8Array(buildBin(d))) : new Array(8).fill(0);

  return (
    <section className={'dump' + (d ? '' : ' empty')}>
      <div className="head">
        <span>{d ? d.id + '.bin' : 'output.bin'}</span>
        <span>little-endian · offset 0x00</span>
      </div>
      <div className="bytes">
        {bytes.map((b, i) => (
          <div key={i} className={'byte ' + (i < 4 ? 'dev' : 'hw')}>
            <span className="off">{i.toString(16).padStart(2, '0')}</span>
            <span className="hx">{b.toString(16).toUpperCase().padStart(2, '0')}</span>
          </div>
        ))}
      </div>
      <div className="legend">
        <span>
          <i className="sd" />
          bytes 0–3 · device ID
        </span>
        <span>
          <i className="st" />
          bytes 4–7 · hardware version
        </span>
      </div>
    </section>
  );
}
