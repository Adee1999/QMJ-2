import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LessonPlan, LessonStage } from '../types';
import { computeScoringSummary } from './scoring';
import { formatStageTasksText, formatStageResourcesText, formatTieredObjectives } from './planFormat';
import { NOTO_SERIF_REGULAR_BASE64, NOTO_SERIF_BOLD_BASE64 } from './pdfFonts';

const FONT = 'NotoSerif';
const PAGE_MARGIN = 12;
const HEAD_FILL: [number, number, number] = [244, 241, 228];
const LINE_COLOR: [number, number, number] = [200, 194, 168];

function registerFont(doc: jsPDF) {
  doc.addFileToVFS('NotoSerif-Regular.ttf', NOTO_SERIF_REGULAR_BASE64);
  doc.addFont('NotoSerif-Regular.ttf', FONT, 'normal');
  doc.addFileToVFS('NotoSerif-Bold.ttf', NOTO_SERIF_BOLD_BASE64);
  doc.addFont('NotoSerif-Bold.ttf', FONT, 'bold');
  doc.setFont(FONT, 'normal');
}

function pageWidth(doc: jsPDF) {
  return doc.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
}

function metaTable(doc: jsPDF, plan: LessonPlan, startY: number) {
  const w = pageWidth(doc);
  autoTable(doc, {
    startY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: 'grid',
    styles: { font: FONT, fontSize: 9, lineColor: LINE_COLOR, lineWidth: 0.2, cellPadding: 2.2 },
    tableWidth: w,
    columnStyles: {
      0: { cellWidth: w * 0.22, fontStyle: 'bold', fillColor: HEAD_FILL },
      1: { cellWidth: w * 0.28 },
      2: { cellWidth: w * 0.22, fontStyle: 'bold', fillColor: HEAD_FILL },
      3: { cellWidth: w * 0.28 },
    },
    body: [
      ['Мектеп', plan.school || '—', 'Күні', plan.date || '—'],
      ['Мұғалімнің аты-жөні', plan.teacher || '—', 'Сынып', plan.grade || '—'],
      ['Пән', plan.subject || '—', 'Қатысқандар саны', plan.studentsCount || '—'],
    ],
    didParseCell: (data) => {
      if (data.column.index === 1 || data.column.index === 3) data.cell.styles.fontStyle = 'normal';
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  autoTable(doc, {
    startY: finalY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: 'grid',
    styles: { font: FONT, fontSize: 9, lineColor: LINE_COLOR, lineWidth: 0.2, cellPadding: 2.2 },
    tableWidth: w,
    columnStyles: {
      0: { cellWidth: w * 0.22, fontStyle: 'bold', fillColor: HEAD_FILL },
      1: { cellWidth: w * 0.78 },
    },
    body: [['Қатыспағандар саны', plan.absentCount || '—']],
  });

  const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  autoTable(doc, {
    startY: finalY2,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: 'grid',
    styles: { font: FONT, fontSize: 9, cellPadding: 2.2 },
    tableWidth: w,
    columnStyles: {
      0: { cellWidth: w * 0.22, fontStyle: 'bold', fillColor: HEAD_FILL },
      1: { cellWidth: w * 0.78, fontStyle: 'bold' },
    },
    body: [['Сабақтың тақырыбы', plan.topic || '—']],
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function sectionTable(doc: jsPDF, rows: [string, string][], startY: number) {
  const w = pageWidth(doc);
  autoTable(doc, {
    startY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: 'grid',
    styles: { font: FONT, fontSize: 9, lineColor: LINE_COLOR, lineWidth: 0.2, cellPadding: 2.5, valign: 'top' },
    tableWidth: w,
    columnStyles: {
      0: { cellWidth: w * 0.3, fontStyle: 'bold', fillColor: HEAD_FILL },
      1: { cellWidth: w * 0.7 },
    },
    body: rows.map(([label, value]) => [label, value || '—']),
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function heading(doc: jsPDF, text: string, y: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + 14 > pageH - PAGE_MARGIN) {
    doc.addPage();
    y = PAGE_MARGIN;
  }
  doc.setFont(FONT, 'bold');
  doc.setFontSize(12);
  doc.text(text, PAGE_MARGIN, y + 6);
  doc.setFont(FONT, 'normal');
  return y + 11;
}

function stagesTable(doc: jsPDF, plan: LessonPlan, startY: number) {
  const w = pageWidth(doc);

  const cols: { header: string; width: number }[] = [
    { header: 'Кезең/Уақыты', width: 0.1 },
    { header: 'Мұғалім әрекеті (сценарий)', width: 0.28 },
    { header: 'Оқушы әрекеті', width: 0.18 },
    { header: 'Тапсырма / бағалау', width: 0.24 },
    { header: 'Ресурстар', width: 0.2 },
  ];

  const columnStyles: Record<number, { cellWidth: number; fontStyle?: 'bold' }> = {};
  cols.forEach((c, i) => {
    columnStyles[i] = { cellWidth: w * c.width, ...(i === 0 ? { fontStyle: 'bold' as const } : {}) };
  });

  function stageRow(label: string, stage: LessonStage) {
    return [
      `${label}\n(${stage.time})`,
      stage.teacherScript,
      stage.studentActions,
      formatStageTasksText(stage),
      formatStageResourcesText(stage),
    ];
  }

  autoTable(doc, {
    startY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: 'grid',
    styles: { font: FONT, fontSize: 8, lineColor: LINE_COLOR, lineWidth: 0.2, cellPadding: 2, valign: 'top' },
    tableWidth: w,
    head: [cols.map((c) => c.header)],
    headStyles: { fillColor: HEAD_FILL, textColor: 20, fontStyle: 'bold', fontSize: 8 },
    columnStyles,
    body: [
      stageRow('Басы', plan.beginning),
      stageRow('Ортасы', plan.middle),
      stageRow(plan.formativeMode ? 'БЖБ' : 'Соңы', plan.end),
    ],
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function scoringTable(doc: jsPDF, plan: LessonPlan, startY: number): number {
  const { rows, total } = computeScoringSummary(plan);
  if (rows.length === 0) return startY;

  let y = heading(doc, `Сабақ бойынша бағалау критерийлері (${total} балл)`, startY);
  const w = pageWidth(doc);

  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: 'grid',
    styles: { font: FONT, fontSize: 8.5, lineColor: LINE_COLOR, lineWidth: 0.2, cellPadding: 2.2, valign: 'top' },
    tableWidth: w,
    head: [['Кезең', 'Деңгей', 'Критерий', 'Дескриптор', 'Балл']],
    headStyles: { fillColor: HEAD_FILL, textColor: 20, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: w * 0.18 },
      1: { cellWidth: w * 0.15 },
      2: { cellWidth: w * 0.2 },
      3: { cellWidth: w * 0.37 },
      4: { cellWidth: w * 0.1, halign: 'center', fontStyle: 'bold' },
    },
    body: [
      ...rows.map((r) => [r.stage, r.level, r.criterion, r.descriptor, String(r.points)]),
      [{ content: 'Барлығы', colSpan: 4, styles: { fontStyle: 'bold' as const, fillColor: HEAD_FILL } }, { content: String(total), styles: { fontStyle: 'bold' as const, fillColor: HEAD_FILL, halign: 'center' as const } }],
    ],
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function taskCards(doc: jsPDF, plan: LessonPlan, startY: number) {
  if (plan.readyTaskCards.length === 0) return;
  let y = heading(doc, 'Дайын тапсырмалар (сыныпта қолдануға)', startY);
  const w = pageWidth(doc);
  const pageH = doc.internal.pageSize.getHeight();

  plan.readyTaskCards.forEach((card, i) => {
    doc.setFont(FONT, 'bold');
    doc.setFontSize(10);
    const titleLines = doc.splitTextToSize(`${i + 1}. ${card.title}`, w);
    doc.setFont(FONT, 'normal');
    doc.setFontSize(9);
    const contentLines = doc.splitTextToSize(card.content, w);
    const blockHeight = titleLines.length * 5 + contentLines.length * 4.5 + 6;

    if (y + blockHeight > pageH - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    doc.setFont(FONT, 'bold');
    doc.setFontSize(10);
    doc.text(titleLines, PAGE_MARGIN, y + 4);
    y += titleLines.length * 5 + 1;

    doc.setFont(FONT, 'normal');
    doc.setFontSize(9);
    doc.text(contentLines, PAGE_MARGIN, y + 3.5);
    y += contentLines.length * 4.5 + 5;
  });
}

export async function exportToPdf(plan: LessonPlan) {
  const doc = new jsPDF('p', 'mm', 'a4');
  registerFont(doc);

  doc.setFont(FONT, 'bold');
  doc.setFontSize(15);
  doc.text('ҚЫСҚА МЕРЗІМДІ ЖОСПАР', doc.internal.pageSize.getWidth() / 2, PAGE_MARGIN + 4, { align: 'center' });
  doc.setFont(FONT, 'normal');

  let y = metaTable(doc, plan, PAGE_MARGIN + 10);

  y = sectionTable(
    doc,
    [
      ['Осы сабақта қол жеткізілетін оқу мақсаттары', plan.learningObjectives],
      ['Сабақ мақсаттары', formatTieredObjectives(plan.lessonObjectives)],
      ['Бағалау критерийлері', plan.assessmentCriteria],
      ['Тілдік мақсаттар', plan.languageObjectives],
      ['Құндылықтарды дарыту', plan.values],
      ['Пәнаралық байланыс', plan.crossCurricularLinks],
      ['АКТ қолдану дағдылары', plan.ictSkills],
      ['Алдыңғы білім', plan.priorLearning],
    ],
    y + 3
  );

  y = heading(doc, 'Сабақ барысы', y + 3);
  y = stagesTable(doc, plan, y);

  const tailRows: [string, string][] = [
    ['Саралау', plan.differentiation],
    ['Бағалау', plan.assessment],
    ['Денсаулық және қауіпсіздік ережелері', plan.healthSafety],
  ];
  if (!plan.formativeMode) tailRows.push(['Сабақ бойынша рефлексия', plan.reflection || '']);
  y = sectionTable(doc, tailRows, y + 3);

  if (plan.formativeMode && plan.formativeAssessment) {
    y = heading(doc, 'БЖБ тапсырмасы', y + 3);
    y = sectionTable(
      doc,
      [
        ['Тапсырма', plan.formativeAssessment.task],
        ['Критерийлер', plan.formativeAssessment.criteria],
        ['Дескрипторлар', plan.formativeAssessment.descriptors],
      ],
      y
    );
  }

  y = scoringTable(doc, plan, y + 3);
  taskCards(doc, plan, y + 3);

  const filename = `QMZH_${(plan.subject || 'sabaq').replace(/\s+/g, '_')}_${plan.grade || ''}.pdf`;
  doc.save(filename);
}
