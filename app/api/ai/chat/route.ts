import { NextRequest } from 'next/server';
import { groq, MODELS, SYSTEM_PROMPT } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const { messages, habitContext } = await req.json();

  const contextNote = habitContext
    ? `\n\nContexto del usuario: ${JSON.stringify(habitContext)}`
    : '';

  const stream = await groq.chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + contextNote },
      ...messages,
    ],
    temperature: 0.8,
    max_tokens: 300,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
