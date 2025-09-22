export type AuthFormState = {
  status?: string;
  redirect?: string;
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
};
