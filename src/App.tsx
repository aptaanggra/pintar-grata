import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  CheckSquare, 
  BookOpen, 
  History, 
  Camera, 
  Send, 
  UploadCloud, 
  Plus, 
  Calendar, 
  Award, 
  CheckCircle, 
  HelpCircle, 
  RefreshCw, 
  Star, 
  Layout, 
  Smile, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { ExploreReport, Assignment, DailyQuestion, WeeklyReview } from './types';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { 
  initAuth, 
  googleSignIn, 
  logout as googleLogout, 
} from './auth';
import { createGoogleDocFromStudy } from './googleDocsService';
import { User } from 'firebase/auth';

// Predefined mock assets for single-click trial templates
const DEMO_EXPLORATIONS = [
  {
    name: "🌱 Struktur Tulang Daun",
    desc: "Saya mengamati tulang daun sirsak di kebun samping rumah. Struktur tulang daunnya menyirip indah.",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23E2F1E7'/><path d='M50,90 Q50,50 50,10' stroke='%232F855A' stroke-width='2' fill='none'/><path d='M50,70 Q70,55 85,50' stroke='%2338A169' stroke-width='1.5' fill='none'/><path d='M50,70 Q30,55 15,50' stroke='%2338A169' stroke-width='1.5' fill='none'/><path d='M50,50 Q75,35 85,25' stroke='%2338A169' stroke-width='1.5' fill='none'/><path d='M50,50 Q25,35 15,25' stroke='%2338A169' stroke-width='1.5' fill='none'/><circle cx='50' cy='30' r='2' fill='%2348BB78'/></svg>"
  },
  {
    name: "🐜 Perilaku Semut Merah",
    desc: "Menemukan barisan semut merah memindahkan butiran gula kargo ke dalam sela semen trotoar taman.",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FFEBEB'/><circle cx='30' cy='50' r='4' fill='%23C53030'/><circle cx='40' cy='48' r='3.5' fill='%23C53030'/><circle cx='48' cy='45' r='5' fill='%23C53030'/><line x1='30' y1='50' x2='25' y2='60' stroke='%239B2C2C' stroke-width='1'/><line x1='40' y1='48' x2='38' y2='62' stroke='%239B2C2C' stroke-width='1'/><line x1='48' y1='45' x2='52' y2='60' stroke='%239B2C2C' stroke-width='1'/></svg>"
  }
];

const DEMO_ASSIGNMENTS = [
  {
    name: "📝 Tugas Sains_Ekosistem.png",
    filename: "Tugas Sains_Ekosistem.png",
    type: "image/png",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FAF5FF'/><text x='10' y='25' font-family='sans-serif' font-size='5' fill='%235B21B6' font-weight='bold'>TUGAS BIOLOGI: EKOSISTEM</text><text x='10' y='38' font-family='sans-serif' font-size='4' fill='black'>1. Produsen utama di hutan: Tumbuhan hijau</text><text x='10' y='48' font-family='sans-serif' font-size='4' fill='black'>2. Konsumen primer: Ulat dan belalang</text><text x='10' y='58' font-family='sans-serif' font-size='4' fill='black'>3. Peran dekomposer: Mengurai sisa organik</text><circle cx='80' cy='45' r='10' fill='none' stroke='%238B5CF6' stroke-width='1'/></svg>"
  },
  {
    name: "📐 Latihan_Matematika_Aljabar.png",
    filename: "Latihan_Matematika_Aljabar.png",
    type: "image/png",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23EFF6FF'/><text x='10' y='25' font-family='sans-serif' font-size='5' fill='%231E40AF' font-weight='bold'>LATIHAN PERSAMAAN LINEAR</text><text x='10' y='38' font-family='sans-serif' font-size='4' fill='black'>Soal: Cari nilai x dari 4x - 7 = 13</text><text x='10' y='48' font-family='sans-serif' font-size='4' fill='%231D4ED8'>Jawaban: 4x = 13 + 7 = 20</text><text x='10' y='58' font-family='sans-serif' font-size='4' fill='%231D4ED8'>x = 20 / 4 = 5 (Selesai)</text><rect x='70' y='60' width='15' height='15' fill='none' stroke='%233B82F6' stroke-width='1'/></svg>"
  }
];

