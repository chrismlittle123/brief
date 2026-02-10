interface CompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  fallbacks?: string[];
  max_retries?: number;
  timeout?: number;
}

interface CompletionResponse {
  content: string;
  usage: Record<string, unknown>;
}

export class LLMClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await fetch(`${this.baseUrl}/v1/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LLM gateway error (${response.status}): ${body}`);
    }

    return (await response.json()) as CompletionResponse;
  }
}
