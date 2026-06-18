/**
 * Device Provisioner — Google Apps Script backend
 * ------------------------------------------------------------------
 * Bound to the Google Sheet that stores your device registry.
 *
 * SETUP (one time)
 *  1. Open your Google Sheet (or import devices-template.xlsx into Drive
 *     and "Open with Google Sheets").
 *  2. Extensions ▸ Apps Script. Delete any sample code, paste THIS file.
 *  3. Run the `setup` function once (authorise when prompted). It creates
 *     the "Devices" and "HardwareVersions" sheets + the dropdown if missing.
 *  4. Deploy ▸ New deployment ▸ type "Web app".
 *       Execute as: Me      Who has access: Anyone
 *     Copy the /exec Web app URL.
 *  5. Put that URL in the app's lib/config.ts (SYNC.url). Access is gated by
 *     the deployment itself — there is no separate key.
 * ------------------------------------------------------------------
 */

var DEVICES_SHEET  = 'Devices';
var HW_SHEET       = 'HardwareVersions';
var DEVICE_HEADERS = ['Device ID', 'Hardware Version', 'Manufacturing Number',
                      'Firmware ID', 'Comments', '32-bit ID', 'Created At'];

/* ----------------------------- read --------------------------------- */
function doGet(e) {
  try {
    return json({ ok: true, devices: readDevices(), hardwareVersions: readHwVersions() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ----------------------------- write -------------------------------- */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');

    var lock = LockService.getScriptLock();
    lock.waitLock(20000); // serialise writes so two provisioners never clash
    try {
      switch (body.action) {
        case 'addDevice':     addDevice(body.payload); break;
        case 'updateDevice':  updateDevice(body.payload); break;
        case 'addHwVersion':  addHwVersion(body.payload && body.payload.version); break;
        case 'saveBin':       saveBin(body.payload); break;
        default: return json({ ok: false, error: 'unknown action: ' + body.action });
      }
    } finally {
      lock.releaseLock();
    }
    return json({ ok: true, devices: readDevices(), hardwareVersions: readHwVersions() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* --------------------------- operations ----------------------------- */
function addDevice(d) {
  if (!d || !d.id) throw 'device id required';
  var sh = sheet(DEVICES_SHEET);
  if (findRow(sh, d.id) > 0) return; // idempotent: id already present
  sh.appendRow([
    d.id, d.hwv || '', d.hwn || '', d.fwid || '', d.comment || '',
    d.idHex || '', d.createdAt || new Date().toISOString()
  ]);
  if (d.hwv) addHwVersion(d.hwv);
}

function updateDevice(d) {
  if (!d || !d.id) throw 'device id required';
  var sh = sheet(DEVICES_SHEET);
  var row = findRow(sh, d.id);
  if (row < 1) { addDevice(d); return; }
  if (d.fwid    !== undefined) sh.getRange(row, 4).setValue(d.fwid);
  if (d.comment !== undefined) sh.getRange(row, 5).setValue(d.comment);
}

function addHwVersion(version) {
  version = (version || '').toString().trim();
  if (!version) return;
  var sh = sheet(HW_SHEET);
  var existing = readHwVersions().map(String);
  if (existing.indexOf(version) === -1) sh.appendRow([version]);
}

/* ----------------------------- reads -------------------------------- */
function readDevices() {
  var sh = sheet(DEVICES_SHEET), out = [];
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0] && r[0] !== 0) continue;
    out.push({
      id: String(r[0]).trim(), hwv: str(r[1]), hwn: str(r[2]),
      fwid: str(r[3]), comment: str(r[4]), idHex: str(r[5]), createdAt: str(r[6])
    });
  }
  return out;
}

function readHwVersions() {
  var sh = sheet(HW_SHEET), out = [];
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    var v = str(values[i][0]);
    if (v && out.indexOf(v) === -1) out.push(v);
  }
  return out;
}

/* ----------------------------- setup -------------------------------- */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Provisioner')
    .addItem('Set up sheets', 'setup')
    .addToUi();
}

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var dev = ss.getSheetByName(DEVICES_SHEET) || ss.insertSheet(DEVICES_SHEET);
  if (dev.getLastRow() === 0) dev.appendRow(DEVICE_HEADERS);
  dev.getRange(1, 1, 1, DEVICE_HEADERS.length).setFontWeight('bold')
     .setBackground('#0b1f33').setFontColor('#ffffff');
  dev.setFrozenRows(1);

  var hw = ss.getSheetByName(HW_SHEET) || ss.insertSheet(HW_SHEET);
  if (hw.getLastRow() === 0) {
    hw.appendRow(['Hardware Version']);
    ['Rev A', 'Rev B', 'Rev C', '1.0', '2.0'].forEach(function (v) { hw.appendRow([v]); });
  }
  hw.getRange(1, 1).setFontWeight('bold').setBackground('#0b1f33').setFontColor('#ffffff');
  hw.setFrozenRows(1);

  // Dropdown on Devices!B sourced from the HardwareVersions list.
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(hw.getRange('A2:A1000'), true)
    .setAllowInvalid(true).build();
  dev.getRange('B2:B1000').setDataValidation(rule);

  // Default the menu's default sheet to Devices and remove a stray "Sheet1".
  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);

  SpreadsheetApp.getActiveSpreadsheet().toast('Sheets ready.', 'Provisioner', 5);
}

/* ----------------------------- helpers ------------------------------ */
function sheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function findRow(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return -1; // header-only / empty sheet — getRange needs >= 1 data row
  var col = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) if (String(col[i][0]).trim() === String(id).trim()) return i + 2;
  return -1;
}
function str(v) { return v == null ? '' : String(v).trim(); }
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
