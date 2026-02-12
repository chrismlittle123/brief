// API calls go to Next.js API routes (same origin)
const API_URL = "/api/v1";

export type Report = {
  tldr: string;
  thisWeek: string[];
  challenges: string[];
  currentStatus: string;
  nextWeek: string[];
  dependencies: string;
  supportRequired: string;
  vibe: string;
  status: "ON_TRACK" | "AT_RISK" | "BLOCKED";
};

type CreateSessionOptions = {
  voice?: string;
  systemPrompt?: string;
  greeting?: string;
  userName?: string;
  weekOf?: string;
};

type CreateSessionResponse = {
  sessionId: string;
  token: string;
  livekitUrl: string;
};

type SessionResponse = {
  id: string;
  status: string;
  livekitRoom: string;
  weekOf?: string;
  transcript?: string;
  createdAt: string;
  updatedAt: string;
  report?: Report;
};

export async function createSession(
  opts: CreateSessionOptions
): Promise<CreateSessionResponse> {
  const response = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message || "Failed to create session");
  }

  return response.json() as Promise<CreateSessionResponse>;
}

export async function getSession(id: string): Promise<SessionResponse> {
  const response = await fetch(`${API_URL}/sessions/${id}`);

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message || "Failed to get session");
  }

  return response.json() as Promise<SessionResponse>;
}

export async function refineReport(
  currentReport: Report,
  instruction: string
): Promise<Report> {
  const response = await fetch(`${API_URL}/refine-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentReport, instruction }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message || "Report refinement failed");
  }

  return response.json() as Promise<Report>;
}

export async function saveToNotion(
  report: Report
): Promise<{ success: boolean; pageId: string; url: string }> {
  const response = await fetch(`${API_URL}/save-to-notion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message || "Failed to save to Notion");
  }

  return response.json() as Promise<{
    success: boolean;
    pageId: string;
    url: string;
  }>;
}
