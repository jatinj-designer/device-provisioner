'use client';

import type { Provisioner, SyncStatus as Status } from './useProvisioner';

const DOT: Record<Status, string> = {
  off: '', idle: '', syncing: 'syncing', ok: 'ok', error: 'err',
};

export default function SyncStatus({ p }: { p: Provisioner }) {
  if (!p.syncEnabled) return null;
  const busy = p.syncStatus === 'syncing';
  const n = p.pending.length;
  const recordsOpen = p.sheetRecords !== null;

  return (
    <section className="syncbar">
      <span className={'status ' + DOT[p.syncStatus]}>
        <span className="dot" />
        <span>{p.syncMsg}</span>
      </span>
      {n > 0 && <span className="pcount">{n} pending</span>}
      <div className="syncbtns">
        <button type="button" className="act ghost narrow" onClick={p.resync} disabled={busy}>
          {busy ? 'Pushing…' : 'Push'}
        </button>
        <button
          type="button"
          className={'act narrow ' + (recordsOpen ? 'primary' : 'ghost')}
          onClick={recordsOpen ? p.closeRecords : p.loadRecords}
          disabled={p.recordsLoading}
        >
          {p.recordsLoading ? 'Loading…' : recordsOpen ? 'Close records' : 'View records'}
        </button>
      </div>
    </section>
  );
}
