'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import RadarChart7KAIH from '@/components/public/RadarChart7KAIH'
import PersonalHabitCoach from '@/components/public/PersonalHabitCoach'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3,
  Sparkles,
  Calendar,
  Award,
  CheckCircle2,
  TrendingUp,
  User,
  Sunrise,
  HeartHandshake,
  Dumbbell,
  Apple,
  BookOpenCheck,
  Users,
  MoonStar,
  PlusCircle,
  Lock,
  Mail,
  LogOut,
  ShieldAlert,
  GitMerge,
  Loader2,
} from 'lucide-react'

const SEVEN_KAIH_INDICATORS = [
  {
    key: 'Bangun Pagi',
    short: 'Bangun Pagi',
    target: 3.6,
    icon: Sunrise,
    iconBox: 'bg-amber-100 text-amber-700 border-amber-300',
    barGradient: 'from-amber-500 to-orange-400',
    tip: 'Pasang alarm pukul 05.15 dan jauhkan ponsel dari kasur agar langsung bangun.',
  },
  {
    key: 'Beribadah',
    short: 'Beribadah',
    target: 3.6,
    icon: HeartHandshake,
    iconBox: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    barGradient: 'from-emerald-600 to-teal-400',
    tip: 'Jadikan waktu ibadah dan berdoa sebagai prioritas sebelum aktivitas lain.',
  },
  {
    key: 'Berolahraga',
    short: 'Berolahraga',
    target: 3.4,
    icon: Dumbbell,
    iconBox: 'bg-sky-100 text-sky-700 border-sky-300',
    barGradient: 'from-sky-600 to-cyan-400',
    tip: 'Jadwalkan aktivitas fisik atau peregangan minimal 20 menit 3 kali seminggu.',
  },
  {
    key: 'Makan Sehat',
    short: 'Makan Sehat',
    target: 3.5,
    icon: Apple,
    iconBox: 'bg-rose-100 text-rose-700 border-rose-300',
    barGradient: 'from-rose-600 to-pink-400',
    tip: 'Tambahkan minimal 1 porsi buah/sayur dan kurangi minuman manis kemasan.',
  },
  {
    key: 'Gemar',
    short: 'Gemar Membaca',
    target: 3.5,
    icon: BookOpenCheck,
    iconBox: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    barGradient: 'from-indigo-600 to-blue-500',
    tip: 'Luangkan 15–30 menit membaca buku literasi atau artikel edukatif setiap hari.',
  },
  {
    key: 'Bermasyarakat',
    short: 'Bermasyarakat',
    target: 3.5,
    icon: Users,
    iconBox: 'bg-orange-100 text-orange-700 border-orange-300',
    barGradient: 'from-orange-600 to-amber-400',
    tip: 'Ambil inisiatif membantu orang tua dan peduli lingkungan sekitar.',
  },
  {
    key: 'Tidur Cepat',
    short: 'Tidur Cepat',
    target: 3.4,
    icon: MoonStar,
    iconBox: 'bg-violet-100 text-violet-700 border-violet-300',
    barGradient: 'from-violet-600 to-purple-400',
    tip: 'Hentikan penggunaan gadget 30 menit sebelum pukul 22.00 agar tidur tepat waktu.',
  },
]

const KELAS_OPTIONS = [
  'X-1', 'X-2', 'X-3', 'X-4', 'X-5', 'X-6', 'X-7', 'X-8', 'X-9', 'X-10', 'X-11', 'X-12',
  'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5', 'XI-6', 'XI-7', 'XI-8', 'XI-9', 'XI-10', 'XI-11', 'XI-12',
  'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5', 'XII-6', 'XII-7', 'XII-8', 'XII-9', 'XII-10', 'XII-11', 'XII-12',
]

type DimensionScore = {
  label: string
  score: number
  target: number
}

const INDICATOR_DETAILS = SEVEN_KAIH_INDICATORS.map((indicator) => ({
  full: indicator.short,
  dimension: indicator.key,
}))

