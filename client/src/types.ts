// ҚМЖ (Қысқа мерзімді жоспар) деректер құрылымы — толық сценарий нұсқасы

export const WORK_TYPES = [
  'Өз бетімен жұмыс',
  'Жұптық жұмыс',
  'Топтық жұмыс',
  'Жоба жұмысы',
  'Зертханалық жұмыс',
  'Практикалық жұмыс',
] as const;

export type WorkType = (typeof WORK_TYPES)[number];

export interface LessonFormInput {
  subject: string;
  grade: string;
  topic: string;
  duration: string;
  school: string;
  teacher: string;
  date: string;
  studentsCount: string;
  workTypes: WorkType[];        // 1-3 таңдалған жұмыс түрі
  specialNeeds: boolean;         // ЕБҚ режимі
  formativeMode: boolean;        // БЖБ режимі (рефлексия орнына)
}

// ---------- Генерацияланатын мазмұн ----------

export interface DifferentiatedTask {
  level: string;          // "Барлық оқушылар" / "Базалық" / "Негізгі" / "Жетілдірілген" т.б.
  task: string;           // тапсырма сипаттамасы (карточкаға сай тұжырым)
  roles?: string;         // топ ішіндегі оқушы рөлдері (топтық жұмыс болса)
  criterion?: string;     // бағалау критерийі (кейбір кезеңдерде болмайды)
  descriptor: string;     // дескриптор
  points?: number;        // балл (кейбір кезеңдерде «балл жоқ»)
  imageHint?: string;     // AI сурет сала алмайды — осы жерде қандай сурет/сызба керегін сипаттайды,
                          // тапсырма сол сипаттамамен бірге бос орын (плейсхолдер) ретінде көрсетіледі
}

// Ресми ҚМЖ үлгісіндегі үш деңгейлі мақсат құрылымы
// («Барлық/Көпшілік/Кейбір оқушылар үшін»)
export interface TieredObjectives {
  all: string;    // Барлық оқушылар үшін
  most: string;   // Көпшілік оқушылар үшін
  some: string;   // Кейбір оқушылар үшін
}

export interface LessonStage {
  time: string;
  teacherScript: string;      // толық сценарий — мұғалімнің нақты сөздері мен нұсқаулары
  studentActions: string;
  tasks: DifferentiatedTask[];
  resources: string;
  specialNeedsNote?: string;  // тек ЕБҚ режимінде толтырылады
}

export interface ReadyTaskCard {
  title: string;
  content: string;
}

export interface FormativeAssessment {
  task: string;
  criteria: string;
  descriptors: string;
}

export interface ScoringRow {
  stage: string;       // қай кезеңге жатады (көрсету үшін)
  level: string;
  criterion: string;
  descriptor: string;
  points: number;
}

export interface LessonPlan {
  // Мета (пайдаланушы енгізген, AI өзгертпейді)
  school: string;
  teacher: string;
  date: string;
  grade: string;
  subject: string;
  topic: string;
  studentsCount: string;
  absentCount: string;          // Қатыспағандар саны — әрқашан бос, сабақ күні қолмен толтырылады
  workTypes: WorkType[];
  specialNeeds: boolean;
  formativeMode: boolean;

  // AI генерациялайтын педагогикалық мазмұн
  learningObjectives: string;
  lessonObjectives: TieredObjectives;   // ресми үлгі: Барлық/Көпшілік/Кейбір оқушылар үшін
  assessmentCriteria: string;
  languageObjectives: string;
  values: string;
  crossCurricularLinks: string;
  ictSkills: string;
  priorLearning: string;

  beginning: LessonStage;
  middle: LessonStage;
  end: LessonStage;            // formativeMode=true болса, мазмұны БЖБ тапсырмасы болады

  differentiation: string;
  assessment: string;
  healthSafety: string;

  reflection?: string;                       // formativeMode=false кезінде
  formativeAssessment?: FormativeAssessment; // formativeMode=true кезінде

  readyTaskCards: ReadyTaskCard[];
}

export interface GenerateResponse {
  success: boolean;
  data?: LessonPlan;
  error?: string;
}
