import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  VerticalAlign,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import type { LessonPlan, LessonStage } from '../types';
import { computeScoringSummary } from './scoring';
import { formatStageTasksText, formatStageRolesText } from './planFormat';

const FONT = 'Times New Roman';

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
  left: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
  right: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
};

function textCell(text: string, opts: { bold?: boolean; width?: number; shaded?: boolean; columnSpan?: number } = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: opts.columnSpan,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.shaded ? { fill: 'F2F2F2' } : undefined,
    borders: cellBorder,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: (text || '—').split('\n').map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, font: FONT, size: 20, bold: opts.bold })],
        })
    ),
  });
}

function metaRow(label1: string, value1: string, label2: string, value2: string) {
  return new TableRow({
    children: [
      textCell(label1, { bold: true, width: 22, shaded: true }),
      textCell(value1, { width: 28 }),
      textCell(label2, { bold: true, width: 22, shaded: true }),
      textCell(value2, { width: 28 }),
    ],
  });
}

function sectionRow(label: string, value: string) {
  return new TableRow({
    children: [
      textCell(label, { bold: true, width: 30, shaded: true }),
      textCell(value, { width: 70 }),
    ],
  });
}

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: FONT, bold: true, size: 24 })],
    spacing: { before: 200, after: 100 },
  });
}

function spacer() {
  return new Paragraph({ text: '', spacing: { after: 100 } });
}

function stageTable(label: string, stage: LessonStage, showRoles: boolean, showSen: boolean) {
  const headerCells = [
    textCell('Кезең/Уақыты', { bold: true, width: 12, shaded: true }),
    textCell('Мұғалім әрекеті (сценарий)', { bold: true, width: 30, shaded: true }),
    textCell('Оқушы әрекеті', { bold: true, width: 20, shaded: true }),
    textCell('Тапсырма / бағалау', { bold: true, width: showRoles ? 18 : 23, shaded: true }),
  ];
  if (showRoles) headerCells.push(textCell('Рөлдер', { bold: true, width: 7, shaded: true }));
  headerCells.push(textCell('Ресурстар', { bold: true, width: showSen ? 13 : 18, shaded: true }));
  if (showSen) headerCells.push(textCell('ЕБҚ бейімделуі', { bold: true, width: 10, shaded: true }));

  const tasksText = formatStageTasksText(stage);
  const rolesText = formatStageRolesText(stage);

  const bodyCells = [
    textCell(`${label}\n(${stage.time})`, { bold: true, width: 12 }),
    textCell(stage.teacherScript, { width: 30 }),
    textCell(stage.studentActions, { width: 20 }),
    textCell(tasksText, { width: showRoles ? 18 : 23 }),
  ];
  if (showRoles) bodyCells.push(textCell(rolesText, { width: 7 }));
  bodyCells.push(textCell(stage.resources, { width: showSen ? 13 : 18 }));
  if (showSen) bodyCells.push(textCell(stage.specialNeedsNote || '', { width: 10 }));

  return { headerCells, bodyCells };
}

