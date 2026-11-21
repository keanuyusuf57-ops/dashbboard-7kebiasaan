'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ClassActionPlanCard from '@/components/admin/ClassActionPlanCard'
import ActivityGalleryManager from '@/components/admin/ActivityGalleryManager'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Award,
  BarChart3,
  Database,
  FileSpreadsheet,
  HelpCircle,
  Settings,
  RefreshCw,
  Sunrise,
  HeartHandshake,
  Dumbbell,
  Apple,
  BookOpenCheck,
  MoonStar,
  Sparkles,
  ArrowRight,
  Clock,
  Gamepad2,
  MessageSquareText,
  Trash2,
} from 'lucide-react'

const SEVEN_KAIH_INDICATORS = [
  {
    key: 'Bangun Pagi',
    short: 'Bangun Pagi',
    icon: Sunrise,
    iconBox: 'bg-amber-100 text-amber-700 border-amber-300',
    barGradient: 'from-amber-500 to-orange-400',
  },
  {
    key: 'Beribadah',
    short: 'Beribadah',
    icon: HeartHandshake,
    iconBox: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    barGradient: 'from-emerald-600 to-teal-400',
  },
  {
    key: 'Berolahraga',
    short: 'Berolahraga',
    icon: Dumbbell,
    iconBox: 'bg-sky-100 text-sky-700 border-sky-300',
    barGradient: 'from-sky-600 to-cyan-400',
  },
  {
    key: 'Makan Sehat',
    short: 'Makan Sehat',
    icon: Apple,
    iconBox: 'bg-rose-100 text-rose-700 border-rose-300',
    barGradient: 'from-rose-600 to-pink-400',
  },
  {
    key: 'Gemar',
    short: 'Gemar Membaca',
    icon: BookOpenCheck,
    iconBox: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    barGradient: 'from-indigo-600 to-blue-500',
  },
  {
    key: 'Bermasyarakat',
    short: 'Bermasyarakat',
    icon: Users,
    iconBox: 'bg-orange-100 text-orange-700 border-orange-300',
    barGradient: 'from-orange-600 to-amber-400',
  },
  {
    key: 'Tidur Cepat',
    short: 'Tidur Cepat',
    icon: MoonStar,
    iconBox: 'bg-violet-100 text-violet-700 border-violet-300',
    barGradient: 'from-violet-600 to-purple-400',
  },
]

type FeedbackItem = {
  id: string
  nama_pengirim: string
  kelas: string
  kategori: string
  pesan: string
  created_at: string
}

function parseRowScores(row: any): number[] {
  if (Array.isArray(row?.answers_json) && row.answers_json.length > 0) {
    return row.answers_json.map((v: any) => Number(v) || 0)
  }
  if (typeof row?.answers_json === 'string') {
    try {
      const parsed = JSON.parse(row.answers_json)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((v: any) => Number(v) || 0)
      }
    } catch {}
  }

  const qKeys = Object.keys(row || {})
    .filter((k) => /^q\d+$/i.test(k))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))

  if (qKeys.length > 0) {
    return qKeys.map((k) => Number(row[k]) || 0)
  }

  return [row?.q1, row?.q2, row?.q3, row?.q4, row?.q5, row?.q6, row?.q7, row?.q8, row?.q9, row?.q10].map(
    (v) => Number(v) || 0
  )
}

function computeRowAverage(row: any): number {
  const valid = parseRowScores(row).filter((v) => v >= 1 && v <= 4)
  if (valid.length > 0) {
    return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2))
  }
  const dbAvg = Number(row?.rata_rata)
  return !isNaN(dbAvg) && dbAvg > 0 ? Number(dbAvg.toFixed(2)) : 0
}

function mapCategoryToIndicatorIndex(category: string, fallbackIdx: number): number {
  const lower = (category || '').toLowerCase()
  if (lower.includes('bangun')) return 0
  if (lower.includes('ibadah')) return 1
  if (lower.includes('olahraga')) return 2
  if (lower.includes('makan')) return 3
  if (lower.includes('baca') || lower.includes('belajar')) return 4
  if (lower.includes('masyarakat')) return 5
  if (lower.includes('tidur')) return 6

  const defaultMap = [0, 1, 1, 2, 2, 3, 4, 5, 6, 6]
  return defaultMap[fallbackIdx] ?? fallbackIdx % 7
}