export default function App() {
  // Mobile app tabs: 'explore' | 'assignment' | 'essay' | 'weekly'
  const [activeTab, setActiveTab] = useState<'explore' | 'assignment' | 'essay' | 'weekly'>('explore');
  
  // Data State
  const [explorations, setExplorations] = useState<ExploreReport[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [essayQuestion, setEssayQuestion] = useState<DailyQuestion | null>(null);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  
  const [isSaturday, setIsSaturday] = useState<boolean>(false);
  const [dayName, setDayName] = useState<string>('');
  
  // Interaction/UI States
  const [selectedExploration, setSelectedExploration] = useState<ExploreReport | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Inputs for Exploration Create Form
  const [exploreDesc, setExploreDesc] = useState<string>('');
  const [explorePhoto, setExplorePhoto] = useState<string>('');
  const [showNewExploreModal, setShowNewExploreModal] = useState<boolean>(false);
  
  // Inputs for Assignment Upload Form
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [assignmentFile, setAssignmentFile] = useState<{ filename: string; type: string; data: string } | null>(null);

  // Essay Input
  const [essayAnswerInput, setEssayAnswerInput] = useState<string>('');

  // Weekly review Saturday simulator override
  const [simulateSaturday, setSimulateSaturday] = useState<boolean>(false);

  // Google Docs Auth/Export States
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState<boolean>(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<{ id: string; url: string; title: string } | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<{ id: string; msg: string } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Google OAuth Initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsConnectingGoogle(true);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login Google gagal:', err);
      alert('Koneksi Google gagal atau dibatalkan. Harap izinkan popup browser.');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin memutuskan koneksi Google Docs?');
    if (!confirmed) return;
    try {
      await googleLogout();
      setGoogleUser(null);
      setGoogleToken(null);
      setExportSuccessMessage(null);
      setExportErrorMessage(null);
    } catch (err) {
      console.error('Logout gagal:', err);
    }
  };

  const handleExportExploration = async (exp: ExploreReport) => {
    if (!googleToken) {
      alert('Harap hubungkan Google Docs terlebih dahulu!');
      return;
    }
    
    const docTitle = `Eksplorasi AI - ${exp.description.slice(0, 30)}${exp.description.length > 30 ? '...' : ''}`;
    const confirmed = window.confirm(`Apakah Anda yakin ingin mengekspor eksplorasi "Eksplorasi ${exp.description.slice(0, 20)}..." ke akun Google Docs Anda?`);
    if (!confirmed) return;
    
    setExportingId(exp.id);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);
    
    let mdContent = `# LAPORAN EKSPLORASI MANDIRI (PINTAR AI)\n\n`;
    mdContent += `## DESKRIPSI UTAMA PENELITIAN SISWA\n${exp.description}\n\n`;
    mdContent += `Tanggal Dilaporkan: ${new Date(exp.createdAt).toLocaleString('id-ID')}\n\n`;
    mdContent += `## DIALOG DIKUSI DAN TUTORIAL BERSAMA GURU AI\n`;
    exp.chatHistory.forEach(chat => {
      mdContent += `### ${chat.sender === 'user' ? 'Siswa' : 'Kakak AI'} (Pukul ${new Date(chat.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})\n`;
      mdContent += `${chat.message}\n\n`;
    });
    
    const res = await createGoogleDocFromStudy(googleToken, docTitle, mdContent);
    if (res.success && res.docUrl) {
      setExportSuccessMessage({ id: exp.id, url: res.docUrl, title: docTitle });
    } else {
      setExportErrorMessage({ id: exp.id, msg: res.error || 'Terjadi kesalahan saat menyinkronkan dokumen.' });
    }
    setExportingId(null);
  };

  const handleExportAssignment = async (asg: Assignment) => {
    if (!googleToken) {
      alert('Harap hubungkan Google Docs terlebih dahulu!');
      return;
    }
    
    const docTitle = `Evaluasi Tugas AI - ${asg.filename}`;
    const confirmed = window.confirm(`Apakah Anda yakin ingin mengekspor ulasan penilaian tugas "${asg.filename}" ke Google Docs?`);
    if (!confirmed) return;
    
    setExportingId(asg.id);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);
    
    let mdContent = `# HASIL EVALUASI KOREKSI TUGAS MANDIRI\n\n`;
    mdContent += `Nama Berkas Tugas: ${asg.filename}\n`;
    mdContent += `Tanggal Koreksi: ${new Date(asg.uploadedAt).toLocaleString('id-ID')}\n`;
    mdContent += `SKOR PENILAIAN UTAMA: **${asg.score} dari 100**\n\n`;
    mdContent += `## HASIL TINJAUAN DAN ANALISIS UTUH GURU JURI AI\n`;
    mdContent += `${asg.review}\n`;
    
    const res = await createGoogleDocFromStudy(googleToken, docTitle, mdContent);
    if (res.success && res.docUrl) {
      setExportSuccessMessage({ id: asg.id, url: res.docUrl, title: docTitle });
    } else {
      setExportErrorMessage({ id: asg.id, msg: res.error || 'Terjadi kesalahan saat mengekspor tugas.' });
    }
    setExportingId(null);
  };

  const handleExportEssay = async (eq: DailyQuestion) => {
    if (!googleToken) {
      alert('Harap hubungkan Google Docs terlebih dahulu!');
      return;
    }
    if (!eq.userAnswer) return;
    
    const docTitle = `Tantangan Esai Harian - ${eq.subject}`;
    const confirmed = window.confirm(`Apakah Anda yakin ingin mengekspor tulisan tantangan esai harian topik "${eq.subject}" ke Google Docs?`);
    if (!confirmed) return;
    
    setExportingId(eq.id);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);
    
    let mdContent = `# JAWABAN ESAI MANDIRI & PENILAIAN RESMI AI\n\n`;
    mdContent += `Topik Pelajaran: ${eq.subject}\n`;
    mdContent += `Tanggal Tantangan Harian: ${new Date(eq.date).toLocaleDateString('id-ID')}\n`;
    mdContent += `SKOR ESAI SISWA: **${eq.score} dari 100**\n\n`;
    mdContent += `## PERTANYAAN TANTANGAN ESAI\n${eq.question}\n\n`;
    mdContent += `## JAWABAN ANDA\n${eq.userAnswer}\n\n`;
    mdContent += `## EVALUASI DAN MASUKANKAN DARI GURU AI\n`;
    mdContent += `${eq.aiFeedback}\n`;
    
    const res = await createGoogleDocFromStudy(googleToken, docTitle, mdContent);
    if (res.success && res.docUrl) {
      setExportSuccessMessage({ id: eq.id, url: res.docUrl, title: docTitle });
    } else {
      setExportErrorMessage({ id: eq.id, msg: res.error || 'Terjadi kesalahan saat mengekspor esai.' });
    }
    setExportingId(null);
  };

  const handleExportWeeklyReview = async (review: WeeklyReview) => {
    if (!googleToken) {
      alert('Harap hubungkan Google Docs terlebih dahulu!');
      return;
    }
    
    const docTitle = `Rapor Minggu PintarAI - ${review.weekRange}`;
    const confirmed = window.confirm(`Apakah Anda yakin ingin mengekspor Rapor Hasil Belajar Mingguan (${review.weekRange}) ke Google Docs?`);
    if (!confirmed) return;
    
    setExportingId(review.id);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);
    
    let mdContent = `# RAPOR HASIL BELAJAR MINGGUAN GURU AI PINTAR\n\n`;
    mdContent += `Rentang Analisis Rapor: ${review.weekRange}\n`;
    mdContent += `Tanggal Terbit Rapor: ${new Date(review.releasedAt).toLocaleDateString('id-ID')}\n`;
    mdContent += `RATA-RATA NILAI KOMPETENSI: **${review.statistics.averageScore} dari 100**\n\n`;
    mdContent += `## RINGKASAN AKTIVITAS BELAJAR\n`;
    mdContent += `* Menyelesaikan latihan esai harian: ${review.statistics.essaysCount} kali\n`;
    mdContent += `* Menyerahkan berkas tugas: ${review.statistics.assignmentsCount} kali\n`;
    mdContent += `* Penjelajahan alam mandiri: ${review.statistics.explorationsCount} kali\n\n`;
    mdContent += `## ANALISIS KOMPETENSI BELAJAR DAN STRATEGI LANJUTAN\n`;
    mdContent += `${review.summary}\n\n`;
    if (review.achievements && review.achievements.length > 0) {
      mdContent += `## LENCANA & PRESTASI YANG BERHASIL DIAKUISISI\n`;
      review.achievements.forEach(ach => {
        mdContent += `* 💎 ${ach}\n`;
      });
    }
    
    const res = await createGoogleDocFromStudy(googleToken, docTitle, mdContent);
    if (res.success && res.docUrl) {
      setExportSuccessMessage({ id: review.id, url: res.docUrl, title: docTitle });
    } else {
      setExportErrorMessage({ id: review.id, msg: res.error || 'Terjadi kesalahan saat mengekspor kran rapor mingguan.' });
    }
    setExportingId(null);
  };

  // Fetch initial data
  useEffect(() => {
    fetchExplorations();
    fetchAssignments();
    fetchTodayQuestion();
    fetchWeeklyReviews();
    checkSaturdayStatus();
  }, []);

  // Scroll to bottom of chat whenever conversation updates or report selected
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedExploration, selectedExploration?.chatHistory]);

  const checkSaturdayStatus = async () => {
    try {
      const res = await fetch('/api/saturday-check');
      const data = await res.json();
      setIsSaturday(data.isSaturday);
      setDayName(data.dayName);
    } catch (err) {
      console.error("Error checking Saturday status:", err);
    }
  };

  const fetchExplorations = async () => {
    try {
      const res = await fetch('/api/explorations');
      const data = await res.json();
      setExplorations(data);
    } catch (err) {
      console.error("Error explorations:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/assignments');
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      console.error("Error assignments:", err);
    }
  };

  const fetchTodayQuestion = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/questions/today');
      const data = await res.json();
      setEssayQuestion(data);
    } catch (err) {
      console.error("Error today quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReviews = async () => {
    try {
      const res = await fetch('/api/reviews/history');
      const data = await res.json();
      setWeeklyReviews(data);
    } catch (err) {
      console.error("Error reviews:", err);
    }
  };

  // Convert uploaded files to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'explore' | 'assignment') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      if (target === 'explore') {
        setExplorePhoto(base64Data);
      } else {
        setAssignmentFile({
          filename: file.name,
          type: file.type || 'image/png',
          data: base64Data
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Action: Submit Explorations
  const handleCreateExploration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explorePhoto || !exploreDesc.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/explorations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoData: explorePhoto,
          description: exploreDesc
        })
      });
      const newExp = await res.json();
      if (res.ok) {
        setExplorations(prev => [newExp, ...prev]);
        setSelectedExploration(newExp);
        setExploreDesc('');
        setExplorePhoto('');
        setShowNewExploreModal(false);
      }
    } catch (err) {
      console.error("Error submitting exploration", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Continue Explora Chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExploration || !chatInput.trim() || submitting) return;

    const userMsgText = chatInput;
    setChatInput('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/explorations/${selectedExploration.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsgText })
      });
      const updatedReport = await res.json();
      if (res.ok) {
        setExplorations(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
        setSelectedExploration(updatedReport);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Submit Assignment Doc
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentFile || submitting) return;

    setSubmitting(true);
    setUploadProgress('Sedang menilai tugas Anda menggunakan AI...');
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: assignmentFile.filename,
          fileType: assignmentFile.type,
          fileData: assignmentFile.data
        })
      });
      const newAsg = await res.json();
      if (res.ok) {
        setAssignments(prev => [newAsg, ...prev]);
        setAssignmentFile(null);
        setShowNewAssignmentModal(false);
        setUploadProgress('');
      }
    } catch (err) {
      console.error("Error submitting assignment:", err);
      setUploadProgress('Gagal mengirimkan tugas. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Submit Essay Response
  const handleSubmitEssay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayAnswerInput.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/questions/today/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: essayAnswerInput })
      });
      const updatedQ = await res.json();
      if (res.ok) {
        setEssayQuestion(updatedQ);
        setEssayAnswerInput('');
        fetchExplorations(); // Refresh stats for weekly report
      }
    } catch (err) {
      console.error("Error submitting essay:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Generate Weekly Review
  const handleGenerateWeeklyReview = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const newReview = await res.json();
      if (res.ok) {
        setWeeklyReviews(prev => [newReview, ...prev]);
      }
    } catch (err) {
      console.error("Error generating weekly review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Preset Applicator Utility
  const applyPresetExploration = (preset: typeof DEMO_EXPLORATIONS[0]) => {
    setExplorePhoto(preset.image);
    setExploreDesc(preset.desc);
  };

  const applyPresetAssignment = (preset: typeof DEMO_ASSIGNMENTS[0]) => {
    setAssignmentFile({
      filename: preset.filename,
      type: preset.type,
      data: preset.image
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4 md:py-10 px-4 md:px-8 font-sans">
      
      {/* BRAND HEADER */}
      <div className="w-full max-w-6xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left animate-fade-in shrink-0">
        <div>
          <h1 className="text-3xl font-black text-[#4F46E5] tracking-tight flex items-center gap-2.5 justify-center sm:justify-start">
            PintarAI
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Platform Belajar Mandiri Interaktif di mana siswa bebas bereksplorasi, dibimbing guru AI hebat setiap hari.
          </p>
        </div>
        <div className="text-slate-400 text-xs sm:text-right font-medium">
          <p>Aplikasi Belajar AI • 2026</p>
        </div>
      </div>

      {/* RESPONSIVE HUB CONTAINER */}
      <div className="w-full max-w-6xl bg-white text-slate-900 rounded-3xl shadow-xl flex flex-col overflow-hidden border border-slate-200 min-h-[80vh] relative">

        {/* TOP STATUS BAR */}
        <header className="bg-[#1E293B] text-white pt-6 pb-4 px-5 flex justify-between items-center relative border-b border-slate-800/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/10">
              AI
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">PINTAR AI</h2>
              <span className="text-[10px] bg-slate-800 text-indigo-300 py-0.5 px-2 rounded-full font-semibold font-sans">Student Companion</span>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <span className="text-xs text-slate-300 font-bold tracking-tight">Hari {dayName || 'Friday'}</span>
            <span className="text-[10px] leading-tight text-white/50 block font-mono">Working Hours</span>
          </div>
        </header>

        {/* HERO QUICK STATUS STATS BAR */}
        <div className="bg-slate-50 border-b border-slate-200 py-2.5 px-5 flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1 text-slate-700">
            <Award className="w-4 h-4 text-amber-505 text-amber-500" />
            <span>Poin: <strong className="text-[#4F46E5] font-extrabold">{explorations.length * 15 + assignments.length * 20 + (essayQuestion?.userAnswer ? 10 : 0)} XP</strong></span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
            <span>🔍 Eksplor: {explorations.length}</span>
            <span>📝 Laporan: {assignments.length}</span>
          </div>
        </div>

        {/* GOOGLE DOCS STATUS BANNER */}
        <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs transition-all relative z-10 shadow-sm shrink-0">
          {googleUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-5 w-5 bg-indigo-50 text-[#4F46E5] rounded-md flex items-center justify-center font-bold text-[9px] border border-indigo-100 shrink-0">
                  DOC
                </div>
                <span className="text-slate-650 truncate text-[11px]">
                  Akun: <strong className="text-slate-800 font-extrabold">{googleUser.displayName || googleUser.email}</strong>
                </span>
              </div>
              <button 
                onClick={handleGoogleLogout}
                className="text-[10px] text-red-600 hover:text-red-700 font-bold underline shrink-0 cursor-pointer ml-2"
              >
                Putus Koneksi
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2 font-sans">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                <span className="text-slate-500 font-bold text-[10.5px] truncate">Cadangkan belajarmu ke Google Docs!</span>
              </div>
              
              <button 
                onClick={handleGoogleLogin}
                disabled={isConnectingGoogle}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all shadow-sm shrink-0"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5 shrink-0 block">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span className="text-[10px] font-bold text-slate-700">{isConnectingGoogle ? 'Buka...' : 'Hubungkan Docs'}</span>
              </button>
            </div>
          )}
        </div>

        {/* INNER CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative pb-4">
          
          {selectedExploration && (
            /* LAYER CHAT DIALOG FOR EXPLORATION */
            <div className="absolute inset-0 bg-white z-40 flex flex-col">
              
              {/* Chat Header */}
              <div className="bg-slate-50 border-b border-slate-200 py-3.5 px-4 flex items-center gap-3 justify-between">
                <button 
                  onClick={() => setSelectedExploration(null)}
                  className="flex items-center text-[#4F46E5] font-bold text-xs gap-1 hover:bg-slate-100 p-1.5 px-2.5 rounded-lg transition-all active:scale-[0.97]"
                >
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <div className="text-center flex-1 pr-10">
                  <h3 className="text-xs font-bold text-slate-950 tracking-wider">OBROLAN SEPUTAR EKSPLOR</h3>
                  <p className="text-[10px] font-medium text-slate-400 truncate max-w-[200px]">{selectedExploration.description}</p>
                </div>
              </div>

              {/* Chat History Panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
                <div className="flex justify-center my-1">
                  <div className="w-24 h-24 rounded-xl border border-slate-200 overflow-hidden shadow">
                    <img 
                      src={selectedExploration.photoData} 
                      alt="Explore report base" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400">
                  Foto eksplorasi diajukan pada {new Date(selectedExploration.createdAt).toLocaleDateString('id-ID')}
                </div>

                {/* EXPORT TO GOOGLE DOCS FOR EXPLORATIONS */}
                <div className="flex flex-col items-center mt-1">
                  {googleToken ? (
                    <div className="flex flex-col items-center w-full">
                      <button
                        onClick={() => handleExportExploration(selectedExploration)}
                        disabled={exportingId === selectedExploration.id}
                        className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[#4F46E5] text-[10.5px] font-extrabold py-1.5 px-3 rounded-lg flex items-center gap-1 hover:shadow-sm cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        {exportingId === selectedExploration.id ? 'Mengekspor ke Google Docs...' : 'Simpan Percakapan ke Google Docs'}
                      </button>
                      
                      {exportSuccessMessage?.id === selectedExploration.id && (
                        <div className="mt-2 text-center text-[10px] bg-emerald-50 text-emerald-850 border border-emerald-250 p-2 rounded-xl max-w-[85%]">
                          <p className="font-bold">✓ Berhasil disimpan!</p>
                          <a 
                            href={exportSuccessMessage.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="underline text-[#4F46E5] font-black block mt-1"
                          >
                            Hubungkan & Buka Google Docs
                          </a>
                        </div>
                      )}
                      {exportErrorMessage?.id === selectedExploration.id && (
                        <div className="mt-2 text-center text-[10px] bg-red-50 text-red-800 border border-red-200 p-2 rounded-xl max-w-[85%] font-sans">
                          <p className="font-bold">Gagal menyimpan kran awan:</p>
                          <p className="mt-0.5 opacity-80">{exportErrorMessage.msg}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-slate-500 font-medium bg-slate-100/80 border border-slate-200 p-2.5 rounded-xl max-w-[85%] mx-auto">
                      Hubungkan Google Docs di bar atas untuk menyimpan seluruh rekaman belajar sains eksperimen ini!
                    </div>
                  )}
                </div>

                {selectedExploration.chatHistory.map((chat, index) => {
                  const isUser = chat.sender === 'user';
                  return (
                    <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                        isUser 
                          ? 'bg-[#4F46E5] text-white rounded-br-none' 
                          : 'bg-white text-slate-800 border border-slate-200/50 rounded-bl-none'
                      }`}>
                        <div className="text-[9px] font-bold text-slate-450 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                          {isUser ? <Smile className="w-3.5 h-3.5 text-indigo-200" /> : <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />}
                          {isUser ? 'Saya' : 'Kakak AI'}
                        </div>
                        <p className="whitespace-pre-line leading-relaxed">{chat.message}</p>
                        <span className="text-[9px] block text-right mt-1 opacity-60 font-mono">
                          {new Date(chat.timestamp).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Send Input Box */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tanya Kakak AI tentang objek di atas..."
                  className="flex-1 bg-slate-100 text-xs py-2.5 px-4 rounded-xl border border-slate-220 focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                  disabled={submitting}
                />
                <button 
                  type="submit" 
                  disabled={submitting || !chatInput.trim()}
                  className="bg-[#4F46E5] text-white p-2.5 rounded-xl hover:bg-indigo-750 disabled:bg-slate-150 transition-colors"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 1: EXPLORATIONS */}
          {activeTab === 'explore' && (
            <div className="px-5 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 tracking-tight flex items-center gap-2">
                    <Compass className="text-[#4F46E5] w-5 h-5" /> Eksplorasi Saya
                  </h3>
                  <p className="text-xs text-slate-400 leading-tight">Ambil & tanyakan ulasan sains dari sekitar alam Anda!</p>
                </div>
                <button
                  onClick={() => setShowNewExploreModal(true)}
                  className="bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl h-10 w-10 flex items-center justify-center shadow-lg hover:shadow-indigo-600/25 transition-all active:scale-[0.95] shrink-0 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Explorations Gallery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {explorations.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-455 space-y-3 shadow-sm">
                    <Camera className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">Belum ada eksplorasi alam</p>
                    <p className="text-xs text-slate-400 px-4">Klik tombol plus di atas untuk mengirimkan penemuan baru sekitar lingkungan!</p>
                  </div>
                ) : (
                  explorations.map((exp) => (
                    <div 
                      key={exp.id}
                      onClick={() => setSelectedExploration(exp)}
                      className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex gap-3.5 hover:border-indigo-400 cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
                    >
                      <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                        <img 
                          src={exp.photoData} 
                          alt="Explorer snap" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold font-mono">
                            {new Date(exp.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </p>
                          <h4 className="text-sm font-bold text-slate-800 truncate mt-0.5">{exp.description}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#4F46E5] font-semibold mt-1">
                          <Smile className="w-3.5 h-3.5" />
                          <span>Mulai Perbincangan AI ({exp.chatHistory.length - 1} balasan)</span>
                        </div>
                      </div>
                      <div className="self-center text-slate-350 p-1">
                        <ChevronRight className="w-5 h-5 text-indigo-500/80" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNMENTS CHECK */}
          {activeTab === 'assignment' && (
            <div className="px-5 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <CheckSquare className="text-[#4F46E5] w-5 h-5" /> Pemeriksaan Tugas
                  </h3>
                  <p className="text-xs text-slate-400 leading-tight">Unggah lembar tugas untuk evaluasi, ulasan, dan penilaian otomatis.</p>
                </div>
                <button
                  onClick={() => setShowNewAssignmentModal(true)}
                  className="bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl h-10 w-10 flex items-center justify-center shadow-lg hover:shadow-indigo-600/25 transition-all active:scale-[0.95] shrink-0 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Assignment log list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {assignments.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 space-y-2.5 shadow-sm">
                    <UploadCloud className="w-10 h-10 mx-auto opacity-35 text-slate-450" />
                    <p className="text-sm font-bold text-slate-700">Tempat Unggah Tugas</p>
                    <p className="text-xs text-slate-400 px-4">Kumpulkan lembar tugas PNG/JPG/PDF Anda untuk dievaluasi oleh Guru AI tepercaya secara instan.</p>
                  </div>
                ) : (
                  assignments.map((asg) => (
                    <div 
                      key={asg.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      {/* Top status */}
                      <div className="bg-slate-50 px-4 py-2.5 text-slate-500 text-xs border-b border-slate-200 flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <FileText className="w-3.5 h-3.5 text-[#4F46E5]" /> {asg.filename}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{new Date(asg.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      
                      {/* Body details & Grade */}
                      <div className="p-4 space-y-3.5">
                        <div className="flex justify-between items-start gap-3.5">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden w-12 h-12 shrink-0">
                            {asg.fileData?.startsWith('data:image') || asg.fileData?.startsWith('data:image/svg+xml') ? (
                              <img src={asg.fileData} alt="file preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full bg-red-50 text-red-650 flex items-center justify-center font-black text-xs">PDF</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider font-sans">
                              AI TERVERIFIKASI
                            </span>
                            <p className="text-xs text-slate-500 mt-1">Ditinjau instan oleh Guru Penguji PintarAI.</p>
                          </div>
                          
                          {/* Round score */}
                          <div className="flex flex-col items-center justify-center border-2 border-indigo-100 rounded-xl w-12 h-12 bg-indigo-50/20 shrink-0">
                            <span className="text-lg font-black text-indigo-700 leading-none">{asg.score}</span>
                            <span className="text-[8px] text-indigo-500 tracking-wider font-bold">SKOR</span>
                          </div>
                        </div>

                        {/* Review Content */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/50">
                          <MarkdownRenderer content={asg.review || 'Ulasan tidak tersedia.'} />
                        </div>

                        {/* EXPORT TO GOOGLE DOCS FOR ASSIGNMENTS */}
                        {googleToken ? (
                          <div className="mt-3 flex flex-col items-center">
                            <button
                              onClick={() => handleExportAssignment(asg)}
                              disabled={exportingId === asg.id}
                              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[#4F46E5] text-[10px] font-extrabold py-1.5 px-4 rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              {exportingId === asg.id ? 'Sedang mengekspor...' : 'Ekspor Evaluasi ke Google Docs'}
                            </button>
                            
                            {exportSuccessMessage?.id === asg.id && (
                              <div className="mt-2 text-center text-[10px] bg-emerald-50 text-emerald-850 border border-emerald-250 p-2.5 rounded-xl w-full">
                                <p className="font-bold">✓ Evaluasi Berhasil Disimpan!</p>
                                <a 
                                  href={exportSuccessMessage.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="underline text-[#4F46E5] font-black block mt-0.5"
                                >
                                  Buka Dokumen Google Docs
                                </a>
                              </div>
                            )}
                            {exportErrorMessage?.id === asg.id && (
                              <div className="mt-2 text-center text-[10px] bg-red-50 text-red-800 border border-red-200 p-2.5 rounded-xl w-full font-sans">
                                <p className="font-bold">Gagal mengekspor ulasan:</p>
                                <p className="mt-0.5 opacity-80">{exportErrorMessage.msg}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-[10px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-dashed border-slate-200">
                            Sambungkan Google Docs di atas untuk menyimpan dokumen ulasan bimbingan AI ini.
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DAILY ESSAY QUESTION */}
          {activeTab === 'essay' && (
            <div className="px-5 pt-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BookOpen className="text-[#4F46E5] w-5 h-5" /> Satu Hari Satu Soal
                </h3>
                <p className="text-xs text-slate-400 leading-tight">Latihan menulis esai kritis untuk mengasah intelek harian Anda.</p>
              </div>

              {loading ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4F46E5] mb-3" />
                  <p className="text-sm font-bold text-slate-700">Mempersiapkan soal esai harian baru...</p>
                  <p className="text-xs text-slate-400 mt-1">Sains/Sastra harian sedang dikompilasi oleh AI.</p>
                </div>
              ) : essayQuestion ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  
                  {/* Topic Header banner */}
                  <div className="bg-gradient-to-r from-[#4F46E5] to-indigo-800 p-4.5 text-white">
                    <span className="text-[9px] bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg font-bold tracking-wider uppercase font-sans">
                      TOPIK: {essayQuestion.subject}
                    </span>
                    <h3 className="text-xs font-medium text-slate-100 block mt-2">Disediakan harian pada {new Date(essayQuestion.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</h3>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                      <p className="text-slate-800 text-xs font-bold leading-relaxed">
                        {essayQuestion.question}
                      </p>
                    </div>

                    {essayQuestion.userAnswer ? (
                      /* ANSWER ALREADY GIVEN */
                      <div className="space-y-4">
                        <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-1.5">
                          <span className="text-[9px] font-bold font-sans text-slate-400 uppercase tracking-wider">Jawaban Saya:</span>
                          <p className="text-xs text-slate-700 leading-relaxed italic">"{essayQuestion.userAnswer}"</p>
                        </div>

                        {/* Grading feedback card */}
                        <div className="border border-indigo-100 bg-indigo-50/15 p-4 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 h-12 w-12 bg-[#4F46E5] text-white rounded-bl-xl flex items-center justify-center font-bold">
                            <span className="text-sm font-sans tracking-tight">{essayQuestion.score}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-[#4F46E5] flex items-center gap-1.5">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Hasil Penilaian Guru AI
                            </span>
                            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pr-6">
                              {essayQuestion.aiFeedback}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-100/80 rounded-xl p-3 text-center text-[11px] font-medium text-slate-500 flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 text-[#4F46E5]" />
                          <span>Anda berhasil menyelesaikan tantangan hari ini!</span>
                        </div>

                        {/* EXPORT TO GOOGLE DOCS FOR ESSAY */}
                        {googleToken ? (
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => handleExportEssay(essayQuestion)}
                              disabled={exportingId === essayQuestion.id}
                              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[#4F46E5] text-[10.5px] font-extrabold py-1.5 px-4 rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-50 w-full justify-center"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              {exportingId === essayQuestion.id ? 'Mengekspor Esai harian Anda...' : 'Ekspor Esai Hari Ini ke Google Docs'}
                            </button>
                            
                            {exportSuccessMessage?.id === essayQuestion.id && (
                              <div className="mt-2 text-center text-[10px] bg-emerald-50 text-emerald-850 border border-emerald-250 p-2.5 rounded-xl w-full">
                                <p className="font-bold">✓ Esai Kamu Berhasil Disimpan!</p>
                                <a 
                                  href={exportSuccessMessage.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="underline text-[#4F46E5] font-black block mt-0.5"
                                >
                                  Buka Dokumen Esai Anda di Google Docs
                                </a>
                              </div>
                            )}
                            {exportErrorMessage?.id === essayQuestion.id && (
                              <div className="mt-2 text-center text-[10px] bg-red-50 text-red-800 border border-red-200 p-2.5 rounded-xl w-full font-sans">
                                <p className="font-bold">Gagal ekspor esai:</p>
                                <p className="mt-0.5 opacity-80">{exportErrorMessage.msg}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-[10px] text-slate-500 font-medium bg-slate-100/50 border border-slate-200 p-2.5 rounded-xl">
                            Daftarkan Google Docs di bar atas untuk menyimpan seluruh ulasan guru dan hasil evaluasi esai ini ke Google Cloud!
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ACTIVE SUBMISSION FORM */
                      <form onSubmit={handleSubmitEssay} className="space-y-3.5">
                        <textarea
                          rows={4}
                          value={essayAnswerInput}
                          onChange={(e) => setEssayAnswerInput(e.target.value)}
                          placeholder="Ketik jawaban esai kritis Anda di sini (minimal 1 atau 2 paragraf)..."
                          className="w-full bg-slate-50 text-slate-900 border border-slate-220 text-xs p-3.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4F46E5] font-sans h-32"
                          maxLength={1000}
                          disabled={submitting}
                        />
                        <button
                          type="submit"
                          disabled={submitting || !essayAnswerInput.trim()}
                          className="w-full bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-indigo-600/10 transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2 text-xs"
                        >
                          {submitting ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Sedang Menilai Jawaban Anda...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Kirim Jawaban Ke Guru AI</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-450 text-xs">
                  Gagal mempersiapkan latihan harian.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SATURDAY WEEKLY REVIEW */}
          {activeTab === 'weekly' && (
            <div className="px-5 pt-5 space-y-4 pb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Calendar className="text-[#4F46E5] w-5 h-5" /> Rapor Mingguan (Review)
                </h3>
                <p className="text-xs text-slate-400 leading-tight">Ulasan konsolidasi prestasi mingguan siswa. Rilis setiap hari Sabtu.</p>
              </div>

              {/* Saturday checker information */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-none">
                <div className="flex gap-2.5">
                  <Award className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Ulasan Mingguan PintarAI</p>
                    <p className="text-slate-650 leading-relaxed mt-0.5">
                      Hari ini adalah hari <strong className="font-semibold">{dayName || 'Jumat'}</strong>. Rapor mingguan dirilis otomatis setiap hari sabtu untuk merangkum seluruh kegiatan belajar mandiri Anda.
                    </p>
                  </div>
                </div>

                {/* Simulate helper override */}
                {!isSaturday && (
                  <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium italic">Gunakan simulator untuk menguji fitur:</span>
                    <button
                      onClick={() => {
                        setSimulateSaturday(prev => !prev);
                      }}
                      className={`text-[10px] py-1 px-3 rounded-xl font-bold shadow-sm transition-all cursor-pointer ${
                        simulateSaturday ? 'bg-[#4F46E5] text-white' : 'bg-white border boundary-slate text-indigo-600'
                      }`}
                    >
                      {simulateSaturday ? 'Simulasi Aktif' : 'Simulasi Sabtu'}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button to Generate Weekly review (If Saturday or Simulator is override) */}
              {(isSaturday || simulateSaturday) && (
                <div className="bg-gradient-to-br from-indigo-950 to-[#2A2185] text-white rounded-xl p-5 shadow-lg space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles className="w-20 h-20" />
                  </div>
                  <h3 className="text-[9px] font-extrabold tracking-widest text-[#B4AFFA] uppercase font-sans">RAPOR MINGGUAN TERSEDIA</h3>
                  <h4 className="text-sm font-bold leading-tight">Buat Rapor AI Baru untuk 7 Hari Belajar Terakhir Anda!</h4>
                  <p className="text-xs text-indigo-200/90 leading-relaxed">
                    AI akan mengompilasi {explorations.length} eksplorasi sekitar, {assignments.length} tugas terverifikasi, dan latihan esai harian Anda untuk diringkas ke analisis kompetensi belajar.
                  </p>
                  <button
                    onClick={handleGenerateWeeklyReview}
                    disabled={submitting}
                    className="w-full bg-[#4F46E5] hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>MENGANALISIS RIWAYAT...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-200 fill-indigo-200" />
                        <span>BUAT RAPOR MINGGUAN SEKARANG</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Historic review cards */}
              <div className="space-y-4.5 pt-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">RIWAYAT RAPOR MINGGUAN</h4>
                
                {weeklyReviews.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat rapor tersimpan. Silakan klik "Simulasi Sabtu" untuk membuat rapor mingguan Anda!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {weeklyReviews.map((review) => (
                    <div 
                      key={review.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 relative"
                    >
                      {/* Badge Top */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] bg-slate-100 text-slate-800 font-extrabold px-2.5 py-1 rounded-lg">
                            RAPOR • {review.weekRange}
                          </span>
                          <h4 className="text-[10px] text-slate-400 font-medium mt-1.5">Diterbitkan pada {new Date(review.releasedAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</h4>
                        </div>
                        <div className="text-right text-[#4F46E5] text-xs font-black font-mono">
                          Rata-rata: {review.statistics.averageScore}/100
                        </div>
                      </div>

                      {/* AI Summary report */}
                      <div className="border-l-2 border-[#4F46E5] pl-3 py-1 bg-slate-50 rounded-r-xl p-2.5 text-xs text-slate-700 leading-relaxed">
                        <MarkdownRenderer content={review.summary} />
                      </div>

                      {/* Stat summary blocks */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-0.5">
                          <span className="block text-xs font-bold text-slate-800">{review.statistics.essaysCount}</span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Latihan</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-0.5">
                          <span className="block text-xs font-bold text-slate-800">{review.statistics.explorationsCount}</span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Eksplor</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-0.5">
                          <span className="block text-xs font-bold text-slate-800">{review.statistics.assignmentsCount}</span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">Tugas</span>
                        </div>
                      </div>

                      {/* Medal Achievements list */}
                      {review.achievements && review.achievements.length > 0 && (
                        <div className="bg-indigo-50/15 border border-indigo-100 rounded-xl p-3.5 space-y-2">
                          <div className="text-[9px] font-extrabold text-[#4F46E5] uppercase tracking-wider flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Gelar Lencana Dibuka
                          </div>
                          <div className="space-y-1">
                            {review.achievements.map((ach, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                                <span className="text-amber-500 font-bold">💎</span>
                                <span>{ach}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* EXPORT TO GOOGLE DOCS FOR WEEKLY REVIEWS */}
                      {googleToken ? (
                        <div className="mt-4 flex flex-col items-center">
                          <button
                            onClick={() => handleExportWeeklyReview(review)}
                            disabled={exportingId === review.id}
                            className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[#4F46E5] text-[10.5px] font-extrabold py-1.5 px-4 rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-50 w-full justify-center"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            {exportingId === review.id ? 'Sedang mencadangkan rapor...' : 'Ekspor Rapor Mingguan ke Google Docs'}
                          </button>
                          
                          {exportSuccessMessage?.id === review.id && (
                            <div className="mt-2 text-center text-[10px] bg-emerald-50 text-emerald-850 border border-emerald-250 p-2.5 rounded-xl w-full">
                              <p className="font-bold">✓ Rapor Berhasil Dicadangkan!</p>
                              <a 
                                href={exportSuccessMessage.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="underline text-[#4F46E5] font-black block mt-0.5"
                              >
                                Buka Google Docs Rapor Mingguan
                              </a>
                            </div>
                          )}
                          {exportErrorMessage?.id === review.id && (
                            <div className="mt-2 text-center text-[10px] bg-red-50 text-red-800 border border-red-200 p-2.5 rounded-xl w-full font-sans">
                              <p className="font-bold">Gagal mencadangkan rapor:</p>
                              <p className="mt-0.5 opacity-80">{exportErrorMessage.msg}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-dashed border-slate-200">
                          Hubungkan dengan Google Docs di atas untuk mengekspor rapor prestasi ini sehingga bisa diperlihatkan ke orang tua!
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>

        {/* FOOTER BAR (TAB NAVIGATOR) */}
        <nav className="h-16 border-t border-slate-200 bg-white flex justify-around items-center px-2 shrink-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-2 pt-1">
          <button 
            onClick={() => { setActiveTab('explore'); setSelectedExploration(null); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl cursor-pointer ${
              activeTab === 'explore' ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Compass className="w-5 h-5 leading-none" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">Eksplor</span>
          </button>

          <button 
            onClick={() => { setActiveTab('assignment'); setSelectedExploration(null); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl cursor-pointer ${
              activeTab === 'assignment' ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckSquare className="w-5 h-5 leading-none" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">Koreksi</span>
          </button>

          <button 
            onClick={() => { setActiveTab('essay'); setSelectedExploration(null); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl cursor-pointer ${
              activeTab === 'essay' ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-5 h-5 leading-none" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">Latihan</span>
          </button>

          <button 
            onClick={() => { setActiveTab('weekly'); setSelectedExploration(null); }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl cursor-pointer ${
              activeTab === 'weekly' ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Calendar className="w-5 h-5 leading-none" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">Rapor</span>
          </button>
        </nav>
      </div>

      {/* ====================================================
          NEW EXPLORATION DIALOG / MODAL (FLOATING)
          ==================================================== */}
      {showNewExploreModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ajukan Eksplorasi Baru</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Benda alam, tumbuh-tumbuhan, fenomena sekitar.</p>
              </div>
              <button 
                onClick={() => setShowNewExploreModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold p-1.5 px-3 rounded-lg border border-slate-200 bg-white cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleCreateExploration} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Presets shortcut */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[#4F46E5] uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[#4F46E5] fill-indigo-200" /> Presets Coba Cepat (Trial)
                </span>
                <div className="flex flex-col gap-1.5">
                  {DEMO_EXPLORATIONS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => applyPresetExploration(preset)}
                      className="bg-indigo-50/15 hover:bg-indigo-50/40 text-[#4F46E5] text-xs font-bold text-left py-2 px-3 rounded-xl border border-indigo-100 flex justify-between items-center transition-all cursor-pointer"
                    >
                      <span>{preset.name}</span>
                      <span className="text-[9px] opacity-90 bg-[#4F46E5] text-white py-0.5 px-2 rounded-lg font-sans">Pasang</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload image form */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Unggah Foto Objek:</label>
                <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 relative flex flex-col justify-center items-center min-h-[100px]">
                  {explorePhoto ? (
                    <div className="relative">
                      <img src={explorePhoto} alt="preview submit" className="max-h-[80px] rounded-lg shadow-sm" referrerPolicy="no-referrer" />
                      <button 
                        type="button" 
                        onClick={() => setExplorePhoto('')}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 text-[8px] h-4 w-4 flex items-center justify-center font-bold"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-7 h-7 mx-auto text-slate-400" />
                      <span className="text-[9px] text-slate-400 mt-1 block">Silakan ambil foto atau klik preset cepat di atas</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'explore')}
                        className="opacity-0 absolute inset-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Description input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Tanya / Deskripsi Eksplorasi Anda:</label>
                <textarea
                  rows={3}
                  value={exploreDesc}
                  onChange={(e) => setExploreDesc(e.target.value)}
                  placeholder="Misal: Saya melihat daun sirih hijau di pagar, mengapa bentuknya menyirip melebar?"
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !explorePhoto || !exploreDesc.trim()}
                className="w-full bg-[#4F46E5] hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1 shadow-lg hover:shadow-indigo-600/10 cursor-pointer transition-all active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang diproses Kakak AI...</span>
                  </>
                ) : (
                  <>
                    <span>Ajukan & Mulai Obrolan</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          NEW ASSIGNMENT DIALOG / MODAL (FLOATING)
          ==================================================== */}
      {showNewAssignmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ajukan Tugas Baru (Koreksi)</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Uji lembar tugas sains, biologi, atau matematika.</p>
              </div>
              <button 
                onClick={() => setShowNewAssignmentModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold p-1.5 px-3 rounded-lg border border-slate-200 bg-white cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="p-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Presets shortcut */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[#4F46E5] uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[#4F46E5] fill-indigo-200" /> Presets Tugas Percobaan
                </span>
                <div className="flex flex-col gap-1.5">
                  {DEMO_ASSIGNMENTS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => applyPresetAssignment(preset)}
                      className="bg-indigo-50/15 hover:bg-indigo-50/40 text-[#4F46E5] text-xs font-bold text-left py-2 px-3 rounded-xl border border-indigo-100 flex justify-between items-center transition-all cursor-pointer"
                    >
                      <span>{preset.name}</span>
                      <span className="text-[9px] opacity-90 bg-[#4F46E5] text-white py-0.5 px-2 rounded-lg font-sans">Pasang</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload doc form */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Pilih File Tugas (Dokumen PNG/JPG/PDF):</label>
                <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 relative flex flex-col justify-center items-center min-h-[100px]">
                  {assignmentFile ? (
                    <div className="space-y-1 flex flex-col items-center">
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold font-mono">
                        {assignmentFile.filename}
                      </span>
                      {assignmentFile.data?.startsWith('data:image') && (
                        <img src={assignmentFile.data} className="h-[40px] mt-1 rounded opacity-75" referrerPolicy="no-referrer" />
                      )}
                      <button 
                        type="button" 
                        onClick={() => setAssignmentFile(null)}
                        className="text-[10px] font-bold text-red-600 underline cursor-pointer"
                      >
                        Ganti File
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-7 h-7 mx-auto text-slate-400" />
                      <span className="text-[10px] text-slate-400 mt-1 block">Tarik & letakkan file tugas Anda di sini</span>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(e, 'assignment')}
                        className="opacity-0 absolute inset-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </div>

              {uploadProgress && (
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-[10px] font-bold text-indigo-800 text-center animate-pulse">
                  {uploadProgress}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !assignmentFile}
                className="w-full bg-[#4F46E5] hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1 shadow-lg hover:shadow-indigo-600/10 transition-all active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Jawaban Anda...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Evaluasi AI</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
