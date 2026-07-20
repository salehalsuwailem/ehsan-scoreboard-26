export type CategoryId =
  | "football"
  | "volleyball"
  | "cultural"
  | "community"
  | "haraki"
  | "attendance"
  | "uniform"
  | "reflections"
  | "mohsen"
  | "mubakkirun"
  | "workshops"
  | "media"
  | "groupPhoto";

export type ComponentId =
  | "league"
  | "project"
  | "haraki"
  | "uniform"
  | "attendance"
  | "educational"
  | "mohsen"
  | "mubakkirun"
  | "mediaPhoto";

export interface CategoryScore {
  id: string;
  nameAr: string;
  scorePct: number;
  maxPct: number;
  pct: number;
}

export interface Group {
  id: string;
  index: number;
  nameAr: string;
  captain: string;
  deputy: string;
  members: number;
  rank: number;
  totalPct: number;
  medal: number | null;
  movement: number | null;
  categories: CategoryScore[];
  components: CategoryScore[];
}

export interface RankingRow {
  rank: number;
  groupId: string;
  nameAr: string;
  totalPct: number;
  movement: number | null;
  medal: number | null;
}

export interface FootballRound {
  w: number;
  d: number;
  l: number;
  points: number;
  maxPoints: number;
  pct: number;
  scorePct: number;
}

export interface FootballGroup {
  groupId: string;
  rounds: FootballRound[];
  totalPoints: number;
  maxPoints: number;
  pct: number;
  scorePct: number;
  rankInComp: number;
}

export interface VolleyballGroup {
  groupId: string;
  round1: { w: number; d: number; l: number; points: number };
  round2Points: number;
  totalPoints: number;
  maxPoints: number;
  pct: number;
  scorePct: number;
  rankInComp: number;
}

export interface CulturalGroup {
  groupId: string;
  contests: { position: number; points: number }[];
  totalPoints: number;
  scorePct: number;
  rankInComp: number;
}

export interface LeagueSummaryRow {
  groupId: string;
  footballPct: number;
  volleyballPct: number;
  culturalPct: number;
  totalPct: number;
  rank: number;
}

export interface Competitions {
  football: {
    nameAr: string;
    weightPct: number;
    roundsCount: number;
    roundScorePct: number;
    win: number;
    draw: number;
    loss: number;
    perGroup: FootballGroup[];
  };
  volleyball: {
    nameAr: string;
    weightPct: number;
    roundsCount: number;
    roundScorePct: number;
    win: number;
    draw: number;
    loss: number;
    perGroup: VolleyballGroup[];
  };
  cultural: {
    nameAr: string;
    weightPct: number;
    contestsCount: number;
    contestScorePct: number;
    placePoints: number[];
    perGroup: CulturalGroup[];
  };
  leagueSummary: LeagueSummaryRow[];
}

export interface Award {
  id: string;
  titleAr: string;
  groupId: string;
  /** نص جاهز للعرض بجانب الجائزة (مثال: "92.5%" أو "+2 مركز") — يُحسب في المزامنة فقط. */
  detail?: string;
}

export interface SeasonStats {
  highestPct: number;
  averagePct: number;
  lowestPct: number;
  leaderGroupId: string;
  groupsCount: number;
  categoriesCount: number;
}

export interface WeightRow {
  nameAr: string;
  weightPct: number;
  note: string;
}

export interface HistoryEntry {
  groupId: string;
  rank: number;
  totalPct: number;
}

export interface HistorySnapshot {
  syncedAt: string;
  entries: HistoryEntry[];
}

export interface SeasonMeta {
  season: string;
  seasonYear: number;
  generatedAt: string;
  sourceFile: string;
  programDays: number;
  scoringDays: number;
  completedDays: number;
  totalWeeks: number;
  completedWeeks: number;
  completionPct: number;
  comment: string;
}

export interface SeasonData {
  meta: SeasonMeta;
  weights: WeightRow[];
  groups: Group[];
  ranking: RankingRow[];
  competitions: Competitions;
  awards: Award[];
  stats: SeasonStats;
  history: HistorySnapshot[];
}
