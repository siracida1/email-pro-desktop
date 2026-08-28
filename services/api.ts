import { EmailAccount } from '../types';

type EmailResult = { success: boolean; messageId?: string; error?: string };

async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return response;
}

export async function getData(key: string): Promise<unknown> {
  const response = await apiFetch(`/data/${key}`);
  if (!response.ok) return null;
  const { value } = await response.json();
  return value;
}

export async function saveData(key: string, value: unknown): Promise<boolean> {
  const response = await apiFetch(`/data/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value })
  });
  return response.ok;
}

export async function sendEmail(
  config: EmailAccount,
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const response = await apiFetch('/email/send', {
    method: 'POST',
    body: JSON.stringify({ config, to, subject, html })
  });
  return response.json();
}

export async function testSmtp(config: EmailAccount, testRecipient?: string): Promise<EmailResult> {
  const response = await apiFetch('/email/test-smtp', {
    method: 'POST',
    body: JSON.stringify({ config, testRecipient })
  });
  return response.json();
}

export async function login(password: string): Promise<{ success: boolean; error?: string }> {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
  return response.json();
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}

export async function checkSession(): Promise<boolean> {
  try {
    const response = await apiFetch('/auth/session');
    if (!response.ok) return false;
    const { authenticated } = await response.json();
    return Boolean(authenticated);
  } catch {
    return false;
  }
}
