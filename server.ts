import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, initDb } from './db';
import { GoogleGenAI, Type } from '@google/genai';
import { ExploreReport, Assignment, DailyQuestion, WeeklyReview, ChatMessage } from './src/types';

// Initialize Gemini Client safely on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const app = express();
const PORT = 3000;

// Set up JSON body limits for base64 file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper: split base64 prefix
function parseBase64(base64Str: string) {
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { mimeType: 'image/png', data: base64Str }; // fallback
  }
  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Explorations API List
app.get('/api/explorations', async (req, res) => {
  try {
    const list = await db.getExploreReports();
    // Sort reviews by date descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Create Exploration Report & start conversation with AI Tutor
app.post('/api/explorations', async (req, res) => {
  try {
    const { photoData, description } = req.body;
    if (!photoData || !description) {
      return res.status(400).json({ error: 'Photo data and description are required.' });
    }

    const reportId = 'exp_' + Date.now();
    const createdAt = new Date().toISOString();

    // Call Gemini to analyze the exploration photo and description
    const filePart = parseBase64(photoData);
    const imagePart = {
      inlineData: {
        mimeType: filePart.mimeType,
        data: filePart.data,
      },
    };

    const textPart = {
      text: `Anda adalah "Kakak AI", seorang mentor belajar pribadi anak-anak yang santun, interaktif, hangat, dan menginspirasi. 
Fokus Anda adalah memicu kepintaran anak dengan pertanyaan yang mendidik dan fakta unik yang mengejutkan tentang apa yang mereka upload.

Siswa baru saja mengunggah foto eksplorasi alam/benda mereka sendiri.
Deskripsi siswa: "${description}"

Analisis foto dan deskripsi mereka. Berikan tanggapan yang hangat dan memuji keaktifan mereka (sekitar 1-2 paragraf saja). 
Kemudian berikan 1 fakta unik sains/pengetahuan tentang benda tersebut, serta ajukan 1 pertanyaan pemancing rasa ingin tahu agar siswa mau membalas obrolan Anda.
Jawab dalam Bahasa Indonesia yang ramah, sopan, dan hangat.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    const aiMessage = response.text || 'Wah hebat sekali eksplorasimu! Mari kita diskusikan lebih jauh.';

    const initialChat: ChatMessage[] = [
      {
        sender: 'user',
        message: `Halo Kakak AI, saya melakukan eksplorasi: ${description}`,
        timestamp: createdAt,
      },
      {
        sender: 'ai',
        message: aiMessage,
        timestamp: new Date().toISOString(),
      },
    ];

    const report: ExploreReport = {
      id: reportId,
      photoData,
      description,
      createdAt,
      chatHistory: initialChat,
    };

    await db.saveExploreReport(report);
    res.status(201).json(report);
  } catch (error: any) {
    console.error('Error in explorations API:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Continue chat inside exploration
app.post('/api/explorations/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const reports = await db.getExploreReports();
    const report = reports.find((r) => r.id === id);
    if (!report) {
      return res.status(404).json({ error: 'Exploration report not found.' });
    }

    const userMsg: ChatMessage = {
      sender: 'user',
      message: message,
      timestamp: new Date().toISOString(),
    };
    report.chatHistory.push(userMsg);

    // Context format for Chat
    const chatHistoryContext = report.chatHistory
      .map((c) => `${c.sender === 'user' ? 'Siswa' : 'Kakak AI'}: ${c.message}`)
      .join('\n');

    const filePart = parseBase64(report.photoData);
    const imagePart = {
      inlineData: {
        mimeType: filePart.mimeType,
        data: filePart.data,
      },
    };

    const promptText = `Anda adalah "Kakak AI", mentor belajar mandiri yang hangat, seru, dan pintar.
Berikut adalah foto eksplorasi yang siswa unggah, serta deskripsinya: "${report.description}".

Berikut adalah riwayat obrolan Anda sebelumnya dengan siswa:
${chatHistoryContext}

Balas pesan siswa tersebut dengan ramah, komunikatif, dan mendidik. Bantu mereka memahami konsep sains/sejarah/geografi dari objek eksplorasi mereka, dukung pemikiran kritis, dan akhiri dengan respon yang menyenangkan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, { text: promptText }] },
    });

    const aiResponseText = response.text || 'Hebat sekali! Terus bereksplorasi ya!';
    const aiMsg: ChatMessage = {
      sender: 'ai',
      message: aiResponseText,
      timestamp: new Date().toISOString(),
    };
    report.chatHistory.push(aiMsg);

    await db.saveExploreReport(report);
    res.json(report);
  } catch (error: any) {
    console.error('Error inside chat exploration:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Assignments Review & list API
app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await db.getAssignments();
    assignments.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Submit Document Assignment for AI valuation
app.post('/api/assignments', async (req, res) => {
  try {
    const { filename, fileType, fileData } = req.body;
    if (!filename || !fileType || !fileData) {
      return res.status(400).json({ error: 'Filename, fileType, and fileData are required.' });
    }

    const assignmentId = 'asg_' + Date.now();
    const uploadedAt = new Date().toISOString();

    const filePart = parseBase64(fileData);
    const documentPart = {
      inlineData: {
        mimeType: filePart.mimeType,
        data: filePart.data,
      },
    };

    const promptText = `Anda adalah seorang "Guru Korektor AI" profesional yang sangat cerdas, adil, teliti, namun mendidik dan memberikan motivasi membangun.
Periksa dokumen tugas siswa berikut yang diunggah dengan nama file: "${filename}" dan format: "${fileType}".

Tugas Anda:
1. Berikan skor numerik (nilai tugas) dari rentang 0 sampai 100 secara objektif berdasarkan kerapian, kelengkapan, dan akurasi isi yang tampak di dokumen.
2. Buatlah ulasan (review) dalam bentuk Markdown komprehensif bahasa Indonesia yang terstruktur rapi:
   - **Analisis Tugas**: Penjelasan singkat isi dokumen yang berhasil diidentifikasi.
   - **Kelebihan**: Aspek luar biasa dari tugas yang dikerjakan murid.
   - **Poin Perbaikan**: Sisi minor atau kesalahan yang perlu diperbaiki.
   - **Saran Langkah Nyata**: Tips konkret 1-2-3 agar siswa dapat menyempurnakan jawaban ini di masa mendatang.

Harap kembalikan respon dalam struktur objek JSON dengan key:
"score" (integer) dan "review" (markdown string)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [documentPart, { text: promptText }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            review: { type: Type.STRING },
          },
          required: ['score', 'review'],
        },
      },
    });

    let result = { score: 75, review: 'Dokumen berhasil diunggah namun gagal dinilai secara otomatis.' };
    if (response.text) {
      try {
        result = JSON.parse(response.text.trim());
      } catch (parseErr) {
        console.error('Error parsing JSON score:', parseErr);
      }
    }

    const assignment: Assignment = {
      id: assignmentId,
      filename,
      fileType,
      fileData,
      score: result.score,
      review: result.review,
      uploadedAt,
    };

    await db.saveAssignment(assignment);
    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error in assignments checking:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Get Daily Essay Question
app.get('/api/questions/today', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    let dailyQuestion = await db.getDailyQuestionByDate(todayStr);

    if (!dailyQuestion) {
      // Subjects randomized pool
      const subjects = [
        'Sains dan Alam',
        'Sejarah Dunia',
        'Matematika Pemikiran',
        'Bahasa dan Sastra',
        'Teknologi dan Masyarakat',
        'Geografi dan Budaya',
        'Seni rupa dan Musik',
      ];
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

      const promptText = `Hasilkan satu pertanyaan esai latihan harian untuk murid (tingkat sekolah menengah) dalam Bahasa Indonesia.
Mata pelajaran yang dipilih hari ini: "${randomSubject}".

Persyaratan Soal:
1. Soal harus memicu penalaran kritis mendalam, bukan sekadar hafalan singkat.
2. Soal harus menanyakan konsep menarik, relevan dengan kehidupan sehari-hari, dan membutuhkan tanggapan argumen 2-3 kalimat.
3. Berikan subjek yang terpilih dan soal tersebut dalam objek JSON.

Harap kembalikan respon struktur objek JSON dengan key:
"question" (string) dan "subject" (string).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              subject: { type: Type.STRING },
            },
            required: ['question', 'subject'],
          },
        },
      });

      let genResults = {
        question: 'Berikan deskripsi singkat tentang pentingnya menjaga sumber air bersih di sekitar pemukiman padat penduduk.',
        subject: randomSubject,
      };

      if (response.text) {
        try {
          genResults = JSON.parse(response.text.trim());
        } catch (parseErr) {
          console.error('Error parsing JSON question:', parseErr);
        }
      }

      dailyQuestion = {
        id: todayStr,
        date: todayStr,
        subject: genResults.subject,
        question: genResults.question,
        userAnswer: null,
        aiFeedback: null,
        score: null,
        answeredAt: null,
      };

      await db.saveDailyQuestion(dailyQuestion);
    }

    res.json(dailyQuestion);
  } catch (error: any) {
    console.error('Error generating daily question:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Submit Daily Essay Response
app.post('/api/questions/today/answer', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const { answer } = req.body;
    if (!answer) {
      return res.status(400).json({ error: 'Jawaban esai tidak boleh kosong.' });
    }

    const dailyQuestion = await db.getDailyQuestionByDate(todayStr);
    if (!dailyQuestion) {
      return res.status(404).json({ error: 'Soal latihan hari ini belum siap.' });
    }

    if (dailyQuestion.userAnswer) {
      return res.status(400).json({ error: 'Anda sudah mengumpulkan jawaban untuk latihan hari ini.' });
    }

    const promptText = `Anda adalah "Guru Penguji Esai" Bahasa Indonesia yang adil dan inspiratif.
Murid baru saja mengumpulkan jawaban esai untuk soal harian:

[MATA PELAJARAN]: ${dailyQuestion.subject}
[SOAL]: ${dailyQuestion.question}
[JAWABAN SISWA]: "${answer}"

Tugas Anda:
1. Berikan nilai numerik (skor) dari 0 sampai 100 secara objektif atas jawaban tersebut.
2. Tulis feedback ringkas kemanusiaan yang mendidik dalam Bahasa Indonesia (maksimal 3 paragraf). Tunjukkan bagian argumen yang bagus, berikan koreksi jika ada konsep/tata bahasa yang kurang tepat, dan berikan dorongan semangat.

Harap kembalikan respon struktur objek JSON dengan key:
"score" (integer) dan "feedback" (string - santun, hangat, mendidik).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
          },
          required: ['score', 'feedback'],
        },
      },
    });

    let grading = { score: 80, feedback: 'Jawaban diterima dengan baik! Tetap semangat belajar.' };
    if (response.text) {
      try {
        grading = JSON.parse(response.text.trim());
      } catch (parseErr) {
        console.error('Error parsing essay grade:', parseErr);
      }
    }

    dailyQuestion.userAnswer = answer;
    dailyQuestion.aiFeedback = grading.feedback;
    dailyQuestion.score = grading.score;
    dailyQuestion.answeredAt = new Date().toISOString();

    await db.saveDailyQuestion(dailyQuestion);
    res.json(dailyQuestion);
  } catch (error: any) {
    console.error('Error grading daily response:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Generate & Get Weekly Review
app.get('/api/reviews/history', async (req, res) => {
  try {
    const list = await db.getWeeklyReviews();
    list.sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger generation of weekly review (on-demand or if it is saturday)
app.post('/api/reviews/generate', async (req, res) => {
  try {
    // Current Week Range (from last 7 days)
    const today = new Date();
    const past7Days = new Date();
    past7Days.setDate(today.getDate() - 7);

    const formatShortDate = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    };

    const rangeStr = `${formatShortDate(past7Days)} - ${formatShortDate(today)} ${today.getFullYear()}`;
    const weekYearVal = `${today.getFullYear()}-W${Math.floor(today.getDate() / 7) + 1}`;

    // Collect activities from the last 7 days from our db
    const explorations = (await db.getExploreReports()).filter((e) => {
      const diff = Date.now() - new Date(e.createdAt).getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });

    const assignments = (await db.getAssignments()).filter((a) => {
      const diff = Date.now() - new Date(a.uploadedAt).getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });

    const essays = (await db.getDailyQuestions()).filter((q) => {
      if (!q.answeredAt) return false;
      const diff = Date.now() - new Date(q.answeredAt).getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });

    const totalEssays = essays.length;
    const totalExplores = explorations.length;
    const totalAssignments = assignments.length;

    // Calculate average score
    let totalScore = 0;
    let countedScores = 0;
    essays.forEach((q) => {
      if (q.score) {
        totalScore += q.score;
        countedScores++;
      }
    });
    assignments.forEach((a) => {
      if (a.score) {
        totalScore += a.score;
        countedScores++;
      }
    });

    const avgScore = countedScores > 0 ? Math.round(totalScore / countedScores) : 0;

    // Build context summary for Gemini
    const essaysSummary = essays.map((q) => `- Soal: "${q.question}" | Subjek: ${q.subject} | Skor: ${q.score}`).join('\n');
    const explorationsSummary = explorations.map((e) => `- Objek: "${e.description.substring(0, 60)}..."`).join('\n');
    const assignmentsSummary = assignments.map((a) => `- File Tugas: "${a.filename}" | Skor: ${a.score}`).join('\n');

    const promptText = `Anda adalah "Kepala Sekolah Cerdas AI", mentor agung yang meninjau rapor belajar mingguan siswa.
Di bawah ini adalah rekam jejak aktivitas belajar mandiri murid selama 7 hari terakhir:

- Total Esai Harian yang dikerjakan: ${totalEssays} kali
- Total Eksplorasi lapangan yang dilaporkan: ${totalExplores} kali
- Total Dokumen tugas sekolah yang diperiksa: ${totalAssignments} kali
- Rata-rata Skor Penilaian Gabungan: ${avgScore} / 100

RINCIAN KEGIATAN:
1. Esai Harian:\n${essaysSummary || 'Tidak ada aktivitas esai.'}
2. Eksplorasi Mandiri:\n${explorationsSummary || 'Tidak ada aktivitas eksplorasi lapangan.'}
3. Tugas yang Dinilai:\n${assignmentsSummary || 'Tidak ada dokumen tugas diuji.'}

Tugas Anda:
1. Buat ulasan rapor mingguan yang luar biasa memotivasi, menyentuh hati, mengevaluasi kekuatan akademis secara ramah, dan membimbing siswa untuk menyongsong minggu baru dengan gembira. (Maksimal 3 paragraf, dukung format Markdown).
2. Tentukan 2 sampai 3 nama "Lencana Gelar Kebanggaan" (Achievement Badges) unik fiktif yang berhasil dibuka murid minggu ini beserta penjelasan singkatnya dalam 1 kalimat (contoh: "Penjelajah Rimba Raya - atas eksplorasi alammu yang jeli!", atau "Penulis Konsisten - telah menuntaskan semua essay tanpa absen").

Harap kembalikan respon struktur objek JSON dengan rumus key:
"summary" (markdown string ulasan) dan "achievements" (array of string lencana gelar).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            achievements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['summary', 'achievements'],
        },
      },
    });

    let reviewData = {
      summary: 'Hebat! Anda telah belajar dengan tekun minggu ini. Terus tingkatkan hasil kuismu demi kemajuan belajar.',
      achievements: ['Pelajar Mandiri Tangguh - Telah memulai langkah baru belajar AI'],
    };

    if (response.text) {
      try {
        reviewData = JSON.parse(response.text.trim());
      } catch (parseErr) {
        console.error('Error parsing weekly review:', parseErr);
      }
    }

    const weeklyReview: WeeklyReview = {
      id: weekYearVal,
      weekRange: rangeStr,
      releasedAt: today.toISOString(),
      summary: reviewData.summary,
      achievements: reviewData.achievements,
      statistics: {
        essaysCount: totalEssays,
        explorationsCount: totalExplores,
        assignmentsCount: totalAssignments,
        averageScore: avgScore,
      },
    };

    await db.saveWeeklyReview(weeklyReview);
    res.status(201).json(weeklyReview);
  } catch (error: any) {
    console.error('Error generating weekly review:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper route to check if today is Saturday
app.get('/api/saturday-check', (req, res) => {
  const today = new Date();
  const isSaturday = today.getDay() === 6; // 0 Sunday, 6 Saturday
  res.json({
    isSaturday,
    dayName: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][today.getDay()],
  });
});

// ==========================================
// SERVING CONFIG & VITE MIDDLEWARE
// ==========================================

async function startServer() {
  // Initialize Database (PG schemas)
  await initDb();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html globally for react router client fallback if needed
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OK] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
