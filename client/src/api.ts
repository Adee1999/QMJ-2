import type { LessonFormInput, GenerateResponse } from './types';

// Дамыту кезінде vite proxy /api -> localhost:5000 бағыттайды (vite.config.ts қараңыз).
// Production-та backend пен frontend бір Node.js серверінен беріледі, сондықтан
// қатысты жол (/api/generate) жеткілікті.
const API_BASE = '/api';

export async function generateLessonPlan(input: LessonFormInput): Promise<GenerateResponse> {
  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Сервермен байланыс кезінде қате пайда болды.',
      };
    }

    return { success: true, data: data.plan };
  } catch (err) {
    console.error('generateLessonPlan error:', err);
    return {
      success: false,
      error: 'Серверге қосыла алмадық. Интернет байланысын тексеріп, қайта көріңіз.',
    };
  }
}
