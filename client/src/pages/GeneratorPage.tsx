import { useState } from 'react';
import { ArrowLeft, FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import LessonForm from '../components/LessonForm';
import LessonPreview from '../components/LessonPreview';
import AdGateModal from '../components/AdGateModal';
import { generateLessonPlan } from '../api';
import type { LessonFormInput, LessonPlan } from '../types';

type ViewState = 'form' | 'loading' | 'result' | 'error';

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <span className="hero-eyebrow">
          <FileText size={14} aria-hidden="true" />
          Жасанды интеллект көмегімен
        </span>
        <h1>ҚМЖ Генератор</h1>
        <svg className="header-underline" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M2 8 C 40 2, 70 12, 110 6 S 180 2, 220 9 S 270 4, 298 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <p className="subtitle">
          Жасанды интеллект көмегімен қысқа мерзімді жоспарды бірнеше секундта дайындаңыз
        </p>
      </div>
    </section>
  );
}

export default function GeneratorPage() {
  const [view, setView] = useState<ViewState>('form');
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [exporting, setExporting] = useState<'docx' | 'pdf' | null>(null);
  const [pendingInput, setPendingInput] = useState<LessonFormInput | null>(null);
  const [showAdGate, setShowAdGate] = useState(false);

  function handleFormSubmit(input: LessonFormInput) {
    setPendingInput(input);
    setShowAdGate(true);
  }

  async function handleGenerate(input: LessonFormInput) {
    setView('loading');
    setErrorMsg('');
    const res = await generateLessonPlan(input);
    if (res.success && res.data) {
      setPlan(res.data);
      setView('result');
    } else {
      setErrorMsg(res.error || 'Белгісіз қате орын алды.');
      setView('error');
    }
  }

  function handleAdContinue() {
    setShowAdGate(false);
    if (pendingInput) handleGenerate(pendingInput);
    setPendingInput(null);
  }

  function handleAdCancel() {
    setShowAdGate(false);
    setPendingInput(null);
  }

  async function handleExport(format: 'docx' | 'pdf') {
    if (!plan) return;
    setExporting(format);
    try {
      if (format === 'docx') {
        const { exportToDocx } = await import('../utils/docxExport');
        await exportToDocx(plan);
      } else {
        const { exportToPdf } = await import('../utils/pdfExport');
        await exportToPdf(plan);
      }
    } catch (err) {
      console.error(err);
      alert('Файлды жүктеу кезінде қате пайда болды. Қайта көріңіз.');
    } finally {
      setExporting(null);
    }
  }

  function handleReset() {
    setPlan(null);
    setView('form');
    setErrorMsg('');
  }

  return (
    <>
      {view !== 'result' && <Hero />}

      {showAdGate && <AdGateModal onContinue={handleAdContinue} onCancel={handleAdCancel} />}

      {view === 'form' && (
        <div className="fade-in">
          <LessonForm onSubmit={handleFormSubmit} loading={false} />
        </div>
      )}

      {view === 'loading' && (
        <div className="status-box fade-in">
          <div className="status-icon is-loading">
            <Loader2 className="spinner-ring" size={36} aria-hidden="true" />
          </div>
          <p>Сабақ жоспары құрастырылуда, күте тұрыңыз…</p>
        </div>
      )}

      {view === 'error' && (
        <div className="status-box status-error fade-in">
          <div className="status-icon">
            <AlertCircle size={28} aria-hidden="true" />
          </div>
          <p>{errorMsg}</p>
          <button className="btn-secondary" onClick={handleReset} style={{ marginTop: 8 }}>
            Қайта көру
          </button>
        </div>
      )}

      {view === 'result' && plan && (
        <div className="result-wrap fade-in">
          <div className="toolbar">
            <button className="btn-secondary" onClick={handleReset}>
              <ArrowLeft size={18} aria-hidden="true" />
              Жаңа ҚМЖ
            </button>
            <div className="toolbar-actions">
              <button
                className="btn-primary"
                onClick={() => handleExport('docx')}
                disabled={exporting !== null}
              >
                <FileText size={18} aria-hidden="true" />
                {exporting === 'docx' ? 'Дайындалуда…' : 'Word (.docx)'}
              </button>
              <button
                className="btn-primary"
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
              >
                <Download size={18} aria-hidden="true" />
                {exporting === 'pdf' ? 'Дайындалуда…' : 'PDF жүктеу'}
              </button>
            </div>
          </div>
          <LessonPreview plan={plan} onChange={setPlan} />
        </div>
      )}
    </>
  );
}
