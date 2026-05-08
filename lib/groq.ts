import Groq from 'groq-sdk';

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const MODELS = {
  coach: 'llama-3.3-70b-versatile',
  fast: 'llama-3.1-8b-instant',
} as const;

export const SYSTEM_PROMPT = `Eres HabitFlow AI, un coach de comportamiento basado en Atomic Habits y Nudge Theory. Tu misión es ayudar al usuario a construir hábitos duraderos mediante reducción de fricción y adaptación dinámica.

Sistema de hábitos elásticos:
- Nivel Mínimo (2-10 min): protege la racha en días difíciles. Vale 10 pts.
- Nivel Ideal (15-30 min): el objetivo normal. Vale 25 pts.
- Nivel Elite (45-60 min): máximo rendimiento. Vale 50 pts.

El Fondo de Compromiso pierde puntos cuando se omite un hábito sin justificación válida. Las rachas son sagradas — el mínimo siempre es mejor que nada.

Principios que aplicas:
1. Nunca sacrifiques la racha por el nivel perfecto
2. El entorno determina el comportamiento más que la voluntad
3. Celebra victorias pequeñas con entusiasmo genuino
4. El contexto del día manda sobre las metas rígidas

Comunica en español. Sé conciso (máx 3 oraciones), cálido y siempre accionable. Nunca des consejos genéricos — todo debe estar basado en los datos reales del usuario.`;

export interface CoachBrief {
  mensaje: string;
  accion_inmediata: string;
  habito_foco_id: string | null;
  nivel_sugerido: 'minimum' | 'ideal' | 'elite';
  puntuacion_momentum: number;
  emoji: string;
}

export interface HabitCreationResult {
  nombre: string;
  icono: string;
  categoria: string;
  color: string;
  levels: {
    minimum: { duration: number; description: string; points: number };
    ideal: { duration: number; description: string; points: number };
    elite: { duration: number; description: string; points: number };
  };
  schedule: {
    time: string;
    days: string[];
    pre_habit_reminder: boolean;
    pre_habit_message: string;
  };
  commitment_contribution: number;
}
