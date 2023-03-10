export type IMomentType = "hours" | "days";

export interface ICommonFields {
  created_at?: Date;
  updated_at?: Date;

  created_by?: string;
  updated_by?: string;

  is_active?: boolean;
}
