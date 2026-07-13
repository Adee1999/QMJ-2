// Google Gemini API-ге сұраныс жасау және ҚМЖ мазмұнын генерациялау логикасы.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const TASK_SCHEMA = {
  type: 'object',
  properties: {
    level: { type: 'string' },
    task: { type: 'string' },
    roles: { type: 'string' },
    criterion: { type: 'string' },
    descriptor: { type: 'string' },
    points: { type: 'integer' },
  },
  required: ['level', 'task', 'descriptor'],
};

function stageSchema(specialNeeds) {
  const properties = {
    time: { type: 'string' },
    teacherScript: { type: 'string' },
    studentActions: { type: 'string' },
    tasks: { type: 'array', items: TASK_SCHEMA },
    resources: { type: 'string' },
  };
  const required = ['time', 'teacherScript', 'studentActions', 'tasks', 'resources'];
  if (specialNeeds) {
    properties.specialNeedsNote = { type: 'string' };
    required.push('specialNeedsNote');
  }
  return { type: 'object', properties, required };
}

function buildResponseSchema(input) {
  const stage = stageSchema(input.specialNeeds);

  const properties = {
    learningObjectives: { type: 'string' },
    lessonObjectives: { type: 'string' },
    assessmentCriteria: { type: 'string' },
    languageObjectives: { type: 'string' },
    values: { type: 'string' },
    crossCurricularLinks: { type: 'string' },
    ictSkills: { type: 'string' },
    priorLearning: { type: 'string' },
    beginning: stage,
    middle: stage,
    end: stage,
    differentiation: { type: 'string' },
    assessment: { type: 'string' },
    healthSafety: { type: 'string' },
    readyTaskCards: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, content: { type: 'string' } },
        required: ['title', 'content'],
      },
    },
  };

  const required = [
    'learningObjectives', 'lessonObjectives', 'assessmentCriteria', 'languageObjectives',
    'values', 'crossCurricularLinks', 'ictSkills', 'priorLearning',
    'beginning', 'middle', 'end', 'differentiation', 'assessment', 'healthSafety', 'readyTaskCards',
  ];

  if (input.formativeMode) {
    properties.formativeAssessment = {
      type: 'object',
      properties: { task: { type: 'string' }, criteria: { type: 'string' }, descriptors: { type: 'string' } },
      required: ['task', 'criteria', 'descriptors'],
    };
    required.push('formativeAssessment');
  } else {
    properties.reflection = { type: 'string' };
    required.push('reflection');
  }

  return { type: 'object', properties, required };
}

