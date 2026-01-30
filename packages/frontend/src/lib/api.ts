// API calls go to Next.js API routes (same origin)
const API_URL = "/api";

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");

  const response = await fetch(`${API_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Transcription failed");
  }

  const data = await response.json();
  return data.text;
}

export interface Report {
  tldr: string;
  thisWeek: string[];
  challenges: string[];
  currentStatus: string;
  nextWeek: string[];
  dependencies: string;
  supportRequired: string;
  vibe: string;
  status: "On Track" | "At Risk" | "Blocked";
}

export async function generateReport(
  responses: Record<string, string>
): Promise<Report> {
  const response = await fetch(`${API_URL}/generate-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ responses }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Report generation failed");
  }

  return response.json();
}

export async function refineReport(
  currentReport: Report,
  instruction: string
): Promise<Report> {
  const response = await fetch(`${API_URL}/refine-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentReport, instruction }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Report refinement failed");
  }

  return response.json();
}

export async function saveToNotion(
  report: Report
): Promise<{ success: boolean; pageId: string; url: string }> {
  const response = await fetch(`${API_URL}/save-to-notion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ report }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to save to Notion");
  }

  return response.json();
}
