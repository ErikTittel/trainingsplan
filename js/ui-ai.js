// Oberfläche: Infokarte „Mit KI optimieren“ (Anweisungen eingeben, „Für KI kopieren“).

const elements = {
  instructions: document.querySelector("#ai-instructions"),
  copyButton: document.querySelector("#ai-copy"),
  result: document.querySelector("#ai-result")
};

// handlers: onCopy(instructions) – die zusätzlichen Anweisungen als Text
export function setupAiCopy(handlers) {
  elements.copyButton.addEventListener("click", () => handlers.onCopy(elements.instructions.value));
}

export function showAiResult(text) {
  elements.result.textContent = text;
}

// Legt Text in die Zwischenablage. Muss ohne vorheriges Warten (await) aus dem Klick heraus
// aufgerufen werden, sonst lehnt Safari ab. Ergebnis: true bei Erfolg.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
}
