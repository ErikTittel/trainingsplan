// Oberfläche: aufklappbare Infokarten „Sicherheit zuerst“ und „Plan & Progression“ (vollständiger
// übergreifender Plan).

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

// Vollständiger übergreifender Plan (Lesefassung): Grundidee, Annahmen, Wochenverteilung, Phasen,
// Progression, Ampelregel, verpasste Einheiten, Kennzahlen. Freiwillige Teile fehlen ganz, wenn
// sie nicht in plan.json stehen.
export function renderPlanDetails(plan) {
  // Bedienhinweis (kein Trainingsinhalt): Die Woche zählt nicht der Kalender, sondern der Nutzer.
  const weekHint = makeElement("p", "", "Die Woche zählst du selbst weiter („+“ oben neben der Woche), sobald du für die nächste bereit bist. Die Phase folgt der Woche.");

  const phases = plan.phases.map((phase) => {
    const section = makeElement("section", "rule");
    section.append(
      makeElement("h3", "", `${phase.number} ${phase.name} · ${phase.weeks}`),
      makeElement("p", "", `${phase.volume} Sätze · ${phase.intensityAndTempo}. Knietiefe: ${phase.kneeDepth}.`),
      makeElement("p", "", phase.jumpAndSpeed)
    );
    return section;
  });
  const progression = [
    plan.periodization.deloadNote,
    plan.workoutGeneralNotes.breaks,
    plan.workoutGeneralNotes.tempoNotation,
    ...plan.phaseProgressionRules,
    plan.jumpAndSpeedProgression?.note
  ];
  const schedule = (plan.weeklySchedule ?? []).map((item) => `${item.day}: ${item.content}`);
  const trafficLight = (plan.badDayTrafficLightRules ?? [])
    .map((rule) => `${rule.level}: ${rule.condition} → ${rule.action}`);
  const metrics = (plan.metrics ?? []).map((metric) => {
    const section = makeElement("section", "rule");
    section.append(
      makeElement("h3", "", metric.metric),
      makeElement("p", "metric-values", `Start: ${metric.start} · W6: ${metric.week6} · W12: ${metric.week12}`),
      makeElement("p", "", `Bei Stagnation: ${metric.ifStalled}`)
    );
    return section;
  });

  elements.planDetails.replaceChildren(
    weekHint,
    ...group("Grundidee", paragraph(plan.basicIdea)),
    ...group("Annahmen", makeList(plan.assumptions ?? [])),
    ...group("Wochenverteilung", makeList([...schedule, ...(plan.weeklyScheduleNotes ?? [])])),
    ...group("Phasen", ...phases),
    ...group("Progression", makeList(progression)),
    ...group("Schlechte Tage: Ampelregel", makeList(trafficLight)),
    ...group("Verpasste Einheiten und Sitzen", makeList(plan.missedTrainingAndSittingNotes ?? [])),
    ...group("Kennzahlen", ...metrics),
    ...group("", paragraph(plan.finalNote))
  );
}

// Überschrift mit Inhalt – oder nichts, wenn der Inhalt leer ist.
function group(title, ...children) {
  const content = children.filter((child) => child && child.childNodes.length);
  if (!content.length) return [];
  return title ? [makeElement("h3", "", title), ...content] : content;
}

function paragraph(text) {
  return text ? makeElement("p", "", text) : null;
}

function makeList(items) {
  const list = makeElement("ul");
  for (const item of items) {
    if (item) list.append(makeElement("li", "", item));
  }
  return list;
}
