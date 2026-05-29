import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { ExploreReport, Assignment, DailyQuestion, WeeklyReview } from './src/types';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  explorations: path.join(DATA_DIR, 'explorations.json'),
  assignments: path.join(DATA_DIR, 'assignments.json'),
  daily_questions: path.join(DATA_DIR, 'daily_questions.json'),
  weekly_reviews: path.join(DATA_DIR, 'weekly_reviews.json'),
};

// Helper: Ensure JSON file exists with empty array
function ensureFile(filePath: string, defaultContent: string = '[]') {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent, 'utf8');
  }
}

Object.values(FILES).forEach((file) => {
  ensureFile(file, '[]');
});

// Setup PG Pool if DB_CONN is available
let pool: pg.Pool | null = null;
if (process.env.DB_CONN) {
  console.log('[Neon DB] DB_CONN detected. Initializing database pool...');
  pool = new pg.Pool({
    connectionString: process.env.DB_CONN,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  console.log('[Local DB] No DB_CONN detected. Using local disk fallback.');
}

// Seed initial data if files are completely empty
function seedInitialData() {
  const dqFile = FILES.daily_questions;
  const rawDq = fs.readFileSync(dqFile, 'utf8');
  if (rawDq.trim() === '[]') {
    const today = new Date();
    const seedQuestions: DailyQuestion[] = [];
    
    const pastSubjects = [
      {
        subject: 'Sains dan Alam',
        question: 'Mengapa air laut terasa asin sementara air sungai segar? Jelaskan siklus hidrologi dan bagaimana mineral terakumulasi di samudra.',
        diffDays: 4,
        answer: 'Air sungai melarutkan garam dan mineral dari batuan tanah seiring perjalanannya mengalir menuju laut. Di laut, air menguap membentuk awan dalam siklus hidrologi, memisahkan uap air murni dari kandungan garamnya. Sementara air murni menguap, garam-garam tersebut tertinggal di laut dan terakumulasi selama miliaran tahun, menjadikannya sangat asin.',
        feedback: 'Penjelasan Anda sangat akurat! Anda secara runut menjelaskan peran air sungai dalam melarutkan mineral, proses evaporasi murni dalam siklus hidrologi, dan bagaimana mineral tersebut terakumulasi dalam jangka waktu geologis yang sangat panjang. Sangat baik!',
        score: 92
      },
      {
        subject: 'Teknologi dan Masyarakat',
        question: 'Bagaimana kecerdasan buatan (AI) dapat membantu melestarikan lingkungan hidup dan memitigasi perubahan iklim?',
        diffDays: 3,
        answer: 'AI dapat menganalisis data satelit untuk mendeteksi deforestasi ilegal secara real-time, mengoptimalkan konsumsi energi pada gedung-gedung komersial, serta memprediksi pola cuaca ekstrem untuk membantu manajemen bencana alam.',
        feedback: 'Luar biasa. Anda menyebutkan tiga aplikasi nyata AI untuk iklim: deteksi deforestasi satelit, optimalisasi grid listrik/energi, dan pemodelan cuaca. Argumen terstruktur dengan baik.',
        score: 88
      },
      {
        subject: 'Sejarah Budaya',
        question: 'Jelaskan pengaruh perdagangan jalur sutra bagi penyebaran budaya dan teknologi antara peradaban timur dan barat.',
        diffDays: 2,
        answer: 'Jalur sutra tidak hanya memperdagangkan sutra dan rempah, tetapi juga menjadi arteri penyebaran agama Buddha, Islam, dan teknologi penting seperti pembuatan kertas dari Tiongkok ke dunia Islam dan Eropa.',
        feedback: 'Bagus sekali! Penguasaan materi yang dalam tentang bagaimana penemuan kertas dan pertukaran religi menyebar melalui jalur perdagangan internasional kuno.',
        score: 90
      },
      {
        subject: 'Matematika Pemikiran',
        question: 'Diberikan deret geometri tak hingga dengan suku pertama a = 12 dan rasio r = 1/3. Jelaskan konsep konvergensi dan tentukan jumlah seluruh deret tersebut!',
        diffDays: 1,
        answer: 'Konsep konvergensi berarti nilai jumlahan mendekati batas tertentu seiring bertambahnya suku ke tak hingga karena rasionya kurang dari 1. Jumlah deret S = a / (1 - r) = 12 / (1 - 1/3) = 12 / (2/3) = 18.',
        feedback: 'Sempurna! Perhitungan matematis Anda tepat 18, dan penjelasan konseptual mengenai limit jumlahan deret yang konvergen sangat baik dan jelas.',
        score: 95
      }
    ];

    pastSubjects.forEach((item) => {
      const date = new Date(today);
      date.setDate(today.getDate() - item.diffDays);
      const dateStr = date.toISOString().split('T')[0];
      seedQuestions.push({
        id: dateStr,
        date: dateStr,
        subject: item.subject,
        question: item.question,
        userAnswer: item.answer,
        aiFeedback: item.feedback,
        score: item.score,
        answeredAt: `${dateStr}T14:30:00Z`
      });
    });

    const todayStr = today.toISOString().split('T')[0];
    seedQuestions.push({
      id: todayStr,
      date: todayStr,
      subject: 'Geografi dan Budaya',
      question: 'Bagaimana kondisi geografis negara kepulauan Indonesia memengaruhi mata pencaharian penduduk, keragaman budaya, dan integrasi sosial antar suku bangsa?',
      userAnswer: null,
      aiFeedback: null,
      score: null,
      answeredAt: null
    });

    fs.writeFileSync(dqFile, JSON.stringify(seedQuestions, null, 2), 'utf8');
  }

  const expFile = FILES.explorations;
  const rawExp = fs.readFileSync(expFile, 'utf8');
  if (rawExp.trim() === '[]') {
    const seedExplorations: ExploreReport[] = [
      {
        id: 'exp_1',
        photoData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 100 100"><rect width="100" height="100" fill="%234A5568"/><circle cx="50" cy="50" r="30" fill="%23ED8936"/><text x="50" y="55" font-family="sans-serif" font-size="6" fill="white" text-anchor="middle">Metamorfosis Kupu-kupu</text></svg>',
        description: 'Menemukan kepompong ulat sutra yang menempel di balik daun pohon mangga halaman belakang rumah hari ini. Sangat menarik melihat pelindungnya yang kokoh!',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        chatHistory: [
          {
            sender: 'user',
            message: 'Saya menemukan kepompong ini. Berapa lama ulat berada di dalamnya sebelum keluar menjadi kupu-kupu?',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            sender: 'ai',
            message: 'Wah, penemuan luar biasa! Kepompong (pupa) kupu-kupu umumnya membutuhkan waktu sekitar 7 hingga 21 hari (1-3 minggu) untuk bertransformasi penuh, tergantung pada spesies kupu-kupu dan suhu lingkungan. Selama fase ini, sel-sel ulat mengalami rekonstruksi menakjubkan membentuk sayap indah. Apakah warnanya tampak kecokelatan atau hijau muda?',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10000).toISOString()
          }
        ]
      }
    ];
    fs.writeFileSync(expFile, JSON.stringify(seedExplorations, null, 2), 'utf8');
  }

  const asgFile = FILES.assignments;
  const rawAsg = fs.readFileSync(asgFile, 'utf8');
  if (rawAsg.trim() === '[]') {
    const seedAssignments: Assignment[] = [
      {
        id: 'asg_1',
        filename: 'kunci_ekosistem_hutan.png',
        fileType: 'image/png',
        fileData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 100 100"><rect width="100" height="100" fill="%232D3748"/><text x="50" y="50" font-family="sans-serif" font-size="8" fill="%23F6E05E" text-anchor="middle">Ekosistem Hutan</text></svg>',
        score: 85,
        review: '### Hasil Peninjauan AI:\n\n* **Topik**: Rantai Makanan Ekosistem Hutan Hujan Tropis\n* **Kelebihan**: Alur produsen (rumput/pohon) menuju konsumen primer (ulat) dan sekunder (burung/ular) digambarkan dengan sangat jelas menggunakan tanda panah sistematis.\n* **Kekurangan**: Hubungan dengan dekomposer (jamur/bakteri) di bagian tanah agak kurang dititikberatkan.\n* **Saran Perbaikan**: Tambahkan tanda panah daur organik dari konsumen puncak kembali ke tanah agar siklus energi tampak lengkap.',
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    fs.writeFileSync(asgFile, JSON.stringify(seedAssignments, null, 2), 'utf8');
  }
}

// Ensure local json seed runs
seedInitialData();

// Init Database tables if PG connected
export async function initDb() {
  if (!pool) {
    return;
  }

  try {
    console.log('[Neon DB] Ensuring tables exist in PostgreSQL...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS explorations (
        id TEXT PRIMARY KEY,
        photo_data TEXT NOT NULL,
        description TEXT NOT NULL,
        chat_history JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_data TEXT NOT NULL,
        score INTEGER,
        review TEXT,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_questions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        subject TEXT NOT NULL,
        question TEXT NOT NULL,
        user_answer TEXT,
        ai_feedback TEXT,
        score INTEGER,
        answered_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekly_reviews (
        id TEXT PRIMARY KEY,
        week_range TEXT NOT NULL,
        released_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        summary TEXT NOT NULL,
        achievements JSONB NOT NULL,
        statistics JSONB NOT NULL
      );
    `);

    console.log('[Neon DB] PostgreSQL schema is ready.');

    // Seed PG database if empty
    const expCountRes = await pool.query('SELECT COUNT(*) FROM explorations');
    const expCount = parseInt(expCountRes.rows[0].count, 10);
    const qCountRes = await pool.query('SELECT COUNT(*) FROM daily_questions');
    const qCount = parseInt(qCountRes.rows[0].count, 10);

    if (expCount === 0 && qCount === 0) {
      console.log('[Neon DB] Database is empty. Migrating local seed data to Neon DB...');
      
      const localExplorations = readFile<ExploreReport[]>(FILES.explorations);
      for (const exp of localExplorations) {
        await pool.query(`
          INSERT INTO explorations (id, photo_data, description, chat_history, created_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING
        `, [exp.id, exp.photoData, exp.description, JSON.stringify(exp.chatHistory), exp.createdAt]);
      }

      const localAssignments = readFile<Assignment[]>(FILES.assignments);
      for (const asg of localAssignments) {
        await pool.query(`
          INSERT INTO assignments (id, filename, file_type, file_data, score, review, uploaded_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [asg.id, asg.filename, asg.fileType, asg.fileData, asg.score, asg.review, asg.uploadedAt]);
      }

      const localQuestions = readFile<DailyQuestion[]>(FILES.daily_questions);
      for (const q of localQuestions) {
        await pool.query(`
          INSERT INTO daily_questions (id, date, subject, question, user_answer, ai_feedback, score, answered_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (date) DO NOTHING
        `, [q.id, q.date, q.subject, q.question, q.userAnswer, q.aiFeedback, q.score, q.answeredAt]);
      }

      const localReviews = readFile<WeeklyReview[]>(FILES.weekly_reviews);
      for (const r of localReviews) {
        await pool.query(`
          INSERT INTO weekly_reviews (id, week_range, released_at, summary, achievements, statistics)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
        `, [r.id, r.weekRange, r.releasedAt, r.summary, JSON.stringify(r.achievements), JSON.stringify(r.statistics)]);
      }

      console.log('[Neon DB] Local seeds migrated to PG successfully.');
    }
  } catch (err) {
    console.error('[Neon DB] Error initializing PostgreSQL tables/seed:', err);
  }
}

// Write helper
function writeFile(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Load helper
function readFile<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content) as T;
}

export const db = {
  // Explorations
  async getExploreReports(): Promise<ExploreReport[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM explorations');
      return res.rows.map((row) => ({
        id: row.id,
        photoData: row.photo_data,
        description: row.description,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        chatHistory: typeof row.chat_history === 'string' ? JSON.parse(row.chat_history) : row.chat_history
      }));
    }
    return readFile<ExploreReport[]>(FILES.explorations);
  },
  
  async saveExploreReport(report: ExploreReport): Promise<ExploreReport> {
    if (pool) {
      await pool.query(`
        INSERT INTO explorations (id, photo_data, description, chat_history, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          photo_data = EXCLUDED.photo_data,
          description = EXCLUDED.description,
          chat_history = EXCLUDED.chat_history,
          created_at = EXCLUDED.created_at
      `, [
        report.id,
        report.photoData,
        report.description,
        JSON.stringify(report.chatHistory),
        report.createdAt
      ]);
      return report;
    }
    const reports = readFile<ExploreReport[]>(FILES.explorations);
    const index = reports.findIndex((r) => r.id === report.id);
    if (index >= 0) {
      reports[index] = report;
    } else {
      reports.push(report);
    }
    writeFile(FILES.explorations, reports);
    return report;
  },

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM assignments');
      return res.rows.map((row) => ({
        id: row.id,
        filename: row.filename,
        fileType: row.file_type,
        fileData: row.file_data,
        score: row.score,
        review: row.review,
        uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : row.uploaded_at
      }));
    }
    return readFile<Assignment[]>(FILES.assignments);
  },

  async saveAssignment(assignment: Assignment): Promise<Assignment> {
    if (pool) {
      await pool.query(`
        INSERT INTO assignments (id, filename, file_type, file_data, score, review, uploaded_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          filename = EXCLUDED.filename,
          file_type = EXCLUDED.file_type,
          file_data = EXCLUDED.file_data,
          score = EXCLUDED.score,
          review = EXCLUDED.review,
          uploaded_at = EXCLUDED.uploaded_at
      `, [
        assignment.id,
        assignment.filename,
        assignment.fileType,
        assignment.fileData,
        assignment.score,
        assignment.review,
        assignment.uploadedAt
      ]);
      return assignment;
    }
    const assignments = readFile<Assignment[]>(FILES.assignments);
    const index = assignments.findIndex((a) => a.id === assignment.id);
    if (index >= 0) {
      assignments[index] = assignment;
    } else {
      assignments.push(assignment);
    }
    writeFile(FILES.assignments, assignments);
    return assignment;
  },

  // Daily Questions
  async getDailyQuestions(): Promise<DailyQuestion[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM daily_questions');
      return res.rows.map((row) => ({
        id: row.id,
        date: row.date,
        subject: row.subject,
        question: row.question,
        userAnswer: row.user_answer,
        aiFeedback: row.ai_feedback,
        score: row.score,
        answeredAt: row.answered_at instanceof Date ? row.answered_at.toISOString() : row.answered_at
      }));
    }
    return readFile<DailyQuestion[]>(FILES.daily_questions);
  },

  async getDailyQuestionByDate(dateStr: string): Promise<DailyQuestion | null> {
    if (pool) {
      const res = await pool.query('SELECT * FROM daily_questions WHERE date = $1', [dateStr]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        date: row.date,
        subject: row.subject,
        question: row.question,
        userAnswer: row.user_answer,
        aiFeedback: row.ai_feedback,
        score: row.score,
        answeredAt: row.answered_at instanceof Date ? row.answered_at.toISOString() : row.answered_at
      };
    }
    const questions = readFile<DailyQuestion[]>(FILES.daily_questions);
    return questions.find((q) => q.date === dateStr) || null;
  },

  async saveDailyQuestion(question: DailyQuestion): Promise<DailyQuestion> {
    if (pool) {
      await pool.query(`
        INSERT INTO daily_questions (id, date, subject, question, user_answer, ai_feedback, score, answered_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (date) DO UPDATE SET
          id = EXCLUDED.id,
          subject = EXCLUDED.subject,
          question = EXCLUDED.question,
          user_answer = EXCLUDED.user_answer,
          ai_feedback = EXCLUDED.ai_feedback,
          score = EXCLUDED.score,
          answered_at = EXCLUDED.answered_at
      `, [
        question.id,
        question.date,
        question.subject,
        question.question,
        question.userAnswer,
        question.aiFeedback,
        question.score,
        question.answeredAt
      ]);
      return question;
    }
    const questions = readFile<DailyQuestion[]>(FILES.daily_questions);
    const index = questions.findIndex((q) => q.date === question.date);
    if (index >= 0) {
      questions[index] = question;
    } else {
      questions.push(question);
    }
    writeFile(FILES.daily_questions, questions);
    return question;
  },

  // Weekly Reviews
  async getWeeklyReviews(): Promise<WeeklyReview[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM weekly_reviews');
      return res.rows.map((row) => ({
        id: row.id,
        weekRange: row.week_range,
        releasedAt: row.released_at instanceof Date ? row.released_at.toISOString() : row.released_at,
        summary: row.summary,
        achievements: typeof row.achievements === 'string' ? JSON.parse(row.achievements) : row.achievements,
        statistics: typeof row.statistics === 'string' ? JSON.parse(row.statistics) : row.statistics
      }));
    }
    return readFile<WeeklyReview[]>(FILES.weekly_reviews);
  },

  async saveWeeklyReview(review: WeeklyReview): Promise<WeeklyReview> {
    if (pool) {
      await pool.query(`
        INSERT INTO weekly_reviews (id, week_range, released_at, summary, achievements, statistics)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          week_range = EXCLUDED.week_range,
          released_at = EXCLUDED.released_at,
          summary = EXCLUDED.summary,
          achievements = EXCLUDED.achievements,
          statistics = EXCLUDED.statistics
      `, [
        review.id,
        review.weekRange,
        review.releasedAt,
        review.summary,
        JSON.stringify(review.achievements),
        JSON.stringify(review.statistics)
      ]);
      return review;
    }
    const reviews = readFile<WeeklyReview[]>(FILES.weekly_reviews);
    const index = reviews.findIndex((r) => r.id === review.id);
    if (index >= 0) {
      reviews[index] = review;
    } else {
      reviews.push(review);
    }
    writeFile(FILES.weekly_reviews, reviews);
    return review;
  }
};
