import type { LessonPlan, ScoringRow, LessonStage } from '../types';

const STAGE_LABELS: Record<'beginning' | 'middle' | 'end', string> = {
  beginning: 'Сабақтың басы',
  middle: 'Сабақтың ортасы',
  end: 'Сабақтың соңы',
};

function stageRows(stageKey: 'beginning' | 'middle' | 'end', stage: LessonStage): ScoringRow[] {
  return stage.tasks
    .filter((t) => typeof t.points === 'number' && t.points > 0)
    .map((t) => ({
      stage: STAGE_LABELS[stageKey],
      level: t.level,
      criterion: t.criterion || '—',
      descriptor: t.descriptor,
      points: t.points as number,
    }));
}

export function computeScoringSummary(plan: LessonPlan): { rows: ScoringRow[]; total: number } {
  const rows = [
    ...stageRows('beginning', plan.beginning),
    ...stageRows('middle', plan.middle),
    ...(plan.formativeMode ? [] : stageRows('end', plan.end)),
  ];
  const total = rows.reduce((sum, r) => sum + r.points, 0);
  return { rows, total };
}
