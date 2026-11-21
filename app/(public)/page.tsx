'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import HeroSection from '@/components/public/HeroSection'
import RadarChart7KAIH from '@/components/public/RadarChart7KAIH'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  BarChart3,
  UserCheck,
  MousePointerClick,
  Sparkles,
  Flame,
  Trophy,
  Award,
  Zap,
  Lock,
  ArrowUpRight,
  X,
  FolderKanban,
  Sunrise,
  HeartHandshake,
  Dumbbell,
  Apple,
  BookOpenCheck,
  Users,
  MoonStar,
  TrendingUp,
  Target,
  Lightbulb,
  Compass,
  Medal,
} from 'lucide-react'

const TOTAL_ABSEN_PER_KELAS = 36

const INDICATOR_DETAILS = [
  {
    short: 'Bangun Pagi',
    full: 'Saya bangun pagi tepat waktu.',
    action:
      'Programkan pengingat pagi bersama wali kelas serta apresiasi siswa hadir tepat waktu sebelum pukul 06.50 WIB.',
  },
  {
    short: 'Beribadah',
    full: 'Saya beribadah sesuai keyakinan.',
    action:
      'Optimalkan pembiasaan doa bersama sebelum jam pertama dan kegiatan rohani terjadwal.',
  },
  {
    short: 'Berolahraga',
    full: 'Saya berolahraga secara teratur.',
    action:
      'Aktifkan senam pagi Jumat sehat dan tantangan kebugaran mingguan antar kelas.',
  },
  {
    short: 'Makan Sehat',
    full: 'Saya mengonsumsi makanan sehat dan bergizi.',
    action:
      'Edukasi sarapan bergizi sebelum berangkat sekolah dan kampanye kantin sehat.',
  },
  {
    short: 'Gemar Membaca',
    full: 'Saya meluangkan waktu untuk membaca.',
    action:
      'Terapkan gerakan literasi 15 menit membaca buku non-pelajaran sebelum pembelajaran dimulai.',
  },
  {
    short: 'Bermasyarakat',
    full: 'Saya membantu orang tua dan peduli lingkungan.',
    action:
      'Berikan jurnal bakti sosial rumah dan piket kebersihan lingkungan kelas berbasis kolaborasi.',
  },
  {
    short: 'Tidur Cepat',
    full: 'Saya beristirahat dengan cukup.',
    action:
      'Sosialisasikan batas penggunaan gawai maksimal pukul 21.30 WIB agar siswa tidur cukup sebelum pukul 22.00.',
  },
  {
    short: 'Belajar',
    full: 'Saya belajar dengan tekun.',
    action:
      'Bentuk kelompok belajar sebaya (peer tutoring) untuk mendampingi materi pelajaran yang sulit.',
  },
  {
    short: 'Bersosialisasi',
    full: 'Saya berinteraksi dengan baik.',
    action:
      'Perkuat kegiatan kerja kelompok lintas minat dan budaya saling menghargai di sekolah.',
  },
  {
    short: 'Mengatur Waktu',
    full: 'Saya mengatur waktu dengan baik.',
    action:
      'Latih siswa menyusun jadwal prioritas harian antara tugas akademik, organisasi, dan istirahat.',
  },
]

type ClassRankingItem = {
  kelas: string
  avgScore: number
  participationPct: number
  compositePoints: number
  studentCount: number
}

type DashboardAnalytics = {
  completionPct: number
  overallScore: number
  totalResponses: number
  uniqueStudentsCount: number
  barAverages: number[]
  sevenDimensions: any[]
  userBadge: string
  userStreak: number
  userXp: number
  leaderboard: { name: string; kelas: string; xp: number }[]
  classLeaderboard: ClassRankingItem[]
  topIndicatorIdx: number
  lowestIndicatorIdx: number
  dailyVelocity: number
  estimatedDaysTo85: number
  estimatedDaysTo90: number
}

function normalizeClassName(raw: string): string {
  return (raw || '')
    .replace(/^kelas\s+/i, '')
    .replace(/\./g, '-')
    .trim()
    .toUpperCase()
}

