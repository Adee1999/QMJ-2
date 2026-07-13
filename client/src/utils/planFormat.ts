import type { LessonStage } from '../types';

export function formatStageTasksText(stage: LessonStage): string {
  return stage.tasks
    .map((t) => {
      const parts = [`${t.level}: ${t.task}`];
      if (t.criterion) parts.push(`Критерий: ${t.criterion}`);
      parts.push(`Дескриптор: ${t.descriptor}${typeof t.points === 'number' ? ` (${t.points} балл)` : ' (балл жоқ)'}`);
      return parts.join('\n');
    })
    .join('\n\n');
}

export function formatStageRolesText(stage: LessonStage): string {
  return stage.tasks
    .map((t) => (t.roles ? `${t.level}: ${t.roles}` : ''))
    .filter(Boolean)
    .join('\n');
}
