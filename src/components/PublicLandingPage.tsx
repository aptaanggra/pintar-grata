import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  CheckSquare, 
  BookOpen, 
  Calendar, 
  ShieldCheck, 
  Zap, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Eye, 
  LogIn,
  UserCheck,
  BrainCircuit,
  Search,
  Sparkle
} from 'lucide-react';

interface PublicLandingPageProps {
  onLogin: () => void;
  onEnterGuest: () => void;
  isConnectingGoogle: boolean;
  isInIframe: boolean;
}

export function PublicLandingPage({ 
  onLogin, 
  onEnterGuest, 
  isConnectingGoogle,
  isInIframe 
}: PublicLandingPageProps) {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'grading' | 'exploration' | 'essay' | 'rapport'>('grading');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF1F2]/60 via-[#F1F5F9] to-[#ECF2FE]/60 text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* BACKGROUND DECORATIVE GLOWS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl opacity-70" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900 font-display">SainsPintar</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Platform Akselerasi Belajar & Koreksi Tugas Sains</p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onEnterGuest}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Akses aplikasi langsung sebagai tamu"
            >
              <UserCheck className="w-4 h-4 text-slate-500" />
              <span>Mode Tamu</span>
            </button>

            <button
              onClick={onLogin}
              disabled={isConnectingGoogle}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2 border border-indigo-500 active:scale-95 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isConnectingGoogle ? 'Menghubungkan...' : 'Masuk / Daftar'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold mb-8 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>Asisten AI Pendamping Belajar Sains SD - SMP & Koreksi Tugas Instan</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto font-display">
          Solusi Pintar Menganalisis <span className="text-indigo-600">Foto Tugas Sekolah</span> & Eksplorasi Sains
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans font-normal">
          Bantu siswa memahami pelajaran IPA & Sains lebih cepat. Cukup foto lembar tugas atau objek di sekitar, sistem memberikan ulasan koreksi melangkah, gambar diagram visual, rujukan ilmiah, dan rapor mingguan otomatis.
        </p>

        {/* Call-to-action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={onLogin}
            disabled={isConnectingGoogle}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center justify-center gap-2.5 border border-indigo-500 active:scale-95 disabled:opacity-50"
          >
            <Sparkle className="w-5 h-5 text-amber-300 fill-amber-300 animate-spin" />
            <span>{isConnectingGoogle ? 'Menghubungkan Akun...' : 'Bergabung Sekarang (1-Klik Masuk)'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onEnterGuest}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all border border-slate-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs hover:border-slate-300"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Jelajahi Mode Tamu Gratis</span>
          </button>
        </div>

        {/* Iframe Notice if applicable */}
        {isInIframe && (
          <div className="mt-6 max-w-lg mx-auto p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium leading-relaxed shadow-xs">
            💡 <strong>Saran Akses:</strong> Jika jendela login terhalang oleh sistem keamanan iframe browser, Anda dapat mengeklik tombol <strong>Mode Tamu</strong> di atas untuk mencoba langsung tanpa login.
          </div>
        )}

        {/* Highlight Stats / Badges */}
        <div className="mt-14 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs">
            <span className="text-xl font-black text-indigo-600 font-mono block">100%</span>
            <span className="text-[11px] text-slate-600 font-semibold mt-0.5 block">Bebas Iklan & Aman Anak</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs">
            <span className="text-xl font-black text-purple-600 font-mono block">Instan</span>
            <span className="text-[11px] text-slate-600 font-semibold mt-0.5 block">Koreksi & Review Tugas</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs">
            <span className="text-xl font-black text-rose-600 font-mono block">Visual & Rujukan</span>
            <span className="text-[11px] text-slate-600 font-semibold mt-0.5 block">Diagram & Referensi Ilmiah</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs">
            <span className="text-xl font-black text-emerald-600 font-mono block">Dokumen Awan</span>
            <span className="text-[11px] text-slate-600 font-semibold mt-0.5 block">Sinkronisasi Otomatis</span>
          </div>
        </div>

      </section>

      {/* SYSTEM SHOWCASE SECTION */}
      <section className="relative z-10 py-16 bg-white/60 border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 font-mono">Modul & Kemampuan Fitur Utuh</h2>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              Satu Aplikasi untuk Seluruh Kebutuhan Belajar Sains
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Berikut adalah gambaran sistem dan antarmuka bimbingan yang akan Anda akses.
            </p>
          </div>

          {/* Interactive Showcase Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveFeatureTab('grading')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                activeFeatureTab === 'grading'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>1. Koreksi Lembar Tugas</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('exploration')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                activeFeatureTab === 'exploration'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>2. Eksplorasi Alam & Visual</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('essay')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                activeFeatureTab === 'essay'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>3. Esai Harian AI</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('rapport')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                activeFeatureTab === 'rapport'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>4. Rapor Mingguan Otomatis</span>
            </button>
          </div>

          {/* Tab Content Cards */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 max-w-4xl mx-auto shadow-xl shadow-slate-200/50">
            {activeFeatureTab === 'grading' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-1 rounded-md font-mono font-bold uppercase">
                      Simulasi Modul Koreksi Tugas
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">Ulasan Foto Lembar Soal & Skor Penilaian Instan</h3>
                  </div>
                  <div className="bg-indigo-600 text-white font-black text-sm px-4 py-1.5 rounded-xl shadow-xs font-mono">
                    SKOR: 95 / 100
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" /> Pratinjau Foto Lembar Tugas
                    </span>
                    <div className="bg-white rounded-xl p-4 text-center border border-dashed border-slate-300">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                        📷
                      </div>
                      <p className="text-xs font-bold text-slate-800">Foto_Tugas_Sains_Ekosistem.png</p>
                      <p className="text-[10px] text-slate-500 mt-1">Siswa mengunggah foto tugas rumah mengenai Rantai Makanan & Produsen Utama.</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hasil Analisis Guru AI
                    </span>
                    <div className="space-y-2 text-xs text-slate-700 leading-relaxed font-sans">
                      <p><strong className="text-slate-900">● Analisis Jawaban Nomor 1:</strong> Sangat tepat! Produsen utama pada ekosistem padang rumput adalah rumput yang mengubah energi matahari lewat fotosintesis.</p>
                      <p><strong className="text-slate-900">● Catatan Perbaikan Nomor 3:</strong> Tambahkan penjelasan peran dekomposer (jamur/bakteri) saat konsumen tingkat akhir mati.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'exploration' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200/80 px-2.5 py-1 rounded-md font-mono font-bold uppercase">
                      Simulasi Modul Eksplorasi Alam
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">Eksplorasi Fenomena Alam dengan Visual Diagram & Referensi</h3>
                  </div>
                  <span className="text-xs text-purple-700 font-bold bg-purple-50 px-3 py-1 rounded-xl border border-purple-200/80">
                    Sains Interaktif
                  </span>
                </div>

                <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <h4 className="font-extrabold text-slate-900 text-sm mb-1">Pertanyaan Siswa: "Mengapa Satelit Komunikasi Mengorbit Bumi?"</h4>
                    <p className="text-slate-600">Sistem menganalisis foto dan menjelaskan konsep orbit geostasioner, gelombang pemancar sinyal, dan panel surya sebagai pembangkit energi.</p>
                  </div>

                  <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-indigo-700 font-mono">Dukungan Referensi Ilmiah</span>
                      <p className="font-bold text-slate-900">Rujukan Jurnal Resmi: "Communication Satellite Orbit Principles" [1]</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-lg shrink-0 shadow-xs">
                      [1] Sitasi Sahih
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'essay' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-1 rounded-md font-mono font-bold uppercase">
                      Tantangan Harian Kurikulum
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">Soal Latihan Esai & Umpan Balik Berpikir Kritis</h3>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-400" /> Soal Hari Ini: Fisika & Perubahan Wujud Benda
                  </div>
                  <p className="text-xs text-slate-800 italic bg-white p-3 rounded-xl border border-slate-200/80">
                    "Mengapa air laut terasa asin sedangkan air hujan yang berasal dari penguapan air laut tidak asin?"
                  </p>
                  <p className="text-xs text-slate-600">
                    Siswa dilatih untuk mengetik argumentasi ilmiah, kemudian sistem memberikan umpan balik mendidik beserta skor keberhasilan.
                  </p>
                </div>
              </div>
            )}

            {activeFeatureTab === 'rapport' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-md font-mono font-bold uppercase">
                      Rapor Mingguan Otomatis
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">Rangkuman Rapor Perkembangan Belajar Hari Sabtu</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <span className="text-2xl font-extrabold text-indigo-600 font-mono">12x</span>
                    <span className="text-[11px] text-slate-600 block mt-1">Latihan Esai Selesai</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <span className="text-2xl font-extrabold text-emerald-600 font-mono">92/100</span>
                    <span className="text-[11px] text-slate-600 block mt-1">Rata-Rata Akurasi</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <span className="text-2xl font-extrabold text-purple-600 font-mono">8x</span>
                    <span className="text-[11px] text-slate-600 block mt-1">Penyimpanan Dokumen</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* KEUNTUNGAN & KEMUDAHAN PROSES BERGABUNG */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Process Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 font-mono">Kemudahan Proses Beranggota</h2>
          <p className="text-3xl font-black text-slate-900 font-display">
            Hanya 3 Langkah Mudah untuk Memulai
          </p>
          <p className="text-xs sm:text-sm text-slate-600">
            Proses menjadi anggota sangat cepat tanpa formulir pendaftaran panjang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 relative shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-mono font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/20">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">1-Klik Masuk Akun</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cukup gunakan akun terhubung Anda. Tidak perlu menghafal kata sandi baru atau verifikasi email yang rumit.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 relative shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-mono font-black text-lg flex items-center justify-center shadow-md shadow-purple-600/20">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">Atur Kelas & Pelajaran Favorit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Isi data sekolah dan jenjang kelas siswa (misal: SD Kelas 5) agar gaya penjelasan disesuaikan dengan kurikulum.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 relative shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white font-mono font-black text-lg flex items-center justify-center shadow-md shadow-rose-600/20">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">Mulai Unggah & Simpan Dokumen</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Langsung unggah foto tugas sekolah atau tanyakan konsep sains. Hasil laporan dapat disimpan otomatis ke penyimpanan dokumen digital Anda.
            </p>
          </div>

        </div>

        {/* Benefits Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 font-mono">Keuntungan Keanggotaan Official</h2>
          <p className="text-3xl font-black text-slate-900 font-display">
            Mengapa Memilih SainsPintar?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-3 hover:border-indigo-300 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Analisis AI Presisi & Mendidik</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Memberikan ulasan konstruktif, bukan sekadar jawaban instan, sehingga siswa benar-benar memahami konsep sains.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-3 hover:border-indigo-300 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Privasi Data Selalu Terjamin</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh berkas tugas, catatan, dan profil member disimpan dengan enkripsi aman tanpa diungkap ke pengguna umum.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-3 hover:border-indigo-300 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Integrasi Dokumen Digital</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ekspor laporan eksplorasi dan hasil koreksi tugas langsung ke akun dokumen digital Anda untuk keperluan cetak atau portofolio siswa.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-3 hover:border-indigo-300 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Poin XP & Level Gamifikasi</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mendorong semangat siswa dengan tingkat level dan poin XP setiap kali menyelesaikan tantangan esai & eksplorasi.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-3 hover:border-indigo-300 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Rujukan Jurnal Ilmiah Otomatis</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dilengkapi sitasi referensi ilmiah sahih untuk mendukung keakuratan fakta sains dan tugas riset sekolah.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-3 hover:border-indigo-300 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Rapor Mingguan Otomatis</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dirilis otomatis setiap hari Sabtu sebagai evaluasi berkas bagi orang tua untuk memantau grafik perkembangan anak.
            </p>
          </div>

        </div>

      </section>

      {/* SYSTEM INFORMATION SECTION */}
      <section className="relative z-10 py-16 bg-white/80 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-8 sm:p-10 rounded-3xl text-center space-y-6 shadow-xl text-white">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-display">
              Siap Meningkatan Nilai & Pemahaman Sains Siswa?
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mx-auto leading-relaxed">
              Mulai sekarang secara gratis. Anda dapat mencoba langsung menggunakan Mode Tamu atau masuk dengan akun resmi untuk menyimpan seluruh riwayat belajar.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onLogin}
                disabled={isConnectingGoogle}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 cursor-pointer border border-indigo-400/40"
              >
                {isConnectingGoogle ? 'Menghubungkan...' : 'Masuk Sekarang'}
              </button>
              <button
                onClick={onEnterGuest}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 transition-all border border-white/20 cursor-pointer"
              >
                Coba Mode Tamu Tanpa Login
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 border-t border-slate-200/80 pt-8">
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 uppercase tracking-wider font-mono text-[11px]">Tentang Sistem SainsPintar</h5>
              <p className="leading-relaxed">
                SainsPintar adalah sistem pembelajaran cerdas terintegrasi yang dibangun khusus untuk mendukung sains & IPA jenjang SD hingga SMP. Menggabungkan analisis gambar OCR, visualisasi diagram, dan pencarian referensi ilmiah.
              </p>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 uppercase tracking-wider font-mono text-[11px]">Jaminan Keamanan & Privasi Data</h5>
              <p className="leading-relaxed">
                Kami sangat menghargai privasi siswa dan orang tua. Data berkas tugas, esai, dan profil tidak pernah dipublikasikan tanpa izin. Halaman publik ini disajikan terbatas tanpa pernah mengungkap identitas atau dokumen pribadi anggota.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-8 border-t border-slate-200/80 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800 font-display">SainsPintar</span>
            <span>• Hak Cipta © {new Date().getFullYear()} Hak Cipta Dilindungi.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <button onClick={onEnterGuest} className="hover:text-indigo-600 transition-colors cursor-pointer border-0 bg-transparent">Mode Tamu</button>
            <span>•</span>
            <button onClick={onLogin} className="hover:text-indigo-600 transition-colors cursor-pointer border-0 bg-transparent">Masuk Akun</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
