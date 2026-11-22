// Oberfläche: aufklappbare Infokarten „Sicherheit zuerst“ und „Plan & Progression“.

import { makeElement } from "./dom.js";

const elements = {
  safetyRules: document.querySelector("#safety-rules"),
  planDetails: document.querySelector("#plan-details")
};

export function renderSafetyRules(rules) {
  elements.safetyRules.replaceChildren(...rules.map((rule) => {
    const section = makeElement("section", "rule");
    section.append(makeElement("h3", "", rule.title));
    if (rule.text) section.append(makeElement("p", "", rule.text));
    if (rule.subItems.length) section.append(makeList(rule.subItems));
    return section;
  }));
}

export function renderPlanDetails(plan) {
  const phases = plan.phases.map((phase) => {
    const section = makeElement("section", "rule");
    section.append(
      makeElement("h3", "", `${phase.number} ${phase.name} · ${phase.weeks}`),
      makeElement("p", "", `${phase.volume} Sätze · ${phase.intensityAndTempo}. Knietiefe: ${phase.kneeDepth}.`),
      makeElement("p", "", phase.jumpAndSpeed)
    );
    return section;
  });
  const notes = [
    plan.periodization.deloadNote,
    plan.workoutGeneralNotes.breaks,
    plan.workoutGeneralNotes.tempoNotation,
    ...plan.phaseProgressionRules
  ];
  // Bedienhinweis (kein Trainingsinhalt): Die Woche zählt nicht der Kalender, sondern der Nutzer.
  const weekHint = makeElement("p", "", "Die Woche zählst du selbst weiter („+“ oben neben der Woche), sobald du für die nächste bereit bist. Die Phase folgt der Woche.");
  elements.planDetails.replaceChildren(weekHint, ...phases, makeList(notes));
}

function makeList(items) {
  const list = makeElement("ul");
  for (const item of items) list.append(makeElement("li", "", item));
  return list;
}
