'use client';

import InstallButton from './InstallButton';

export default function AppHeader() {
  return (
    <header className="app">
      <h1>Device Provisioner</h1>
      <span className="tag">8-byte payload</span>
      <InstallButton />
      <p>
        Choose a hardware version, give it a manufacturing number, mint a unique device ID, and emit the binary your
        bootloader reads.{' '}
        <a
          href="https://docs.google.com/spreadsheets/d/1XCO8HlwrDKg65PxafYJL7tyFxyISs0e7VPcrFw7wpfM/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="sheet-link"
        >
          Open Google Sheet ↗
        </a>
      </p>
    </header>
  );
}