function buildPrompt(input) {
  const { subject, grade, topic, duration, studentsCount, workTypes, specialNeeds, formativeMode } = input;

  const workTypesText = workTypes && workTypes.length > 0
    ? workTypes.join(', ')
    : 'мұғалім өз қалауынша таңдасын (сабақ тақырыбына сай)';

  const lines = [
    `Сен – Қазақстан Республикасының жаңартылған білім мазмұны бағдарламасы (Кембридж негізіндегі) бойынша тәжірибелі әдіскер-мұғалімсің.`,
    `Төмендегі мәліметтер негізінде толық, сыныпта дереу қолдануға дайын "Қысқа мерзімді жоспар" (ҚМЖ) мазмұнын дайында. Бұл жай құрылым емес — мұғалімнің нақты сөйлейтін сценарийі болу керек, дайын оқу-әдістемелік материал ретінде пайдаланылады.`,
    ``,
    `Пән: ${subject}`,
    `Сынып: ${grade}`,
    `Сабақтың тақырыбы: ${topic}`,
    `Сабақ ұзақтығы: ${duration || 40} минут`,
    `Оқушылар саны: ${studentsCount || 'көрсетілмеген'}`,
    `Қолданылатын жұмыс түрлері: ${workTypesText}`,
    ``,
    `ЖАЛПЫ ТАЛАПТАР:`,
    `- Барлық мәтін тек қазақ тілінде, педагогикалық стильде, нақты әрі қолданысқа дайын болсын.`,
    `- "Оқу мақсаттары" пәннің мемлекеттік стандартына сәйкес, тақырыпқа лайық, кодпен көрсетілуі мүмкін (мысалы, 9.2.3.4), бірақ код ойдан құрастырылатынын ескер.`,
    ``,
    `СЦЕНАРИЙ ТАЛАПТАРЫ (beginning, middle, end өрістері):`,
    `- "teacherScript" өрісінде мұғалімнің НАҚТЫ айтатын сөздерін тікелей сөйлеу түрінде жаз (мысалы: «Балалар, бүгін біз...»). Бұл жалпы сипаттама емес, оқылатын мәтін болу керек. Кемінде 3-5 сөйлем/нұсқау болсын.`,
    `- "studentActions" өрісінде оқушылардың нақты не істейтінін жаз.`,
    `- "tasks" өрісі — деңгейлік немесе топтық тапсырмалар тізімі. Егер жұмыс түрі топтық болса, әр деңгейге (мысалы, Базалық/Негізгі/Жетілдірілген) бөлек тапсырма, әрқайсысына сай критерий, дескриптор және балл көрсет. Егер жеке/жұптық жұмыс болса, "Барлық оқушылар" деген бір жазба жеткілікті.`,
    `- Сабақтың басы мен рефлексия/бекіту сияқты бағаланбайтын кезеңдерде "tasks" ішінде дескриптор болсын, бірақ "points" өрісін қоспа (балл жоқ дегенді білдіреді).`,
    `- "middle" кезеңінде міндетті түрде балл қойылған тапсырмалар болсын (жалпы қосындысы 8-10 балл аралығында болатындай), себебі бұл сабақтың негізгі бағаланатын бөлігі.`,
    `- Топтық жұмыс таңдалған болса, "roles" өрісінде топ ішіндегі нақты рөлдерді көрсет (мысалы: "1) жетекші, 2) хатшы, 3) баяндамашы").`,
    `- "resources" өрісінде нақты құралдар мен материалдар аталсын.`,
  ];

  if (specialNeeds) {
    lines.push(
      ``,
      `ЕБҚ (ерекше білім беру қажеттілігі) РЕЖИМІ ҚОСЫЛҒАН:`,
      `- Әр кезеңнің "specialNeedsNote" өрісінде ЕБҚ бар оқушыларға арналған нақты бейімдеу тәсілдерін жаз (жеңілдетілген тұжырым, қосымша уақыт, көрнекілік, қолдау серігі, дауыстап оқу және т.б.).`
    );
  }

  if (formativeMode) {
    lines.push(
      ``,
      `БЖБ РЕЖИМІ ҚОСЫЛҒАН (рефлексия орнына):`,
      `- "reflection" өрісін ҚОСПА. Оның орнына жеке "formativeAssessment" объектісін бер: "task" (қалыптастырушы бағалау тапсырмасының толық мәтіні), "criteria" (бағалау критерийі), "descriptors" (нақты дескрипторлар).`,
      `- "end" кезеңінің мазмұны да осы БЖБ тапсырмасын сыныпта өткізуге арналған сценарий болсын (тапсырманы қалай беру, қанша уақыт беру, қалай жинау).`
    );
  } else {
    lines.push(
      ``,
      `- "reflection" өрісінде мұғалімге арналған қысқа рефлексия сұрақтарын жаз (сабақтан кейін толтырылатын, 2-3 сөйлем).`
    );
  }

  lines.push(
    ``,
    `ҚОСЫМША БӨЛІМДЕР:`,
    `- "differentiation": әлсіз/орта/күшті оқушыларға арналған нақты тәсілдер.`,
    `- "assessment": қалыптастырушы бағалаудың жалпы әдістері (мысалы: "Бас бармақ" әдісі, дескриптор бойынша өзін-өзі бағалау).`,
    `- "healthSafety": қысқа әрі нақты қауіпсіздік ережесі.`,
    `- "readyTaskCards": сыныпта тікелей басып беруге дайын 3-5 тапсырма карточкасы (әр карточка — қысқа "title" + оқушыға тікелей бағытталған "content" тапсырма мәтіні). Бұл сабақ барысындағы тапсырмалардың қысқа, баспаға дайын нұсқасы.`
  );

  return lines.join('\n');
}

export async function generateLessonPlanContent(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY орнатылмаған');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const parts = [{ text: buildPrompt(input) }];

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: buildResponseSchema(input),
      // Толық сценарий тым көп reasoning токенін жегіп, жауапты кешіктіруі мүмкін —
      // сондықтан ойлану бюджетін шектейміз (сапаны сақтай отырып, жылдамдықты арттыру үшін).
      thinkingConfig: { thinkingBudget: 4096 },
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  let response;
  try {
    response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('AI жауап беру уақыты асып кетті');
      e.code = 'TIMEOUT';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(`Gemini API қатесі: ${response.status} ${errText}`);
    err.code = 'GEMINI_ERROR';
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const err = new Error('AI-дан мазмұн қайтпады');
    err.code = 'EMPTY_RESPONSE';
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch {
    const err = new Error('AI жауабын өңдеу мүмкін болмады');
    err.code = 'PARSE_ERROR';
    throw err;
  }
}
