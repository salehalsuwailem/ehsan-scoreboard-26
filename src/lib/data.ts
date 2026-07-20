import type { Award, Group, SeasonData } from "@/types";
import raw from "@/data/data.json";

/** البيانات كاملة كما ولّدتها المزامنة — الموقع لا يحسب شيئاً. */
export const data = raw as unknown as SeasonData;

export const groups: Group[] = data.groups;

const byId = new Map(groups.map((g) => [g.id, g]));

export function getGroup(id: string): Group | undefined {
  return byId.get(id);
}

export function getGroupName(id: string): string {
  return byId.get(id)?.nameAr ?? id;
}

export function getPodium(): Group[] {
  return [...groups].sort((a, b) => a.rank - b.rank).slice(0, 3);
}

export function getAward(id: string): Award | undefined {
  return data.awards.find((a) => a.id === id);
}
