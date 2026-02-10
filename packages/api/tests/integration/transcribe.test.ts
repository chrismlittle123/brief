import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildApp } from "./setup.js";
import { transcribeRoute } from "../../src/routes/transcribe.js";

vi.mock("openai", () => ({
  default: class MockOpenAI {
    audio = {
      transcriptions: {
        create: vi.fn().mockResolvedValue({ text: "Hello, this is a test transcription." }),
      },
    };
  },
}));

function multipartPayload(filename: string, content: Buffer, mimeType: string) {
  const boundary = "----TestBoundary";
  return {
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      ),
      content,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
  };
}

describe("POST /v1/transcribe", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp(transcribeRoute);
  });

  afterEach(async () => {
    await app.close();
  });

  it("transcribes an audio file", async () => {
    const { headers, payload } = multipartPayload("test.webm", Buffer.from("fake-audio"), "audio/webm");

    const res = await app.inject({
      method: "POST",
      url: "/v1/transcribe",
      headers,
      payload,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().text).toBe("Hello, this is a test transcription.");
  });
});
