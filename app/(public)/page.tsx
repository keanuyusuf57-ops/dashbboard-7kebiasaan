'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import HeroSection from '@/components/public/HeroSection'
import {
  Search,
  BarChart3,
  UserCheck,
  Menu,
  X,
  MousePointerClick,
  Sparkles,
} from 'lucide-react'

const GOOGLE_SHEET_API_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL ||
  'https://script.google.com/macros/s/AKfycbyGCDCIQMCbgqy0l3hAjtuZs_Ed9F6xsj09cU9oxxnG72WizU_Q0sOVobnRtvYjGS5T/exec'

const INDICATOR_DETAILS = [
  {
    short: 'Bangun Pagi',
    full: 'Bangun tidur sebelum pukul 05.30 pagi setiap hari sehingga tidak terlambat sekolah.',
  },
  {
    short: 'Ibadah Tepat',
    full: 'Menjalankan ibadah sesuai dengan agama/kepercayaan tepat waktu dan khidmat.',
  },
  {
    short: 'Berdoa Harian',
    full: 'Mengawali dan mengakhiri kegiatan harian (belajar dan makan) dengan berdoa.',
  },
  {
    short: 'Olahraga 3x',
    full: 'Melakukan aktivitas fisik atau olahraga (berlari, senam, bersepeda) minimal 3 kali seminggu.',
  },
  {
    short: 'Ekskul/Sekolah',
    full: 'Berpartisipasi aktif dalam kegiatan olahraga di sekolah atau ekstrakurikuler.',
  },
  {
    short: 'Makan Sehat',
    full: 'Memilih makanan/jajanan sehat yang mengandung buah, sayur, atau protein saat di sekolah dan rumah.',
  },
  {
    short: 'Gemar Membaca',
    full: 'Meluangkan waktu membaca buku (non-pelajaran/literasi) minimal 15–30 menit setiap hari.',
  },
  {
    short: 'Bantu Ortu',
    full: 'Membantu pekerjaan rumah tangga (menyapu, mencuci piring, menjaga adik) tanpa diperintah.',
  },
  {
    short: 'Tidur Cepat',
    full: 'Tidur malam tidak melebihi pukul 21.30/22.00 agar istirahat mencukupi.',
  },
  {
    short: 'Bebas Gadget',
    full: 'Mematikan atau tidak menggunakan gadget/smartphone saat mendekati jam tidur malam.',
  },
]

function Sidebar({ logoUrl }: { logoUrl: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { label: 'Beranda', href: '/' },
    { label: 'Yuk Survey!', href: '/survey' },
    { label: 'Main Game', href: '/game' },
    { label: 'Statistik Pribadi', href: '/statistik' },
    { label: 'Tentang 7 KAIH', href: '/tentang' },
    { label: 'Admin', href: '/admin' },
  ]

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo Nexara"
            className="h-14 w-14 rounded-2xl object-contain p-1 bg-slate-900 border border-slate-200 shrink-0 shadow-sm"
          />
        ) : (
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-sm shrink-0">
            NX
          </div>
        )}
        <div>
          <p className="text-base font-extrabold text-slate-800 leading-tight">NEXARA • 7 KAIH</p>
          <p className="text-xs text-slate-500 mt-0.5">SMAN 5 Semarang</p>
        </div>
      </div>

      <nav className="mt-5 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-40 bg-indigo-600 text-white p-3.5 rounded-full shadow-lg"
        aria-label="Buka Navigasi"
      >
        <Menu size={22} />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden flex">
          <div className="w-72 bg-white h-full p-5 flex flex-col">
            <div className="flex justify-end mb-2">
              <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-500">
                <X size={20} />
              </button>
            </div>
            <NavContent />
          </div>
        </div>
      )}

      <aside className="w-64 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 hidden lg:flex flex-col shrink-0">
        <NavContent />
      </aside>
    </>
  )
}

