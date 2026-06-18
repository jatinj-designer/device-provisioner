'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
      navigator.serviceWorker.register(base + '/sw.js', { scope: base + '/' }).catch(() => {});
    }
  }, []);
  return null;
}
