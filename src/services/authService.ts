import Cookies from "js-cookie";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST;

export async function login(email: string, password: string) {
  const res = await fetch(`${API_HOST}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.success) {
    // simpan token di cookie agar bisa dibaca middleware
    Cookies.set("token", data.data.token, { expires: 1 }); // expire 1 hari
  }

  return data;
}

export function getToken() {
  return Cookies.get("token");
}

export function logout() {
  Cookies.remove("token");
}
