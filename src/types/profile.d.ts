/** `GET /api/me/profile` (docs/setup-module.md §11). */
export type TMyProfile = {
  user: {
    id: number;
    name: string;
    email: string;
    status: "active" | "inactive";
    created_at: string;
    role: { id: number; title: string } | null;
  };
  employee: TMyEmployee | null;
};

export type TMyEmployee = {
  id: number;
  employee_number: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  position: string | null;
  /** `YYYY-MM-DD` */
  join_date: string | null;
  employment_type: "permanent" | "contract" | "probation" | "intern";
  status: "active" | "inactive";
  department: { id: number; name: string; alias: string } | null;
  supervisor: { id: number; name: string; employee_number: string; position: string | null } | null;
  subordinates: { id: number; name: string; position: string | null }[];
};
