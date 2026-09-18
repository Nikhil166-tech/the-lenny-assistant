import { HealthStatus, Session, Message } from '../types';

const RAW_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE = RAW_BASE ? `${RAW_BASE}/api` : '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health probe failed');
  return res.json();
}

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error('Failed fetching sessions');
  return res.json();
}

export async function createSession(title: string = "New Growth Session"): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed creating session');
  return res.json();
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed deleting session');
}

export async function fetchSessionMessages(sessionId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);
  if (!res.ok) throw new Error('Failed fetching messages');
  return res.json();
}
