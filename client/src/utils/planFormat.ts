import type { LessonStage, TieredObjectives } from '../types';

export function formatTieredObjectives(tiers: TieredObjectives): string {
  return [
    `Барлық оқушылар үшін:\n${tiers.all || '—'}`,
    `Көпшілік оқушылар үшін:\n${tiers.most || '—'}`,
    `Кейбір оқушылар үшін:\n${tiers.some || '—'}`,
  ].join('\n\n');
}

export function formatStageTasksText(stage: LessonStage): string {
  return stage.tasks
    .map((t) => {
      const parts = [`${t.level}: ${t.task}`];
      if (t.roles) parts.push(`Рөлдер: ${t.roles}`);
      if (t.criterion) parts.push(`Критерий: ${t.criterion}`);
      parts.push(`Дескриптор: ${t.descriptor}${typeof t.points === 'number' ? ` (${t.points} балл)` : ' (балл жоқ)'}`);
      if (t.imageHint) parts.push(`[СУРЕТ ОРНЫ: ${t.imageHint}]`);
      return parts.join('\n');
    })
    .join('\n\n');
}

// Ресурстар мәтінін қажет болса ЕБҚ бейімделу жазбасымен біріктіреді —
// бөлек тар баған ашпай, сөздің ортадан бөлінуін болдырмау үшін.
export function formatStageResourcesText(stage: LessonStage): string {
  if (!stage.specialNeedsNote) return stage.resources;
  return `${stage.resources}\n\nЕБҚ бейімделуі: ${stage.specialNeedsNote}`;
}