function getPredicate(score: number) {
  if (score >= 3.5) {
    return { label: 'Sangat Baik', color: 'bg-emerald-100/95 text-emerald-900 border-emerald-300' }
  }
  if (score >= 2.5) {
    return { label: 'Baik', color: 'bg-indigo-100/95 text-indigo-900 border-indigo-300' }
  }
  if (score >= 1.5) {
    return { label: 'Cukup', color: 'bg-amber-100/95 text-amber-900 border-amber-300' }
  }
  return { label: 'Perlu Peningkatan', color: 'bg-rose-100/95 text-rose-900 border-rose-300' }
}

type QuestionMeta = {
  question_text: string
  category: string
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

function isValidStrictEmail(val: string): boolean {
  const clean = val.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)
}

function MergeHistoryBox({
  verifiedEmail,
  defaultNama,
  defaultKelas,
  defaultAbsen,
  onMerged,
}: {
  verifiedEmail: string
  defaultNama?: string
  defaultKelas?: string
  defaultAbsen?: string
  onMerged: () => void
}) {
  const supabase = createClient()
  const [nama, setNama] = useState(defaultNama || '')
  const [kelas, setKelas] = useState(defaultKelas || 'X-1')
  const [noAbsen, setNoAbsen] = useState(defaultAbsen || '')
  const [merging, setMerging] = useState(false)
  const [mergeFeedback, setMergeFeedback] = useState<{
    type: 'success' | 'info' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    if (defaultNama && !nama) setNama(defaultNama)
    if (defaultKelas) setKelas(defaultKelas)
    if (defaultAbsen && !noAbsen) setNoAbsen(String(defaultAbsen))
  }, [defaultNama, defaultKelas, defaultAbsen])

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifiedEmail || !kelas.trim() || !noAbsen.trim()) return

    setMerging(true)
    setMergeFeedback(null)

    const { data, error } = await supabase.rpc('merge_student_survey_history', {
      p_target_email: verifiedEmail.trim().toLowerCase(),
      p_kelas: kelas.trim(),
      p_no_absen: noAbsen.trim(),
      p_nama: nama.trim() || null,
    })

    if (error) {
      setMergeFeedback({
        type: 'error',
        text: `Gagal menggabungkan riwayat: ${error.message}`,
      })
    } else {
      const count = Number(data || 0)
      if (count > 0) {
        setMergeFeedback({
          type: 'success',
          text: `Berhasil! ${count} riwayat pengisian lamamu atas Kelas ${kelas} Absen ${noAbsen} telah digabungkan ke ${verifiedEmail}.`,
        })
        onMerged()
      } else {
        setMergeFeedback({
          type: 'info',
          text: 'Tidak ditemukan data survei lama dengan email berbeda untuk Kelas & Nomor Absen tersebut.',
        })
      }
    }

    setMerging(false)
  }

  return (
    <form
      onSubmit={handleMerge}
      className="kaih-glass-card p-5 sm:p-6 rounded-3xl border border-amber-300/70 space-y-3"
    >
      <div className="flex items-center gap-2 text-[#090D16]">
        <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0">
          <GitMerge size={16} />
        </div>
        <div>
          <h3 className="font-heading text-sm sm:text-base font-black text-[#090D16]">
            Gabungkan Riwayat Survei dari Email Lama
          </h3>
          <p className="text-[11px] font-medium text-slate-700">
            Pernah mengisi memakai email asal-asalan atau berbeda? Masukkan Kelas &amp; No. Absen untuk menyatukan datamu ke <strong>{verifiedEmail}</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
        <input
          type="text"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: Keanu Yusuf Al Ghifari"
          className="sm:col-span-5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/95 text-xs font-bold text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <select
          value={kelas}
          onChange={(e) => setKelas(e.target.value)}
          className="sm:col-span-3 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/95 text-xs font-extrabold text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
        >
          {KELAS_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={50}
          required
          value={noAbsen}
          onChange={(e) => setNoAbsen(e.target.value)}
          placeholder="No. Absen"
          className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/95 text-xs font-extrabold text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="submit"
          disabled={merging}
          className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-700 to-sky-600 hover:opacity-95 text-white text-xs font-extrabold shadow-xs cursor-pointer disabled:opacity-60"
        >
          {merging ? <Loader2 size={14} className="animate-spin" /> : <GitMerge size={14} />}
          <span>Gabungkan</span>
        </button>
      </div>

      {mergeFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-extrabold flex items-center gap-2 ${
            mergeFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : mergeFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{mergeFeedback.text}</span>
        </div>
      )}
    </form>
  )
}

function StatistikContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const emailFromQuery = (searchParams.get('email') || '').trim().toLowerCase()

  const [emailInput, setEmailInput] = useState(emailFromQuery)
  const [verifiedEmail, setVerifiedEmail] = useState(
    isValidStrictEmail(emailFromQuery) ? emailFromQuery : ''
  )
  const [authError, setAuthError] = useState<string | null>(null)
  const [rows, setRows] = useState<any[]>([])
  const [questionMetas, setQuestionMetas] = useState<QuestionMeta[]>(
    INDICATOR_DETAILS.map((d) => ({ question_text: d.full, category: d.dimension }))
  )
  const [loading, setLoading] = useState(false)

  const loadPersonalData = useCallback(
    async (targetEmail: string) => {
      const clean = targetEmail.trim().toLowerCase()
      if (!isValidStrictEmail(clean)) {
        setRows([])
        setLoading(false)
        return
      }

      setLoading(true)

      const { data: qData } = await supabase
        .from('survey_questions')
        .select('question_text, category, order_index')
        .order('order_index', { ascending: true })

      if (qData && qData.length > 0) {
        setQuestionMetas(
          qData.map((q) => ({
            question_text: q.question_text,
            category: q.category || '',
          }))
        )
      }

      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .ilike('email', clean)
        .order('created_at', { ascending: false })

      if (!error && Array.isArray(data)) {
        const exactRows = data.filter(
          (r) => String(r.email || '').trim().toLowerCase() === clean
        )
        setRows(exactRows)
      } else {
        setRows([])
      }
      setLoading(false)
    },
    [supabase]
  )

  useEffect(() => {
    const savedLocal = (localStorage.getItem('kaih_student_email') || '').trim().toLowerCase()
    const targetEmail = isValidStrictEmail(emailFromQuery) ? emailFromQuery : savedLocal

    if (isValidStrictEmail(targetEmail)) {
      setEmailInput(targetEmail)
      setVerifiedEmail(targetEmail)
      loadPersonalData(targetEmail)
    } else {
      setVerifiedEmail('')
      setRows([])
    }
  }, [emailFromQuery, loadPersonalData])

  const handleOpenPersonalStats = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    const clean = emailInput.trim().toLowerCase()

    if (!isValidStrictEmail(clean)) {
      setAuthError('Masukkan alamat email pribadi yang lengkap dan valid (contoh: keanu.yusuf@gmail.com).')
      return
    }

    localStorage.setItem('kaih_student_email', clean)
    setVerifiedEmail(clean)
    router.replace(`/statistik?email=${encodeURIComponent(clean)}`)
    loadPersonalData(clean)
  }

  const handleLockPersonalStats = () => {
    localStorage.removeItem('kaih_student_email')
    setVerifiedEmail('')
    setEmailInput('')
    setRows([])
    setAuthError(null)
    router.replace('/statistik')
  }

  const indicatorSums = Array(7).fill(0)
  const indicatorCounts = Array(7).fill(0)
  const rawTenSums = Array(10).fill(0)
  const rawTenCounts = Array(10).fill(0)
  let totalRowScoreSum = 0
  let validRowCount = 0

  rows.forEach((r) => {
    const scores = parseRowScores(r)
    scores.forEach((val: number, qIdx: number) => {
      if (val >= 1 && val <= 4) {
        if (qIdx < 10) {
          rawTenSums[qIdx] += val
          rawTenCounts[qIdx] += 1
        }
        const cat = questionMetas[qIdx]?.category || ''
        const indIdx = mapCategoryToIndicatorIndex(cat, qIdx)
        indicatorSums[indIdx] += val
        indicatorCounts[indIdx] += 1
      }
    })

    const rAvg = computeRowAverage(r)
    if (rAvg > 0) {
      totalRowScoreSum += rAvg
      validRowCount += 1
    }
  })

  const studentTenAverages = Array.from({ length: 10 }, (_, idx) =>
    rawTenCounts[idx] > 0 ? Number((rawTenSums[idx] / rawTenCounts[idx]).toFixed(2)) : 0
  )

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

  const overallAverage =
    validRowCount > 0 ? Number((totalRowScoreSum / validRowCount).toFixed(2)) : 0
  const completionPct = Math.min(100, Math.round((overallAverage / 4) * 100))
  const predicate = getPredicate(overallAverage)

  const sevenDimensions: DimensionScore[] = indicatorStats.map((item) => ({
    label: item.short,
    score: item.avg,
    target: item.target,
  }))

  const latestStudent = rows[0]

  return (
    <div className="space-y-5 font-sans text-[#090D16]">
      {/* Baris Aksi Atas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full kaih-glass-card text-xs font-extrabold text-[#090D16]">
          <Lock size={14} className="text-indigo-700" />
          <span>Mode Privasi Aktif • Khusus Data Pribadi</span>
        </div>

        <div className="flex items-center gap-2.5">
          {verifiedEmail && (
            <button
              type="button"
              onClick={handleLockPersonalStats}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-700 hover:bg-rose-50 kaih-glass-card px-4 py-2.5 rounded-full cursor-pointer transition-all"
            >
              <LogOut size={14} />
              <span>Ganti Akun / Kunci</span>
            </button>
          )}

          <Link
            href="/survey"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 hover:opacity-95 px-4 py-2.5 rounded-full shadow-sm transition-all"
          >
            <PlusCircle size={15} />
            <span>Isi Survei Hari Ini</span>
          </Link>
        </div>
      </div>

      {/* Banner Gradasi Indigo - Ungu - Biru Langit */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-800 to-sky-700 text-white p-6 sm:p-8 shadow-xl border border-indigo-400/20 relative overflow-hidden space-y-4">
        <Award
          size={170}
          className="hidden sm:block absolute -bottom-8 right-6 text-white/[0.08] pointer-events-none"
        />

        <div className="relative z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold text-sky-200">
          <Sparkles size={14} className="text-sky-300" />
          <span>Statistik &amp; Rapor Karakter Pribadi • Skala 1.0 – 4.0</span>
        </div>

        <div className="relative z-10 space-y-1.5">
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-white">
            {verifiedEmail && latestStudent
              ? `Rapor Karakter: ${latestStudent.nama}`
              : 'Statistik & Rapor Karakter Pribadi'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl leading-relaxed">
            {verifiedEmail && latestStudent
              ? `${latestStudent.kelas}${
                  latestStudent.no_absen ? ` • Absen ${latestStudent.no_absen}` : ''
                } • ${latestStudent.email}`
              : 'Demi menjaga privasi, statistik hanya menampilkan hasil evaluasi milikmu sendiri berdasarkan email pribadi yang didaftarkan saat mengisi survei.'}
          </p>
        </div>
      </div>

      {/* Gerbang Privasi: Form Verifikasi Email Pribadi */}
      {!verifiedEmail ? (
        <div className="kaih-glass-card p-6 sm:p-10 rounded-3xl max-w-xl mx-auto space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-[#090D16]">
                Buka Statistik Pribadimu
              </h2>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                Data siswa lain dilindungi dan tidak ditampilkan secara publik.
              </p>
            </div>
          </div>

          <form onSubmit={handleOpenPersonalStats} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-[#090D16] mb-1.5">
                Masukkan Email Pribadi Saat Mengisi Survei
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="text-indigo-700 absolute left-3.5 top-1/2 -translate-y-1/2"
                />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="contoh: keanu.yusuf@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 bg-white/95 text-sm font-bold text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 hover:opacity-95 text-white font-extrabold text-sm shadow-md cursor-pointer transition-all"
            >
              Lihat Statistik Saya
            </button>
          </form>
        </div>
      ) : loading ? (
        <div className="kaih-glass-card p-12 rounded-3xl text-center text-sm font-bold text-slate-800 animate-pulse">
          Memuat statistik pribadi untuk <strong>{verifiedEmail}</strong>...
        </div>
      ) : rows.length === 0 ? (
        <div className="space-y-5 max-w-3xl mx-auto">
          <div className="kaih-glass-card p-8 sm:p-10 rounded-3xl text-center space-y-4">
            <p className="text-sm font-extrabold text-[#090D16]">
              Belum ditemukan riwayat survei untuk email pribadi{' '}
              <span className="text-indigo-700">{verifiedEmail}</span>.
            </p>
            <p className="text-xs text-slate-700 font-medium">
              Jika sebelumnya kamu pernah mengisi survei memakai email lama/asal ketik, gunakan formulir penggabungan di bawah ini agar seluruh datamu ditarik ke <strong>{verifiedEmail}</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleLockPersonalStats}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-[#090D16] text-xs font-extrabold cursor-pointer"
              >
                Coba Email Lain
              </button>
              <Link
                href="/survey"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-extrabold"
              >
                Isi Survei Sekarang
              </Link>
            </div>
          </div>

          <MergeHistoryBox
            verifiedEmail={verifiedEmail}
            onMerged={() => loadPersonalData(verifiedEmail)}
          />
        </div>
      ) : (
        <>
          {/* Fitur Gabungkan Riwayat Lama dari Email Berbeda */}
          <MergeHistoryBox
            verifiedEmail={verifiedEmail}
            defaultNama={latestStudent?.nama}
            defaultKelas={latestStudent?.kelas}
            defaultAbsen={latestStudent?.no_absen}
            onMerged={() => loadPersonalData(verifiedEmail)}
          />

          {/* Kartu Ringkasan Skor Pribadi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="habit-folder-card kaih-glass-card p-5 rounded-3xl flex items-center gap-4 relative overflow-hidden">
              <TrendingUp
                size={64}
                className="absolute -right-2 -bottom-2 text-indigo-500/[0.08] pointer-events-none"
              />
              <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase text-slate-700">Rata-Rata Skor</p>
                <p className="font-heading text-2xl font-black text-indigo-800">
                  {overallAverage.toFixed(2)}{' '}
                  <span className="text-xs font-bold text-slate-600">/ 4.0</span>
                </p>
              </div>
            </div>

            <div className="habit-folder-card kaih-glass-card p-5 rounded-3xl flex items-center gap-4 relative overflow-hidden">
              <CheckCircle2
                size={64}
                className="absolute -right-2 -bottom-2 text-emerald-500/[0.08] pointer-events-none"
              />
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase text-slate-700">
                  Persentase Capaian
                </p>
                <p className="font-heading text-2xl font-black text-emerald-700">{completionPct}%</p>
              </div>
            </div>

            <div className="habit-folder-card kaih-glass-card p-5 rounded-3xl flex items-center gap-4 relative overflow-hidden">
              <Award
                size={64}
                className="absolute -right-2 -bottom-2 text-amber-500/[0.08] pointer-events-none"
              />
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                <Award size={22} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase text-slate-700">
                  Predikat ({rows.length} Sesi Saya)
                </p>
                <p className="text-sm font-black text-[#090D16] mt-0.5">{predicate.label}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RadarChart7KAIH dimensions={sevenDimensions} />

            {/* Diagram Batang Vertikal Per Indikator 7 KAIH */}
            <div className="kaih-glass-card p-6 rounded-3xl flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-heading text-base font-extrabold text-[#090D16] flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-700" />
                    <span>Diagram Batang per Indikator 7 KAIH</span>
                  </h2>
                  <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                    Rata-rata skor pribadimu berdasarkan 7 kategori kebiasaan
                  </p>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 shrink-0 border border-indigo-200">
                  Skala 0 – 4.0
                </span>
              </div>

              {/* Area Plot Diagram Batang Vertikal */}
              <div className="relative pt-6 pb-2">
                <div className="relative h-56 flex items-end justify-between gap-2 sm:gap-3 pl-7 pr-1 border-b-2 border-slate-300/80">
                  {[4, 3, 2, 1].map((tick) => (
                    <div
                      key={tick}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-300/80 flex items-center pointer-events-none"
                      style={{ bottom: `${(tick / 4) * 100}%` }}
                    >
                      <span className="text-[10px] font-bold text-slate-600 -translate-y-2.5">
                        {tick}.0
                      </span>
                    </div>
                  ))}

                  {indicatorStats.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative z-10 flex-1 h-full flex flex-col justify-end items-center group"
                    >
                      <span className="mb-1.5 text-[11px] font-black text-[#090D16] bg-white/95 border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs">
                        {item.avg.toFixed(2)}
                      </span>

                      <div
                        className={`w-full max-w-[38px] rounded-t-xl bg-gradient-to-t ${item.barGradient} shadow-xs transition-all duration-500 group-hover:brightness-105`}
                        style={{ height: `${Math.max(item.pct, item.avg > 0 ? 6 : 0)}%` }}
                        title={`${item.short}: ${item.avg.toFixed(2)} / 4.0`}
                      />
                    </div>
                  ))}
                </div>

                {/* Ikon & Label Nama 7 Indikator di Bawah Sumbu X */}
                <div className="flex items-start justify-between gap-2 sm:gap-3 pl-7 pr-1 pt-2.5">
                  {indicatorStats.map((item, idx) => {
                    const IconComponent = item.icon
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center text-center gap-1">
                        <span
                          className={`h-6 w-6 rounded-lg border flex items-center justify-center ${item.iconBox}`}
                        >
                          <IconComponent size={13} />
                        </span>
                        <p className="text-[10px] sm:text-[11px] font-extrabold text-[#090D16] leading-tight break-words">
                          {item.short}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* AI Personal Habit Coach (3 Langkah Mikro Harian Spesifik Siswa) */}
          <PersonalHabitCoach
            studentName={latestStudent?.nama || 'Siswa Hebat'}
            studentAverages={studentTenAverages}
          />

          {/* Riwayat Pengisian Pribadi */}
          <div className="kaih-glass-card p-6 rounded-3xl space-y-4">
            <h2 className="font-heading text-base font-extrabold text-[#090D16]">
              Riwayat Pengisian Pribadi ({rows.length} Sesi)
            </h2>

            <div className="space-y-3">
              {rows.map((r) => {
                const rowAvg = computeRowAverage(r)
                const rowPct = Math.min(100, Math.round((rowAvg / 4) * 100))
                const rowPred = getPredicate(rowAvg)
                const scores = parseRowScores(r).filter((v) => v >= 1 && v <= 4)

                return (
                  <div
                    key={r.id}
                    className="habit-folder-card p-4 rounded-2xl bg-white/90 border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[#090D16] flex items-center gap-1.5">
                          <User size={14} className="text-indigo-700" />
                          {r.nama}
                        </span>
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200">
                          {r.kelas} {r.no_absen ? `• Absen ${r.no_absen}` : ''}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${rowPred.color}`}
                        >
                          {rowPred.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>
                          {new Date(r.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>• Skor: [{scores.join(', ')}]</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 bg-indigo-50/70 px-4 py-2 rounded-xl border border-indigo-100">
                      <div className="text-right">
                        <p className="text-[10px] font-extrabold uppercase text-slate-700">Rata-Rata</p>
                        <p className="text-base font-black text-indigo-800">
                          {rowAvg.toFixed(2)}{' '}
                          <span className="text-[11px] font-bold text-slate-600">/ 4.0</span>
                        </p>
                      </div>
                      <div className="h-7 w-px bg-indigo-200" />
                      <div className="text-right">
                        <p className="text-[10px] font-extrabold uppercase text-slate-700">Capaian</p>
                        <p className="text-base font-black text-emerald-700">{rowPct}%</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function StatistikPage() {
  return (
    <Suspense
      fallback={
        <div className="kaih-glass-card p-10 rounded-3xl text-center text-slate-800 font-semibold text-sm">
          Memuat statistik pribadi...
        </div>
      }
    >
      <StatistikContent />
    </Suspense>
  )
}