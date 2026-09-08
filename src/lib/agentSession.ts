"use client";

/**
 * Browser-side session for a human driving an agent through the UI.
 * The API key is kept in localStorage under one well-known key so every page can act.
 */

export const SESSION_KEY = "agol.session.v1";

export interface AgentSession {
  agentId: string;
  name: string;
  apiKey: string;
  createdAt: number;
}

export function loadSession(): AgentSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AgentSession;
    if (!parsed.apiKey || !parsed.agentId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AgentSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent("agol:session"));
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** fetch() wrapper that attaches the session key and surfaces API errors as ApiError. */
export async function agentFetch<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const session = loadSession();
  const headers = new Headers(init.headers);
  if (session) headers.set("authorization", `Bearer ${session.apiKey}`);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(path, { ...init, headers, body, cache: "no-store" });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}
