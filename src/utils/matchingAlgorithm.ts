// Sophisticated volunteer–resident matching engine — v3

import { Volunteer, Resident, MatchingRule } from "@/services/firestore";

// ————————————————————————————————————————————————————————————————————
// Types
// ————————————————————————————————————————————————————————————————————

export interface MatchFactor {
  name: string;
  score: number;   // Raw 0–100 (not weighted)
  weight: number;  // 0–10 from rule config (0 = disabled)
  reason: string;
}

export interface MatchResult {
  volunteerId: string;
  residentId: string;
  score: number;       // Final 0–100 weighted %
  factors: MatchFactor[];
}

interface MatchContext {
  maxSessions: number;
}

type RuleEvaluator = (v: Volunteer, r: Resident, weight: number, ctx: MatchContext) => MatchFactor | null;

// ————————————————————————————————————————————————————————————————————
// Math helpers
// ————————————————————————————————————————————————————————————————————

const MAX_SCORE = 100;

function gaussian(distance: number, sigma: number): number {
  const s = Math.max(1e-6, sigma);
  return MAX_SCORE * Math.exp(-(distance ** 2) / (2 * s ** 2));
}

function safeArray<T>(arr?: T[]): T[] { return Array.isArray(arr) ? arr : []; }

function jaccardDistance(a?: string[], b?: string[]): number {
  const A = new Set(safeArray(a));
  const B = new Set(safeArray(b));
  const intersection = [...A].filter(x => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  if (union === 0) return 0.5;
  return 1 - intersection / union;
}

function getAge(dateString?: string): number | null {
  if (!dateString) return null;
  const birth = new Date(dateString);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function toWeight(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : 0;
}

const NEUTRAL = 50;

// ————————————————————————————————————————————————————————————————————
// Rule implementations
// ————————————————————————————————————————————————————————————————————

const ruleImplementations: Record<string, RuleEvaluator> = {
  "skills-match": (v, r, w) => {
    const needs = safeArray(r.needs);
    const vSkills = safeArray(v.skills);
    const missing = needs.filter(n => !vSkills.includes(n));
    const matched = needs.filter(n => vSkills.includes(n));
    const sigma = Math.max(1, needs.length / 2);
    const score = needs.length === 0 ? NEUTRAL : gaussian(missing.length, sigma);
    let reason = "";
    if (needs.length === 0) {
      reason = "Resident has not specified any required skills.";
    } else if (matched.length === needs.length) {
      reason = "All required resident skills are present in the volunteer's skill set.";
    } else if (matched.length === 0) {
      reason = "Volunteer does not possess any of the resident's required skills.";
    } else {
      reason = `Volunteer skills matched: [${matched.join(", ")}]. Required but missing: [${missing.join(", ")}].`;
    }
    return { name: "Skills match", score, weight: w, reason };
  },

  "hobbies-match": (v, r, w) => {
    const vHobbies = safeArray(v.hobbies);
    const rHobbies = safeArray(r.hobbies);
    const matched = vHobbies.filter(h => rHobbies.includes(h));
    const missing = rHobbies.filter(h => !vHobbies.includes(h));
    const dist = jaccardDistance(v.hobbies, r.hobbies);
    const score = gaussian(dist, 0.5);
    let reason = "";
    if (rHobbies.length === 0 && vHobbies.length === 0) {
      reason = "No hobbies specified for volunteer or resident.";
    } else if (matched.length === rHobbies.length && rHobbies.length > 0) {
      reason = "Volunteer and resident share all listed hobbies.";
    } else if (matched.length === 0) {
      reason = "No shared hobbies between volunteer and resident.";
    } else {
      reason = `Shared hobbies: [${matched.join(", ")}]. Resident's hobbies not shared: [${missing.join(", ")}].`;
    }
    return { name: "Hobbies match", score, weight: w, reason };
  },

  "language-match": (v, r, w) => {
    const langs = safeArray(r.languages);
    const vLangs = safeArray(v.languages);
    const missing = langs.filter(l => !vLangs.includes(l));
    const matched = langs.filter(l => vLangs.includes(l));
    const sigma = Math.max(1, langs.length / 2);
    const score = langs.length === 0 ? NEUTRAL : gaussian(missing.length, sigma);
    let reason = "";
    if (langs.length === 0 && vLangs.length === 0) {
      reason = "No languages specified for volunteer or resident.";
    } else if (matched.length === langs.length && langs.length > 0) {
      reason = "Volunteer speaks all languages required by the resident.";
    } else if (matched.length === 0) {
      reason = "Volunteer does not speak any of the resident's required languages.";
    } else {
      reason = `Languages in common: [${matched.join(", ")}]. Resident's required languages not spoken: [${missing.join(", ")}].`;
    }
    return { name: "Language match", score, weight: w, reason };
  },

  "availability-match": (v, r, w) => {
    const vAvail = v.availability || {};
    const rAvail = r.availability || {};
    let missing = 0, total = 0, matched = 0;
    let missingSlots: string[] = [], matchedSlots: string[] = [];
    for (const day in rAvail) {
      const resSlots: string[] = rAvail[day] || [];
      const volSlots: string[] = vAvail[day] || [];
      for (const slot of resSlots) {
        total++;
        if (!volSlots.includes(slot)) missing++, missingSlots.push(`${day} ${slot}`);
        else matched++, matchedSlots.push(`${day} ${slot}`);
      }
    }
    const score = total === 0 ? NEUTRAL : gaussian(missing, Math.max(1, total / 2));
    let reason = "";
    if (total === 0) {
      reason = "Resident has not specified any required availability.";
    } else if (matched === total) {
      reason = "Volunteer is available for all of the resident's requested time slots.";
    } else if (matched === 0) {
      reason = "Volunteer is not available for any of the resident's requested time slots.";
    } else {
      reason = `Matching time slots: [${matchedSlots.join(", ")}]. Unavailable for: [${missingSlots.join(", ")}].`;
    }
    return { name: "Availability match", score, weight: w, reason };
  },

  "require-exact-availability": (v, r, w) => {
    const vAvail = v.availability || {};
    const rAvail = r.availability || {};
    let missing = 0, total = 0, matched = 0;
    let missingSlots: string[] = [], matchedSlots: string[] = [];
    for (const day in rAvail) {
      const resSlots: string[] = rAvail[day] || [];
      const volSlots: string[] = vAvail[day] || [];
      for (const slot of resSlots) {
        total++;
        if (!volSlots.includes(slot)) missing++, missingSlots.push(`${day} ${slot}`);
        else matched++, matchedSlots.push(`${day} ${slot}`);
      }
    }
    const score = missing === 0 && total > 0 ? MAX_SCORE : total === 0 ? NEUTRAL : gaussian(missing, Math.max(1, total / 2));
    let reason = "";
    if (total === 0) {
      reason = "Resident has not specified any required availability.";
    } else if (missing === 0) {
      reason = "Volunteer fulfills every exact time slot required by the resident.";
    } else {
      reason = `Volunteer does not meet the following required time slots: [${missingSlots.join(", ")}]. (All must be met for a perfect match.)`;
    }
    return { name: "Exact availability", score, weight: w, reason };
  },

  "gender-match": (v, r, w) => {
    const match = v.gender && r.gender && v.gender === r.gender;
    const score = v.gender && r.gender ? (match ? MAX_SCORE : 0) : NEUTRAL;
    let reason = "";
    if (!v.gender || !r.gender) {
      reason = "Gender information is missing for volunteer or resident.";
    } else if (match) {
      reason = `Volunteer and resident have the same gender: [${v.gender}].`;
    } else {
      reason = `Volunteer gender: [${v.gender}]. Resident gender: [${r.gender}].`;
    }
    return { name: "Gender match", score, weight: w, reason };
  },

  "age-proximity": (v, r, w) => {
    const a = getAge(v.birthDate);
    const b = getAge(r.birthDate);
    const score = a == null || b == null ? NEUTRAL : gaussian(Math.abs(a - b), 10);
    let reason = "";
    if (a == null || b == null) {
      reason = "Birth date is missing for volunteer or resident.";
    } else {
      reason = `Volunteer is ${a} years old, resident is ${b} years old. Age difference: ${Math.abs(a - b)} years.`;
    }
    return { name: "Age proximity", score, weight: w, reason };
  },

  "prioritize-least-visits": (v, r, w, ctx) => {
    if (ctx.maxSessions === 0) {
      return { name: "Least visits (disabled)", score: 0, weight: 0, reason: "No residents have received any visits yet." };
    }
    const sessions = r.totalSessions ?? 0;
    const score = gaussian(sessions, Math.max(1, ctx.maxSessions / 2));
    let reason = `Resident has received ${sessions} visits. The most visited resident has ${ctx.maxSessions} visits.`;
    return { name: "Least visits", score, weight: w, reason };
  },
};

// ————————————————————————————————————————————————————————————————————
// Public engine
// ————————————————————————————————————————————————————————————————————

export function matchVolunteersToResidents(
  volunteers: Volunteer[],
  residents: Resident[],
  rules: MatchingRule[]
): MatchResult[] {
  const ctx: MatchContext = {
    maxSessions: residents.reduce((m, r) => Math.max(m, r.totalSessions ?? 0), 0),
  };

  const ruleMap = new Map<string, MatchingRule>();
  for (const r of rules) ruleMap.set(r.id, r);

  const results: MatchResult[] = [];

  for (const v of volunteers) {
    for (const r of residents) {
      let weightedSum = 0;
      let weightTotal = 0;
      const factors: MatchFactor[] = [];

      for (const [id, evaluator] of Object.entries(ruleImplementations)) {
        const cfg = ruleMap.get(id);
        if (!cfg) continue; // rule not enabled
        const w = toWeight(cfg.value);
        if (w === 0) continue; // 0-weight from UI

        const factor = evaluator(v, r, w, ctx);
        if (!factor || factor.weight === 0) continue; // disabled dynamically

        factors.push(factor);
        weightedSum += factor.score * factor.weight; // use factor.weight (may be 0)
        weightTotal += factor.weight;
      }

      const final = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

      results.push({
        volunteerId: v.id,
        residentId: r.id,
        score: Math.max(0, Math.min(MAX_SCORE, final)),
        factors,
      });
    }
  }

  return results;
} 