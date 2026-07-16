import type { LessonPlan, LessonStage, DifferentiatedTask } from '../types';
import { computeScoringSummary } from '../utils/scoring';

interface Props {
  plan: LessonPlan;
  onChange: (plan: LessonPlan) => void;
}

type StageKey = 'beginning' | 'middle' | 'end';

function AutoTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      className="cell-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={Math.max(2, Math.ceil(value.length / 55))}
    />
  );
}

export default function LessonPreview({ plan, onChange }: Props) {
  function set<K extends keyof LessonPlan>(key: K, value: LessonPlan[K]) {
    onChange({ ...plan, [key]: value });
  }

  function setStage<K extends keyof LessonStage>(stageKey: StageKey, field: K, value: LessonStage[K]) {
    onChange({ ...plan, [stageKey]: { ...plan[stageKey], [field]: value } });
  }

  function setTask<K extends keyof DifferentiatedTask>(
    stageKey: StageKey,
    taskIndex: number,
    field: K,
    value: DifferentiatedTask[K]
  ) {
    const stage = plan[stageKey];
    const tasks = stage.tasks.map((t, i) => (i === taskIndex ? { ...t, [field]: value } : t));
    onChange({ ...plan, [stageKey]: { ...stage, tasks } });
  }

  function setCard(index: number, field: 'title' | 'content', value: string) {
    const cards = plan.readyTaskCards.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    onChange({ ...plan, readyTaskCards: cards });
  }

  const { rows: scoringRows, total } = computeScoringSummary(plan);

  function renderStage(stageKey: StageKey, label: string) {
    const stage = plan[stageKey];
    return (
      <div className="stage-block" key={stageKey}>
        <div className="stage-block-header">
          <h4>{label}</h4>
          <input
            className="cell-input stage-time"
            value={stage.time}
            onChange={(e) => setStage(stageKey, 'time', e.target.value)}
          />
        </div>

        <div className="stage-sub">
          <span className="sub-label">Мұғалімнің сценарийі</span>
          <AutoTextarea value={stage.teacherScript} onChange={(v) => setStage(stageKey, 'teacherScript', v)} />
        </div>

        <div className="stage-sub">
          <span className="sub-label">Оқушы әрекеті</span>
          <AutoTextarea value={stage.studentActions} onChange={(v) => setStage(stageKey, 'studentActions', v)} />
        </div>

        {stage.tasks.length > 0 && (
          <div className="tasks-block">
            <span className="sub-label">Тапсырмалар / бағалау</span>
            <table className="tasks-table">
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>Деңгей</th>
                  <th style={{ width: '28%' }}>Тапсырма</th>
                  {plan.workTypes.includes('Топтық жұмыс') && <th style={{ width: '14%' }}>Рөлдер</th>}
                  <th style={{ width: '16%' }}>Критерий</th>
                  <th style={{ width: '20%' }}>Дескриптор</th>
                  <th style={{ width: '8%' }}>Балл</th>
                </tr>
              </thead>
              <tbody>
                {stage.tasks.map((task, i) => (
                  <tr key={i}>
                    <td><input className="cell-input" value={task.level} onChange={(e) => setTask(stageKey, i, 'level', e.target.value)} /></td>
                    <td>
                      <AutoTextarea value={task.task} onChange={(v) => setTask(stageKey, i, 'task', v)} />
                      {(task.imageHint !== undefined) && (
                        <div className="image-placeholder">
                          <span className="image-placeholder-icon" aria-hidden="true">🖼</span>
                          <input
                            className="cell-input image-placeholder-input"
                            value={task.imageHint || ''}
                            placeholder="Сурет орны — не салу керегін жазыңыз"
                            onChange={(e) => setTask(stageKey, i, 'imageHint', e.target.value)}
                          />
                        </div>
                      )}
                      {task.imageHint === undefined && (
                        <button
                          type="button"
                          className="image-placeholder-add"
                          onClick={() => setTask(stageKey, i, 'imageHint', '')}
                        >
                          + Сурет орнын қосу
                        </button>
                      )}
                    </td>
                    {plan.workTypes.includes('Топтық жұмыс') && (
                      <td><AutoTextarea value={task.roles || ''} onChange={(v) => setTask(stageKey, i, 'roles', v)} /></td>
                    )}
                    <td><AutoTextarea value={task.criterion || ''} onChange={(v) => setTask(stageKey, i, 'criterion', v)} /></td>
                    <td><AutoTextarea value={task.descriptor} onChange={(v) => setTask(stageKey, i, 'descriptor', v)} /></td>
                    <td>
                      <input
                        className="cell-input points-input"
                        type="number"
                        min={0}
                        value={task.points ?? ''}
                        placeholder="—"
                        onChange={(e) =>
                          setTask(stageKey, i, 'points', e.target.value === '' ? undefined : Number(e.target.value))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="stage-sub">
          <span className="sub-label">Ресурстар</span>
          <AutoTextarea value={stage.resources} onChange={(v) => setStage(stageKey, 'resources', v)} />
        </div>

        {plan.specialNeeds && (
          <div className="stage-sub sen-note">
            <span className="sub-label">ЕБҚ бейімделуі</span>
            <AutoTextarea
              value={stage.specialNeedsNote || ''}
              onChange={(v) => setStage(stageKey, 'specialNeedsNote', v)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="qmzh-document" className="qmzh-document">
      <h2 className="doc-title">ҚЫСҚА МЕРЗІМДІ ЖОСПАР</h2>

      <table className="meta-table">
        <tbody>
          <tr>
            <td className="meta-label">Мектеп</td>
            <td><input className="cell-input" value={plan.school} onChange={(e) => set('school', e.target.value)} /></td>
            <td className="meta-label">Күні</td>
            <td><input className="cell-input" value={plan.date} onChange={(e) => set('date', e.target.value)} /></td>
          </tr>
          <tr>
            <td className="meta-label">Мұғалімнің аты-жөні</td>
            <td><input className="cell-input" value={plan.teacher} onChange={(e) => set('teacher', e.target.value)} /></td>
            <td className="meta-label">Сынып</td>
            <td><input className="cell-input" value={plan.grade} onChange={(e) => set('grade', e.target.value)} /></td>
          </tr>
          <tr>
            <td className="meta-label">Пән</td>
            <td><input className="cell-input" value={plan.subject} onChange={(e) => set('subject', e.target.value)} /></td>
            <td className="meta-label">Қатысқандар саны</td>
            <td><input className="cell-input" value={plan.studentsCount} onChange={(e) => set('studentsCount', e.target.value)} /></td>
          </tr>
          <tr>
            <td className="meta-label">Қатыспағандар саны</td>
            <td colSpan={3}><input className="cell-input" value={plan.absentCount} onChange={(e) => set('absentCount', e.target.value)} placeholder="Сабақ күні толтырылады" /></td>
          </tr>
          <tr>
            <td className="meta-label">Сабақтың тақырыбы</td>
            <td colSpan={3}><input className="cell-input" value={plan.topic} onChange={(e) => set('topic', e.target.value)} /></td>
          </tr>
        </tbody>
      </table>

      <table className="section-table">
        <tbody>
          <tr>
            <td className="section-label">Осы сабақта қол жеткізілетін оқу мақсаттары</td>
            <td><AutoTextarea value={plan.learningObjectives} onChange={(v) => set('learningObjectives', v)} /></td>
          </tr>
          <tr>
            <td className="section-label">Сабақ мақсаттары</td>
            <td className="tiered-objectives">
              <div className="tier-row">
                <span className="tier-label">Барлық оқушылар үшін:</span>
                <AutoTextarea
                  value={plan.lessonObjectives.all}
                  onChange={(v) => set('lessonObjectives', { ...plan.lessonObjectives, all: v })}
                />
              </div>
              <div className="tier-row">
                <span className="tier-label">Көпшілік оқушылар үшін:</span>
                <AutoTextarea
                  value={plan.lessonObjectives.most}
                  onChange={(v) => set('lessonObjectives', { ...plan.lessonObjectives, most: v })}
                />
              </div>
              <div className="tier-row">
                <span className="tier-label">Кейбір оқушылар үшін:</span>
                <AutoTextarea
                  value={plan.lessonObjectives.some}
                  onChange={(v) => set('lessonObjectives', { ...plan.lessonObjectives, some: v })}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td className="section-label">Бағалау критерийлері</td>
            <td><AutoTextarea value={plan.assessmentCriteria} onChange={(v) => set('assessmentCriteria', v)} /></td>
          </tr>
          <tr>
            <td className="section-label">Тілдік мақсаттар</td>
            <td><AutoTextarea value={plan.languageObjectives} onChange={(v) => set('languageObjectives', v)} /></td>
          </tr>
          <tr>
            <td className="section-label">Құндылықтарды дарыту</td>
            <td><AutoTextarea value={plan.values} onChange={(v) => set('values', v)} /></td>
          </tr>
          <tr>
            <td className="section-label">Пәнаралық байланыс</td>
            <td><AutoTextarea value={plan.crossCurricularLinks} onChange={(v) => set('crossCurricularLinks', v)} /></td>
          </tr>
          <tr>
            <td className="section-label">АКТ қолдану дағдылары</td>
            <td><AutoTextarea value={plan.ictSkills} onChange={(v) => set('ictSkills', v)} /></td>
          </tr>
          <tr>
            <td className="section-label">Алдыңғы білім</td>
            <td><AutoTextarea value={plan.priorLearning} onChange={(v) => set('priorLearning', v)} /></td>
          </tr>
        </tbody>
      </table>

      <h3 className="stage-title">Сабақ барысы</h3>
      {renderStage('beginning', 'Сабақтың басы')}
      {renderStage('middle', 'Сабақтың ортасы')}
      {renderStage('end', plan.formativeMode ? 'БЖБ' : 'Сабақтың соңы')}

      <table className="section-table">
        <tbody>
          <tr>
            <td className="section-label">Саралау</td>
            <td><AutoTextarea value={plan.differentiation} onChange={(v) => set('differentiation', v)} /></td>
          </tr>
          <tr>
            <td className="section-label">Бағалау</td>
            <td><AutoTextarea value={plan.assessment} onChange={(v) => set('assessment', v)} /></td>
          </tr>
          <tr>
            <td className="section-label">Денсаулық және қауіпсіздік ережелері</td>
            <td><AutoTextarea value={plan.healthSafety} onChange={(v) => set('healthSafety', v)} /></td>
          </tr>
          {!plan.formativeMode && (
            <tr>
              <td className="section-label">Сабақ бойынша рефлексия</td>
              <td><AutoTextarea value={plan.reflection || ''} onChange={(v) => set('reflection', v)} /></td>
            </tr>
          )}
        </tbody>
      </table>

      {plan.formativeMode && plan.formativeAssessment && (
        <>
          <h3 className="stage-title">БЖБ тапсырмасы</h3>
          <table className="section-table">
            <tbody>
              <tr>
                <td className="section-label">Тапсырма</td>
                <td>
                  <AutoTextarea
                    value={plan.formativeAssessment.task}
                    onChange={(v) => set('formativeAssessment', { ...plan.formativeAssessment!, task: v })}
                  />
                </td>
              </tr>
              <tr>
                <td className="section-label">Критерийлер</td>
                <td>
                  <AutoTextarea
                    value={plan.formativeAssessment.criteria}
                    onChange={(v) => set('formativeAssessment', { ...plan.formativeAssessment!, criteria: v })}
                  />
                </td>
              </tr>
              <tr>
                <td className="section-label">Дескрипторлар</td>
                <td>
                  <AutoTextarea
                    value={plan.formativeAssessment.descriptors}
                    onChange={(v) => set('formativeAssessment', { ...plan.formativeAssessment!, descriptors: v })}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {scoringRows.length > 0 && (
        <>
          <h3 className="stage-title">Сабақ бойынша бағалау критерийлері ({total} балл)</h3>
          <table className="stage-table scoring-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Кезең</th>
                <th style={{ width: '15%' }}>Деңгей</th>
                <th style={{ width: '20%' }}>Критерий</th>
                <th style={{ width: '35%' }}>Дескриптор</th>
                <th style={{ width: '10%' }}>Балл</th>
              </tr>
            </thead>
            <tbody>
              {scoringRows.map((row, i) => (
                <tr key={i}>
                  <td>{row.stage}</td>
                  <td>{row.level}</td>
                  <td>{row.criterion}</td>
                  <td>{row.descriptor}</td>
                  <td className="points-cell">{row.points}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={4}>Барлығы</td>
                <td className="points-cell">{total}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {plan.readyTaskCards.length > 0 && (
        <>
          <h3 className="stage-title">Дайын тапсырмалар (сыныпта қолдануға)</h3>
          <div className="task-cards">
            {plan.readyTaskCards.map((card, i) => (
              <div className="task-card" key={i}>
                <input
                  className="cell-input card-title"
                  value={card.title}
                  onChange={(e) => setCard(i, 'title', e.target.value)}
                />
                <AutoTextarea value={card.content} onChange={(v) => setCard(i, 'content', v)} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
