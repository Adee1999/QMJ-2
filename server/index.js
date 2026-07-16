import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateLessonPlanContent } from './gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env файлын әрқашан осы файл орналасқан папкадан (server/) оқимыз,
// терминал қай жерден іске қосылғанына қарамастан (process.cwd() емес).
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

app.use(cors());
app.use(express.json({ limit: '200kb' }));

// AI шақыруларын шектеу — тегін Gemini квотасын үнемдеу үшін
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Сұраныстар тым жиі жіберілді. Бірнеше минуттан кейін қайта көріңіз.' },
});

const MAX_FIELD_LEN = 200;
const ALLOWED_WORK_TYPES = [
  'Өз бетімен жұмыс', 'Жұптық жұмыс', 'Топтық жұмыс',
  'Жоба жұмысы', 'Зертханалық жұмыс', 'Практикалық жұмыс',
];

function validateInput(body) {
  const errors = [];
  const subject = String(body.subject || '').trim();
  const grade = String(body.grade || '').trim();
  const topic = String(body.topic || '').trim();
  const duration = String(body.duration || '40').trim();
  const school = String(body.school || '').trim();
  const teacher = String(body.teacher || '').trim();
  const date = String(body.date || '').trim();
  const studentsCount = String(body.studentsCount || '').trim();

  if (!subject) errors.push('Пән көрсетілмеген');
  if (!grade) errors.push('Сынып көрсетілмеген');
  if (!topic) errors.push('Сабақ тақырыбы көрсетілмеген');

  for (const [key, val] of Object.entries({ subject, grade, topic, school, teacher, studentsCount })) {
    if (val.length > MAX_FIELD_LEN) errors.push(`${key} өрісі тым ұзын`);
  }

  const durationNum = parseInt(duration, 10);
  if (Number.isNaN(durationNum) || durationNum < 10 || durationNum > 180) {
    errors.push('Сабақ ұзақтығы 10-180 минут аралығында болуы керек');
  }

  const workTypes = Array.isArray(body.workTypes)
    ? body.workTypes.filter((t) => ALLOWED_WORK_TYPES.includes(t)).slice(0, 3)
    : [];

  const specialNeeds = Boolean(body.specialNeeds);
  const formativeMode = Boolean(body.formativeMode);

  return {
    errors,
    clean: {
      subject, grade, topic, duration: String(durationNum || 40), school, teacher, date, studentsCount,
      workTypes, specialNeeds, formativeMode,
    },
  };
}

app.post('/api/generate', generateLimiter, async (req, res) => {
  const { errors, clean } = validateInput(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    const aiContent = await generateLessonPlanContent(clean);

    const plan = {
      school: clean.school,
      teacher: clean.teacher,
      date: clean.date,
      grade: clean.grade,
      subject: clean.subject,
      topic: clean.topic,
      studentsCount: clean.studentsCount,
      absentCount: '',
      workTypes: clean.workTypes,
      specialNeeds: clean.specialNeeds,
      formativeMode: clean.formativeMode,
      ...aiContent,
    };

    res.json({ plan });
  } catch (err) {
    console.error('generate error:', err.code || '', err.message);

    if (err.code === 'NO_API_KEY') {
      return res.status(500).json({ error: 'Сервер конфигурациясы аяқталмаған. Әкімшіге хабарласыңыз.' });
    }
    if (err.code === 'TIMEOUT') {
      return res.status(504).json({ error: 'AI жауап беру уақыты асып кетті. Қайта көріңіз.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'AI сервисінің тегін квотасы уақытша таусылды. Кейінірек қайта көріңіз.' });
    }
    return res.status(502).json({ error: 'ҚМЖ генерациялау кезінде қате пайда болды. Қайта көріңіз.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Production-та құрастырылған frontend-ті осы серверден беру
app.use(express.static(CLIENT_DIST));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`QMZH server ${PORT} портында жұмыс істеп тұр`);
});
