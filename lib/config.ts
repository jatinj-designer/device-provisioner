import type { SyncConfig } from './sheet';

/**
 * Google Sheet sync is configured here — in code, not in the UI.
 *
 * Paste your Apps Script Web-app /exec URL. Access is controlled by the
 * deployment itself (who can access the Web app), so there's no separate key.
 * When `url` is set, the app pulls the registry + hardware-version list on load
 * and pushes new devices / edits automatically.
 *
 * Leave `url` empty to run fully offline (local + devices.xlsx only).
 */
export const SYNC: SyncConfig = {
  url: 'https://script.google.com/macros/s/AKfycbzE4SrXmvj-nKwm8hV4X923GvL4Gm0g4t2ichSWAF-CIfYn-jKHZjMw-sgvPRM-hSss5w/exec',
};
