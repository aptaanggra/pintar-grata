import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  CheckSquare, 
  BookOpen, 
  Calendar, 
  Award, 
  CheckCircle, 
  HelpCircle, 
  RefreshCw, 
  Star, 
  Smile, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  FileText,
  Trophy,
  GraduationCap,
  Sparkle,
  Camera,
  UploadCloud,
  Send,
  Plus,
  Paperclip,
  Image,
  X,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [activeTab, setActiveTab] = useState<'explore' | 'assignment' | 'essay' | 'weekly'>('explore');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Auto-collapse sidebar on tablet portrait view (< 1024px) on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    }
  }, []);
  
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
  const [chatAttachment, setChatAttachment] = useState<{ filename: string; type: string; data: string } | null>(null);
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isInIframe = typeof window !== 'undefined' ? window.self !== window.top : false;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatDocRef = useRef<HTMLInputElement>(null);
  const chatImgRef = useRef<HTMLInputElement>(null);

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

  const handleCopyExplorationText = (exp: ExploreReport) => {
    let mdContent = `# LAPORAN EKSPLORASI MANDIRI (PINTAR AI)\n\n`;
    mdContent += `## DESKRIPSI UTAMA PENELITIAN SISWA\n${exp.description}\n\n`;
    mdContent += `Tanggal Dilaporkan: ${new Date(exp.createdAt).toLocaleString('id-ID')}\n\n`;
    mdContent += `## DIALOG DIKUSI DAN TUTORIAL BERSAMA GURU AI\n`;
    exp.chatHistory.forEach(chat => {
      mdContent += `### ${chat.sender === 'user' ? 'Siswa' : 'Kakak AI'} (Pukul ${new Date(chat.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})\n`;
      mdContent += `${chat.message}\n\n`;
    });
    navigator.clipboard.writeText(mdContent);
    setCopiedId(exp.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAssignmentText = (asg: Assignment) => {
    let mdContent = `# HASIL EVALUASI KOREKSI TUGAS MANDIRI\n\n`;
    mdContent += `Nama Berkas Tugas: ${asg.filename}\n`;
    mdContent += `Tanggal Koreksi: ${new Date(asg.uploadedAt).toLocaleString('id-ID')}\n`;
    mdContent += `SKOR PENILAIAN UTAMA: **${asg.score} dari 100**\n\n`;
    mdContent += `## HASIL TINJAUAN DAN ANALISIS UTUH GURU JURI AI\n`;
    mdContent += `${asg.review}\n`;
    navigator.clipboard.writeText(mdContent);
    setCopiedId(asg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyEssayText = (eq: DailyQuestion) => {
    let mdContent = `# JAWABAN ESAI MANDIRI & PENILAIAN RESMI AI\n\n`;
    mdContent += `Topik Pelajaran: ${eq.subject}\n`;
    mdContent += `Tanggal Tantangan Harian: ${new Date(eq.date).toLocaleDateString('id-ID')}\n`;
    mdContent += `SKOR ESAI SISWA: **${eq.score} dari 100**\n\n`;
    mdContent += `## PERTANYAAN TANTANGAN ESAI\n${eq.question}\n\n`;
    mdContent += `## JAWABAN ANDA\n${eq.userAnswer || '-'}\n\n`;
    mdContent += `## EVALUASI DAN MASUKANKAN DARI GURU AI\n`;
    mdContent += `${eq.aiFeedback || '-'}\n`;
    navigator.clipboard.writeText(mdContent);
    setCopiedId(eq.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyWeeklyReviewText = (review: WeeklyReview) => {
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
    navigator.clipboard.writeText(mdContent);
    setCopiedId(review.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportExploration = async (exp: ExploreReport) => {
    if (!googleToken) return;
    
    const docTitle = `Eksplorasi AI - ${exp.description.slice(0, 30)}${exp.description.length > 30 ? '...' : ''}`;
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
    if (!googleToken) return;
    
    const docTitle = `Evaluasi Tugas AI - ${asg.filename}`;
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
    if (!googleToken || !eq.userAnswer) return;
    
    const docTitle = `Tantangan Esai Harian - ${eq.subject}`;
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
    if (!googleToken) return;
    
    const docTitle = `Rapor Minggu PintarAI - ${review.weekRange}`;
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
  }, [googleUser]);

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
      const res = await fetch('/api/explorations', {
        headers: { 'x-user-id': googleUser?.uid || 'guest' }
      });
      const data = await res.json();
      setExplorations(data);
    } catch (err) {
      console.error("Error explorations:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/assignments', {
        headers: { 'x-user-id': googleUser?.uid || 'guest' }
      });
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      console.error("Error assignments:", err);
    }
  };

  const fetchTodayQuestion = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/questions/today', {
        headers: { 'x-user-id': googleUser?.uid || 'guest' }
      });
      const data = await res.json();
      if (data && data.question) {
        setEssayQuestion(data);
      } else {
        console.error("Error today question response:", data);
        setEssayQuestion(null);
      }
    } catch (err) {
      console.error("Error today quiz:", err);
      setEssayQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReviews = async () => {
    try {
      const res = await fetch('/api/reviews/history', {
        headers: { 'x-user-id': googleUser?.uid || 'guest' }
      });
      const data = await res.json();
      setWeeklyReviews(data);
    } catch (err) {
      console.error("Error reviews:", err);
    }
  };

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

  const handleCreateExploration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explorePhoto || !exploreDesc.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/explorations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': googleUser?.uid || 'guest'
        },
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

  const handleChatAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>, acceptType: 'image' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (acceptType === 'image' && !file.type.startsWith('image/')) {
      alert("Unggahan gagal. Silakan pilih berkas gambar saja!");
      return;
    }
    if (acceptType === 'doc' && file.type.startsWith('image/')) {
      alert("Unggahan gagal. Silakan pilih dokumen (PDF, Word, Teks) untuk diunggah!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      setChatAttachment({
        filename: file.name,
        type: file.type || 'application/octet-stream',
        data: base64Data
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const renderMessageWithCitations = (text: string, journals: ExploreReport['chatHistory'][0]['journals']) => {
    if (!journals || journals.length === 0) {
      return <p className="whitespace-pre-line leading-relaxed">{text}</p>;
    }

    const parts = text.split(/(\[\d+\])/g);
    return (
      <p className="whitespace-pre-line leading-relaxed">
        {parts.map((part, index) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (match) {
            const num = parseInt(match[1], 10);
            const journalIdx = num - 1;
            if (journals[journalIdx]) {
              const ref = journals[journalIdx];
              return (
                <a
                  key={index}
                  href={ref.url.startsWith('http') ? ref.url : `https://scholar.google.com/scholar?q=${encodeURIComponent(ref.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-extrabold px-1.5 py-0.5 mx-0.5 rounded text-[9px] select-none align-baseline border border-solid border-indigo-300/50 no-underline cursor-pointer transition-colors shadow-sm"
                  title={`[Ref ${num}] ${ref.title} (${ref.author}, ${ref.year})`}
                >
                  [{num}]
                </a>
              );
            }
          }
          return part;
        })}
      </p>
    );
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExploration || !chatInput.trim() || submitting) return;

    const userMsgText = chatInput;
    const currentAttachment = chatAttachment;
    setChatInput('');
    setChatAttachment(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/explorations/${selectedExploration.id}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': googleUser?.uid || 'guest'
        },
        body: JSON.stringify({ 
          message: userMsgText,
          attachment: currentAttachment
        })
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

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentFile || submitting) return;

    setSubmitting(true);
    setUploadProgress('Sedang menilai tugas Anda menggunakan AI...');
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': googleUser?.uid || 'guest'
        },
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

  const handleSubmitEssay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayAnswerInput.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/questions/today/answer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': googleUser?.uid || 'guest'
        },
        body: JSON.stringify({ answer: essayAnswerInput })
      });
      const updatedQ = await res.json();
      if (res.ok) {
        setEssayQuestion(updatedQ);
        setEssayAnswerInput('');
        fetchExplorations(); 
      }
    } catch (err) {
      console.error("Error submitting essay:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateWeeklyReview = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': googleUser?.uid || 'guest'
        }
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
    <div className={`min-h-screen bg-gradient-to-br from-[#FEF1F2]/60 via-[#F1F5F9] to-[#ECF2FE]/60 flex flex-col md:flex-row text-slate-800 font-sans antialiased overflow-x-hidden ${
      selectedExploration 
        ? 'h-screen overflow-hidden' 
        : 'md:h-screen md:overflow-hidden'
    }`}>
      
      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className={`hidden md:flex flex-col ${isSidebarCollapsed ? 'w-24' : 'w-76'} bg-white/70 backdrop-blur-md rounded-[2.25rem] border border-slate-200/40 p-5 shadow-lg shadow-slate-100/30 justify-between h-[calc(100vh-2rem)] sticky top-4 m-4 shrink-0 transition-all duration-300 z-20`}>
        <div className="space-y-6 w-full">
          {/* Logo and Collapse Toggle */}
          <div className={`flex flex-col ${isSidebarCollapsed ? 'items-center gap-4' : 'gap-3'} w-full`}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-50/80 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100/50 shadow-xs shrink-0">
                  <Compass className="w-5 h-5 text-indigo-650 animate-pulse" />
                </div>
                {!isSidebarCollapsed && (
                  <div>
                    <h1 className="text-base font-bold font-display tracking-tight text-slate-800 leading-none">PintarAI</h1>
                    <p className="text-[10px] text-slate-400 font-medium font-sans mt-1">Sesi Belajar Mandiri</p>
                  </div>
                )}
              </div>
              
              {!isSidebarCollapsed && (
                <button 
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-all cursor-pointer border-0 flex items-center justify-center"
                  title="Sembunyikan Menu"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-all cursor-pointer border-0"
                title="Tampilkan Menu"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Student Stats Profile Card in beautiful soft pink shade */}
          {isSidebarCollapsed ? (
            <div 
              className="bg-gradient-to-br from-[#FFF0F3] to-pink-50 border border-pink-100 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              onClick={() => setIsSidebarCollapsed(false)}
              title={`Poin: ${explorations.length * 15 + assignments.length * 20 + (essayQuestion?.userAnswer ? 10 : 0)} XP - Level ${Math.floor((explorations.length + assignments.length) / 3) + 1}`}
            >
              <Trophy className="w-5 h-5 text-rose-500" />
              <span className="text-[10px] font-black text-rose-650 font-display">
                Lvl {Math.floor((explorations.length + assignments.length) / 3) + 1}
              </span>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#FFF0F3] via-pink-50/50 to-[#EFF2FE]/40 border border-pink-100/75 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-rose-700 font-display">Siswa Unggulan</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold font-display text-slate-900">
                  {explorations.length * 15 + assignments.length * 20 + (essayQuestion?.userAnswer ? 10 : 0)} XP
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-650 py-0.5 px-2 rounded-full font-bold">Lvl {Math.floor((explorations.length + assignments.length) / 3) + 1}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-pink-150/50 pt-2 text-[10px] text-slate-500 font-semibold font-sans">
                <div>🔍 {explorations.length} Eksplor</div>
                <div>📝 {assignments.length} Koreksi</div>
              </div>
            </div>
          )}

          {/* Nav List with Black theme on active item */}
          <nav className="space-y-1 pt-2 w-full">
            {[
              { id: 'explore', label: 'Eksplorasi Sains', icon: Compass },
              { id: 'assignment', label: 'Koreksi Berkas', icon: CheckSquare },
              { id: 'essay', label: 'Esai Harian', icon: BookOpen },
              { id: 'weekly', label: 'Rapor Belajar', icon: Calendar },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setSelectedExploration(null); }}
                  title={tab.label}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-bold transition-all cursor-pointer border border-solid ${
                    isActive 
                      ? 'bg-indigo-50/70 text-indigo-700 border-indigo-150/40 shadow-xs' 
                      : 'text-slate-400 hover:bg-slate-100/70 hover:text-slate-800 bg-transparent border-transparent'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-650' : 'text-slate-400'}`} />
                  {!isSidebarCollapsed && <span className="tracking-wide font-display">{tab.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Google Cloud backup segment in Sidebar */}
        <div className="border-t border-slate-100 pt-4 space-y-2 w-full">
          {isSidebarCollapsed ? (
            googleUser ? (
              <button 
                onClick={handleGoogleLogout}
                title={`Koneksi Google Docs aktif: ${googleUser.displayName || googleUser.email}. Klik untuk memutuskan.`}
                className="w-full flex items-center justify-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all cursor-pointer border-0"
              >
                <div className="relative">
                  <FileText className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                </div>
              </button>
            ) : (
              <button 
                onClick={handleGoogleLogin} 
                disabled={isConnectingGoogle}
                title="Hubungkan Google Docs"
                className="w-full flex items-center justify-center p-2.5 bg-slate-105 hover:bg-indigo-50 border border-slate-200 text-indigo-650 rounded-xl cursor-pointer font-bold transition-all border-0"
              >
                <Sparkle className="w-4 h-4 text-amber-500 fill-amber-400 animate-pulse" />
              </button>
            )
          ) : (
            googleUser ? (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] space-y-1">
                <p className="text-slate-400 font-bold font-sans truncate">Koneksi Docs: <strong className="text-slate-700">{googleUser.displayName || googleUser.email}</strong></p>
                <button onClick={handleGoogleLogout} className="text-red-500 hover:text-red-600 font-black underline cursor-pointer text-[10px] border-0 bg-transparent">Putus Koneksi</button>
              </div>
            ) : (
              <div className="space-y-1.5 w-full">
                <button 
                  onClick={handleGoogleLogin} 
                  disabled={isConnectingGoogle}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-50/70 hover:bg-rose-50 border border-indigo-100 text-indigo-700 text-[11px] py-2 px-3 rounded-xl cursor-pointer font-bold transition-all border-0 shadow-xs"
                >
                  <Sparkle className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
                  <span className="font-display">Hubungkan Docs</span>
                </button>
                {isInIframe && (
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans text-center bg-slate-50 border border-slate-100 p-2 rounded-lg">
                    🔒 Mengalami kendala login? Silakan klik tombol <strong className="text-indigo-600 font-extrabold hover:underline">Buka di Tab Baru ↗️</strong> di pojok kanan atas preview untuk melewati pemblokiran iframe oleh browser.
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-white/90 backdrop-blur-md px-5 py-3.5 flex items-center justify-between sticky top-0 z-30 border-0 border-b border-solid border-slate-200/40 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-650 font-bold border border-indigo-100/50 shadow-xs">
            <Compass className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-bold font-display tracking-tight text-slate-800">PintarAI</span>
        </div>
        <div className="flex items-center gap-2 bg-[#FFF0F3] border border-pink-100 px-3 py-1 rounded-full">
          <Trophy className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-xs font-bold font-display text-rose-600">
            {explorations.length * 15 + assignments.length * 20 + (essayQuestion?.userAnswer ? 10 : 0)} XP
          </span>
        </div>
      </header>

      {/* MOBILE FLOATING NAV BAR */}
      <nav className={`md:hidden fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-around z-30 h-16 border border-solid border-slate-100/40 shadow-slate-100/50 px-2 py-1 transition-all duration-350 ${selectedExploration ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        {[
          { id: 'explore', label: 'Eksplor', icon: Compass },
          { id: 'assignment', label: 'Koreksi', icon: CheckSquare },
          { id: 'essay', label: 'Esai', icon: BookOpen },
          { id: 'weekly', label: 'Rapor', icon: Calendar },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSelectedExploration(null); }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer border-0 bg-transparent ${
                isActive ? 'text-indigo-650 scale-105 animate-pulse' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <TabIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-0.5 font-display">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MAIN VIEWPORT */}
      <main className={`flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 relative flex flex-col ${selectedExploration ? 'overflow-hidden h-full min-h-0 pb-3 md:pb-6 lg:pb-8' : 'overflow-y-auto pb-24 md:pb-10'}`}>
        
        {/* DESKTOP HEADER */}
        {!selectedExploration && (
          <div className="hidden md:flex justify-between items-center mb-6 shrink-0">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display leading-tight">
                {googleUser ? `Selamat Pagi, ${googleUser.displayName?.split(' ')[0]} 👋` : "Selamat Pagi, Siswa ☀️"}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">Aktivitas dan statistik belajarmu meningkat minggu ini.</p>
            </div>
            
            {/* Navigation is unified on the left side menu for a cleaner layout */}
            <div />

            {/* RIGHT PROFILE AND NOTIFICATION PILLS */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => alert("Gunakan kotak eksplorasi di bawah untuk mengunggah materi ilmiah barumu.")}
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                title="Petunjuk Belajar"
              >
                <HelpCircle className="w-4 h-4 text-slate-450" />
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 transition-all relative cursor-pointer shadow-xs hover:shadow-sm"
                title="Notifikasi Masuk"
              >
                <svg xmlns="http://www.w3.org/2050/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.003 6.003 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-2.5 right-2 tracking-wide w-2 h-2 bg-rose-500 rounded-full border border-white" />
              </button>

              {/* User Profil picture custom render */}
              {googleUser ? (
                <img 
                  src={googleUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250'} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm shrink-0" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FB7185] to-[#818CF8] p-0.5 shadow-sm">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-black text-slate-800 font-display">
                    ST
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedExploration ? `_chat_${selectedExploration.id}` : '_main')}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className={`w-full flex-1 flex flex-col ${selectedExploration ? 'min-h-0 h-full overflow-hidden' : ''}`}
          >

            {/* TAB 1: EXPLORATIONS */}
            {activeTab === 'explore' && (
              <div className={`flex-1 flex flex-col ${selectedExploration ? 'h-full min-h-0 overflow-hidden space-y-0' : 'space-y-6'}`}>
                
                {/* Check if exploration is selected */}
                {selectedExploration ? (
                  /* SPLIT SCREEN CHAT LAYOUT ON DESKTOP - STRETCHES FULL HEIGHT OF VIEWPORT */
                  <div className="flex flex-col lg:flex-row gap-6 flex-1 h-full min-h-0 overflow-hidden">
                    {/* Detail Column (left) */}
                    <div className="hidden lg:block lg:w-80 shrink-0 font-sans space-y-4 lg:overflow-y-auto lg:max-h-full pr-1">
                      <button 
                        onClick={() => setSelectedExploration(null)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 p-2.5 px-4 rounded-xl transition-all w-full justify-center border-0 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" /> Kembali ke Galeri
                      </button>

                      <div className="bg-white rounded-2xl border border-solid border-slate-100/35 p-4 space-y-4 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300">
                        <div className="aspect-video w-full rounded-xl overflow-hidden shadow-xs border border-solid border-slate-100/80">
                          <img src={selectedExploration.photoData} alt="Penemuan" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold font-mono uppercase tracking-wider">Laporan Percobaan</span>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{selectedExploration.description}</h4>
                          <span className="text-[10px] text-slate-400 font-mono block">Dibuat pada {new Date(selectedExploration.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>

                        {/* Export block */}
                        <div className="border-t border-solid border-slate-100/60 pt-3.5 space-y-2">
                          <button
                            onClick={() => handleCopyExplorationText(selectedExploration)}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 transition-all font-sans"
                          >
                            {copiedId === selectedExploration.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Sesi Percakapan Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Salin Laporan Percakapan</span>
                              </>
                            )}
                          </button>

                          {googleToken ? (
                            <div className="space-y-2">
                              <button
                                onClick={() => handleExportExploration(selectedExploration)}
                                disabled={exportingId === selectedExploration.id}
                                className="w-full bg-emerald-50 hover:bg-emerald-100 border border-solid border-emerald-100 text-emerald-700 text-[11px] font-bold py-2 p-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span>{exportingId === selectedExploration.id ? 'Mengunduh...' : 'Simpan Percakapan ke Docs'}</span>
                              </button>
                              
                              {exportSuccessMessage?.id === selectedExploration.id && (
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-950 border border-solid border-emerald-100 text-[10px] text-center">
                                  <p className="font-bold">✓ Tersimpan di Cloud!</p>
                                  <a href={exportSuccessMessage.url} target="_blank" rel="noopener noreferrer" className="underline text-[#4F46E5] font-black block mt-1">Buka Google Docs</a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-slate-50 border border-solid border-slate-100/50 rounded-xl p-2.5 text-center text-[9px] text-slate-400">
                              Koneksikan Docs di sidebar kiri untuk sinkronisasi ke awan Google Docs.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chat Box (right) */}
                    <div className="flex-1 bg-white border border-solid border-slate-100/30 rounded-2xl shadow-sm shadow-slate-100/30 flex flex-col h-full overflow-hidden min-h-0">
                      {/* Chat Header */}
                      <div className="bg-slate-50/55 border-b border-solid border-slate-100 py-3 px-4.5 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedExploration(null)}
                            className="lg:hidden p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-750 rounded-xl transition-all border-0 mr-1 flex items-center justify-center cursor-pointer bg-slate-200/40"
                            title="Kembali ke Galeri"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-widest font-sans">Sesi Bimbingan Sains Bersama Kakak AI</span>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 py-0.5 px-2.5 rounded-full font-bold">Respon Aktif</span>
                      </div>

                      {/* Chat Messages Log */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                        {selectedExploration.chatHistory.map((chat, idx) => {
                          const isUser = chat.sender === 'user';
                          return (
                            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs shadow-sm ${
                                isUser ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-solid border-slate-100/50 rounded-bl-none'
                              }`}>
                                <div className="text-[9px] font-bold text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wider">
                                  {isUser ? 'Siswa' : 'Kakak AI • Tutor'}
                                </div>
                                {renderMessageWithCitations(chat.message, chat.journals)}

                                {/* Render User Attachment if present in this message bubble */}
                                {chat.attachment && (
                                  <div className={`mt-2.5 p-2 rounded-xl flex items-center gap-3 max-w-full ${isUser ? 'bg-indigo-950/40 text-indigo-100' : 'bg-slate-55 text-slate-700 border border-solid border-slate-100/30 shadow-xs'}`}>
                                    {chat.attachment.type.startsWith('image/') ? (
                                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                                        <img src={chat.attachment.data} alt={chat.attachment.filename} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      </div>
                                    ) : (
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        <FileText className="w-4 h-4" />
                                      </div>
                                    )}
                                    <div className="overflow-hidden">
                                      <p className="text-[10px] font-bold truncate leading-tight">{chat.attachment.filename}</p>
                                      <p className="text-[8px] opacity-70 uppercase tracking-widest font-mono">Lampiran • {Math.round(chat.attachment.data.length / 1024)} KB</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Scientific Illustrations Thread */}
                                {chat.illustrations && chat.illustrations.length > 0 && (
                                  <div className="mt-4 space-y-3 pt-3 border-t border-solid border-slate-100/85">
                                    <span className="text-[10px] font-extrabold text-indigo-600 flex items-center gap-1.5 uppercase tracking-wider">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-300 animate-pulse" /> Visualisasi Konsep Sains
                                    </span>
                                    <div className="grid grid-cols-1 gap-3">
                                      {chat.illustrations.map((ill, iIdx) => (
                                        <div key={iIdx} className="bg-slate-50 border border-solid border-slate-100/35 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-shadow">
                                          {ill.svgCode ? (
                                            <div 
                                              className="p-4 bg-white flex items-center justify-center border-b border-solid border-slate-100 relative overflow-hidden text-slate-800"
                                              dangerouslySetInnerHTML={{ __html: ill.svgCode }}
                                            />
                                          ) : ill.imageUrl ? (
                                            <div className="bg-white border-b border-solid border-slate-100 flex items-center justify-center p-2">
                                              <img 
                                                src={ill.imageUrl} 
                                                alt={ill.title} 
                                                className="max-h-48 object-contain rounded-lg"
                                                referrerPolicy="no-referrer"
                                              />
                                            </div>
                                          ) : null}
                                          <div className="p-2.5 px-3 bg-slate-50/50">
                                            <h4 className="font-bold text-slate-900 text-[11px] leading-tight flex items-center gap-1">
                                              🔍 {ill.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 mt-1 leading-snug">{ill.caption}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Source Journal References */}
                                {chat.journals && chat.journals.length > 0 && (
                                  <div className="mt-4 space-y-2.5 pt-3 border-t border-solid border-slate-100/85">
                                    <span className="text-[10px] font-extrabold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
                                      <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Jurnal & Sumber Referensi
                                    </span>
                                    <div className="space-y-2">
                                      {chat.journals.map((ref, rIdx) => (
                                        <div key={rIdx} className="bg-slate-50 border border-solid border-slate-100/60 p-3 rounded-xl transition-all">
                                          <div className="flex justify-between items-start gap-2">
                                            <div>
                                              <h5 className="font-bold text-slate-800 text-[11px] leading-tight">
                                                {ref.title}
                                              </h5>
                                              <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                                                👤 {ref.author} ({ref.year}) • <span className="italic">{ref.journalName}</span>
                                              </p>
                                            </div>
                                          </div>
                                          {ref.snippet && (
                                            <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed bg-white/80 p-2 rounded-lg border border-solid border-slate-100 italic">
                                              "{ref.snippet}"
                                            </p>
                                          )}
                                          <div className="mt-2 text-right">
                                            <a 
                                              href={ref.url.startsWith('http') ? ref.url : `https://scholar.google.com/scholar?q=${encodeURIComponent(ref.title)}`}
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/85 py-1.5 px-3 rounded-lg transition-all border-0 decoration-none cursor-pointer"
                                            >
                                              Buka Sumber Jurnal ↗
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <span className="text-[9px] block text-right mt-1.5 opacity-60 font-mono">
                                  {new Date(chat.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Attachment Preview Banner if selected */}
                      {chatAttachment && (
                        <div className="px-3.5 py-2.5 bg-indigo-50/70 border-t border-solid border-slate-100 flex items-center justify-between gap-2 shrink-0 animate-fade-in">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {chatAttachment.type.startsWith('image/') ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 border border-solid border-slate-100">
                                <img src={chatAttachment.data} alt={chatAttachment.filename} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-indigo-100 border border-solid border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-extrabold text-indigo-950 truncate leading-snug">{chatAttachment.filename}</p>
                              <p className="text-[8.5px] text-indigo-600 font-bold">Siap dikirimkan bersama respon sains lanjutan Anda</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setChatAttachment(null)}
                            className="p-1 px-1.5 bg-indigo-100/50 hover:bg-indigo-100 rounded-full text-indigo-600 hover:text-indigo-800 transition-colors border-0 shrink-0 cursor-pointer"
                            title="Batalkan Lampiran"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Prompt Form with Document and Image Upload trigger */}
                      <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-solid border-slate-100 flex items-center gap-2 shrink-0">
                        <input 
                          type="file" 
                          ref={chatDocRef}
                          onChange={(e) => handleChatAttachmentChange(e, 'doc')}
                          accept=".pdf,.doc,.docx,.txt"
                          className="hidden"
                        />
                        <input 
                          type="file" 
                          ref={chatImgRef}
                          onChange={(e) => handleChatAttachmentChange(e, 'image')}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => chatDocRef.current?.click()}
                          disabled={submitting}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-colors border-0 cursor-pointer flex items-center justify-center shrink-0"
                          title="Unggah dokumen rujukan (PDF/DOC/TXT)"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => chatImgRef.current?.click()}
                          disabled={submitting}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-colors border-0 cursor-pointer flex items-center justify-center shrink-0"
                          title="Unggah gambar sains pendukung"
                        >
                          <Image className="w-4 h-4" />
                        </button>
                        
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Tanyakan hal sains lanjutan atau unggah berkas rujukan..."
                          className="flex-1 bg-slate-100 text-xs py-2.5 px-4 rounded-xl border border-solid border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-650"
                          disabled={submitting}
                        />
                        <button
                          type="submit"
                          disabled={submitting || !chatInput.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white p-2.5 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center shrink-0"
                        >
                          {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  /* CATALOG GRID LAYOUT - BEAUTIFUL CUSTOM DASHBOARD */
                  <div className="space-y-6 animate-fade-in font-sans">
                    
                    {/* FIRST ROW GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* PERFORMANCE CHART CARD (LEFT - 2 COLS WIDTH) */}
                      <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100/30 p-6 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-bold tracking-tight text-slate-800 font-display">Grafik Performa</h3>
                              <p className="text-[11px] text-slate-400 mt-1 font-sans">Pantau kemajuan eksplorasi sains dan nilai tantangan harian Anda secara utuh.</p>
                            </div>
                            
                            {/* Legend Indicators */}
                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 select-none">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-300" /> Teori</span>
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-300" /> Eksplor</span>
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-300" /> Esai</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-5">
                            {/* Growth rate card in soft pink tint */}
                            <div className="bg-[#FFF0F3]/50 border border-pink-100/20 rounded-2xl p-2.5 px-4 flex items-center gap-3">
                              <span className="text-2xl font-black text-rose-450 font-display">+24%</span>
                              <span className="text-[9.5px] text-rose-400 font-bold leading-tight uppercase tracking-wider font-sans">Peningkatan Belajar<br />Minggu Ini</span>
                            </div>

                             {/* Interval buttons switcher */}
                             <div className="flex bg-slate-50/50 p-1 rounded-xl gap-0.5 border border-slate-100/60 animate-fade-in">
                               {['Minggu', 'Bulan', 'Tahun'].map((interval) => {
                                 const isActive = interval === 'Bulan';
                                 return (
                                   <button 
                                     key={interval}
                                     type="button"
                                     className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all border cursor-pointer ${
                                       isActive 
                                         ? 'bg-white border-slate-100 text-slate-600 shadow-xs' 
                                         : 'bg-transparent border-transparent text-slate-400 font-semibold hover:text-slate-600'
                                     }`}
                                   >
                                     {interval}
                                   </button>
                                 )
                               })}
                             </div>
                          </div>
                        </div>

                        {/* BEAUTIFUL SPLINE CHART SVG */}
                        <div className="w-full h-44 mt-6 relative select-none">
                          <svg viewBox="0 0 700 200" className="w-full h-full overflow-visible">
                            {/* Gradients definitions for spline styling */}
                            <defs>
                              <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F472B6" stopOpacity="0.25"/>
                                <stop offset="100%" stopColor="#F472B6" stopOpacity="0.0"/>
                              </linearGradient>
                              <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25"/>
                                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.0"/>
                              </linearGradient>
                              <linearGradient id="pinkLine" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#FB7185"/>
                                <stop offset="50%" stopColor="#F472B6"/>
                                <stop offset="100%" stopColor="#EC4899"/>
                              </linearGradient>
                              <linearGradient id="indigoLine" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#6366F1"/>
                                <stop offset="50%" stopColor="#818CF8"/>
                                <stop offset="100%" stopColor="#4F46E5"/>
                              </linearGradient>
                            </defs>

                            {/* Gridlines */}
                            <line x1="40" y1="30" x2="660" y2="30" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="40" y1="80" x2="660" y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="40" y1="130" x2="660" y2="130" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="40" y1="170" x2="660" y2="170" stroke="#E2E8F0" strokeWidth="1.5" />

                            {/* Shading Area Pink */}
                            <path d="M 40 170 C 120 120, 180 145, 240 75 C 300 -5, 380 95, 460 55 C 540 15, 600 85, 660 65 L 660 170 Z" fill="url(#pinkGrad)" />
                            {/* Shading Area Indigo */}
                            <path d="M 40 170 C 110 155, 190 65, 260 105 C 320 145, 400 35, 480 85 C 550 135, 610 55, 660 35 L 660 170 Z" fill="url(#indigoGrad)" />

                            {/* Spline Line Pink */}
                            <path 
                              d="M 40 170 C 120 120, 180 145, 240 75 C 300 -5, 380 95, 460 55 C 540 15, 600 85, 660 65" 
                              fill="none" 
                              stroke="url(#pinkLine)" 
                              strokeWidth="3.5" 
                              strokeLinecap="round"
                            />
                            {/* Spline Line Indigo */}
                            <path 
                              d="M 40 170 C 110 155, 190 65, 260 105 C 320 145, 400 35, 480 85 C 550 135, 610 55, 660 35" 
                              fill="none" 
                              stroke="url(#indigoLine)" 
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />

                            {/* Key Data Points */}
                            <circle cx="240" cy="75" r="5.5" fill="#FB7185" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-md" />
                            <circle cx="260" cy="105" r="5.5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-md" />
                            <circle cx="460" cy="55" r="5.5" fill="#EC4899" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-md" />
                            <circle cx="480" cy="85" r="5.5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-md" />

                            {/* X Axis monthly Tick labels */}
                            <text x="40" y="192" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Jan</text>
                            <text x="130" y="192" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Feb</text>
                            <text x="220" y="192" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Mar</text>
                            <text x="310" y="192" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Apr</text>
                            <text x="400" y="192" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Mei</text>
                            <text x="490" y="192" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Jun</text>
                            <text x="580" y="192" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Jul</text>
                            <text x="660" y="192" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Ags</text>
                          </svg>
                        </div>
                      </div>

                      {/* SELECT A COURSE / RECOMMENDATIONS COLUMN (RIGHT - 1 COL WIDTH) */}
                      <div className="bg-white rounded-[2rem] border border-slate-100/30 p-6 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-bold tracking-tight text-slate-800 font-display">Tugas Pintar</h3>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-full font-mono border border-indigo-100/20">Shortcut</span>
                          </div>

                          <div className="space-y-3.5">
                            
                            {/* Card 1: Botani */}
                            <div 
                              onClick={() => {
                                setExploreDesc("Saya mengamati struktur tulang daun sirsak di kebun samping rumah.");
                                setExplorePhoto(DEMO_EXPLORATIONS[0].image);
                                setShowNewExploreModal(true);
                              }}
                              className="bg-gradient-to-r from-pink-50/50 to-pink-100/30 hover:from-pink-100/50 hover:to-pink-100/70 border border-pink-100/20 rounded-2xl p-4 flex items-center justify-between transition-all duration-200 cursor-pointer group shadow-xs"
                            >
                              <div className="space-y-1">
                                <span className="text-[8px] bg-pink-100/60 text-pink-650 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Sains Botani</span>
                                <h4 className="text-xs font-bold text-slate-700 font-display group-hover:text-pink-900">Struktur Tulang Daun</h4>
                                <p className="text-[10px] text-slate-400 leading-none">Amati susunan klorofil & fotosintesis</p>
                              </div>
                              <div className="bg-white/90 border border-solid border-slate-100 text-slate-500 rounded-full px-3 py-1.5 text-[9.5px] font-bold group-hover:bg-pink-50 group-hover:text-pink-700 transition-all shadow-xs shrink-0">
                                Mulai →
                              </div>
                            </div>

                            {/* Card 2: Zoologi */}
                            <div 
                              onClick={() => {
                                setExploreDesc("Melihat gerombolan koloni semut merah menggotong butiran gula di sela semen trotoar.");
                                setExplorePhoto(DEMO_EXPLORATIONS[1].image);
                                setShowNewExploreModal(true);
                              }}
                              className="bg-gradient-to-r from-indigo-50/50 to-indigo-100/30 hover:from-indigo-100/50 hover:to-indigo-100/70 border border-indigo-100/20 rounded-2xl p-4 flex items-center justify-between transition-all duration-200 cursor-pointer group shadow-xs"
                            >
                              <div className="space-y-1">
                                <span className="text-[8px] bg-indigo-100/60 text-indigo-650 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Sains Hewan</span>
                                <h4 className="text-xs font-bold text-slate-700 font-display group-hover:text-indigo-900">Perilaku Semut Merah</h4>
                                <p className="text-[10px] text-slate-400 leading-none">Sistem sosial & gotong royong koloni</p>
                              </div>
                              <div className="bg-white/90 border border-solid border-slate-100 text-slate-500 rounded-full px-3 py-1.5 text-[9.5px] font-bold group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-all shadow-xs shrink-0">
                                Mulai →
                              </div>
                            </div>

                            {/* Card 3: Fisika */}
                            <div 
                              onClick={() => {
                                setExploreDesc("Pantulan elastis bola tenis lapangan di lantai garasi yang mengalami perlambatan.");
                                setExplorePhoto(""); // Let user know they can start empty
                                setShowNewExploreModal(true);
                              }}
                              className="bg-gradient-to-r from-amber-50/50 to-amber-100/30 hover:from-amber-100/50 hover:to-amber-100/70 border border-amber-100/20 rounded-2xl p-4 flex items-center justify-between transition-all duration-200 cursor-pointer group shadow-xs"
                            >
                              <div className="space-y-1">
                                <span className="text-[8px] bg-amber-100/60 text-amber-650 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Fisika Dinamis</span>
                                <h4 className="text-xs font-bold text-slate-700 font-display group-hover:text-amber-900">Gaya Pantul Gravitasi</h4>
                                <p className="text-[10px] text-slate-400 leading-none">Hitung percepatan gravitasi bumi</p>
                              </div>
                              <div className="bg-white/90 border border-solid border-slate-100 text-slate-500 rounded-full px-3 py-1.5 text-[9.5px] font-bold group-hover:bg-amber-50 group-hover:text-amber-700 transition-all shadow-xs shrink-0">
                                Mulai →
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>

                    </div>

                    {/* SECOND ROW GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* STUDENT PROGRESS (LEFT) */}
                      <div className="bg-white rounded-[2rem] border border-slate-100/30 p-6 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="text-lg font-bold text-slate-800 font-display">Kompetensi Belajar Anda</h3>
                          <span className="text-[10px] text-slate-400 font-mono">Mei 2026</span>
                        </div>

                        <div className="space-y-4 pt-1">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-baseline text-xs font-bold text-slate-600">
                              <span>Eksplorasi Lingkungan Aktif</span>
                              <span className="text-indigo-600 font-black">{(explorations.length + 2) * 10}%</span>
                            </div>
                            {/* Rounded Indigo Track with inner pill */}
                            <div className="w-full bg-[#EFF2FE] h-5 rounded-full p-0.5 flex">
                              <div 
                                className="bg-indigo-400 rounded-full h-full transition-all duration-500 shadow-sm"
                                style={{ width: `${Math.min(((explorations.length + 2) * 10), 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-baseline text-xs font-bold text-slate-600">
                              <span>Koreksi Akurasi Lembar Tugas</span>
                              <span className="text-rose-500 font-black">{(assignments.length + 1) * 30}%</span>
                            </div>
                            {/* Rounded Pink Track with inner pill */}
                            <div className="w-full bg-[#FFF0F3] h-5 rounded-full p-0.5 flex">
                              <div 
                                className="bg-pink-300 rounded-full h-full transition-all duration-500 shadow-sm"
                                style={{ width: `${Math.min(((assignments.length + 1) * 30), 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* FRIENDS SCORE (RIGHT) */}
                      <div className="bg-white rounded-[2rem] border border-slate-100/30 p-6 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="text-lg font-bold text-slate-800 font-display">Papan Skor Siswa</h3>
                          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wide">Puncak Kelas</span>
                        </div>

                        <div className="space-y-3 pt-1">
                          {[
                            { name: "Sophia Bennett", score: "89%", color: "bg-indigo-300", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150" },
                            { name: "Muhammad Evan", score: "74%", color: "bg-emerald-300", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150" },
                            { name: "Clara Anderson", score: "92%", color: "bg-pink-300", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150" }
                          ].map((friend, fId) => (
                            <div key={friend.name} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 font-display w-3 text-center">{fId + 1}</span>
                                <img src={friend.img} alt={friend.name} className="w-7 h-7 rounded-full object-cover border border-slate-100 shadow-xs" referrerPolicy="no-referrer" />
                                <span className="text-xs font-bold text-slate-700 font-sans truncate max-w-[120px]">{friend.name}</span>
                              </div>
                              <div className="flex-1 max-w-[110px] bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                <div className={`${friend.color} h-full rounded-full`} style={{ width: friend.score }} />
                              </div>
                              <span className="text-xs font-bold text-slate-700 font-display w-9 text-right">{friend.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* EXPLORATION GALLERY HEADER & LIST */}
                    <div className="bg-white rounded-[2rem] border border-slate-100/30 p-6 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-solid border-slate-100 pb-5 mb-5">
                        <div>
                          <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                            <Compass className="text-indigo-600 w-5 h-5 animate-spin" /> Riwayat Eksplorasi Sains Anda
                          </h3>
                          <p className="text-[11px] text-slate-400">Daftar fenomena alam, ekosistem harian, dan kearifan botani yang berhasil Anda rekam bersama Guru AI.</p>
                        </div>
                        <button
                          onClick={() => {
                            setExploreDesc("");
                            setExplorePhoto("");
                            setShowNewExploreModal(true);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100/80 border border-solid border-indigo-150/40 text-indigo-700 gap-2 text-xs font-semibold py-2.5 px-4 rounded-full flex items-center justify-center shadow-xs active:scale-97 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Eksplorasi Baru
                        </button>
                      </div>

                      {explorations.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 space-y-4 max-w-sm mx-auto">
                          <Camera className="w-10 h-10 mx-auto text-slate-300 opacity-60 animate-bounce" />
                          <h4 className="text-xs font-bold text-slate-700">Belum ada unggahan eksplorasi</h4>
                          <p className="text-[11px] text-slate-450 leading-normal">Ketik tantangan rujukan di atas atau unggah foto fenomena alam nyata Anda untuk analisis ilmiah.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                          {explorations.map((exp) => (
                            <div
                              key={exp.id}
                              onClick={() => setSelectedExploration(exp)}
                              className="bg-slate-50/40 hover:bg-white rounded-2xl border border-slate-100/30 shadow-xs hover:shadow-sm cursor-pointer overflow-hidden group transition-all duration-250 flex flex-col justify-between"
                            >
                              <div>
                                <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                                  <img src={exp.photoData} alt={exp.description} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" referrerPolicy="no-referrer" />
                                  <span className="absolute top-2 left-2 text-[8px] bg-slate-950/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-full font-mono font-bold tracking-wider">
                                    {new Date(exp.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <div className="p-4 space-y-1">
                                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight font-sans">{exp.description}</h4>
                                  <span className="text-[9px] text-indigo-650 bg-indigo-50/50 px-1.5 py-0.5 rounded-md font-extrabold inline-block">Bimbingan Aktif</span>
                                </div>
                              </div>
                              <div className="p-4 pt-0 border-0 flex justify-between items-center text-[10px] font-bold text-slate-450 group-hover:text-slate-850">
                                <span className="flex items-center gap-1.5"><Smile className="w-3.5 h-3.5 text-indigo-505" /> Dialog Sains ({exp.chatHistory.length - 1})</span>
                                <ChevronRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ASSIGNMENT CORRECTION */}
            {activeTab === 'assignment' && (
              <div className="space-y-6">
                <div className="border-b border-solid border-slate-200 pb-5">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <CheckSquare className="text-indigo-600 w-7 h-7" /> Pemeriksaan Tugas Otomatis
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Unggah lembar jawaban tugas sains atau matematika Anda untuk dianalisis dan dikoreksi oleh AI seketika.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                  {/* Left widget menu */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100/30 p-5 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300 space-y-5">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-sans">Koleksi Penyerahan Berkas</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Menerima format lembar foto coretan tugas Anda.</p>
                      </div>

                      {/* File submit helper */}
                      <button
                        onClick={() => setShowNewAssignmentModal(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-600/10 active:scale-95 transition-all cursor-pointer border-0"
                      >
                        <Plus className="w-4 h-4" /> Unggah Lembaran Berkas
                      </button>

                      {/* Demo Presets fast track */}
                      <div className="border-t border-solid border-slate-100 pt-4.5 space-y-2.5">
                        <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 font-mono">
                          <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-250 animate-pulse" /> Coba Cepat Shortcut
                        </span>
                        <div className="flex flex-col gap-1.5 animate-fade-in animate-duration-300">
                          {DEMO_ASSIGNMENTS.map((preset, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                applyPresetAssignment(preset);
                                setShowNewAssignmentModal(true);
                              }}
                              className="bg-slate-50/50 hover:bg-indigo-50/30 text-left py-2 px-3 text-xs font-bold rounded-xl border border-slate-100 text-slate-650 flex justify-between items-center transition-all cursor-pointer"
                            >
                              <span className="truncate pr-2">{preset.name}</span>
                              <span className="text-[8px] bg-indigo-500 text-white py-0.5 px-2 rounded-md shrink-0 font-sans">Tes</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* History feed column */}
                  <div className="lg:col-span-3 space-y-6">
                    {assignments.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400 space-y-4 shadow-sm">
                        <UploadCloud className="w-12 h-12 mx-auto text-slate-300 opacity-45 animate-pulse" />
                        <h3 className="text-sm font-bold text-slate-755">Belum Ada Koreksi Tugas Dilaporkan</h3>
                        <p className="text-xs text-slate-500">Silakan unggah foto tugas sains, esai biologi, atau matematika dengan menekan tombol menu di panel kiri untuk dilakukan grading instan.</p>
                      </div>
                    ) : (
                      assignments.map((asg) => (
                        <div key={asg.id} className="bg-white rounded-2xl border border-slate-100/30 shadow-sm shadow-slate-100/40 hover:shadow-md overflow-hidden flex flex-col transition-all duration-300">
                          <div className="bg-slate-50/50 px-4.5 py-3 border-b border-solid border-slate-100/70 flex justify-between items-center text-xs text-slate-500 font-semibold font-sans">
                            <span className="flex items-center gap-1.5 text-slate-700 font-bold max-w-[70%] truncate">
                              <FileText className="w-3.5 h-3.5 text-indigo-500" /> {asg.filename}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-medium font-sans">
                              Selesai Penilaian • {new Date(asg.uploadedAt).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          
                          <div className="p-5 space-y-4">
                            <div className="flex items-start justify-between gap-4.5">
                              <div className="bg-slate-50 rounded-xl overflow-hidden w-14 h-14 border border-solid border-slate-100 shrink-0">
                                {asg.fileData?.startsWith('data:image') || asg.fileData?.startsWith('data:application/pdf') ? (
                                  <img src={asg.fileData} alt="koreksi" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full bg-[#1E293B] text-indigo-300 font-black text-[10px] flex items-center justify-center font-sans">IMAGE</div>
                                )}
                              </div>
                              <div className="flex-1 space-y-0.5">
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider">AI Verifikasi Sempurna</span>
                                <p className="text-xs text-slate-505">Grading dilakukan secara objektif oleh AI Student Grader.</p>
                              </div>
                              
                              {/* Score Card bubble */}
                              <div className="flex flex-col items-center justify-center border border-indigo-100/40 rounded-xl w-14 h-14 bg-indigo-50/20 shadow-xs shrink-0">
                                <span className="text-xl font-black text-indigo-700 leading-none">{asg.score}</span>
                                <span className="text-[8px] text-indigo-505 uppercase font-extrabold tracking-widest mt-0.5 font-sans">SKOR</span>
                              </div>
                            </div>

                            {/* Review Box */}
                            <div className="bg-slate-50/40 p-4 rounded-xl border border-solid border-slate-100/70">
                              <MarkdownRenderer content={asg.review || ''} />
                            </div>

                            {/* Print to Google docs backup button */}
                            <div className="border-t border-solid border-slate-100 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
                              <button
                                onClick={() => handleCopyAssignmentText(asg)}
                                className="bg-slate-100 hover:bg-slate-200 border border-solid border-slate-200 text-slate-700 text-[10.5px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 font-bold cursor-pointer transition-all hover:scale-102 font-sans active:scale-98"
                              >
                                {copiedId === asg.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Evaluasi Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Salin Hasil Evaluasi</span>
                                  </>
                                )}
                              </button>

                              {googleToken ? (
                                <div className="flex flex-col items-end shrink-0">
                                  <button
                                    onClick={() => handleExportAssignment(asg)}
                                    disabled={exportingId === asg.id}
                                    className="bg-indigo-50 hover:bg-indigo-100 border border-solid border-indigo-100/50 text-indigo-750 text-[10.5px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 font-extrabold cursor-pointer transition-all disabled:opacity-50 shadow-xs"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{exportingId === asg.id ? 'Mengunggah ke Cloud Docs...' : 'Ekspor Evaluasi ke Google Docs'}</span>
                                  </button>
                                  {exportSuccessMessage?.id === asg.id && (
                                    <div className="mt-1.5 text-right text-[9.5px] text-emerald-700 font-bold bg-emerald-50 py-1 px-2.5 rounded-lg border border-solid border-emerald-100 font-sans">
                                      ✓ Berhasil! <a href={exportSuccessMessage.url} target="_blank" rel="noopener noreferrer" className="underline font-black ml-1 text-indigo-600">Buka di Tab Baru</a>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-[9.5px] text-slate-400 font-medium text-center sm:text-right">Koneksikan Google Docs di sidebar kiri untuk mencadangkan.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DAILY ESSAY CHALLENGE */}
            {activeTab === 'essay' && (
              <div className="space-y-6">
                <div className="border-b border-solid border-slate-100/70 pb-5">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                    <BookOpen className="text-indigo-600 w-7 h-7" /> Satu Hari Satu Soal (Tantangan Esai)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Latih pola pikir dan tulisan esai kritis Anda mengenai topik sains, fisika, atau sastra terkini.</p>
                </div>

                {loading ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-100 shadow-sm max-w-lg mx-auto space-y-4">
                    <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-750">Memuat Soal Tantangan Hari Ini...</p>
                  </div>
                ) : essayQuestion ? (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    
                    {/* Workstation (left) */}
                    <div className="lg:col-span-3 space-y-6">
                      <div className="bg-white rounded-2xl border border-slate-100/30 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-[#EFF2FE] to-indigo-50/55 p-5 text-slate-800 flex justify-between items-center border-b border-solid border-slate-100">
                          <div>
                            <span className="text-[9.5px] bg-indigo-150/70 text-indigo-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                              Subjek: {essayQuestion.subject}
                            </span>
                            <span className="text-[10px] text-slate-450 block mt-1.5 font-medium leading-none font-sans">Rilis Soal: {new Date(essayQuestion.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                          </div>
                        </div>

                        <div className="p-6 space-y-5">
                          {/* Question Section */}
                          <div className="bg-slate-50/40 border border-solid border-slate-100/60 rounded-2xl p-4.5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans mb-1.5 font-mono">Pertanyaan Esai:</h3>
                            <p className="text-slate-800 text-sm font-bold leading-relaxed">{essayQuestion.question}</p>
                          </div>

                          {/* Submission state */}
                          {essayQuestion.userAnswer ? (
                            <div className="border border-solid border-slate-100 bg-slate-50/10 p-5 rounded-2xl space-y-2">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Jawaban Tertulis Saya:</h4>
                              <p className="text-xs text-slate-705 leading-relaxed italic bg-white p-4.5 rounded-xl border border-solid border-slate-100">
                                "{essayQuestion.userAnswer}"
                              </p>
                              <div className="pt-2 text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span>Jawaban tersimpan di pangkalan data secara kokoh.</span>
                              </div>
                            </div>
                          ) : (
                            <form onSubmit={handleSubmitEssay} className="space-y-4">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-505 font-sans">
                                  <label>Ketik Jawaban Esai:</label>
                                  <span>{essayAnswerInput.length}/1000 Karakter</span>
                                </div>
                                <textarea
                                  rows={5}
                                  value={essayAnswerInput}
                                  onChange={(e) => setEssayAnswerInput(e.target.value)}
                                  placeholder="Mulailah mengetik esai Anda (beri argumentasi ilmiah, rincian sebab-akibat yang relevan)..."
                                  className="w-full bg-slate-50 border border-solid border-slate-100/70 text-xs p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-300 leading-relaxed h-44 font-sans shadow-inner"
                                  maxLength={1000}
                                  required
                                  disabled={submitting}
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={submitting || !essayAnswerInput.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 font-bold text-xs py-3 text-white rounded-xl shadow-lg hover:shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border-0"
                              >
                                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                <span>Kirim Jawaban Ke Guru AI</span>
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Diagnostics and Evaluation Score (right) */}
                    <div className="lg:col-span-2 space-y-6">
                      {essayQuestion.userAnswer ? (
                        <div className="bg-white rounded-2xl border border-solid border-slate-100/35 shadow-sm shadow-slate-100/40 hover:shadow-md p-5 space-y-4 relative overflow-hidden transition-all duration-300">
                          {/* Corner score */}
                          <div className="absolute top-0 right-0 h-14 w-14 bg-indigo-600 text-white rounded-bl-2xl flex flex-col items-center justify-center shadow-lg font-black font-sans shrink-0">
                            <span className="text-lg leading-none">{essayQuestion.score}</span>
                            <span className="text-[7.5px] uppercase font-bold tracking-widest leading-none mt-0.5 opacity-80">SKOR</span>
                          </div>

                          <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-indigo-600 flex items-center gap-1 font-sans">
                              <Trophy className="w-4 h-4 text-amber-500 animate-bounce" /> Hasil Evaluasi AI Resmi
                            </h3>
                            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-100/70 font-sans">
                              {essayQuestion.aiFeedback}
                            </div>
                          </div>

                          {/* Docs Export Block */}
                          <div className="pt-2 border-t border-solid border-slate-100 space-y-2">
                            <button
                              onClick={() => handleCopyEssayText(essayQuestion)}
                              className="w-full bg-slate-100 hover:bg-slate-200 border border-solid border-slate-200 text-slate-700 text-[10.5px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 font-bold cursor-pointer transition-all hover:scale-102 font-sans active:scale-98"
                            >
                              {copiedId === essayQuestion.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Esai & Feedback Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Salin Hasil Esai & AI Review</span>
                                </>
                              )}
                            </button>

                            {googleToken ? (
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleExportEssay(essayQuestion)}
                                  disabled={exportingId === essayQuestion.id}
                                  className="w-full bg-indigo-50 hover:bg-indigo-100 border border-solid border-indigo-200 text-indigo-700 font-extrabold text-[10px] py-2 px-3 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                                >
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span>{exportingId === essayQuestion.id ? 'Mengunggah esai...' : 'Simpan Evaluasi Esai ke Docs'}</span>
                                </button>
                                {exportSuccessMessage?.id === essayQuestion.id && (
                                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-950 border border-solid border-emerald-100 text-[10px] text-center font-bold">
                                    ✓ Berhasil disimpan! <a href={exportSuccessMessage.url} target="_blank" rel="noopener noreferrer" className="underline block mt-0.5 text-indigo-650">Buka Google Docs</a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-[9px] text-slate-400 font-medium text-center">Sambungkan Google Docs di sidebar kiri untuk mencadangkan.</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-450">
                          <HelpCircle className="w-9 h-9 mx-auto opacity-40 mb-2 text-slate-450" />
                          <h4 className="text-xs font-bold text-slate-650 font-sans">Menunggu Jawaban Siswa</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Gunakan kemampuan analisis Anda untuk menulis esai di sebelah kiri agar ulasan juri AI beserta skor instan terbuka!</p>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-solid border-slate-150 p-8 text-center space-y-3 max-w-md mx-auto shadow-xs">
                    <HelpCircle className="w-8 h-8 text-amber-500 mx-auto opacity-80" />
                    <h3 className="text-sm font-bold text-slate-700 font-sans">Belum Ada Soal Harian</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">Terjadi kendala saat mengambil soal latihan. Silakan klik tombol di bawah untuk membuat ulang soal harian.</p>
                    <button
                      onClick={fetchTodayQuestion}
                      className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer border-0 active:scale-95"
                    >
                      Coba Muat Ulang Soal
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: WEEKLY REVIEW RATPORT */}
            {activeTab === 'weekly' && (
              <div className="space-y-6">
                <div className="border-b border-solid border-slate-100 pb-5">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                    <Calendar className="text-indigo-600 w-7 h-7" /> Rapor Hasil Belajar Mingguan
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Diterbitkan instan setiap hari Sabtu untuk merangkum dan mengevaluasi seluruh riwayat skor dan eksplorasi belajar mandiri Anda.</p>
                </div>

                {/* Status simulator box */}
                <div className="bg-slate-50/50 rounded-2xl border border-solid border-slate-100 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex gap-2.5">
                    <Award className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="text-xs font-sans">
                      <p className="font-bold text-slate-800 animate-pulse">Informasi Jadwal Rapor</p>
                      <p className="text-slate-500 mt-0.5">Hari ini adalah hari <strong className="font-semibold text-slate-700">{dayName || 'Jumat'}</strong>. Rapor mingguan dirilis otomatis setiap hari sabtu untuk merangkum seluruh kegiatan belajar mandiri Anda.</p>
                    </div>
                  </div>

                  {!isSaturday && (
                    <button
                      onClick={() => setSimulateSaturday(prev => !prev)}
                      className={`text-xs px-3.5 py-1.5 font-bold rounded-xl shadow-xs transition-all cursor-pointer border-0 ${
                        simulateSaturday ? 'bg-indigo-600 text-white' : 'bg-white border border-solid border-slate-100 text-indigo-600 hover:bg-slate-50 hover:shadow-xs'
                      }`}
                    >
                      {simulateSaturday ? 'Simulator: Aktif' : 'Simulator: Atur Sabtu'}
                    </button>
                  )}
                </div>

                {/* Make weekly review CTA */}
                {(isSaturday || simulateSaturday) && (
                  <div className="bg-gradient-to-br from-[#EFF2FE]/85 via-indigo-50/40 to-pink-50/10 p-6 rounded-[2rem] text-slate-800 border border-solid border-indigo-100/30 shadow-sm shadow-indigo-100/10 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="space-y-2 max-w-2xl">
                      <span className="text-[10px] bg-[#FFF0F3] text-rose-600 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                        Rilis Rapor Teridentifikasi
                      </span>
                      <h4 className="text-base font-bold text-slate-950">Kompilasi Rapor AI Baru untuk Sesi Minggu Ini</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        Guru Penguji AI akan melacak total {explorations.length} eksperimen mandiri, {assignments.length} grading tugas, dan jawaban ujian esai harian Anda untuk diringkas sebagai evaluasi akhir rapor.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleGenerateWeeklyReview}
                      disabled={submitting}
                      className="bg-indigo-50 hover:bg-indigo-105 text-indigo-700 border border-solid border-indigo-200 font-bold text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 shrink-0 shadow-xs active:scale-97 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-200" />
                      <span>{submitting ? 'SEDANG MENGANALISIS...' : 'TERBITKAN RAPOR MINGGUAN'}</span>
                    </button>
                  </div>
                )}

                {/* Historic rapports grid */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono font-sans">Riwayat Penerbitan Rapor Mandiri (Arsip)</h4>
                  
                  {weeklyReviews.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-100 p-12 text-center text-slate-400 text-xs shadow-xs">
                      Belum ada riwayat rapor tersimpan. Silakan aktifkan "Simulator Sabtu" untuk menerbitkan rapor perdana Anda!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {weeklyReviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-2xl border border-solid border-slate-100/40 p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-4 flex flex-col justify-between">
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-baseline">
                              <span className="text-[10px] bg-[#EEF2F6]/60 text-slate-600 font-extrabold px-2.5 py-1 rounded-lg border border-slate-100/50">
                                RAPOR BELAJAR • {review.weekRange}
                              </span>
                              <span className="text-indigo-650 text-xs font-black font-mono">Rata-rata: {review.statistics.averageScore}/100</span>
                            </div>
                            
                            {/* Analysis block */}
                            <div className="border-l-2 border-indigo-400 border-solid pl-3 py-1 bg-slate-50/40 p-3 rounded-r-xl text-xs text-slate-700 leading-relaxed font-sans">
                              <MarkdownRenderer content={review.summary} />
                            </div>

                            {/* Achievements jewels */}
                            {review.achievements && review.achievements.length > 0 && (
                              <div className="bg-indigo-50/10 border border-solid border-indigo-100/40 rounded-xl p-3 space-y-2">
                                <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1 font-mono">
                                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> Pencapaian Lencana Belajar
                                </span>
                                <div className="space-y-1">
                                  {review.achievements.map((ach, i) => (
                                    <div key={i} className="text-[11px] text-slate-650 flex items-center gap-1.5 font-sans">
                                      <span>💎</span>
                                      <span>{ach}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Export segment */}
                          <div className="pt-3 border-t border-solid border-slate-100/60 flex flex-col gap-2 shrink-0 font-sans">
                            <button
                              onClick={() => handleCopyWeeklyReviewText(review)}
                              className="w-full bg-slate-100 hover:bg-slate-200 border border-solid border-slate-200 text-slate-700 text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 font-bold cursor-pointer transition-all hover:scale-102"
                            >
                              {copiedId === review.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Rapor Belajar Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Salin Isi Rapor</span>
                                </>
                              )}
                            </button>

                            {googleToken ? (
                              <div className="w-full flex flex-col items-stretch">
                                <button
                                  onClick={() => handleExportWeeklyReview(review)}
                                  disabled={exportingId === review.id}
                                  className="bg-indigo-50 hover:bg-indigo-100 border border-solid border-indigo-105 text-indigo-700 text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 font-bold cursor-pointer disabled:opacity-50 shadow-xs hover:shadow-sm"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{exportingId === review.id ? 'Mengunggah laporan...' : 'Sinkron Rapor ke Google Docs'}</span>
                                </button>
                                {exportSuccessMessage?.id === review.id && (
                                  <div className="mt-2 text-center text-[10px] text-emerald-800 bg-emerald-50/50 p-2 rounded-lg border border-solid border-emerald-100/40 font-sans shadow-xs">
                                    ✓ Rapor Disimpan! <a href={exportSuccessMessage.url} target="_blank" rel="noopener noreferrer" className="underline font-bold text-indigo-600">Buka Docs</a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-[9px] text-slate-450 font-medium font-sans text-center">Sambungkan Google Docs di sidebar kiri untuk sinkronisasi ke awan.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* ====================================================
          NEW EXPLORATION DIALOG / MODAL (FLOATING)
          ==================================================== */}
      <AnimatePresence>
        {showNewExploreModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-solid border-slate-100/30 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-solid border-slate-100/70 bg-slate-50/50 flex items-center justify-between font-sans">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload Eksplorasi Baru</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ajukan foto tanaman, benda atau fenomena alam di sekitarmu.</p>
                </div>
                <button 
                  onClick={() => setShowNewExploreModal(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs font-bold p-1 px-3 bg-white border border-solid border-slate-100/80 hover:shadow-xs rounded-lg cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <form onSubmit={handleCreateExploration} className="p-5 space-y-4 overflow-y-auto font-sans flex-1">
                <div className="space-y-1.5">
                  <span className="text-[9.5px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1 font-mono">
                    <Star className="w-3.5 h-3.5 fill-indigo-200 text-indigo-505" /> Shortcut Trial (Preset Cepat)
                  </span>
                  <div className="flex flex-col gap-1.5 animate-fade-in animate-duration-300">
                    {DEMO_EXPLORATIONS.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applyPresetExploration(preset)}
                        className="bg-slate-55 hover:bg-slate-100 border border-solid border-slate-100/50 text-xs text-left p-2 rounded-xl flex justify-between items-center cursor-pointer transition-all text-slate-700 font-sans"
                      >
                        <span className="font-bold">{preset.name}</span>
                        <span className="text-[8px] bg-indigo-600 text-white font-bold py-0.5 px-2 rounded">Pasang</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-505 font-sans">Unggah Foto Objek:</label>
                  <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center hover:bg-slate-50 relative flex flex-col justify-center items-center h-28 cursor-pointer shadow-sm">
                    {explorePhoto ? (
                      <div className="relative">
                        <img src={explorePhoto} alt="preview" className="max-h-[80px] rounded" referrerPolicy="no-referrer" />
                        <button type="button" onClick={() => setExplorePhoto('')} className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white rounded-full h-4 w-4 text-[8px] flex items-center justify-center font-bold border-0 cursor-pointer">X</button>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-slate-400" />
                        <span className="text-[10px] text-slate-400 mt-1 font-medium font-sans">Silakan seret foto di sini atau pilih preset</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'explore')} className="opacity-0 absolute inset-0 cursor-pointer" />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1 font-sans">
                  <label className="text-xs font-bold text-slate-505 font-sans">Deskripsi / Pertanyaan Anda:</label>
                  <textarea
                    rows={3}
                    value={exploreDesc}
                    onChange={(e) => setExploreDesc(e.target.value)}
                    placeholder="Misal: Saya memotret tulang daun ini, mengapa jaringannya berbentuk garis lurus sejajar?"
                    className="w-full bg-slate-50 border border-solid border-slate-100 text-xs p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-300 font-sans shadow-inner"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !explorePhoto || !exploreDesc.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold py-3.5 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center border-0"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin mr-1 text-white" /> : null}
                  <span>{submitting ? 'Sedang Diproses Kakak AI...' : 'Ajukan & Mulai Obrolan'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================
          NEW ASSIGNMENT DIALOG / MODAL (FLOATING)
          ==================================================== */}
      <AnimatePresence>
        {showNewAssignmentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-solid border-slate-100/30 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-solid border-slate-100/70 bg-slate-50/50 flex items-center justify-between font-sans">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload Tugas Baru</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Uji jawaban tugas sains, esai biologi, matematika.</p>
                </div>
                <button 
                  onClick={() => setShowNewAssignmentModal(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs font-bold p-1 px-3 bg-white border border-solid border-slate-100/80 hover:shadow-xs rounded-lg cursor-pointer font-sans"
                >
                  Tutup
                </button>
              </div>

              <form onSubmit={handleSubmitAssignment} className="p-5 space-y-4 overflow-y-auto font-sans flex-1">
                <div className="space-y-1 font-sans">
                  <label className="text-xs font-bold text-slate-505 font-sans">Pilih Berkas Tugas (Gambar/Foto):</label>
                  <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center hover:bg-slate-50 relative flex flex-col justify-center items-center h-28 cursor-pointer">
                    {assignmentFile ? (
                      <div className="space-y-1 flex flex-col items-center">
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold font-mono">{assignmentFile.filename}</span>
                        <button type="button" onClick={() => setAssignmentFile(null)} className="text-[10px] text-red-600 font-bold underline cursor-pointer border-0 bg-transparent">Ganti Berkas</button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-6 h-6 text-slate-400" />
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">Seret foto tugas Anda di sini</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'assignment')} className="opacity-0 absolute inset-0 cursor-pointer text-xs" />
                      </>
                    )}
                  </div>
                </div>

                {uploadProgress && (
                  <p className="text-center font-bold text-[10.5px] text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-solid border-indigo-100/50 animate-pulse font-sans shadow-xs">{uploadProgress}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !assignmentFile}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold text-xs py-3 rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg flex items-center justify-center gap-1.5 border-0"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : null}
                  <span>{submitting ? 'Sedang Mengevaluasi...' : 'Kirim & Dapatkan Penilaian AI'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
