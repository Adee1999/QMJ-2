import { useState } from 'react';
import type { FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import type { LessonFormInput, WorkType } from '../types';
import { WORK_TYPES } from '../types';

interface Props {
  onSubmit: (input: LessonFormInput) => void;
  loading: boolean;
}

const SUBJECTS = [
  'Қазақ тілі', 'Қазақ әдебиеті', 'Орыс тілі', 'Ағылшын тілі',
  'Математика', 'Алгебра', 'Геометрия', 'Информатика',
  'Дүниетану', 'Жаратылыстану', 'Биология', 'Физика', 'Химия',
  'Тарих', 'Дүние жүзі тарихы', 'Қазақстан тарихы', 'География',
  'Өзін-өзі тану', 'Дене шынықтыру', 'Музыка', 'Көркем еңбек',
];

const GRADES = Array.from({ length: 11 }, (_, i) => `${i + 1}-сынып`);
const MAX_WORK_TYPES = 3;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LessonForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<LessonFormInput>({
    subject: '',
    grade: '',
    topic: '',
    duration: '40',
    school: '',
    teacher: '',
    date: todayISO(),
    studentsCount: '',
    workTypes: [],
    specialNeeds: false,
    formativeMode: false,
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function update<K extends keyof LessonFormInput>(key: K, value: LessonFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleWorkType(type: WorkType) {
    setForm((f) => {
      const has = f.workTypes.includes(type);
      if (has) return { ...f, workTypes: f.workTypes.filter((t) => t !== type) };
      if (f.workTypes.length >= MAX_WORK_TYPES) return f;
      return { ...f, workTypes: [...f.workTypes, type] };
    });
  }

  function validate(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!form.subject.trim()) next.subject = 'Пәнді таңдаңыз немесе енгізіңіз';
    if (!form.grade.trim()) next.grade = 'Сыныпты таңдаңыз';
    if (!form.topic.trim()) next.topic = 'Сабақ тақырыбын жазыңыз';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <form className="lesson-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2 className="section-title">Сабақ параметрлері</h2>
        <p className="section-subtitle">Толтыру үшін өрістерді пайдаланыңыз — жасанды интеллект ҚМЖ-ны дайындайды</p>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="subject">Пән *</label>
          <input
            id="subject"
            list="subjects-list"
            value={form.subject}
            onChange={(e) => update('subject', e.target.value)}
            placeholder="Мысалы: Қазақ тілі"
          />
          <datalist id="subjects-list">
            {SUBJECTS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {errors.subject && <span className="error">{errors.subject}</span>}
        </div>

        <div className="field">
          <label htmlFor="grade">Сынып *</label>
          <input
            id="grade"
            list="grades-list"
            value={form.grade}
            onChange={(e) => update('grade', e.target.value)}
            placeholder="Мысалы: 5-сынып"
          />
          <datalist id="grades-list">
            {GRADES.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          {errors.grade && <span className="error">{errors.grade}</span>}
        </div>

        <div className="field field-wide">
          <label htmlFor="topic">Сабақтың тақырыбы *</label>
          <input
            id="topic"
            value={form.topic}
            onChange={(e) => update('topic', e.target.value)}
            placeholder="Мысалы: Есімдіктің мағыналық түрлері"
          />
          {errors.topic && <span className="error">{errors.topic}</span>}
        </div>

        <div className="field">
          <label htmlFor="duration">Сабақ ұзақтығы (мин)</label>
          <input
            id="duration"
            type="number"
            min={20}
            max={90}
            value={form.duration}
            onChange={(e) => update('duration', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="studentsCount">Оқушылар саны</label>
          <input
            id="studentsCount"
            type="number"
            min={0}
            value={form.studentsCount}
            onChange={(e) => update('studentsCount', e.target.value)}
            placeholder="Міндетті емес"
          />
        </div>

        <div className="field">
          <label htmlFor="school">Мектеп</label>
          <input
            id="school"
            value={form.school}
            onChange={(e) => update('school', e.target.value)}
            placeholder="Міндетті емес"
          />
        </div>

        <div className="field">
          <label htmlFor="teacher">Мұғалімнің аты-жөні</label>
          <input
            id="teacher"
            value={form.teacher}
            onChange={(e) => update('teacher', e.target.value)}
            placeholder="Міндетті емес"
          />
        </div>

        <div className="field">
          <label htmlFor="date">Күні</label>
          <input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
          />
        </div>
      </div>

      {/* ---------- Жұмыс түрлері ---------- */}
      <div className="field-group">
        <label className="group-label">
          Жұмыс түрлері <span className="group-hint">(ең көбі {MAX_WORK_TYPES})</span>
        </label>
        <div className="checkbox-grid">
          {WORK_TYPES.map((type) => {
            const checked = form.workTypes.includes(type);
            const disabled = !checked && form.workTypes.length >= MAX_WORK_TYPES;
            return (
              <label key={type} className={`checkbox-chip ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleWorkType(type)}
                />
                {type}
              </label>
            );
          })}
        </div>
      </div>

      {/* ---------- ЕБҚ / БЖБ ---------- */}
      <div className="field-group">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={form.specialNeeds}
            onChange={(e) => update('specialNeeds', e.target.checked)}
          />
          <span>
            <strong>ЕБҚ бар оқушылар бар</strong>
            <br />
            <span className="group-hint">Әр кезеңге қосымша бейімдеу бағаны қосылады</span>
          </span>
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={form.formativeMode}
            onChange={(e) => update('formativeMode', e.target.checked)}
          />
          <span>
            <strong>БЖБ бекіту мен рефлексияның орнына</strong>
            <br />
            <span className="group-hint">Қосылса, сабақ соңында «БЖБ» кезеңі болады, бөлек рефлексия қосылмайды</span>
          </span>
        </label>
      </div>

      <button type="submit" className="btn-primary btn-block" disabled={loading}>
        <Sparkles size={18} aria-hidden="true" />
        {loading ? 'Генерациялануда…' : 'ҚМЖ генерациялау'}
      </button>
    </form>
  );
}
