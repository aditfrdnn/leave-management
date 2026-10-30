export type TUser = {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  status?: string;
  department?: {
    id: number;
    name: string;
    alias: string;
  } | null;
};

/** `POST /api/auth/login` → `data`: the user with its bearer token on the same object. */
export type TLoginData = TUser & { token: string };

export type AuthFormState = {
  status?: string;
  redirect?: string;
  user?: TUser;
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
};
