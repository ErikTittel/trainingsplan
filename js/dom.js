// Kleine Helfer zum Aufbau der Oberfläche. Inhalte werden immer als Text gesetzt
// (textContent), nie als HTML (innerHTML) – so kann nichts aus plan.json oder dem
// Protokoll als Code ausgeführt werden.

export function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// Knopf, der kein Formular absendet
export function makeButton(className, text) {
  const button = makeElement("button", className, text);
  button.type = "button";
  return button;
}
