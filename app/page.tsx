'use client';

import { ToastProvider } from '@/components/Toast';
import { useProvisioner } from '@/components/useProvisioner';
import AppHeader from '@/components/AppHeader';
import HardwarePanel from '@/components/HardwarePanel';
import GeneratePanel from '@/components/GeneratePanel';
import HexDump from '@/components/HexDump';
import SyncStatus from '@/components/SyncStatus';
import PendingQueue from '@/components/PendingQueue';
import SheetRecords from '@/components/SheetRecords';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

function App() {
  const p = useProvisioner();
  return (
    <div className="wrap">
      <AppHeader />
      <div className="grid">
        <HardwarePanel p={p} />
        <GeneratePanel p={p} />
      </div>
      <HexDump p={p} />
      <SyncStatus p={p} />
      <PendingQueue p={p} />
      <SheetRecords p={p} />
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <ServiceWorkerRegister />
      <App />
    </ToastProvider>
  );
}
