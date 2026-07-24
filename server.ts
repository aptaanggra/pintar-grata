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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Set up JSON body limits for base64 file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper: robust base64 parser for Gemini inlineData
function parseBase64(inputStr: string): { mimeType: string; data: string } {
  if (!inputStr) {
    return { mimeType: 'image/png', data: '' };
  }

  const str = inputStr.trim();

  // 1. Standard base64 data URI: data:image/png;base64,XXXX...
  const base64DataUriMatch = str.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/s);
  if (base64DataUriMatch) {
    let mime = base64DataUriMatch[1];
    let base64Data = base64DataUriMatch[2].replace(/\s/g, '');
    if (mime.includes('svg')) {
      mime = 'image/png';
    }
    return { mimeType: mime, data: base64Data };
  }

  // 2. Non-base64 data URI (e.g., data:image/svg+xml;utf8,<svg...> or data:image/svg+xml,<svg...>)
  const utf8DataUriMatch = str.match(/^data:([A-Za-z0-9-+\/]+)(?:;[a-zA-Z0-9=-]+)*,(.+)$/s);
  if (utf8DataUriMatch) {
    try {
      const rawContent = decodeURIComponent(utf8DataUriMatch[2]);
      const base64Data = Buffer.from(rawContent, 'utf-8').toString('base64');
      return { mimeType: 'image/png', data: base64Data };
    } catch {
      const base64Data = Buffer.from(utf8DataUriMatch[2], 'utf-8').toString('base64');
      return { mimeType: 'image/png', data: base64Data };
    }
  }

  // 3. Raw SVG text starting with or containing <svg
  if (str.startsWith('<svg') || str.includes('<svg')) {
    const base64Data = Buffer.from(str, 'utf-8').toString('base64');
    return { mimeType: 'image/png', data: base64Data };
  }

  // 4. Raw base64 string without data: header
  const cleanStr = str.replace(/^data:.*?,/, '').replace(/\s/g, '');
  
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(cleanStr);
  if (isBase64 && cleanStr.length > 0) {
    return { mimeType: 'image/png', data: cleanStr };
  }

  // 5. Fallback for any other plain string
  return {
    mimeType: 'image/png',
    data: Buffer.from(str, 'utf-8').toString('base64'),
  };
}

// ==========================================
// API ROUTES
// ==========================================

// Helper: get userId from header
function getUserId(req: express.Request): string {
  return (req.headers['x-user-id'] as string) || 'guest';
}

async function getStudentProfileContext(userId: string): Promise<string> {
  try {
    const profile = await db.getUserProfile(userId);
    if (profile && (profile.schoolName || profile.grade)) {
      return `\n[PROFIL & LEVEL BELAJAR SISWA]:\n- Sekolah: "${profile.schoolName || 'Tidak diisi'}"\n- Kelas/Tingkat: "${profile.grade || 'Tidak diisi'}"\n- Pelajaran Favorit: "${profile.favoriteSubject || 'Umum'}"\nPETUNJUK UTAMA: Sesuaikan tingkat kesulitan soal, istilah teknis, gaya penjelasan, dan contoh kasus agar sangat pas dengan level pendidikan/kelas siswa ini (${profile.grade}).`;
    }
  } catch (e) {
    console.error('Error fetching profile context:', e);
  }
  return '';
}

// ==========================================
// API ROUTES
// ==========================================