function InteractiveDonutChart({
  completion,
  overallScore,
}: {
  completion: number
  overallScore: number
}) {
  const [showScoreMode, setShowScoreMode] = useState(false)
  const safeCompletion = Math.min(100, Math.max(0, completion))

  return (
    <div
      onClick={() => setShowScoreMode(!showScoreMode)}
      title="Klik untuk mengganti tampilan Persentase / Skor Rata-Rata"
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all select-none group"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
            Progress Kebiasaan
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MousePointerClick size={12} className="text-indigo-500" />
            Klik grafik untuk ubah mode tampilan
          </p>
        </div>
        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full">
          {showScoreMode ? `${overallScore.toFixed(2)} / 5.0` : `${safeCompletion}%`}
        </span>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="relative h-44 w-44 transition-transform duration-300 group-hover:scale-105">
          <div className="absolute inset-0 rounded-full bg-slate-100" />
          <div
            className="absolute inset-0 rounded-full transition-all duration-700"
            style={{
              background: `conic-gradient(#6366f1 0 ${safeCompletion}%, #e2e8f0 ${safeCompletion}% 100%)`,
            }}
          />
          <div className="absolute inset-4 rounded-full bg-white shadow-inner flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-slate-800">
                {showScoreMode ? overallScore.toFixed(1) : `${safeCompletion}%`}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                {showScoreMode ? 'Skor Skala 5.0' : 'Indeks Tercapai'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="bg-slate-50 p-3 rounded-2xl">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Dimensi</p>
          <p className="font-bold text-slate-800 mt-1">7 Kebiasaan</p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-2xl">
          <p className="text-[10px] uppercase tracking-wide text-indigo-500">Status</p>
          <p className="font-bold text-indigo-700 mt-1">Aktif • SMAN 5</p>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [completion, setCompletion] = useState(0)
  const [overallScore, setOverallScore] = useState(0)
  const [barAverages, setBarAverages] = useState<number[]>(Array(10).fill(0))
  const [selectedBarIdx, setSelectedBarIdx] = useState<number>(0)
  const [loadingChart, setLoadingChart] = useState(true)
  const [nexaraLogoUrl, setNexaraLogoUrl] = useState('')
  const [savedStudentEmail, setSavedStudentEmail] = useState<string | null>(null)

  useEffect(() => {
    const email = localStorage.getItem('kaih_student_email')
    if (email) setSavedStudentEmail(email)
  }, [])

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(GOOGLE_SHEET_API_URL)
        const json = await res.json()
        if (json.status === 'success' && Array.isArray(json.data)) {
          const rows = json.data

          if (rows.length > 0) {
            const sums = Array(10).fill(0)
            const validCounts = Array(10).fill(0)

            rows.forEach((r: any) => {
              if (Array.isArray(r.scores)) {
                r.scores.forEach((rawVal: any, idx: number) => {
                  const val = Number(rawVal)
                  if (!isNaN(val) && val >= 1 && val <= 5) {
                    sums[idx] += val
                    validCounts[idx] += 1
                  }
                })
              }
            })

            const avgs = sums.map((s, idx) =>
              validCounts[idx] > 0 ? Number((s / validCounts[idx]).toFixed(2)) : 0
            )
            setBarAverages(avgs)

            const validAvgs = avgs.filter((a) => a > 0)
            if (validAvgs.length > 0) {
              const totalAvg = validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length
              setOverallScore(totalAvg)
              setCompletion(Math.min(100, Math.round((totalAvg / 5) * 100)))
            }
          }
        }
      } catch (err) {
        console.error('Gagal memuat statistik:', err)
      } finally {
        setLoadingChart(false)
      }
    }
    fetchStats()
  }, [])

  const getPredicate = (score: number) => {
    if (score >= 4.2)
      return { label: 'Sangat Baik (Membudaya)', color: 'bg-emerald-100 text-emerald-700' }
    if (score >= 3.4)
      return { label: 'Baik (Konsisten)', color: 'bg-indigo-100 text-indigo-700' }
    if (score >= 2.5)
      return { label: 'Cukup (Perlu Pembiasaan)', color: 'bg-amber-100 text-amber-700' }
    return { label: 'Perlu Ditingkatkan', color: 'bg-rose-100 text-rose-700' }
  }

  const selectedAvg = barAverages[selectedBarIdx] || 0
  const selectedPct = Math.round((selectedAvg / 5) * 100)
  const selectedPredicate = getPredicate(selectedAvg)

  const habits = [
    {
      title: '1. Bangun Pagi',
      desc: 'Membiasakan diri bangun tepat waktu untuk memulai hari dengan disiplin.',
    },
    {
      title: '2. Beribadah',
      desc: 'Taat menjalankan ibadah sesuai keyakinan masing-masing.',
    },
    {
      title: '3. Berolahraga',
      desc: 'Menjaga kesehatan dan kebugaran jasmani secara teratur.',
    },
    {
      title: '4. Makan Sehat & Bergizi',
      desc: 'Mengonsumsi makanan yang bernutrisi untuk mendukung tumbuh kembang.',
    },
    {
      title: '5. Gemar Membaca',
      desc: 'Mengembangkan minat baca untuk menambah wawasan dan literasi.',
    },
    {
      title: '6. Membantu Orang Tua',
      desc: 'Aktif berinteraksi, peduli lingkungan, dan bergotong royong.',
    },
    {
      title: '7. Istirahat Cukup',
      desc: 'Menjaga pola tidur yang teratur untuk pemulihan energi fisik dan mental.',
    },
  ]

  const filteredHabits = habits.filter(
    (h) =>
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex bg-slate-50 min-h-screen p-4 gap-6 font-sans">
      <Sidebar logoUrl={nexaraLogoUrl} />

      <main className="flex-1 space-y-6 min-w-0">
        <header className="flex flex-wrap justify-between items-center bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl w-full sm:w-72">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kebiasaan atau indikator..."
              className="bg-transparent text-sm focus:outline-none w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold">
              <Sparkles size={14} />
              <span>7 KAIH • SMAN 5 Semarang</span>
            </div>

            {savedStudentEmail && (
              <Link
                href="/statistik"
                className="hidden sm:flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all"
              >
                <UserCheck size={14} className="text-indigo-600" />
                <span className="max-w-[140px] truncate">{savedStudentEmail}</span>
              </Link>
            )}

            <Link
              href="/survey"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-xs font-bold shadow-sm"
            >
              + Isi Survey Hari Ini
            </Link>
          </div>
        </header>

        <Suspense
          fallback={
            <div className="h-[200px] bg-indigo-900 rounded-3xl flex items-center justify-center text-white">
              <p className="text-indigo-200 animate-pulse font-semibold">Memuat Beranda...</p>
            </div>
          }
        >
          <HeroSection onLogoLoaded={(url: string) => setNexaraLogoUrl(url)} />
        </Suspense>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InteractiveDonutChart
            completion={completion}
            overallScore={overallScore}
          />

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Aksi Cepat</h3>
              <p className="text-xs text-slate-500 mb-5">
                Akses fitur utama 7 KAIH secara langsung.
              </p>
              <div className="space-y-3">
                <Link
                  href="/survey"
                  className="block w-full p-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm text-center hover:bg-indigo-700 transition-all shadow-sm"
                >
                  Isi Survei Evaluasi Diri →
                </Link>
                <Link
                  href="/statistik"
                  className="block w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold text-sm text-center hover:bg-blue-100 transition-all"
                >
                  Lihat Statistik Perkembangan Pribadi
                </Link>
                <Link
                  href="/game"
                  className="block w-full p-4 bg-purple-50 text-purple-700 rounded-2xl font-bold text-sm text-center hover:bg-purple-100 transition-all"
                >
                  Mainkan Kuis Game Rotasi 🎮
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-600" />
                Chart Batang Rata-Rata Jawaban Siswa
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MousePointerClick size={13} className="text-indigo-500" />
                Klik / pencet salah satu batang di bawah untuk melihat detail rata-rata indikatornya
              </p>
            </div>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full">
              Skala 1.0 – 5.0
            </span>
          </div>

          {loadingChart ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400 animate-pulse">
              Memuat grafik capaian siswa...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 items-end h-56 pt-6 px-1 border-b border-slate-100">
                {barAverages.map((avg, idx) => {
                  const safeAvg = Math.min(5, Math.max(0, avg))
                  const heightPercent = Math.round((safeAvg / 5) * 100)
                  const isSelected = selectedBarIdx === idx

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedBarIdx(idx)}
                      className={`flex flex-col items-center h-full justify-end group p-1.5 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 ring-2 ring-indigo-500 -translate-y-1 shadow-sm'
                          : 'hover:bg-slate-50 hover:-translate-y-0.5'
                      }`}
                    >
                      <span
                        className={`text-xs font-extrabold mb-1.5 transition-transform ${
                          isSelected ? 'text-indigo-700 scale-110' : 'text-slate-600'
                        }`}
                      >
                        {safeAvg.toFixed(1)}
                      </span>
                      <div className="w-full max-w-[30px] bg-slate-100 rounded-t-xl h-36 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            isSelected
                              ? 'bg-gradient-to-t from-indigo-700 via-purple-600 to-pink-500'
                              : 'bg-gradient-to-t from-indigo-500 to-purple-400 opacity-80 group-hover:opacity-100'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span
                        className={`text-[10px] text-center mt-2 leading-tight line-clamp-2 h-7 ${
                          isSelected ? 'font-bold text-indigo-700' : 'font-semibold text-slate-500'
                        }`}
                      >
                        {INDICATOR_DETAILS[idx].short}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="bg-slate-50 border border-indigo-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-lg">
                      Indikator #{selectedBarIdx + 1} • {INDICATOR_DETAILS[selectedBarIdx].short}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${selectedPredicate.color}`}
                    >
                      {selectedPredicate.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">
                    "{INDICATOR_DETAILS[selectedBarIdx].full}"
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Rata-Rata Skor</p>
                    <p className="text-2xl font-black text-indigo-700">
                      {selectedAvg.toFixed(2)}{' '}
                      <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                    </p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Persentase</p>
                    <p className="text-2xl font-black text-purple-600">{selectedPct}%</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <section
          id="kebiasaan-section"
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              7 Kebiasaan Anak Indonesia Hebat
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Panduan kebiasaan positif menurut Kementerian Pendidikan Dasar dan Menengah
              (Kemendikdasmen).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHabits.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-base font-bold text-indigo-600 mb-1.5">{item.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}