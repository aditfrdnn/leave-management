// src/services/authService.ts

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://192.168.137.1:8000";

interface LoginResponse {
  success: boolean;
  data?: {
    id: number;
    name: string;
    email: string;
    token: string;
    department?: {
      id: number;
      name: string;
      alias: string;
    };
  };
  message?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_HOST}/api/auth/login`, {
      method: "POST",
      body: new URLSearchParams({
        email,
        password,
      }),
      headers: {
        Accept: "application/json",
      },
    });

    const data: LoginResponse = await response.json();

    if (data.success && data.data?.token) {
      // simpan token ke localStorage
      localStorage.setItem("token", data.data.token);
    }
    //tambahin direct ke home page

    return data;
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
}