// 0. User Profile API Routes
app.get('/api/profile', async (req, res) => {
  try {
    const userId = getUserId(req);
    const profile = await db.getUserProfile(userId);
    res.json(profile || { userId, schoolName: '', grade: '', favoriteSubject: '' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { schoolName, grade, favoriteSubject, name, email } = req.body;
    if (!schoolName || !grade || !favoriteSubject) {
      return res.status(400).json({ error: 'Nama sekolah, kelas, dan pelajaran favorit wajib diisi.' });
    }
    const updated = await db.saveUserProfile({
      userId,
      schoolName: String(schoolName).trim(),
      grade: String(grade).trim(),
      favoriteSubject: String(favoriteSubject).trim(),
      name,
      email
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Explorations API List
app.get('/api/explorations', async (req, res) => {
  try {
    const userId = getUserId(req);
    const list = await db.getExploreReports(userId);
    // Sort reviews by date descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Schema for Kakak AI's rich responses
const KakakAiSchema = {
  type: Type.OBJECT,
  properties: {
    message: { type: Type.STRING },
    illustrations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          svgCode: { type: Type.STRING },
          imageUrl: { type: Type.STRING },
          caption: { type: Type.STRING }
        },
        required: ['title', 'caption']
      }
    },
    journals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          author: { type: Type.STRING },
          year: { type: Type.STRING },
          journalName: { type: Type.STRING },
          url: { type: Type.STRING },
          snippet: { type: Type.STRING }
        },
        required: ['title', 'author', 'year', 'journalName', 'url', 'snippet']
      }
    }
  },
  required: ['message', 'illustrations', 'journals']
};

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
      text: `Anda adalah "Kakak AI", seorang mentor bimbingan sains mandiri yang sangat lugas, profesional, alami (manusiawi), dan mendalam. Gaya komunikasi Anda adalah gaya diskusi ilmiah yang santai tapi fokus antara siswa dan pembimbing native Indonesia yang fasih.

KETENTUAN GAYA BAHASA & STRUKTUR:
- JANGAN PERNAH menyapa siswa dengan sebutan berulang, berlebihan, atau kekanak-kanakan (DILARANG KERAS menggunakan sapaan klise seperti: "Halo Adik!", "Halo adik cerdas!", "Wah hebat sekali!", "Halo adik pintar yang penuh rasa ingin tahu!").
- JANGAN gunakan basa-basi atau pujian kosong yang dipaksakan.
- Mulai tanggapan Anda secara langsung dan organik. Misalkan: "Temuan yang sangat menarik. Mari kita bahas dari sisi sains...", atau langsung menanggapi inti pengamatan murid tersebut secara cerdas.
- Gunakan bahasa Indonesia semi-formal yang mengalir alami, santun, tetapi solid, lugas, bertenaga, dan tidak berbelit-belit. Hindari gaya tulis kaku atau terkesan dihasilkan oleh mesin penerjemah.
- Struktur tanggapan (simpan ke key "message"):
  1. Analisis singkat & tajam dari kacamata ilmiah terhadap foto dan deskripsi siswa.
  2. Berikan 1 fakta sains unik/mendalam yang relevan dengan benda/fenomena tersebut.
  3. Ajukan 1 pertanyaan pemantik diskusi lanjutan yang menantang pemikiran kritis mereka secara alami (tidak kaku).

Siswa baru saja mengunggah foto eksplorasi sains/alam mereka sendiri.
Deskripsi siswa: "${description}"

PENTING: Di dalam teks kalimat "message", sisipkan notasi rujukan inline berupa indeks angka dalam tanda kurung siku seperti [1] or [2] pada bagian kalimat/teori/fakta unik yang didukung oleh jurnal di array "journals" (misal: "Gigi roda biologis ini mengunci kaki saat mereka bersiap melompat [1]."). Pastikan angka indeks dimulai dari [1] dan sesuai dengan urutan referensi jurnal di array "journals".

Sertakan juga minimal 1 objek ilustrasi sains bertema ilmiah dalam array "illustrations".
Setiap ilustrasi membutuhkan:
- "title": Judul ilustrasi/diagram ilmiah.
- "svgCode": Hasilkan kode SVG mandiri (xml valid lengkap, menggunakan tag <svg viewBox="0 0 400 300" ...> dan ditutup </svg>). Silakan gambar diagram/ilustrasi berwarna yang responsif dan bertekstur modern terkait topik yang dibahas (misal diagram sel tumbuhan, anatomi serangga, klorofil, siklus air, gaya gravitasi, pembiasan cahaya, dll.) dengan label ilmiah teks di dalam SVG-nya! Pastikan kodenya bersih dan valid.
- "imageUrl": Gunakan fallback URL picsum atau kosongkan.
- "caption": Deskripsi singkat di balik diagram/ilustrasi ilmiah tersebut.

Sertakan juga minimal 2 entri jurnal sains atau buku sumber akademis terpercaya dalam array "journals".
Setiap jurnal membutuhkan:
- "title": Judul artikel jurnal/makalah/buku.
- "author": Kelompok peneliti atau penulis utama (misal: "Smith, J. et al." atau "LIPI Indonesia").
- "year": Tahun rilis/publikasi.
- "journalName": Nama jurnal terakreditasi/penerbit (misal: "Journal of Plant Biology", "Nature Cell Research", "Jurnal Botani Indonesia", dll.).
- "url": Tautkan link asli/aktif atau pencarian Google Scholar, misalnya dari jstor.org, nature.com, sciencedirect.com, dll.
- "snippet": Rangkuman singkat mengenai keterkaitan penelitian tersebut dengan topik temuan siswa.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: KakakAiSchema,
      }
    });

    let result = {
      message: 'Wah hebat sekali eksplorasimu! Mari kita diskusikan lebih jauh.',
      illustrations: [] as any[],
      journals: [] as any[]
    };

    if (response.text) {
      try {
        result = JSON.parse(response.text.trim());
      } catch (parseErr) {
        console.error('Error parsing JSON response in creations:', parseErr);
      }
    }

    const initialChat: ChatMessage[] = [
      {
        sender: 'user',
        message: `Halo Kakak AI, saya melakukan eksplorasi: ${description}`,
        timestamp: createdAt,
      },
      {
        sender: 'ai',
        message: result.message,
        timestamp: new Date().toISOString(),
        illustrations: result.illustrations,
        journals: result.journals,
      },
    ];

    const report: ExploreReport = {
      id: reportId,
      photoData,
      description,
      createdAt,
      chatHistory: initialChat,
    };

    const userId = getUserId(req);
    await db.saveExploreReport(report, userId);
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
    const { message, attachment } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const userId = getUserId(req);
    const reports = await db.getExploreReports(userId);
    const report = reports.find((r) => r.id === id);
    if (!report) {
      return res.status(404).json({ error: 'Exploration report not found.' });
    }

    const userMsg: ChatMessage = {
      sender: 'user',
      message: message,
      timestamp: new Date().toISOString(),
      ...(attachment ? { attachment } : {}),
    };
    report.chatHistory.push(userMsg);

    // Context format for Chat (exclude full attachment base64 to keep prompt concise, but note attachment name)
    const chatHistoryContext = report.chatHistory
      .map((c) => `${c.sender === 'user' ? 'Siswa' : 'Kakak AI'}: ${c.message}${c.attachment ? ` [Mengunggah berkas: ${c.attachment.filename}]` : ''}`)
      .join('\n');

    const parts: any[] = [];

    // 1) Primary exploration photo
    const filePart = parseBase64(report.photoData);
    parts.push({
      inlineData: {
        mimeType: filePart.mimeType,
        data: filePart.data,
      },
    });

    // 2) Additional attached photo or document for this conversation turn
    if (attachment && attachment.data) {
      try {
        const attachPart = parseBase64(attachment.data);
        parts.push({
          inlineData: {
            mimeType: attachPart.mimeType,
            data: attachPart.data,
          },
        });
      } catch (attachErr) {
        console.error("Error parsing base64 attachment in chat continuation:", attachErr);
      }
    }

    const promptText = `Anda adalah "Kakak AI", seorang mentor bimbingan sains mandiri yang sangat lugas, profesional, alami (manusiawi), dan mendalam. Gaya komunikasi Anda adalah gaya diskusi ilmiah yang santai tapi fokus antara siswa dan pembimbing native Indonesia yang fasih.

Siswa baru saja mengunggah foto eksplorasi awal, dengan deskripsi: "${report.description}".
Siswa saat ini mengajukan sebuah pertanyaan lanjutan/tanggapan: "${message}"${attachment ? ` sambil melampirkan berkas penunjang baru: "${attachment.filename}" dengan tipe dokumen "${attachment.type}".` : ''}

Berikut adalah seluruh riwayat obrolan Anda sebelumnya dengan siswa:
${chatHistoryContext}

KETENTUAN GAYA BAHASA & STRUKTUR:
- JANGAN PERNAH menyapa siswa dengan sebutan berulang, berlebihan, atau kekanak-kanakan (DILARANG KERAS menggunakan sapaan klise seperti: "Halo Adik!", "Halo adik cerdas!", "Wah hebat sekali!", "Halo adik pintar yang penuh rasa ingin tahu!").
- JANGAN gunakan basa-basi atau pujian kosong yang dipaksakan. Sapaan di awal chat lanjutan harus sangat minim dan natural atau langsung menjawab poin pertanyaan mereka.
- Jawab pertanyaan siswa dengan ramah, komunikatif, berbobot, lugas, dan berbasis bukti sains. Buat alur pembicaraan yang mengalir seperti diskusi nyata dua arah.
- Gunakan bahasa Indonesia semi-formal yang mengalir alami, santun, tetapi solid, lugas, bertenaga, dan tidak berbelit-belit. Hindari gaya tulis kaku atau terkesan dihasilkan oleh mesin penerjemah.

TUGAS ANDA:
1. Hubungkan teori sains mendalam dengan deskripsi siswa dan lampiran berkas barunya (jika ada). Jelaskan prinsip botani (tumbuhan), anatomi, zoologi (hewan), fisika rill, sains lingkungan, atau ekosistem alam terkait secara terstruktur. Simpan jawaban responsi Anda di field "message" dalam JSON.
   PENTING: Di dalam teks field "message", Anda WAJIB menyisipkan notasi rujukan inline berupa indeks angka dalam tanda kurung siku seperti [1] atau [2] pada bagian kalimat/teori/fakta sains yang Anda jabarkan yang bersumber dari jurnal di array "journals" (misal: "Mekanisme pengunci mekanis ini menghindarkan selip ketika melompat [1]."). Angka ini harus merujuk ke urutan jurnal di array "journals" (dimulai dari 1).
2. BUAT minimal 1 diagram ilustrasi sains mandiri yang interaktif dan informatif ke dalam array "illustrations".
   - "title": Judul diagram/skema sains.
   - "svgCode": Hasilkan kode SVG mandiri (xml valid lengkap, ditutup </svg>) yang representatif menggambarkan konsep ilmiah diskusi terbaru ini (misal rumus struktur molekul, rangkaian listrik, persilangan genetika, siklus ekologi, dll.) dengan teks label jelas di dalamnya! Jadikan desainnya modern dan penuh warna.
   - "caption": Penjelasan ilmiah di balik diagram SVG tersebut.
3. Sertakan minimal 2 rujukan jurnal ilmiah akademis/buku sumber rill yang kredibel (seperti Nature, ScienceDirect, LIPI, PubMed, dll.) ke dalam array "journals" untuk menyokong penjelasan sains Anda. Lengkapi field "title", "author", "year", "journalName", "url" (link scholar/aktif), dan "snippet" (rangkuman keterkaitan pustaka).

Kembalikan jawaban penuh dalam JSON terstruktur sesuai skema.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: KakakAiSchema,
      }
    });

    let result = {
      message: 'Hebat sekali! Terus bereksplorasi ya!',
      illustrations: [] as any[],
      journals: [] as any[]
    };

    if (response.text) {
      try {
        result = JSON.parse(response.text.trim());
      } catch (parseErr) {
        console.error('Error parsing JSON response in chat continuation:', parseErr);
      }
    }

    const aiMsg: ChatMessage = {
      sender: 'ai',
      message: result.message,
      timestamp: new Date().toISOString(),
      illustrations: result.illustrations,
      journals: result.journals,
    };
    report.chatHistory.push(aiMsg);

    await db.saveExploreReport(report, userId);
    res.json(report);
  } catch (error: any) {
    console.error('Error inside chat exploration:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Assignments Review & list API
app.get('/api/assignments', async (req, res) => {
  try {
    const userId = getUserId(req);
    const assignments = await db.getAssignments(userId);
    assignments.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Submit Document Assignment for AI valuation
app.post('/api/assignments', async (req, res) => {
  try {
    const { filename, fileType, fileData, userNote } = req.body;
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

    const userId = getUserId(req);
    const studentProfileCtx = await getStudentProfileContext(userId);

    const promptText = `Anda adalah seorang "Guru Korektor AI" profesional & mentor bimbingan sains mendalam.${studentProfileCtx}
Periksa dokumen tugas siswa berikut yang diunggah dengan nama file: "${filename}" dan format: "${fileType}".
${userNote ? `\nCatatan / Pertanyaan Tambahan dari Siswa: "${userNote}"` : ''}

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
      model: 'gemini-3.6-flash',
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

    const initialChatHistory: ChatMessage[] = [
      {
        sender: 'user',
        message: `Halo Guru AI, saya mengajukan lembar Tugas Pintar: "${filename}"${userNote ? `\n\nCatatan/Pertanyaan Saya: "${userNote}"` : ''}`,
        timestamp: uploadedAt
      },
      {
        sender: 'ai',
        message: `Tugas "${filename}" telah selesai dikoreksi dengan skor **${result.score}/100**!\n\nBerikut ringkasan evaluasi:\n${result.review}\n\nSilakan ajukan pertanyaan atau minta penjelasan lebih mendalam jika ada bagian soal yang belum kamu pahami!`,
        timestamp: new Date().toISOString()
      }
    ];

    const assignment: Assignment = {
      id: assignmentId,
      filename,
      fileType,
      fileData,
      userNote: userNote || undefined,
      score: result.score,
      review: result.review,
      uploadedAt,
      chatHistory: initialChatHistory
    };

    await db.saveAssignment(assignment, userId);
    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error in assignments checking:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5.b Continue chat / discussion for a specific assignment
app.post('/api/assignments/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachment } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const userId = getUserId(req);
    const assignments = await db.getAssignments(userId);
    const assignment = assignments.find((a) => a.id === id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    if (!assignment.chatHistory) {
      assignment.chatHistory = [];
    }

    const userMsg: ChatMessage = {
      sender: 'user',
      message: message,
      timestamp: new Date().toISOString(),
      ...(attachment ? { attachment } : {}),
    };
    assignment.chatHistory.push(userMsg);

    const studentProfileCtx = await getStudentProfileContext(userId);

    // Build chat context
    const chatHistoryContext = assignment.chatHistory
      .map((c) => `${c.sender === 'user' ? 'Siswa' : 'Guru AI'}: ${c.message}${c.attachment ? ` [Lampiran file: ${c.attachment.filename}]` : ''}`)
      .join('\n');

    const parts: any[] = [];

    // 1) Main assignment file
    try {
      const filePart = parseBase64(assignment.fileData);
      parts.push({
        inlineData: {
          mimeType: filePart.mimeType,
          data: filePart.data,
        },
      });
    } catch (e) {
      console.error('Error parsing assignment file data:', e);
    }

    // 2) Optional attachment in this chat turn
    if (attachment && attachment.data) {
      try {
        const attachPart = parseBase64(attachment.data);
        parts.push({
          inlineData: {
            mimeType: attachPart.mimeType,
            data: attachPart.data,
          },
        });
      } catch (attachErr) {
        console.error('Error parsing chat attachment:', attachErr);
      }
    }

    const promptText = `Anda adalah "Guru AI" yang sabar, cerdas, dan interaktif.${studentProfileCtx}
Siswa sedang berdiskusi mengenai lembar tugas yang diunggah dengan nama file: "${assignment.filename}" (Skor Evaluasi: ${assignment.score}/100).

REKAM OBROLAN TUGAS SEBELUMNYA:
${chatHistoryContext}

PERTANYAAN BARU SISWA:
"${message}"

TUGAS ANDA:
1. Jawab pertanyaan siswa secara lugas, ramah, dan sangat mendidik.
2. Jika siswa bertanya tentang rumus, langkah penyelesaian, atau konsep yang membingungkan dari tugasnya, berikan penjelasan runtut langkah-demi-langkah.
3. Sisipkan notasi rujukan inline [1], [2] jika relevan dengan daftar jurnal.
4. Jika bermanfaat untuk memperjelas visual, buatlah 1 ilustrasi diagram SVG ilmiah di array "illustrations".
5. Jika relevan, sertakan 1-2 referensi akademik/jurnal di array "journals".

Kembalikan jawaban dalam format JSON sesuai schema (message, illustrations, journals).`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: KakakAiSchema,
      }
    });

    let result = {
      message: 'Pertanyaan bagus! Mari kita bedah bersama.',
      illustrations: [] as any[],
      journals: [] as any[]
    };

    if (response.text) {
      try {
        result = JSON.parse(response.text.trim());
      } catch (parseErr) {
        console.error('Error parsing JSON response in assignment chat:', parseErr);
      }
    }

    const aiMsg: ChatMessage = {
      sender: 'ai',
      message: result.message,
      timestamp: new Date().toISOString(),
      illustrations: result.illustrations,
      journals: result.journals,
    };

    assignment.chatHistory.push(aiMsg);

    await db.saveAssignment(assignment, userId);
    res.json(assignment);
  } catch (error: any) {
    console.error('Error inside assignment chat endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Get Daily Essay Question
app.get('/api/questions/today', async (req, res) => {
  try {
    const userId = getUserId(req);
    const todayStr = new Date().toISOString().split('T')[0];
    let dailyQuestion = await db.getDailyQuestionByDate(todayStr, userId);

    if (!dailyQuestion) {
      // Check if today's question was already generated for ANY user, so all students solve the same question today!
      let subject = 'Sains dan Alam';
      let question = 'Berikan deskripsi singkat tentang pentingnya menjaga sumber air bersih di sekitar pemukiman padat penduduk.';
      
      try {
        const poolQuestionsRes = await db.getDailyQuestions('guest');
        const anyToday = poolQuestionsRes.find(q => q.date === todayStr);
        if (anyToday) {
          subject = anyToday.subject;
          question = anyToday.question;
        } else {
          // Generate a brand new daily question using Gemini!
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
          const studentProfileCtx = await getStudentProfileContext(userId);

          const promptText = `Hasilkan satu pertanyaan esai latihan harian untuk murid dalam Bahasa Indonesia.${studentProfileCtx}
Mata pelajaran yang dipilih hari ini: "${randomSubject}".

Persyaratan Soal:
1. Soal harus memicu penalaran kritis mendalam, bukan sekadar hafalan singkat.
2. Soal harus menanyakan konsep menarik, relevan dengan kehidupan sehari-hari, dan membutuhkan tanggapan argumen 2-3 kalimat.
3. Berikan subjek yang terpilih dan soal tersebut dalam objek JSON.

Harap kembalikan respon struktur objek JSON dengan key:
"question" (string) dan "subject" (string).`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
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

          if (response.text) {
            const genResults = JSON.parse(response.text.trim());
            if (genResults.subject && genResults.question) {
              subject = genResults.subject;
              question = genResults.question;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching/generating base daily question:', err);
      }

      dailyQuestion = {
        id: todayStr,
        date: todayStr,
        subject,
        question,
        userAnswer: null,
        aiFeedback: null,
        score: null,
        answeredAt: null,
      };

      try {
        await db.saveDailyQuestion(dailyQuestion, userId);
      } catch (dbErr) {
        console.error('Error saving daily question to DB:', dbErr);
      }
    }

    res.json(dailyQuestion);
  } catch (error: any) {
    console.error('Error generating daily question:', error);
    const todayStr = new Date().toISOString().split('T')[0];
    res.json({
      id: todayStr,
      date: todayStr,
      subject: 'Sains dan Alam',
      question: 'Berikan deskripsi singkat tentang pentingnya menjaga sumber air bersih di sekitar pemukiman padat penduduk.',
      userAnswer: null,
      aiFeedback: null,
      score: null,
      answeredAt: null,
    });
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

    const userId = getUserId(req);
    const dailyQuestion = await db.getDailyQuestionByDate(todayStr, userId);
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
      model: 'gemini-3.6-flash',
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

    await db.saveDailyQuestion(dailyQuestion, userId);
    res.json(dailyQuestion);
  } catch (error: any) {
    console.error('Error grading daily response:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Generate & Get Weekly Review
app.get('/api/reviews/history', async (req, res) => {
  try {
    const userId = getUserId(req);
    const list = await db.getWeeklyReviews(userId);
    list.sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger generation of weekly review (on-demand or if it is saturday)
app.post('/api/reviews/generate', async (req, res) => {
  try {
    const userId = getUserId(req);
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
    const explorations = (await db.getExploreReports(userId)).filter((e) => {
      const diff = Date.now() - new Date(e.createdAt).getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });

    const assignments = (await db.getAssignments(userId)).filter((a) => {
      const diff = Date.now() - new Date(a.uploadedAt).getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });

    const essays = (await db.getDailyQuestions(userId)).filter((q) => {
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
      model: 'gemini-3.6-flash',
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

    await db.saveWeeklyReview(weeklyReview, userId);
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
