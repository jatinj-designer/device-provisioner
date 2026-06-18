/**
 * Device Provisioner — Google Drive bin-file saver
 * ------------------------------------------------------------------
 * Lives in the SAME Apps Script project as Code.gs (add it as a
 * second file: Extensions ▸ Apps Script ▸ + (New file) ▸ Script,
 * name it "DriveUpload", paste this content).
 *
 * Called from Code.gs doPost via action "saveBin".
 * ------------------------------------------------------------------
 */

var BIN_FOLDER = 'firmwarebins';

/**
 * Save an 8-byte device binary to Drive/firmwarebins/<deviceId>.bin.
 * payload: { filename: "XXXXX.bin", data: "<base64 string>" }
 * If a file with the same name already exists it is replaced.
 */
function saveBin(payload) {
  if (!payload || !payload.filename || !payload.data) throw 'filename and data required';

  var bytes   = Utilities.base64Decode(payload.data);
  var blob    = Utilities.newBlob(bytes, 'application/octet-stream', payload.filename);
  var folder  = getOrCreateBinFolder();

  // Replace if already exists so re-provisioning the same ID is idempotent.
  var existing = folder.getFilesByName(payload.filename);
  if (existing.hasNext()) existing.next().setBlob(blob);
  else                    folder.createFile(blob);
}

function getOrCreateBinFolder() {
  var iter = DriveApp.getFoldersByName(BIN_FOLDER);
  return iter.hasNext() ? iter.next() : DriveApp.createFolder(BIN_FOLDER);
}