export default function AdminDashboardPage() {
  const supabase = createClient()

  const [rows, setRows] = useState<any[]>([])
  const [questionCategories, setQuestionCategories] = useState<string[]>([])
  const [totalQuizSessions, setTotalQuizSessions] = useState<number>(0)
  const [totalBankSoal, setTotalBankSoal] = useState<number>(0)
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([])
  const [selectedPlanClass, setSelectedPlanClass] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)

    const [{ data: qData }, { count: quizCount }, { count: soalCount }, { data: fbData }] =
      await Promise.all([
        supabase
          .from('survey_questions')
          .select('category, order_index')
          .order('order_index', { ascending: true }),
        supabase.from('hasil_kuis').select('*', { count: 'exact', head: true }),
        supabase.from('bank_soal').select('*', { count: 'exact', head: true }),
        supabase
          .from('student_feedback')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
      ])

    if (qData && qData.length > 0) {
      setQuestionCategories(qData.map((q) => q.category || ''))
    }
    if (quizCount !== null) setTotalQuizSessions(quizCount)
    if (soalCount !== null) setTotalBankSoal(soalCount)
    if (fbData) setFeedbackList(fbData as FeedbackItem[])

    // Ambil seluruh data survey_responses secara bertahap (tanpa limit 1000)
    let allResponses: any[] = []
    let from = 0
    const batchSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1)

      if (error || !data || data.length === 0) {
        hasMore = false
      } else {
        allResponses = allResponses.concat(data)
        if (data.length < batchSize) {
          hasMore = false
        } else {
          from += batchSize
        }
      }
    }

    setRows(allResponses)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Hapus masukan siswa ini?')) return
    const { error } = await supabase.from('student_feedback').delete().eq('id', id)
    if (!error) {
      setFeedbackList((prev) => prev.filter((item) => item.id !== id))
    }
  }

  // Kalkulasi Indeks 7 KAIH Seluruh Sekolah
  const indicatorSums = Array(7).fill(0)
  const indicatorCounts = Array(7).fill(0)
  let totalScoreSum = 0
  let validScoreRows = 0
  const classCounter: Record<string, { count: number; sum: number }> = {}

  rows.forEach((r) => {
    const scores = parseRowScores(r)
    scores.forEach((val, qIdx) => {
      if (val >= 1 && val <= 4) {
        const cat = questionCategories[qIdx] || ''
        const indIdx = mapCategoryToIndicatorIndex(cat, qIdx)
        indicatorSums[indIdx] += val
        indicatorCounts[indIdx] += 1
      }
    })

    const avg = computeRowAverage(r)
    if (avg > 0) {
      totalScoreSum += avg
      validScoreRows += 1
    }

    const kelas = (r.kelas || 'Tanpa Kelas').trim().toUpperCase()
    if (!classCounter[kelas]) classCounter[kelas] = { count: 0, sum: 0 }
    classCounter[kelas].count += 1
    if (avg > 0) classCounter[kelas].sum += avg
  })

  const availableClasses = Object.keys(classCounter)
    .filter((k) => k !== 'TANPA KELAS')
    .sort()

  const activePlanClass =
    selectedPlanClass && availableClasses.includes(selectedPlanClass)
      ? selectedPlanClass
      : availableClasses[0] || ''

  const activeClassRows = rows.filter(
    (r) => (r.kelas || '').trim().toUpperCase() === activePlanClass
  )

  const schoolAverage =
    validScoreRows > 0 ? Number((totalScoreSum / validScoreRows).toFixed(2)) : 0

  const indicatorStats = SEVEN_KAIH_INDICATORS.map((ind, idx) => {
    const avg =
      indicatorCounts[idx] > 0
        ? Number((indicatorSums[idx] / indicatorCounts[idx]).toFixed(2))
        : 0
    return {
      ...ind,
      avg,
      pct: Math.min(100, Math.round((avg / 4) * 100)),
    }
  })

  const topClasses = Object.entries(classCounter)
    .map(([kelas, info]) => ({
      kelas,
      count: info.count,
      avg: info.count > 0 ? Number((info.sum / info.count).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const recentSubmissions = rows.slice(0, 5)

  return (
    <div className="space-y-6 font-sans text-[#090D16]">
      {/* Hero Banner Dashboard Tunggal */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-800 to-sky-700 text-white p-6 sm:p-8 shadow-xl border border-indigo-400/20 relative overflow-hidden">
        <LayoutDashboard
          size={170}
          className="hidden sm:block absolute -bottom-8 right-6 text-white/[0.07] pointer-events-none"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-extrabold text-sky-200">
              <Sparkles size={13} className="text-sky-300" />
              <span>RINGKASAN ANALITIK • SMAN 5 SEMARANG</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-white">
              Dashboard Gerakan 7 KAIH
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              Pantau rekapitulasi survei karakter siswa, rata-rata indeks 7 kebiasaan nasional, serta
              kelola bank soal kuis dan tampilan beranda secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-extrabold text-white cursor-pointer transition-all disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Segarkan Data</span>
            </button>

            <Link
              href="/admin/database"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 hover:opacity-95 text-indigo-950 text-xs font-black shadow-md transition-all"
            >
              <Database size={15} />
              <span>Buka Database Kelas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Kartu Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase text-slate-600">Total Responden</p>
            <p className="font-heading text-2xl font-black text-[#090D16]">
              {loading ? '...' : rows.length.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase text-slate-600">
              Indeks Sekolah (1–4)
            </p>
            <p className="font-heading text-2xl font-black text-emerald-700">
              {loading ? '...' : schoolAverage.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">/ 4.0</span>
            </p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
            <Gamepad2 size={22} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase text-slate-600">Sesi Game Kuis</p>
            <p className="font-heading text-2xl font-black text-sky-700">
              {loading ? '...' : totalQuizSessions.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-100 text-violet-700 border border-violet-200 flex items-center justify-center shrink-0">
            <Award size={22} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase text-slate-600">Bank Soal Aktif</p>
            <p className="font-heading text-2xl font-black text-violet-700">
              {loading ? '...' : `${totalBankSoal} Soal`}
            </p>
          </div>
        </div>
      </div>

      {/* Akses Cepat Modul Pengelolaan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link
          href="/admin/database"
          className="group p-4 rounded-2xl bg-white/95 hover:bg-indigo-50/70 border border-slate-200/90 hover:border-indigo-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Database size={18} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#090D16]">Database Per Kelas</p>
              <p className="text-[11px] text-slate-600">Filter & Ekspor CSV</p>
            </div>
          </div>
          <ArrowRight
            size={16}
            className="text-slate-400 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all"
          />
        </Link>

        <Link
          href="/admin/survey"
          className="group p-4 rounded-2xl bg-white/95 hover:bg-sky-50/70 border border-slate-200/90 hover:border-sky-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={18} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#090D16]">Rincian Indikator</p>
              <p className="text-[11px] text-slate-600">Matriks Skor Q1–Q10</p>
            </div>
          </div>
          <ArrowRight
            size={16}
            className="text-slate-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition-all"
          />
        </Link>

        <Link
          href="/admin/soal"
          className="group p-4 rounded-2xl bg-white/95 hover:bg-violet-50/70 border border-slate-200/90 hover:border-violet-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <HelpCircle size={18} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#090D16]">Kelola Soal Kuis</p>
              <p className="text-[11px] text-slate-600">Tambah, Edit & Kategori</p>
            </div>
          </div>
          <ArrowRight
            size={16}
            className="text-slate-400 group-hover:text-violet-700 group-hover:translate-x-0.5 transition-all"
          />
        </Link>

        <Link
          href="/admin/settings"
          className="group p-4 rounded-2xl bg-white/95 hover:bg-emerald-50/70 border border-slate-200/90 hover:border-emerald-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Settings size={18} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#090D16]">Pengaturan Tampilan</p>
              <p className="text-[11px] text-slate-600">Edit Beranda Real-Time</p>
            </div>
          </div>
          <ArrowRight
            size={16}
            className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all"
          />
        </Link>
      </div>

      {/* AI Action Plan Spesifik Per Kelas untuk Wali Kelas */}
      {!loading && availableClasses.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white/95 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <p className="text-xs font-black text-[#090D16]">
                Pilih Kelas untuk Analisis Rencana Tindak Lanjut Wali Kelas:
              </p>
              <p className="text-[11px] text-slate-600">
                Sistem mendeteksi kebiasaan dengan skor terendah pada kelas terpilih dan menyusun
                rekomendasi programnya.
              </p>
            </div>

            <select
              value={activePlanClass}
              onChange={(e) => setSelectedPlanClass(e.target.value)}
              className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-black text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          <ClassActionPlanCard selectedClass={activePlanClass} classRows={activeClassRows} />
        </div>
      )}

      {/* Grafik Capaian 7 Indikator & Kelas Teraktif */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Capaian 7 Pilar Kebiasaan */}
        <div className="lg:col-span-7 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-extrabold text-[#090D16] flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-700" />
                <span>Rata-Rata Capaian 7 Pilar 7 KAIH</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Akumulasi skor seluruh responden SMAN 5 Semarang (Skala 1.0 – 4.0)
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {indicatorStats.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-extrabold text-[#090D16]">
                      <span
                        className={`h-6 w-6 rounded-lg border flex items-center justify-center ${item.iconBox}`}
                      >
                        <Icon size={13} />
                      </span>
                      <span>{item.short}</span>
                    </div>
                    <span className="font-black text-indigo-800">
                      {item.avg.toFixed(2)}{' '}
                      <span className="text-[11px] font-semibold text-slate-500">
                        ({item.pct}%)
                      </span>
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.barGradient} transition-all duration-500`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Partisipasi Kelas Terbanyak */}
        <div className="lg:col-span-5 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-extrabold text-[#090D16]">
                Partisipasi Kelas Teraktif
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                6 kelas dengan jumlah pengisian survei terbanyak
              </p>
            </div>
            <Link
              href="/admin/database"
              className="text-xs font-extrabold text-indigo-700 hover:underline"
            >
              Semua Kelas →
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 py-8 text-center animate-pulse">
              Menghitung rekap per kelas...
            </p>
          ) : topClasses.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">Belum ada data kelas.</p>
          ) : (
            <div className="space-y-2.5">
              {topClasses.map((cls, idx) => (
                <div
                  key={cls.kelas}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-xl bg-indigo-950 text-white text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-[#090D16]">{cls.kelas}</p>
                      <p className="text-[11px] text-slate-600">
                        Rata-rata skor: <strong>{cls.avg.toFixed(2)}</strong> / 4.0
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-black">
                    {cls.count} Siswa
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manajemen Galeri Foto & Dokumentasi Kegiatan (/tentang) */}
      <ActivityGalleryManager />

      {/* Kotak Masuk Saran & Umpan Balik Siswa (Dari Navbar) */}
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-extrabold text-[#090D16] flex items-center gap-2">
              <MessageSquareText size={18} className="text-indigo-700" />
              <span>Kotak Masuk Saran &amp; Usulan Siswa ({feedbackList.length})</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Aspirasi kegiatan 7 KAIH dan masukan fitur yang dikirim siswa melalui tombol Saran di
              Navbar.
            </p>
          </div>
        </div>

        {feedbackList.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-2xl">
            Belum ada saran atau masukan siswa yang masuk.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feedbackList.map((fb) => (
              <div
                key={fb.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-[#090D16]">{fb.nama_pengirim}</span>
                    {fb.kelas && fb.kelas !== '-' && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 text-[10px] font-extrabold">
                        {fb.kelas}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                      {fb.kategori}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">{fb.pesan}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {new Date(fb.created_at).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteFeedback(fb.id)}
                  title="Hapus Masukan"
                  className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 shrink-0 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5 Pengisian Survei Terbaru */}
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-extrabold text-[#090D16] flex items-center gap-2">
            <Clock size={18} className="text-indigo-700" />
            <span>5 Pengisian Survei Terbaru</span>
          </h2>
          <Link
            href="/admin/database"
            className="text-xs font-extrabold text-indigo-700 hover:underline"
          >
            Lihat Seluruh {rows.length.toLocaleString('id-ID')} Data →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Rata-Rata</th>
                <th className="py-2.5 px-3">Waktu Kirim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentSubmissions.map((r) => {
                const avg = computeRowAverage(r)
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-extrabold text-[#090D16]">{r.nama}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-extrabold">
                        {r.kelas}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{r.email}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-black">
                        {avg.toFixed(2)} / 4.0
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(r.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}