export async function exportToDocx(plan: LessonPlan) {
  const showRoles = plan.workTypes.includes('Топтық жұмыс');
  const showSen = plan.specialNeeds;

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      metaRow('Мектеп', plan.school || '—', 'Күні', plan.date || '—'),
      metaRow('Мұғалімнің аты-жөні', plan.teacher || '—', 'Сынып', plan.grade || '—'),
      metaRow('Пән', plan.subject || '—', 'Қатысқандар саны', plan.studentsCount || '—'),
      new TableRow({
        children: [
          textCell('Сабақтың тақырыбы', { bold: true, width: 22, shaded: true }),
          textCell(plan.topic, { bold: true, columnSpan: 3 }),
        ],
      }),
    ],
  });

  const sectionTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      sectionRow('Осы сабақта қол жеткізілетін оқу мақсаттары', plan.learningObjectives),
      sectionRow('Сабақ мақсаттары', plan.lessonObjectives),
      sectionRow('Бағалау критерийлері', plan.assessmentCriteria),
      sectionRow('Тілдік мақсаттар', plan.languageObjectives),
      sectionRow('Құндылықтарды дарыту', plan.values),
      sectionRow('Пәнаралық байланыс', plan.crossCurricularLinks),
      sectionRow('АКТ қолдану дағдылары', plan.ictSkills),
      sectionRow('Алдыңғы білім', plan.priorLearning),
    ],
  });

  const beginRows = stageTable('Басы', plan.beginning, showRoles, showSen);
  const midRows = stageTable('Ортасы', plan.middle, showRoles, showSen);
  const endRows = stageTable(plan.formativeMode ? 'БЖБ' : 'Соңы', plan.end, showRoles, showSen);

  const stagesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: beginRows.headerCells }),
      new TableRow({ children: beginRows.bodyCells }),
      new TableRow({ children: midRows.bodyCells }),
      new TableRow({ children: endRows.bodyCells }),
    ],
  });

  const tailTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      sectionRow('Саралау', plan.differentiation),
      sectionRow('Бағалау', plan.assessment),
      sectionRow('Денсаулық және қауіпсіздік ережелері', plan.healthSafety),
      ...(plan.formativeMode ? [] : [sectionRow('Сабақ бойынша рефлексия', plan.reflection || '')]),
    ],
  });

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'ҚЫСҚА МЕРЗІМДІ ЖОСПАР', font: FONT, bold: true, size: 30 })],
      spacing: { after: 200 },
    }),
    metaTable,
    spacer(),
    sectionTable,
    heading('Сабақ барысы'),
    stagesTable,
    spacer(),
    tailTable,
  ];

  if (plan.formativeMode && plan.formativeAssessment) {
    children.push(heading('БЖБ тапсырмасы'));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          sectionRow('Тапсырма', plan.formativeAssessment.task),
          sectionRow('Критерийлер', plan.formativeAssessment.criteria),
          sectionRow('Дескрипторлар', plan.formativeAssessment.descriptors),
        ],
      })
    );
  }

  const { rows: scoringRows, total } = computeScoringSummary(plan);
  if (scoringRows.length > 0) {
    children.push(heading(`Сабақ бойынша бағалау критерийлері (${total} балл)`));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              textCell('Кезең', { bold: true, width: 18, shaded: true }),
              textCell('Деңгей', { bold: true, width: 15, shaded: true }),
              textCell('Критерий', { bold: true, width: 22, shaded: true }),
              textCell('Дескриптор', { bold: true, width: 35, shaded: true }),
              textCell('Балл', { bold: true, width: 10, shaded: true }),
            ],
          }),
          ...scoringRows.map(
            (r) =>
              new TableRow({
                children: [
                  textCell(r.stage, { width: 18 }),
                  textCell(r.level, { width: 15 }),
                  textCell(r.criterion, { width: 22 }),
                  textCell(r.descriptor, { width: 35 }),
                  textCell(String(r.points), { width: 10, bold: true }),
                ],
              })
          ),
          new TableRow({
            children: [
              textCell('Барлығы', { bold: true, width: 90, shaded: true, columnSpan: 4 }),
              textCell(String(total), { bold: true, width: 10, shaded: true }),
            ],
          }),
        ],
      })
    );
  }

  if (plan.readyTaskCards.length > 0) {
    children.push(heading('Дайын тапсырмалар (сыныпта қолдануға)'));
    plan.readyTaskCards.forEach((card, i) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${i + 1}. ${card.title}`, font: FONT, bold: true, size: 22 })],
          spacing: { before: 120, after: 40 },
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: card.content, font: FONT, size: 20 })],
          spacing: { after: 80 },
        })
      );
    });
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });

  const blob = await Packer.toBlob(doc);
  const filename = `QMZH_${(plan.subject || 'sabaq').replace(/\s+/g, '_')}_${plan.grade || ''}.docx`;
  saveAs(blob, filename);
}
