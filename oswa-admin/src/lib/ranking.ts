import type { Criterion, Score } from "./types";

// A score's stored value is always a non-negative magnitude (DB check:
// value >= 0) — the person entering it never types a sign. Whether it
// counts for or against the total is decided here, purely from the
// criterion's kind: "score"/"bonus" add, "deduction" subtracts.
export function signedContribution(value: number, kind: Criterion["kind"]): number {
  return kind === "deduction" ? -value : value;
}

export function computeTotal(participantId: string, scores: Score[], criteriaById: Map<string, Criterion>): number {
  let total = 0;
  for (const s of scores) {
    if (s.participant_id !== participantId) continue;
    const criterion = criteriaById.get(s.criterion_id);
    if (!criterion) continue;
    total += signedContribution(s.value, criterion.kind);
  }
  return total;
}

export function scoreValue(participantId: string, criterionId: string, scores: Score[]): number | null {
  const s = scores.find((x) => x.participant_id === participantId && x.criterion_id === criterionId);
  return s ? s.value : null;
}

// Competition ("1224") ranking: a tie keeps the same rank, and the next
// distinct total skips ahead to its true position (1, 1, 3 — never 1, 1, 2).
export function rankByTotal<T extends { total: number }>(items: T[]): (T & { rank: number })[] {
  const sorted = [...items].sort((a, b) => b.total - a.total);
  const result: (T & { rank: number })[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const rank = i === 0 ? 1 : sorted[i].total === sorted[i - 1].total ? result[i - 1].rank : i + 1;
    result.push({ ...sorted[i], rank });
  }
  return result;
}
