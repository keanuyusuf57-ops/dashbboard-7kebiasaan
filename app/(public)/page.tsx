'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import HeroSection from '@/components/public/HeroSection'
import { Search, ArrowRight, BarChart3 } from 'lucide-react'

const GOOGLE_SHEET_API_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL ||
  'https://script.google.com/macros/s/AKfycbyGCDCIQMCbgqy0l3hAjtuZs_Ed9F6xsj09cU9oxxnG72WizU_Q0sOVobnRtvYjGS5T/exec'

const INDICATOR_LABELS = [
  'Bangun Pagi',
  'Ibadah Tepat',
  'Berdoa Harian',
  'Olahraga 3x',
  'Ekskul/Sekolah',
  'Makan Sehat',
  'Gemar Membaca',
  'Bantu Ortu',
  'Tidur Cepat',
  'Bebas Gadget',
]

function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Beranda', href: '/' },
    { label: 'Yuk Survey!', href: '/survey' },
    { label: 'Main Game', href: '/game' },
    { label: 'Statistik', href: '/statistik' },
    { label: 'Tentang', href: '/tentang' },
  ]

  return (
    <aside className="w-64 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 hidden lg:flex flex-col shrink-0">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm">
          NX
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-800">NEXARA • 7 KAIH</p>
          <p className="text-[11px] text-slate-500">SMAN 5 Semarang</p>
        </div>
      </div>

      <nav className="mt-5 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`block w-full text-left px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

function HabitDonutChart({ completion, totalRows }: { completion: number; totalRows: number }) {
  const safeCompletion = Math.min(100, Math.max(0, completion))

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Progress Kebiasaan</h3>
          <p className="text-xs text-slate-500">Rata-rata capaian dari Spreadsheet</p>
        </div>
        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full">
          {safeCompletion}%
        </span>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="relative h-44 w-44">
          <div className="absolute inset-0 rounded-full bg-slate-100" />
          <div
            className="absolute inset-0 rounded-full transition-all duration-700"
            style={{
              background: `conic-gradient(#6366f1 0 ${safeCompletion}%, #e2e8f0 ${safeCompletion}% 100%)`,
            }}
          />
          <div className="absolute inset-4 rounded-full bg-white shadow-inner flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-slate-800">{safeCompletion}%</div>
              <div className="text-[11px] text-slate-500">Tercapai</div>
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
          <p className="text-[10px] uppercase tracking-wide text-indigo-500">Total Rekapan</p>
          <p className="font-bold text-indigo-700 mt-1">{totalRows} Data</p>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [completion, setCompletion] = useState(0)
  const [totalSubmissions, setTotalSubmissions] = useState(0)
  const [barAverages, setBarAverages] = useState<number[]>(Array(10).fill(0))
  const [loadingChart, setLoadingChart] = useState(true)

  useEffect(() => {
    async function fetchSpreadsheetStats() {
      try {
        const res = await fetch(GOOGLE_SHEET_API_URL)
        const json = await res.json()
        if (json.status === 'success' && Array.isArray(json.data)) {
          const rows = json.data
          setTotalSubmissions(rows.length)

          if (rows.length > 0) {
            const sums = Array(10).fill(0)
            const validCounts = Array(10).fill(0)

            rows.forEach((r: any) => {
              if (Array.isArray(r.scores)) {
                r.scores.forEach((rawVal: any, idx: number) => {
                  const val = Number(rawVal)
                  // VALIDASI KETAT: Hanya hitung angka skala 1 sampai 5 (abaikan NISN/No HP jika ada kolom bergeser)
                  if (!isNaN(val) && val >= 1 && val <= 5) {
                    sums[idx] += val
                    validCounts[idx] += 1
                  }
                })
              }
            })

            const avgs = sums.map((s, idx) =>
              validCounts[idx] > 0 ? Number((s / validCounts[idx]).toFixed(1)) : 0
            )
            setBarAverages(avgs)

            const validAvgs = avgs.filter((a) => a > 0)
            if (validAvgs.length > 0) {
              const totalAvg = validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length
              setCompletion(Math.min(100, Math.round((totalAvg / 5) * 100)))
            }
          }
        }
      } catch (err) {
        console.error('Gagal mengambil data spreadsheet:', err)
      } finally {
        setLoadingChart(false)
      }
    }
    fetchSpreadsheetStats()
  }, [])

  const habits = [
    { title: '1. Bangun Pagi', desc: 'Membiasakan diri bangun tepat waktu untuk memulai hari dengan disiplin.' },
    { title: '2. Beribadah', desc: 'Taat menjalankan ibadah sesuai keyakinan masing-masing.' },
    { title: '3. Berolahraga', desc: 'Menjaga kesehatan dan kebugaran jasmani secara teratur.' },
    { title: '4. Makan Sehat & Bergizi', desc: 'Mengonsumsi makanan yang bernutrisi untuk mendukung tumbuh kembang.' },
    { title: '5. Gemar Membaca', desc: 'Mengembangkan minat baca untuk menambah wawasan dan literasi.' },
    { title: '6. Membantu Orang Tua', desc: 'Aktif berinteraksi, peduli lingkungan, dan bergotong royong.' },
    { title: '7. Istirahat Cukup', desc: 'Menjaga pola tidur yang teratur untuk pemulihan energi fisik dan mental.' },
  ]

  const filteredHabits = habits.filter(
    (h) =>
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex bg-slate-50 min-h-screen p-4 gap-6 font-sans">
      {/* Sidebar Navigasi Kiri dengan Logo Nexara */}
      <Sidebar />

      {/* Konten Utama */}
      <main className="flex-1 space-y-6 min-w-0">
        {/* Top Header Bar */}
        <header className="flex flex-wrap justify-between items-center bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl w-full sm:w-80">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kebiasaan atau indikator..."
              className="bg-transparent text-sm focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/survey"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-xs font-bold shadow-sm"
            >
              Isi Survey Sekarang
            </Link>
          </div>
        </header>

        {/* Hero Section (Kotak samping sekarang fokus tombol navigasi cepat, bukan logo besar yang terpotong) */}
        <Suspense
          fallback={
            <div className="h-[200px] bg-indigo-900 rounded-3xl flex items-center justify-center text-white">
              <p className="text-indigo-200 animate-pulse font-semibold">Memuat Beranda...</p>
            </div>
          }
        >
          <HeroSection />
        </Suspense>

        {/* Grid Dashboard: Donut Chart & Aksi Cepat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HabitDonutChart completion={completion} totalRows={totalSubmissions} />

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Aksi Cepat</h3>
              <p className="text-xs text-slate-500 mb-5">Akses fitur utama 7 KAIH secara langsung.</p>
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

        {/* Chart Batang Rata-Rata Jawaban Siswa (Skala 1.0 - 5.0 Valid) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-600" />
                Chart Batang Rata-Rata Jawaban Siswa
              </h3>
              <p className="text-xs text-slate-500">
                Rata-rata skor 10 indikator dari rekapan Spreadsheet (Skala 1.0 – 5.0)
              </p>
            </div>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full">
              Data Live Spreadsheet
            </span>
          </div>

          {loadingChart ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400 animate-pulse">
              Memuat grafik batang dari Spreadsheet...
            </div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 items-end h-56 pt-6 px-1 border-b border-slate-100">
              {barAverages.map((avg, idx) => {
                const safeAvg = Math.min(5, Math.max(0, avg))
                const heightPercent = Math.round((safeAvg / 5) * 100)
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-xs font-extrabold text-indigo-700 mb-1.5">
                      {safeAvg.toFixed(1)}
                    </span>
                    <div className="w-full max-w-[30px] bg-slate-100 rounded-t-xl h-36 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-xl transition-all duration-700"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 text-center mt-2 leading-tight line-clamp-2 h-7">
                      {INDICATOR_LABELS[idx]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Section 7 Kebiasaan */}
        <section id="kebiasaan-section" className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              7 Kebiasaan Anak Indonesia Hebat
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Panduan kebiasaan positif menurut Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen).
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