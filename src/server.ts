import { routeAgentRequest } from "agents";

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse
} from "ai";

import { createWorkersAI } from "workers-ai-provider";

import { cleanupMessages } from "./utils";

/**
 * Pure chat AI Agent using Cloudflare Workers AI (Llama 3.1 8B Instruct).
 * No tools, no calendar – just a friendly chatbot.
 */
export class Chat extends AIChatAgent<Env> {
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<{}>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Workers AI provider using the Cloudflare AI binding
        const workersai = createWorkersAI({ binding: this.env.AI });

        // @ts-ignore - model id is a valid Workers AI model
        const model = workersai("@cf/meta/llama-3.1-8b-instruct");

        const cleanedMessages = cleanupMessages(this.messages);

        const result = streamText({
          system: `
You are a friendly, helpful general-purpose AI assistant.

You:
- Answer questions clearly and concisely.
- Help with reasoning, explanations, and writing.
- Can chat casually and keep the conversation going.
- Do NOT call any external tools or APIs.
- Never output raw JSON as a final answer.

Always respond in natural language only.
`,
          messages: convertToModelMessages(cleanedMessages),
          model,
          // ❌ no tools
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<{}>,
          stopWhen: stepCountIs(10)
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Simple HTML homepage at "/"
    if (url.pathname === "/") {
      const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AI Chat Bot</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #fafafa;
      padding: 2rem;
      max-width: 720px;
      margin: 0 auto;
      line-height: 1.6;
      color: #222;
    }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    }
    code {
      background: #eee;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    pre {
      background: #111;
      color: #eee;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <h1>🤖 AI Chat Bot</h1>
  <div class="card">
    <p>
      This Cloudflare Worker powers a simple AI chat bot using
      <strong>Cloudflare Workers AI (Llama 3.1 8B Instruct)</strong>.
    </p>

    <p>Capabilities:</p>
    <ul>
      <li>General conversation and Q&amp;A</li>
      <li>Reasoning, explanations, and writing help</li>
      <li>No tools, no external APIs – pure chat</li>
    </ul>

    <p><strong>How to use the full chat UI locally:</strong></p>
    <pre><code>npm install
npm run dev
# then open http://localhost:5173/</code></pre>

    <p style="color:#777;">Worker origin: <code>${url.origin}</code></p>
  </div>
</body>
</html>
      `.trim();

      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }

    // Health-check endpoint for the frontend
    if (url.pathname === "/check-open-ai-key") {
      return Response.json({
        success: true,
        message: "Using Cloudflare Workers AI. No OpenAI API key required. No tools are used."
      });
    }

    // Route the request to our agent or return 404 if not found
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;