'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  RefreshCw,
  Calendar,
  Award,
  TrendingUp,
  ClipboardCheck,
  UserCheck,
  AlertCircle,
} from 'lucide-react'

const GOOGLE_SHEET_API_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL ||
  'https://script.google.com/macros/s/AKfycbyGCDCIQMCbgqy0l3hAjtuZs_Ed9F6xsj09cU9oxxnG72WizU_Q0sOVobnRtvYjGS5T/exec'

const INDICATOR_NAMES = [
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

interface StudentSubmission {
  timestamp: string
  nama: string
  kelas: string
  email: string
  scores: number[]
  rowAvg: number
}

export default function StatistikPribadiPage() {
  const [emailInput, setEmailInput] = useState('')
  const [activeEmail, setActiveEmail] = useState('')
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const getPredicate = (score: number) => {
    if (score >= 4.2) {
      return {
        label: 'Sangat Baik (Membudaya)',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      }
    }
    if (score >= 3.4) {
      return {
        label: 'Baik (Konsisten)',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      }
    }
    if (score >= 2.5) {
      return {
        label: 'Cukup (Perlu Pembiasaan)',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
      }
    }
    return {
      label: 'Perlu Ditingkatkan',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
    }
  }

  const extractEmail = (row: any): string => {
    const raw =
      row.email ||
      row.Email ||
      row['Email Aktif Siswa'] ||
      row['EMAIL AKTIF SISWA'] ||
      row.user_email ||
      ''
    return String(raw).trim().toLowerCase()
  }

  const extractScores = (row: any): number[] => {
    if (Array.isArray(row.scores) && row.scores.length > 0) {
      return row.scores.slice(0, 10).map((v: any) => Number(v) || 0)
    }
    const keys = Object.keys(row)
    const scoreKeys = keys.filter(
      (k) =>
        /^q\d+/i.test(k) ||
        /^indikator/i.test(k) ||
        /^skor/i.test(k) ||
        /^\d+\./.test(k)
    )
    if (scoreKeys.length >= 10) {
      return scoreKeys.slice(0, 10).map((k) => Number(row[k]) || 0)
    }
    return []
  }

  const fetchStudentData = useCallback(async (targetEmail: string, isManualRefresh = false) => {
    const cleanEmail = targetEmail.trim().toLowerCase()
    if (!cleanEmail) {
      setLoading(false)
      return
    }

    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setErrorMsg('')

    try {
      const separator = GOOGLE_SHEET_API_URL.includes('?') ? '&' : '?'
      const url = `${GOOGLE_SHEET_API_URL}${separator}t=${Date.now()}`

      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()

      const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []

      const matched: StudentSubmission[] = rows
        .filter((r: any) => extractEmail(r) === cleanEmail)
        .map((r: any) => {
          const scores = extractScores(r)
          const validScores = scores.filter((s) => s >= 1 && s <= 5)
          const rowAvg =
            validScores.length > 0
              ? Number(
                  (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2)
                )
              : 0

          return {
            timestamp: String(
              r.timestamp || r.Timestamp || r.tanggal || r.Tanggal || 'Tercatat'
            ),
            nama: String(r.nama || r.Nama || r['Nama Lengkap'] || 'Siswa SMAN 5').trim(),
            kelas: String(r.kelas || r.Kelas || '-').trim(),
            email: cleanEmail,
            scores,
            rowAvg,
          }
        })
        .reverse()

      setSubmissions(matched)
      setActiveEmail(cleanEmail)
      localStorage.setItem('kaih_student_email', cleanEmail)
    } catch (err) {
      console.error('Gagal memuat data spreadsheet siswa:', err)
      setErrorMsg('Gagal terhubung ke Spreadsheet. Coba muat ulang beberapa saat lagi.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('kaih_student_email') || ''
    if (saved) {
      setEmailInput(saved)
      fetchStudentData(saved)
    } else {
      setLoading(false)
    }
  }, [fetchStudentData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return
    fetchStudentData(emailInput)
  }

  const indicatorAverages = Array.from({ length: 10 }, (_, idx) => {
    const vals = submissions
      .map((s) => s.scores[idx])
      .filter((v) => typeof v === 'number' && v >= 1 && v <= 5)
    if (vals.length === 0) return 0
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
  })

  const overallAverage =
    submissions.length > 0
      ? Number(
          (
            submissions.reduce((acc, item) => acc + item.rowAvg, 0) / submissions.length
          ).toFixed(2)
        )
      : 0

  const overallPct = Math.min(100, Math.round((overallAverage / 5) * 100))
  const predicate = getPredicate(overallAverage)
  const studentProfile = submissions[0]

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        {/* Header & Pencarian Email Pribadi */}
        <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Statistik Pribadi & Riwayat Spreadsheet
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Rekap otomatis hasil pengisian hari ini dan hari-hari sebelumnya dari Google Spreadsheet.
              </p>
            </div>

            <Link
              href="/survey"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              + Isi Survei Hari Ini
            </Link>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search
                size={17}
                className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Tuliskan email pribadi kalian yang dipakai saat mengisi survei"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
              >
                Tampilkan Data
              </button>

              {activeEmail && (
                <button
                  type="button"
                  onClick={() => fetchStudentData(activeEmail, true)}
                  disabled={refreshing}
                  title="Sinkronkan ulang dari Spreadsheet"
                  className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Sinkronkan</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-sm text-slate-400 animate-pulse">
            Mengambil riwayat pengisian dari Google Spreadsheet...
          </div>
        ) : !activeEmail ? (
          <div className="bg-white p-10 rounded-3xl border border-slate-100 text-center space-y-2">
            <p className="text-base font-bold text-slate-800">
              Masukkan Email Pribadi Kalian di Atas
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Gunakan email yang sama dengan yang kalian tuliskan pada formulir <strong>Yuk Survey!</strong> untuk melihat grafik dan rata-rata pengisian harian.
            </p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-slate-100 text-center space-y-3">
            <p className="text-base font-bold text-slate-800">
              Belum Ditemukan Data untuk <span className="text-indigo-600">{activeEmail}</span>
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Pastikan penulisan email sama persis dengan yang diisikan pada formulir survei, atau tekan tombol sinkronkan jika baru saja mengirim jawaban.
            </p>
            <div className="pt-2">
              <Link
                href="/survey"
                className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Isi Survei Sekarang →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Kartu Profil & Ringkasan Rata-Rata Kumulatif */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold">
                  <UserCheck size={15} />
                  <span>Profil Siswa</span>
                </div>
                <div className="my-3">
                  <p className="text-lg font-extrabold truncate">{studentProfile.nama}</p>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Kelas {studentProfile.kelas} • {studentProfile.email}
                  </p>
                </div>
                <span className="inline-block w-fit px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold">
                  {predicate.label}
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <TrendingUp size={15} className="text-indigo-600" />
                    Rata-Rata Kumulatif
                  </span>
                  <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {overallPct}%
                  </span>
                </div>
                <div className="my-2">
                  <p className="text-3xl font-black text-slate-900">
                    {overallAverage.toFixed(2)}{' '}
                    <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dihitung dari seluruh {submissions.length} kali pengisian
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <ClipboardCheck size={15} className="text-emerald-600" />
                    Total Hari / Entri
                  </span>
                  <Award size={18} className="text-amber-500" />
                </div>
                <div className="my-2">
                  <p className="text-3xl font-black text-slate-900">
                    {submissions.length}{' '}
                    <span className="text-sm font-semibold text-slate-400">Catatan</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Terakhir diisi: {submissions[0].timestamp}
                  </p>
                </div>
              </div>
            </div>

            {/* Grafik Rata-Rata Pribadi per Indikator (10 Kebiasaan) */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="font-bold text-slate-800 text-base sm:text-lg">
                Rata-Rata Pribadi per Indikator (10 Kebiasaan)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {INDICATOR_NAMES.map((label, idx) => {
                  const avg = indicatorAverages[idx] || 0
                  const pct = Math.round((avg / 5) * 100)
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          {idx + 1}. {label}
                        </span>
                        <span className="font-extrabold text-indigo-700">
                          {avg.toFixed(2)} / 5.0
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tabel Riwayat Pengisian Harian (Hari Ini & Hari-Hari Sebelumnya) */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  <span>Riwayat Pengisian Harian (Spreadsheet Pribadi)</span>
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  {submissions.length} Riwayat
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400">
                      <th className="py-3 px-3">Waktu Pengisian</th>
                      <th className="py-3 px-3">Rata-Rata</th>
                      <th className="py-3 px-3">Predikat</th>
                      <th className="py-3 px-3">Rincian Skor (1–10)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {submissions.map((sub, i) => {
                      const rowPred = getPredicate(sub.rowAvg)
                      return (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                            {sub.timestamp}
                            {i === 0 && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                Terbaru
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-black text-indigo-700">
                            {sub.rowAvg.toFixed(2)} / 5.0
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${rowPred.color}`}
                            >
                              {rowPred.label}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {sub.scores.map((sc, sIdx) => (
                                <span
                                  key={sIdx}
                                  title={INDICATOR_NAMES[sIdx]}
                                  className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px]"
                                >
                                  {sc}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}