function normalizeStudentName(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseRowScores(row: any): (number | null)[] {
  if (Array.isArray(row?.answers_json) && row.answers_json.length > 0) {
    return Array.from({ length: 10 }, (_, idx) => {
      const val = Number(row.answers_json[idx])
      return Number.isFinite(val) && val >= 1 && val <= 4 ? val : null
    })
  }
  return Array.from({ length: 10 }, (_, index) => {
    const value = Number(row[`q${index + 1}`])
    return Number.isFinite(value) && value >= 1 && value <= 4 ? value : null
  })
}

function processSupabaseRows(rows: any[], email: string | null = null): DashboardAnalytics {
  const allScores = rows.flatMap(parseRowScores).filter((value): value is number => value !== null)

  const barAverages = Array.from({ length: 10 }, (_, index) => {
    const values = rows
      .map((row) => parseRowScores(row)[index])
      .filter((value): value is number => value !== null)
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
  })

  const overallScore = allScores.length
    ? allScores.reduce((sum, value) => sum + value, 0) / allScores.length
    : 0

  let topIndicatorIdx = 0
  let lowestIndicatorIdx = 0
  barAverages.forEach((val, idx) => {
    if (val > barAverages[topIndicatorIdx]) topIndicatorIdx = idx
    if (val > 0 && (barAverages[lowestIndicatorIdx] === 0 || val < barAverages[lowestIndicatorIdx])) {
      lowestIndicatorIdx = idx
    }
  })

  // 1. Peta referensi dari baris yang sudah memiliki nomor absen valid (1..36)
  const emailToAbsen = new Map<string, number>()
  const nameToAbsen = new Map<string, number>()
  const prefixToAbsen = new Map<string, number>()
  const usedAbsenByClass = new Map<string, Set<number>>()

  rows.forEach((row) => {
    const cls = normalizeClassName(row.kelas)
    const absenNum = Number(row.no_absen)
    if (!cls || isNaN(absenNum) || absenNum < 1 || absenNum > TOTAL_ABSEN_PER_KELAS) return

    if (!usedAbsenByClass.has(cls)) usedAbsenByClass.set(cls, new Set())
    usedAbsenByClass.get(cls)!.add(absenNum)

    const cleanEmail = String(row.email || '').trim().toLowerCase()
    const cleanNameNorm = normalizeStudentName(row.nama || '')
    const prefix = cleanNameNorm.split(' ').slice(0, 2).join(' ')

    if (cleanEmail) emailToAbsen.set(`${cls}::${cleanEmail}`, absenNum)
    if (cleanNameNorm.length >= 3) nameToAbsen.set(`${cls}::${cleanNameNorm}`, absenNum)
    if (prefix.length >= 5 && !prefixToAbsen.has(`${cls}::${prefix}`)) {
      prefixToAbsen.set(`${cls}::${prefix}`, absenNum)
    }
  })

  const orphanKeyToSlot = new Map<string, number>()
  const students = new Map<string, { name: string; kelas: string; score: number; count: number }>()
  const classStats = new Map<
    string,
    { totalScore: number; scoreCount: number; uniqueStudents: Set<string>; submissions: number }
  >()
  const uniqueDates = new Set<string>()

  rows.forEach((row) => {
    if (row.created_at) {
      uniqueDates.add(new Date(row.created_at).toISOString().slice(0, 10))
    }

    const cls = normalizeClassName(row.kelas)
    const cleanEmail = String(row.email || '').trim().toLowerCase()
    const cleanName = String(row.nama || 'Siswa').trim()
    const cleanNameNorm = normalizeStudentName(cleanName)
    const prefix = cleanNameNorm.split(' ').slice(0, 2).join(' ')

    let absenNum = Number(row.no_absen)
    if (isNaN(absenNum) || absenNum < 1 || absenNum > TOTAL_ABSEN_PER_KELAS) {
      absenNum =
        emailToAbsen.get(`${cls}::${cleanEmail}`) ??
        nameToAbsen.get(`${cls}::${cleanNameNorm}`) ??
        prefixToAbsen.get(`${cls}::${prefix}`) ??
        0
    }

    // Alokasikan entri no_absen = 0 yang belum cocok ke slot kosong 1..36 di kelasnya
    if (absenNum === 0 && cls && cls !== '-') {
      const orphanId = `${cls}::${cleanNameNorm || cleanEmail || row.id}`
      if (orphanKeyToSlot.has(orphanId)) {
        absenNum = orphanKeyToSlot.get(orphanId)!
      } else {
        const used = usedAbsenByClass.get(cls) || new Set<number>()
        for (let slot = 1; slot <= TOTAL_ABSEN_PER_KELAS; slot++) {
          if (!used.has(slot)) {
            absenNum = slot
            used.add(slot)
            usedAbsenByClass.set(cls, used)
            orphanKeyToSlot.set(orphanId, slot)
            break
          }
        }
      }
    }

    const hasValidAbsen = absenNum >= 1 && absenNum <= TOTAL_ABSEN_PER_KELAS
    const studentKey =
      cls && cls !== '-'
        ? hasValidAbsen
          ? `${cls}::ABSEN-${absenNum}`
          : `${cls}::ABSEN-${TOTAL_ABSEN_PER_KELAS}`
        : String(cleanEmail || cleanName || row.id).toLowerCase()

    const values = parseRowScores(row).filter((value): value is number => value !== null)
    if (!values.length) return

    const rowAvg = values.reduce((sum, value) => sum + value, 0) / values.length

    const student = students.get(studentKey) || {
      name: cleanName,
      kelas: cls || '-',
      score: 0,
      count: 0,
    }
    if (cleanName.length > student.name.length && !cleanName.includes('@')) {
      student.name = cleanName
    }
    student.score += rowAvg
    student.count += 1
    students.set(studentKey, student)

    if (cls && cls !== '-') {
      const cEntry = classStats.get(cls) || {
        totalScore: 0,
        scoreCount: 0,
        uniqueStudents: new Set<string>(),
        submissions: 0,
      }
      cEntry.totalScore += rowAvg
      cEntry.scoreCount += 1
      cEntry.uniqueStudents.add(studentKey)
      cEntry.submissions += 1
      classStats.set(cls, cEntry)
    }
  })

  const classLeaderboard: ClassRankingItem[] = Array.from(classStats.entries())
    .map(([kelas, stat]) => {
      const avgScore = stat.scoreCount > 0 ? stat.totalScore / stat.scoreCount : 0
      const studentCount = Math.min(TOTAL_ABSEN_PER_KELAS, stat.uniqueStudents.size)
      const participationPct = Math.min(
        100,
        Math.round((studentCount / TOTAL_ABSEN_PER_KELAS) * 100)
      )
      const compositePoints = Math.round((avgScore / 4) * 70 + (participationPct / 100) * 30)
      return {
        kelas,
        avgScore: Number(avgScore.toFixed(2)),
        participationPct,
        compositePoints,
        studentCount,
      }
    })
    .sort((a, b) => b.compositePoints - a.compositePoints || b.avgScore - a.avgScore)

  const leaderboard = Array.from(students.values())
    .map((student) => ({
      name: student.name,
      kelas: student.kelas,
      xp: Math.round((student.score / student.count) * 100),
    }))
    .sort((a, b) => b.xp - a.xp)

  const currentStudent = rows.filter(
    (row) => email && String(row.email || '').trim().toLowerCase() === email.trim().toLowerCase()
  )
  const currentScores = currentStudent
    .flatMap(parseRowScores)
    .filter((value): value is number => value !== null)
  const userScore = currentScores.length
    ? currentScores.reduce((sum, value) => sum + value, 0) / currentScores.length
    : 0

  const dimIndices = [[0], [1, 2], [3, 4], [5], [6], [7], [8, 9]]
  const sevenDimensions = dimIndices.map((idxs, dimIdx) => {
    const vals = idxs.map((i) => barAverages[i]).filter((v) => v > 0)
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    return {
      label: INDICATOR_DETAILS[dimIdx].short,
      subject: INDICATOR_DETAILS[dimIdx].short,
      score: Number(avg.toFixed(2)),
      target: 3.5,
      fullMark: 4,
    }
  })

  const completionPct = Math.min(100, Math.round((overallScore / 4) * 100))
  const activeDays = Math.max(1, uniqueDates.size)
  const dailyVelocity = Math.max(1, Math.round(rows.length / activeDays))
  const gap85 = Math.max(0, 85 - completionPct)
  const gap90 = Math.max(0, 90 - completionPct)
  const estimatedDaysTo85 = gap85 === 0 ? 0 : Math.max(2, Math.ceil((gap85 * 35) / dailyVelocity))
  const estimatedDaysTo90 = gap90 === 0 ? 0 : Math.max(4, Math.ceil((gap90 * 42) / dailyVelocity))

  return {
    completionPct,
    overallScore,
    totalResponses: rows.length,
    uniqueStudentsCount: students.size,
    barAverages,
    sevenDimensions,
    userBadge: userScore >= 3.5 ? 'Konsisten' : userScore > 0 ? 'Terus Bertumbuh' : 'Penjelajah',
    userStreak: currentStudent.length,
    userXp: Math.round(userScore * 100),
    leaderboard,
    classLeaderboard,
    topIndicatorIdx,
    lowestIndicatorIdx,
    dailyVelocity,
    estimatedDaysTo85,
    estimatedDaysTo90,
  }
}

function getPredicate(score: number) {
  if (score >= 3.5)
    return { label: 'Sangat Baik', color: 'bg-emerald-100/95 text-emerald-900 border-emerald-300' }
  if (score >= 2.75)
    return { label: 'Baik', color: 'bg-indigo-100/95 text-indigo-900 border-indigo-300' }
  if (score >= 2.0)
    return { label: 'Cukup', color: 'bg-amber-100/95 text-amber-900 border-amber-300' }
  return { label: 'Perlu Ditingkatkan', color: 'bg-rose-100/95 text-rose-900 border-rose-300' }
}

const GLOBAL_SEARCH_INDEX = [
  {
    title: 'Formulir Yuk Survey! (Evaluasi Harian)',
    category: 'Halaman Survei',
    desc: 'Isi 10 indikator 7 Kebiasaan Anak Indonesia Hebat dengan skala 1–4.',
    href: '/survey',
    keywords: 'survey survei evaluasi isi jawaban harian form kuesioner',
  },
  {
    title: 'Main Game: 7 KAIH Habit Quest',
    category: 'Halaman Game',
    desc: 'Kuis interaktif rotasi 6 jam dengan sistem level, XP, dan profil karakter.',
    href: '/game',
    keywords: 'game kuis main quest xp level karakter',
  },
  {
    title: 'Statistik Pribadi & AI Habit Coach',
    category: 'Halaman Statistik',
    desc: 'Lihat grafik radar pribadi, pelatih kebiasaan AI, riwayat harian, dan unduh rapor.',
    href: '/statistik',
    keywords: 'statistik pribadi rapor nilai rata-rata radar riwayat unduh png excel coach',
  },
  {
    title: 'Tentang 7 KAIH, Galeri & Tim Nexara',
    category: 'Halaman Tentang',
    desc: 'Informasi gerakan karakter SMAN 5 Semarang, galeri kegiatan, dan profil tim.',
    href: '/tentang',
    keywords: 'tentang tim pengembang nexara sman 5 semarang galeri foto kegiatan',
  },
  {
    title: 'Panduan 01: Bangun Pagi',
    category: 'Penjelasan 7 Kebiasaan',
    desc: 'Apa yang harus dilakukan setelah bangun pagi, cara menerapkan, dan tips konsisten.',
    href: '/kebiasaan/bangun-pagi',
    keywords: 'bangun pagi disiplin waktu alarm subuh',
  },
  {
    title: 'Panduan 02: Beribadah',
    category: 'Penjelasan 7 Kebiasaan',
    desc: 'Langkah praktis dan tips menjalankan ibadah tepat waktu serta berdoa.',
    href: '/kebiasaan/beribadah',
    keywords: 'beribadah doa spiritual agama',
  },
  {
    title: 'Panduan 03: Berolahraga',
    category: 'Penjelasan 7 Kebiasaan',
    desc: 'Cara menjaga kebugaran jasmani teratur minimal 3 kali seminggu.',
    href: '/kebiasaan/berolahraga',
    keywords: 'berolahraga kebugaran fisik lari senam',
  },
  {
    title: 'Panduan 04: Makan Sehat & Bergizi',
    category: 'Penjelasan 7 Kebiasaan',
    desc: 'Penerapan gizi seimbang, sarapan sehat, dan kebutuhan hidrasi harian.',
    href: '/kebiasaan/makan-sehat-bergizi',
    keywords: 'makan sehat bergizi nutrisi sayur buah sarapan',
  },
  {
    title: 'Panduan 05: Gemar Membaca',
    category: 'Penjelasan 7 Kebiasaan',
    desc: 'Tips menumbuhkan budaya literasi 15–30 menit setiap hari.',
    href: '/kebiasaan/gemar-membaca',
    keywords: 'gemar membaca literasi buku perpustakaan',
  },
  {
    title: 'Panduan 06: Membantu Orang Tua',
    category: 'Penjelasan 7 Kebiasaan',
    desc: 'Bakti kepada orang tua, kepedulian lingkungan, dan gotong royong.',
    href: '/kebiasaan/membantu-orang-tua',
    keywords: 'membantu orang tua bermasyarakat sosial bakti',
  },
  {
    title: 'Panduan 07: Istirahat Cukup',
    category: 'Penjelasan 7 Kebiasaan',
    desc: 'Cara tidur malam berkualitas sebelum pukul 22.00 tanpa begadang.',
    href: '/kebiasaan/istirahat-cukup',
    keywords: 'istirahat cukup tidur cepat pemulihan gadget',
  },
]

const HABIT_THEMES = [
  {
    num: '01',
    slug: 'bangun-pagi',
    tag: 'Disiplin Waktu',
    title: 'Bangun Pagi',
    desc: 'Bangun tepat waktu sebelum pukul 05.30 untuk memulai hari dengan disiplin.',
    icon: Sunrise,
    iconBg: 'bg-amber-100 text-amber-700 border-amber-300',
    badgeBg: 'bg-amber-100 text-amber-800',
    watermarkColor: 'text-amber-500/15',
    cardTint: 'from-amber-50/90 via-white/85 to-orange-50/80 border-amber-200/80',
  },
  {
    num: '02',
    slug: 'beribadah',
    tag: 'Spiritual',
    title: 'Beribadah',
    desc: 'Taat menjalankan ibadah tepat waktu sesuai keyakinan serta berdoa.',
    icon: HeartHandshake,
    iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    watermarkColor: 'text-emerald-500/15',
    cardTint: 'from-emerald-50/90 via-white/85 to-teal-50/80 border-emerald-200/80',
  },
  {
    num: '03',
    slug: 'berolahraga',
    tag: 'Kebugaran',
    title: 'Berolahraga',
    desc: 'Menjaga kesehatan jasmani secara teratur minimal 3 kali dalam seminggu.',
    icon: Dumbbell,
    iconBg: 'bg-sky-100 text-sky-700 border-sky-300',
    badgeBg: 'bg-sky-100 text-sky-800',
    watermarkColor: 'text-sky-500/15',
    cardTint: 'from-sky-50/90 via-white/85 to-cyan-50/80 border-sky-200/80',
  },
  {
    num: '04',
    slug: 'makan-sehat-bergizi',
    tag: 'Nutrisi',
    title: 'Makan Sehat & Bergizi',
    desc: 'Mengonsumsi makanan bernutrisi seimbang (buah, sayur, protein).',
    icon: Apple,
    iconBg: 'bg-rose-100 text-rose-700 border-rose-300',
    badgeBg: 'bg-rose-100 text-rose-800',
    watermarkColor: 'text-rose-500/15',
    cardTint: 'from-rose-50/90 via-white/85 to-pink-50/80 border-rose-200/80',
  },
  {
    num: '05',
    slug: 'gemar-membaca',
    tag: 'Literasi',
    title: 'Gemar Membaca',
    desc: 'Membaca buku literasi minimal 15–30 menit setiap hari untuk wawasan luas.',
    icon: BookOpenCheck,
    iconBg: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    watermarkColor: 'text-indigo-500/15',
    cardTint: 'from-indigo-50/90 via-white/85 to-blue-50/80 border-indigo-200/80',
  },
  {
    num: '06',
    slug: 'membantu-orang-tua',
    tag: 'Sosial & Bakti',
    title: 'Membantu Orang Tua',
    desc: 'Membantu pekerjaan rumah, peduli lingkungan, dan bergotong royong.',
    icon: Users,
    iconBg: 'bg-orange-100 text-orange-700 border-orange-300',
    badgeBg: 'bg-orange-100 text-orange-800',
    watermarkColor: 'text-orange-500/15',
    cardTint: 'from-orange-50/90 via-white/85 to-amber-50/80 border-orange-200/80',
  },
  {
    num: '07',
    slug: 'istirahat-cukup',
    tag: 'Pemulihan',
    title: 'Istirahat Cukup',
    desc: 'Tidur malam sebelum pukul 22.00 dan bebas gadget demi pemulihan energi.',
    icon: MoonStar,
    iconBg: 'bg-violet-100 text-violet-700 border-violet-300',
    badgeBg: 'bg-violet-100 text-violet-800',
    watermarkColor: 'text-violet-500/15',
    cardTint: 'from-violet-50/90 via-white/85 to-purple-50/80 border-violet-200/80',
  },
]

function InteractiveDonutChart({
  completion,
  overallScore,
  totalResponses,
  uniqueStudentsCount,
}: {
  completion: number
  overallScore: number
  totalResponses: number
  uniqueStudentsCount: number
}) {
  const [showScoreMode, setShowScoreMode] = useState(false)
  const safeCompletion = Math.min(100, Math.max(0, completion))

  return (
    <div
      onClick={() => setShowScoreMode(!showScoreMode)}
      title="Ketuk untuk mengganti tampilan Persentase / Skor Rata-Rata"
      className="kaih-glass-card p-5 sm:p-6 rounded-3xl cursor-pointer hover:border-indigo-400 hover:shadow-lg transition-all duration-300 select-none group flex flex-col justify-between relative overflow-hidden"
    >
      <Sparkles
        size={96}
        className="absolute -right-4 -bottom-4 text-indigo-500/[0.08] pointer-events-none"
      />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div>
          <h3 className="font-heading font-extrabold text-[#090D16] text-base sm:text-lg group-hover:text-indigo-700 transition-colors">
            Progress Kebiasaan
          </h3>
          <p className="text-xs text-slate-800 font-medium flex items-center gap-1">
            <MousePointerClick size={12} className="text-indigo-700 shrink-0" />
            <span>Sinkron Real-Time Supabase</span>
          </p>
        </div>
        <span className="bg-indigo-100 text-indigo-900 text-xs font-extrabold px-3 py-1 rounded-full shrink-0 border border-indigo-200">
          {showScoreMode ? `${overallScore.toFixed(2)} / 4.0` : `${safeCompletion}%`}
        </span>
      </div>

      <div className="flex items-center justify-center py-3 relative z-10">
        <div className="relative h-40 w-40 transition-transform duration-300 group-hover:scale-105">
          <div className="absolute inset-0 rounded-full bg-white/75" />
          <div
            className="absolute inset-0 rounded-full transition-all duration-700"
            style={{
              background: `conic-gradient(#4f46e5 0 ${safeCompletion}%, rgba(203,213,225,0.65) ${safeCompletion}% 100%)`,
            }}
          />
          <div className="absolute inset-4 rounded-full bg-white/95 shadow-inner flex items-center justify-center">
            <div className="text-center">
              <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#090D16]">
                {showScoreMode ? overallScore.toFixed(2) : `${safeCompletion}%`}
              </div>
              <div className="text-[11px] font-bold text-slate-700">
                {showScoreMode ? 'Skor Skala 4.0' : 'Tercapai'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-2 relative z-10">
        <div className="bg-white/80 border border-white p-3 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">
            Siswa Berpartisipasi
          </p>
          <p className="font-extrabold text-[#090D16] text-sm mt-0.5">
            {uniqueStudentsCount.toLocaleString('id-ID')} Siswa
          </p>
        </div>
        <div className="bg-indigo-100/80 border border-indigo-200 p-3 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-900">
            Total Rekapan
          </p>
          <p className="font-extrabold text-indigo-950 text-sm mt-0.5">
            {totalResponses.toLocaleString('id-ID')} Data
          </p>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBarIdx, setSelectedBarIdx] = useState<number>(0)
  const [loadingChart, setLoadingChart] = useState(true)
  const [savedStudentEmail, setSavedStudentEmail] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<DashboardAnalytics>(() => processSupabaseRows([]))

  useEffect(() => {
    const email = localStorage.getItem('kaih_student_email')
    if (email) setSavedStudentEmail(email)
  }, [])

  const fetchStats = useCallback(async () => {
    let allRows: any[] = []
    let from = 0
    const pageSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from('survey_responses')
        .select(
          'id, nama, no_absen, kelas, email, created_at, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, answers_json'
        )
        .range(from, from + pageSize - 1)

      if (error || !data || data.length === 0) break
      allRows = allRows.concat(data)
      if (data.length < pageSize) break
      from += pageSize
    }

    const email = localStorage.getItem('kaih_student_email')
    setAnalytics(processSupabaseRows(allRows, email))
    setLoadingChart(false)
  }, [supabase])

  useEffect(() => {
    fetchStats()

    const channel = supabase
      .channel('realtime-homepage-survey-responses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'survey_responses' },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchStats, supabase])

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const isSearchingAdmin =
    trimmedQuery.includes('admin') ||
    trimmedQuery.includes('panel') ||
    trimmedQuery.includes('database') ||
    trimmedQuery.includes('edit')

  const globalSearchResults = trimmedQuery
    ? GLOBAL_SEARCH_INDEX.filter(
        (item) =>
          item.title.toLowerCase().includes(trimmedQuery) ||
          item.desc.toLowerCase().includes(trimmedQuery) ||
          item.keywords.toLowerCase().includes(trimmedQuery)
      )
    : []

  const selectedAvg = analytics.barAverages[selectedBarIdx] || 0
  const selectedPct = Math.min(100, Math.round((selectedAvg / 4) * 100))
  const selectedPredicate = getPredicate(selectedAvg)

  const safeTopIdx =
    typeof analytics.topIndicatorIdx === 'number' && INDICATOR_DETAILS[analytics.topIndicatorIdx]
      ? analytics.topIndicatorIdx
      : 0
  const safeLowestIdx =
    typeof analytics.lowestIndicatorIdx === 'number' &&
    INDICATOR_DETAILS[analytics.lowestIndicatorIdx]
      ? analytics.lowestIndicatorIdx
      : 0

  const topIndicator = INDICATOR_DETAILS[safeTopIdx]
  const topScore = analytics.barAverages[safeTopIdx] || 0
  const lowestIndicator = INDICATOR_DETAILS[safeLowestIdx]
  const lowestScore = analytics.barAverages[safeLowestIdx] || 0

  return (
    <div className="space-y-5 font-sans text-[#090D16]">
      {/* Paling Atas: Kolom Pencarian Bersih */}
      <div className="relative z-20">
        <div className="kaih-glass-card rounded-3xl px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 bg-white/90 border border-white px-4 py-2 rounded-full flex-1 min-w-[200px] focus-within:ring-2 focus-within:ring-indigo-500">
            <Search size={15} className="text-slate-700 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu, panduan kebiasaan, kuis, rapor..."
              className="bg-transparent text-xs sm:text-sm focus:outline-none w-full text-[#090D16] font-semibold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {savedStudentEmail && (
            <Link
              href="/statistik"
              className="hidden sm:inline-flex items-center gap-1.5 bg-white/90 border border-white text-slate-900 px-3.5 py-2 rounded-full text-xs font-bold hover:bg-white transition-all shrink-0"
            >
              <UserCheck size={13} className="text-indigo-700" />
              <span className="max-w-[160px] truncate">{savedStudentEmail}</span>
            </Link>
          )}
        </div>

        {/* Dropdown Hasil Pencarian Global */}
        {trimmedQuery && (
          <div className="mt-2.5 bg-white/95 backdrop-blur-2xl border border-white rounded-3xl p-4 shadow-xl space-y-2">
            {isSearchingAdmin && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Lock size={16} className="text-amber-700 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-amber-950">
                      Area Panel Admin Terbatas
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Halaman pengelolaan database hanya dapat diakses melalui login resmi Admin.
                    </p>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-[11px] font-bold shrink-0"
                >
                  Login Admin
                </Link>
              </div>
            )}

            {globalSearchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {globalSearchResults.map((res, idx) => (
                  <Link
                    key={idx}
                    href={res.href}
                    onClick={() => setSearchQuery('')}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 flex items-start justify-between gap-2 transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-indigo-700">
                        {res.category}
                      </span>
                      <p className="text-xs font-extrabold text-[#090D16] mt-0.5">{res.title}</p>
                      <p className="text-[11px] text-slate-700 line-clamp-1 mt-0.5">{res.desc}</p>
                    </div>
                    <ArrowUpRight size={15} className="text-indigo-700 shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            ) : (
              !isSearchingAdmin && (
                <p className="text-xs text-slate-700 py-2 text-center font-medium">
                  Tidak ditemukan konten untuk kata kunci <strong>"{searchQuery}"</strong>.
                </p>
              )
            )}
          </div>
        )}
      </div>

      {/* Hero Section */}
      <Suspense
        fallback={
          <div className="h-[220px] bg-indigo-950/80 rounded-3xl flex items-center justify-center text-white">
            <p className="text-slate-200 animate-pulse font-semibold">Memuat Beranda...</p>
          </div>
        }
      >
        <HeroSection />
      </Suspense>

      {/* Banner Partisipasi & Proyeksi Target Ketercapaian Karakter Sekolah */}
      <div className="kaih-glass-card p-5 sm:p-6 rounded-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-heading text-sm sm:text-base font-extrabold text-[#090D16]">
              Total Siswa Berpartisipasi &amp; Proyeksi Target Sekolah
            </span>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              Laju pengisian rata-rata{' '}
              <strong className="text-indigo-800">{analytics.dailyVelocity} rekapan/hari</strong>{' '}
              dari total {analytics.totalResponses.toLocaleString('id-ID')} data masuk
            </p>
          </div>
          <span className="font-heading text-base sm:text-lg font-black text-indigo-700">
            {analytics.uniqueStudentsCount.toLocaleString('id-ID')} Siswa ({analytics.completionPct}
            %)
          </span>
        </div>

        <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden p-0.5 border border-white">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-sky-500 rounded-full transition-all duration-700"
            style={{ width: `${analytics.completionPct}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="bg-white/80 border border-white rounded-2xl px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Compass size={15} className="text-emerald-600 shrink-0" />
              <span>Proyeksi Target 85% (Sangat Baik)</span>
            </div>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
              {analytics.estimatedDaysTo85 === 0
                ? 'Sudah Tercapai!'
                : `± ${analytics.estimatedDaysTo85} Hari Aktif`}
            </span>
          </div>

          <div className="bg-white/80 border border-white rounded-2xl px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Compass size={15} className="text-indigo-600 shrink-0" />
              <span>Proyeksi Target 90% (Unggul)</span>
            </div>
            <span className="text-xs font-black text-indigo-900 bg-indigo-100 px-2.5 py-1 rounded-lg">
              {analytics.estimatedDaysTo90 === 0
                ? 'Sudah Tercapai!'
                : `± ${analytics.estimatedDaysTo90} Hari Aktif`}
            </span>
          </div>
        </div>
      </div>

      {/* Insight Analisis Data & Rekomendasi Tindak Lanjut Sekolah */}
      {!loadingChart && analytics.totalResponses > 0 && (
        <section className="kaih-glass-card p-5 sm:p-6 rounded-3xl space-y-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full">
              <Lightbulb size={13} />
              <span>Analisis Pola &amp; Rekomendasi Sekolah</span>
            </span>
            <h2 className="font-heading text-base sm:text-lg font-extrabold text-[#090D16] mt-2">
              Temuan Utama &amp; Prioritas Pembinaan Karakter SMAN 5 Semarang
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-extrabold">
                <TrendingUp size={15} />
                <span>Kebiasaan Paling Kuat</span>
              </div>
              <p className="text-base font-black text-emerald-950">
                {topIndicator.short} ({topScore.toFixed(2)} / 4.0)
              </p>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Menjadi budaya positif tertinggi di kalangan siswa. Pertahankan melalui apresiasi
                rutin di sekolah.
              </p>
            </div>

            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-extrabold">
                <Target size={15} />
                <span>Prioritas Peningkatan</span>
              </div>
              <p className="text-base font-black text-amber-950">
                {lowestIndicator.short} ({lowestScore.toFixed(2)} / 4.0)
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">
                Memiliki skor rata-rata terendah dibanding indikator lain sehingga menjadi fokus
                pembinaan utama.
              </p>
            </div>

            <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-800 text-xs font-extrabold">
                <Sparkles size={15} />
                <span>Rekomendasi Tindak Lanjut</span>
              </div>
              <p className="text-xs font-bold text-indigo-950 leading-relaxed">
                {lowestIndicator.action}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Bento Grid Baris 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        <InteractiveDonutChart
          completion={analytics.completionPct}
          overallScore={analytics.overallScore}
          totalResponses={analytics.totalResponses}
          uniqueStudentsCount={analytics.uniqueStudentsCount}
        />

        <RadarChart7KAIH dimensions={analytics.sevenDimensions} />

        <div className="kaih-glass-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between space-y-4 md:col-span-2 xl:col-span-1 relative overflow-hidden">
          <Trophy
            size={100}
            className="absolute -right-4 -bottom-4 text-amber-500/[0.08] pointer-events-none"
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-extrabold text-[#090D16] text-base sm:text-lg flex items-center gap-2">
                <Trophy size={18} className="text-amber-600 shrink-0" />
                <span>Pencapaian &amp; Peringkat</span>
              </h3>
              <span className="bg-amber-100 text-amber-900 text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-amber-300">
                {analytics.userBadge}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-gradient-to-br from-amber-100/85 to-orange-100/80 border border-amber-300/70 p-3 rounded-2xl">
                <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold">
                  <Flame size={14} />
                  <span>Streak Aktif</span>
                </div>
                <p className="text-xl font-black text-[#090D16] mt-1">
                  {analytics.userStreak}{' '}
                  <span className="text-xs font-bold text-slate-700">Hari</span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-100/85 to-sky-100/80 border border-indigo-300/70 p-3 rounded-2xl">
                <div className="flex items-center gap-1.5 text-indigo-800 text-[11px] font-extrabold">
                  <Zap size={14} />
                  <span>Poin XP</span>
                </div>
                <p className="text-xl font-black text-indigo-900 mt-1">
                  {analytics.userXp.toLocaleString('id-ID')}{' '}
                  <span className="text-xs font-bold text-indigo-700">XP</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                <Award size={13} className="text-indigo-700" />
                <span>Top Siswa Konsisten</span>
              </p>
              {analytics.leaderboard.length === 0 ? (
                <p className="text-xs text-slate-700 py-3 text-center bg-white/75 rounded-2xl font-medium">
                  Belum ada data peringkat siswa.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {analytics.leaderboard.slice(0, 3).map((student, idx) => (
                    <div
                      key={`${student.name}-${idx}`}
                      className="flex items-center justify-between bg-white/80 px-3 py-2 rounded-xl border border-white"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? 'bg-amber-500 text-white'
                              : idx === 1
                              ? 'bg-slate-500 text-white'
                              : 'bg-orange-500 text-white'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#090D16] truncate">
                            {student.name}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-700 truncate">
                            {student.kelas}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-indigo-800 shrink-0">
                        {student.xp.toLocaleString('id-ID')} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 relative z-10">
            <Link
              href="/statistik"
              className="py-2.5 px-3 bg-white/85 hover:bg-white border border-white text-indigo-800 rounded-xl font-extrabold text-xs text-center transition-all"
            >
              Statistik Saya
            </Link>
            <Link
              href="/game"
              className="py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white rounded-xl font-extrabold text-xs text-center transition-all shadow-xs"
            >
              Main Kuis
            </Link>
          </div>
        </div>
      </div>

      {/* Klasemen Antar Kelas (Menjaga Privasi Skor Pribadi) */}
      {analytics.classLeaderboard.length > 0 && (
        <section className="kaih-glass-card p-5 sm:p-6 rounded-3xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                <Medal size={13} />
                <span>Klasemen Kolektif Antar Kelas</span>
              </span>
              <h2 className="font-heading text-base sm:text-lg font-extrabold text-[#090D16] mt-2">
                Kelas Paling Konsisten &amp; Partisipatif SMAN 5 Semarang
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-700">
              Gabungan Skor Kebiasaan (70%) + Partisipasi Kelas (30%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {analytics.classLeaderboard.slice(0, 5).map((clsItem, idx) => (
              <div
                key={clsItem.kelas}
                className="bg-white/85 border border-white rounded-2xl p-4 flex flex-col justify-between space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-900'
                        : idx === 2
                        ? 'bg-orange-300 text-slate-950'
                        : 'bg-indigo-100 text-indigo-900'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-black text-indigo-800">
                    {clsItem.compositePoints} Poin
                  </span>
                </div>

                <div>
                  <p className="font-heading text-lg font-black text-[#090D16]">
                    Kelas {clsItem.kelas}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600">
                    {clsItem.studentCount}/{TOTAL_ABSEN_PER_KELAS} Siswa (
                    {clsItem.participationPct}%)
                  </p>
                </div>

                <div className="pt-1 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-600">Rata-rata</span>
                  <span className="text-emerald-800 font-black">
                    {clsItem.avgScore.toFixed(2)} / 4.0
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Chart Batang Rata-Rata Jawaban Siswa */}
      <div className="kaih-glass-card p-5 sm:p-8 rounded-3xl space-y-5 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-extrabold text-[#090D16] text-base sm:text-lg flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-700 shrink-0" />
              <span>Chart Batang Rata-Rata Jawaban Siswa</span>
            </h3>
            <p className="text-xs text-slate-800 font-medium flex items-center gap-1 mt-1">
              <MousePointerClick size={13} className="text-indigo-700 shrink-0" />
              <span>Ketuk salah satu indikator untuk melihat detail rata-ratanya</span>
            </p>
          </div>
          <span className="bg-indigo-100 text-indigo-900 text-xs font-extrabold px-3 py-1 rounded-full border border-indigo-200">
            Skala 1.0 – 4.0
          </span>
        </div>

        {loadingChart ? (
          <div className="h-48 flex items-center justify-center text-sm text-slate-800 font-semibold animate-pulse">
            Memuat grafik capaian siswa...
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 sm:hidden border-b border-slate-300/60 pb-5">
              {analytics.barAverages.map((avg, idx) => {
                const safeAvg = Math.min(4, Math.max(0, avg))
                const widthPercent = Math.round((safeAvg / 4) * 100)
                const isSelected = selectedBarIdx === idx

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedBarIdx(idx)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-100/90 border-indigo-500 shadow-xs'
                        : 'bg-white/75 border-white hover:bg-white/95'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span
                        className={`font-extrabold ${
                          isSelected ? 'text-indigo-900' : 'text-[#090D16]'
                        }`}
                      >
                        {idx + 1}. {INDICATOR_DETAILS[idx].short}
                      </span>
                      <span
                        className={`font-black ${
                          isSelected ? 'text-indigo-900' : 'text-slate-800'
                        }`}
                      >
                        {safeAvg.toFixed(1)}{' '}
                        <span className="text-[10px] font-semibold text-slate-600">/ 4.0</span>
                      </span>
                    </div>

                    <div className="w-full h-3 bg-white/85 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500'
                            : 'bg-gradient-to-r from-indigo-500 to-sky-400'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="hidden sm:grid sm:grid-cols-10 gap-2 items-end h-56 pt-6 px-1 border-b border-slate-300/60">
              {analytics.barAverages.map((avg, idx) => {
                const safeAvg = Math.min(4, Math.max(0, avg))
                const heightPercent = Math.round((safeAvg / 4) * 100)
                const isSelected = selectedBarIdx === idx

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedBarIdx(idx)}
                    className={`flex flex-col items-center h-full justify-end group p-1.5 rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/95 ring-2 ring-indigo-600 -translate-y-1 shadow-sm'
                        : 'hover:bg-white/70 hover:-translate-y-0.5'
                    }`}
                  >
                    <span
                      className={`text-xs font-black mb-1.5 transition-transform ${
                        isSelected ? 'text-indigo-800 scale-110' : 'text-[#090D16]'
                      }`}
                    >
                      {safeAvg.toFixed(1)}
                    </span>
                    <div className="w-full max-w-[30px] bg-white/75 rounded-t-xl h-36 flex items-end overflow-hidden border border-white">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isSelected
                            ? 'bg-gradient-to-t from-indigo-700 via-purple-600 to-sky-500'
                            : 'bg-gradient-to-t from-indigo-500 to-sky-400 opacity-90 group-hover:opacity-100'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] text-center mt-2 leading-tight line-clamp-2 h-7 ${
                        isSelected ? 'font-extrabold text-indigo-800' : 'font-bold text-slate-800'
                      }`}
                    >
                      {INDICATOR_DETAILS[idx].short}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="bg-white/85 border border-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-lg">
                    Indikator #{selectedBarIdx + 1} • {INDICATOR_DETAILS[selectedBarIdx].short}
                  </span>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${selectedPredicate.color}`}
                  >
                    {selectedPredicate.label}
                  </span>
                </div>
                <p className="text-sm font-extrabold text-[#090D16] leading-relaxed">
                  "{INDICATOR_DETAILS[selectedBarIdx].full}"
                </p>
              </div>

              <div className="flex items-center justify-around sm:justify-start gap-4 shrink-0 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="text-center">
                  <p className="text-[10px] font-extrabold uppercase text-slate-700">
                    Rata-Rata Skor
                  </p>
                  <p className="text-2xl font-black text-indigo-800">
                    {selectedAvg.toFixed(2)}{' '}
                    <span className="text-xs font-bold text-slate-600">/ 4.0</span>
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <p className="text-[10px] font-extrabold uppercase text-slate-700">Persentase</p>
                  <p className="text-2xl font-black text-sky-700">{selectedPct}%</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Interactive Habit Folder Cards */}
      <section id="kebiasaan-section" className="kaih-glass-card p-6 sm:p-8 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-900 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <FolderKanban size={13} />
              <span>7 Dimensi Karakter</span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#090D16]">
              7 Kebiasaan Anak Indonesia Hebat
            </h2>
          </div>
          <p className="text-slate-800 font-medium text-xs sm:text-sm max-w-md leading-relaxed">
            Klik salah satu kartu kebiasaan di bawah ini untuk membaca panduan lengkap, langkah
            penerapan, dan tips konsisten.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HABIT_THEMES.map((item) => {
            const IconComponent = item.icon
            return (
              <Link
                key={item.num}
                href={`/kebiasaan/${item.slug}`}
                className={`habit-folder-card group relative bg-gradient-to-br p-5 rounded-2xl border block overflow-hidden ${item.cardTint}`}
              >
                <IconComponent
                  size={96}
                  className={`absolute -right-3 -bottom-3 ${item.watermarkColor} group-hover:scale-110 transition-transform duration-300 pointer-events-none`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-9 w-9 rounded-xl border flex items-center justify-center shadow-2xs ${item.iconBg}`}
                      >
                        <IconComponent size={18} />
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 text-white text-[10px] font-black tracking-wider">
                        #{item.num}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${item.badgeBg}`}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="font-heading text-base font-extrabold text-[#090D16] group-hover:text-indigo-700 transition-colors mb-1.5 flex items-center justify-between">
                    <span>{item.title}</span>
                    <ArrowUpRight
                      size={16}
                      className="text-slate-600 group-hover:text-indigo-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </h3>
                  <p className="text-slate-800 font-medium text-xs leading-relaxed pr-6">
                    {item.desc}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}