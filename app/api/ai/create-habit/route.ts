import { NextRequest, NextResponse } from 'next/server';
import { groq, MODELS, SYSTEM_PROMPT, HabitCreationResult } from '@/lib/groq';

const CATEGORY_COLORS: Record<string, string> = {
  fitness: '#f97316',
  health: '#22c55e',
  learning: '#8b5cf6',
  mindfulness: '#06b6d4',
  productivity: '#3b82f6',
  social: '#ec4899',
};

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    const prompt = `El usuario quiere crear este hábito: "${description}"

Genera la estructura completa del hábito. Responde SOLO con JSON válido:
{
  "nombre": "nombre conciso del hábito",
  "icono": "un emoji representativo",
  "categoria": "fitness|health|learning|mindfulness|productivity|social",
  "color": "#hexcolor según categoría",
  "levels": {
    "minimum": {"duration": <2-10 min>, "description": "versión mínima específica", "points": 10},
    "ideal": {"duration": <15-30 min>, "description": "versión ideal específica", "points": 25},
    "elite": {"duration": <45-90 min>, "description": "versión elite específica", "points": 50}
  },
  "schedule": {
    "time": "HH:MM más apropiado para este hábito",
    "days": ["mon","tue","wed","thu","fri"] (o ajusta según el hábito),
    "pre_habit_reminder": true o false según si necesita preparación,
    "pre_habit_message": "mensaje de recordatorio nocturno si aplica, si no empty string"
  },
  "commitment_contribution": <5-25 según importancia del hábito>
}`;

    const completion = await groq.chat.completions.create({
      model: MODELS.coach,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content ?? '{}';
    const habit: HabitCreationResult = JSON.parse(content);

    // Ensure color matches category
    if (!habit.color && habit.categoria) {
      habit.color = CATEGORY_COLORS[habit.categoria] ?? '#3b82f6';
    }

    return NextResponse.json({ habit });
  } catch (err) {
    console.error('[AI Create Habit]', err);
    return NextResponse.json({ error: 'No se pudo crear el hábito' }, { status: 500 });
  }
}
