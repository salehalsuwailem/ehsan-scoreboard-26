export type Term = {
  id: string;
  name: string;
  year: number;
  is_active: boolean;
};

export type Group = {
  id: string;
  term_id: string;
  name: string;
};

export type Participant = {
  id: string;
  group_id: string;
  name: string;
  grade: number;
  is_active: boolean;
};

export type CriterionKind = "score" | "bonus" | "deduction";

// group_id null = shared across every group (the historical behaviour).
// Non-null = created by and scoped to one group's own supervisor -- only
// that group's participants show it or get scored on it, and only a
// manager or that same group's supervisor can edit/retire/reorder it.
export type Criterion = {
  id: string;
  term_id: string;
  name: string;
  kind: CriterionKind;
  sort_order: number;
  is_active: boolean;
  group_id: string | null;
};

// value is always stored as a non-negative magnitude (DB check: value >= 0).
// Whether it counts as + or - toward the total depends entirely on the
// criterion's kind (score/bonus => add, deduction => subtract) — the person
// entering it never types a sign themselves.
export type Score = {
  id: string;
  participant_id: string;
  criterion_id: string;
  value: number;
  note: string | null;
  updated_by: string | null;
  updated_at: string;
};

export type StaffRole = "manager" | "supervisor";

export type StaffProfile = {
  user_id: string;
  role: StaffRole;
  group_id: string | null;
  display_name: string | null;
};

export type AccessRequestStatus = "pending" | "approved" | "rejected";

export type AccessRequest = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  requested_group_id: string | null;
  status: AccessRequestStatus;
};

export type RecognitionType = "adventurer_of_week" | "best_reflection" | "best_player";

export type Recognition = {
  id: string;
  term_id: string;
  participant_id: string;
  type: RecognitionType;
  week_date: string | null;
  event_date: string | null;
  note: string | null;
};
