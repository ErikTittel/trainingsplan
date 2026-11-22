// Oberfläche: Infokarte „Protokoll sichern“ (Stand anzeigen, Datei weitergeben, Datei wählen).
// deliverFile nutzt auch „Für KI kopieren“, wenn die Zwischenablage nicht verfügbar ist.

const elements = {
  hint: document.querySelector("#backup-hint"),
  status: document.querySelector("#backup-status"),
  exportButton: document.querySelector("#backup-export"),
  importButton: document.querySelector("#backup-import"),
  file: document.querySelector("#backup-file"),
  result: document.querySelector("#backup-result")
};

// Nach so vielen Tagen ohne Sicherung (und mit neueren Trainings) wird eine Sicherung empfohlen
const BACKUP_REMINDER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

// handlers: onExport(), onImport(file)
export function setupBackup(handlers) {
  elements.exportButton.addEventListener("click", handlers.onExport);
  elements.importButton.addEventListener("click", () => elements.file.click());
  elements.file.addEventListener("change", () => {
    const file = elements.file.files[0];
    elements.file.value = "";
    if (file) handlers.onImport(file);
  });
}

export function renderBackup(log, writable) {
  const sessions = Object.values(log.sessions);
  const count = sessions.length;
  const exported = log.lastExportAt ? new Date(log.lastExportAt) : null;
  const exportedText = exported
    ? `zuletzt gesichert am ${exported.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`
    : "noch nie gesichert";
  elements.status.textContent = `${count} ${count === 1 ? "Training" : "Trainings"} gespeichert · ${exportedText}`;

  const newer = sessions.some((session) => !log.lastExportAt || session.updatedAt > log.lastExportAt);
  const old = !exported || Date.now() - exported.getTime() > BACKUP_REMINDER_DAYS * DAY_MS;
  elements.hint.textContent = newer && old ? "Sicherung empfohlen" : "Sichern und Wiederherstellen";
  elements.exportButton.disabled = count === 0;
  elements.importButton.disabled = !writable;
}

export function showBackupResult(text) {
  elements.result.textContent = text;
}

// Gibt eine Datei über den Teilen-Dialog weiter oder lädt sie, wo es den nicht gibt, herunter.
// Ergebnis: "saved" oder "aborted" (Nutzer hat den Teilen-Dialog abgebrochen).
export async function deliverFile(filename, text, type = "application/json") {
  try {
    const file = new File([text], filename, { type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return "saved";
    }
  } catch (error) {
    if (error.name === "AbortError") return "aborted";
  }
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "saved";
}
