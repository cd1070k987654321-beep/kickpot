export type TeamFormValues = {
  name: string;
  description: string;
};

export type TeamJoinValues = {
  inviteCode: string;
};

export type TeamSummary = {
  id: string;
  name: string;
  description: string;
  invite_code: string | null;
  logo_url?: string | null;
  role: "owner" | "member";
};
