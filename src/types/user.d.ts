export type TUser = {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  status?: string;
  department?: {
    id: number;
    name: string;
    alias: string;
  };
};
