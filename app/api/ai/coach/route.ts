import { NextRequest, NextResponse } from 'next/server';
import { groq, MODELS, SYSTEM_PROMPT, CoachBrief } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { habits, context, userName } = await req.json();

    const pending = habits.filter((h: { completed: boolean; scheduled: boolean }) => !h.completed && h.scheduled);
    const completed = habits.filter((h: { completed: boolean }) => h.completed);
    const totalStreak = habits.reduce((s: number, h: { current_streak: number }) => s + h.current_streak, 0);

    const userPrompt = `
Usuario: ${userName || 'Usuario'}
Contexto del día: ${context.busy_level} | Energía: ${context.energy_level}%

Hábitos pendientes hoy (${pending.length}):
${pending.map((h: { name: string; current_streak: number; current_difficulty_level: string }) =>
  `- ${h.name}: racha ${h.current_streak} días, nivel actual ${h.current_difficulty_level}`
).join('\n')}

Completados hoy: ${completed.length}
Racha total acumulada: ${totalStreak} días

Genera un brief motivacional para este momento. Responde SOLO con JSON válido:
{
  "mensaje": "mensaje motivacional personalizado (máx 2 oraciones)",
  "accion_inmediata": "qué hacer en los próximos 5 minutos",
  "habito_foco_id": "${pending[0]?.id || null}",
  "nivel_sugerido": "${context.busy_level === 'overloaded' || context.energy_level < 30 ? 'minimum' : context.busy_level === 'busy' ? 'ideal' : 'elite'}",
  "puntuacion_momentum": <número 0-100 basado en el contexto>,
  "emoji": "<emoji que representa el momento>"
}`;

    const completion = await groq.chat.completions.create({
      model: MODELS.coach,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content ?? '{}';
    const brief: CoachBrief = JSON.parse(content);

    return NextResponse.json({ brief });
  } catch (err) {
    console.error('[AI Coach]', err);
    return NextResponse.json({
      brief: {
        mensaje: 'Cada acción pequeña construye el camino. Empieza con un solo paso hoy.',
        accion_inmediata: 'Abre tu primer hábito y completa el nivel mínimo.',
        habito_foco_id: null,
        nivel_sugerido: 'ideal',
        puntuacion_momentum: 70,
        emoji: '🎯',
      },
    });
  }
}
