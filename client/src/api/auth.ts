import type { AuthUser } from "../types";

const API_BASE_URL = "http://127.0.0.1:3000";

type AuthResponse = {
  user: AuthUser | null;
  error?: string;
};

export async function getCurrentUser() {
  // La sessione non viene salvata in localStorage: il server la riconosce tramite cookie HttpOnly.
  // Per questo ogni chiamata auth deve includere `credentials: "include"`.
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include"
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as AuthResponse;
  return data.user;
}

export async function login(email: string, password: string) {
  // Il client invia solo le credenziali in chiaro sulla richiesta HTTPS/locale.
  // Hash, salt, lockout e creazione della sessione restano responsabilita del backend.
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  const data = (await response.json()) as AuthResponse;

  if (!response.ok || !data.user) {
    throw new Error(data.error ?? "Login failed");
  }

  return data.user;
}

export async function logout() {
  // Il logout invalida la sessione lato server e svuota il cookie di sessione.
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
}
