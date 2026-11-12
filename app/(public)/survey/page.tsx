'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle2, Send, User, Sparkles } from 'lucide-react'

const GOOGLE_SHEET_API_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL ||
  'https://script.google.com/macros/s/AKfycbyGCDCIQMCbgqy0l3hAjtuZs_Ed9F6xsj09cU9oxxnG72WizU_Q0sOVobnRtvYjGS5T/exec'

const FALLBACK_QUESTIONS = [
  { id: '1', question_text: 'Saya bangun tidur sebelum pukul 05.30 pagi setiap hari.' },
  { id: '2', question_text: 'Saya menjalankan ibadah sesuai dengan agama/kepercayaan saya tepat waktu.' },
  { id: '3', question_text: 'Saya mengawali dan mengakhiri kegiatan harian (seperti belajar dan makan) dengan berdoa.' },
  { id: '4', question_text: 'Saya melakukan aktivitas fisik atau olahraga (berlari, senam, bersepeda) minimal 3 kali seminggu.' },
  { id: '5', question_text: 'Saya berpartisipasi aktif dalam kegiatan olahraga di sekolah atau ekstrakurikuler.' },
  { id: '6', question_text: 'Saya memilih makanan/jajanan sehat yang mengandung buah, sayur, atau protein saat di sekolah maupun di rumah.' },
  { id: '7', question_text: 'Saya meluangkan waktu membaca buku (non-pelajaran/literasi) minimal 15–30 menit setiap hari.' },
  { id: '8', question_text: 'Saya membantu pekerjaan rumah tangga (menyapu, mencuci piring, menjaga adik) tanpa diperintah.' },
  { id: '9', question_text: 'Saya tidur malam tidak melebihi pukul 21.30/22.00 agar istirahat mencukupi.' },
  { id: '10', question_text: 'Saya mematikan atau tidak menggunakan gadget/smartphone saat mendekati jam tidur malam.' },
]

const SCALE_OPTIONS = [
  { value: 1, label: 'Jarang' },
  { value: 2, label: 'Kadang' },
  { value: 3, label: 'Cukup' },
  { value: 4, label: 'Sering' },
  { value: 5, label: 'Selalu' },
]

export default function SurveyPage() {
  const supabase = createClient()

  // State Identitas Siswa
  const [email, setEmail] = useState('')
  const [nisn, setNisn] = useState('')
  const [nama, setNama] = useState('')
  const [kelas, setKelas] = useState('')
  const [absen, setAbsen] = useState('')

  // State Pertanyaan & Jawaban
  const [questions, setQuestions] = useState<any[]>(FALLBACK_QUESTIONS)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Muat identitas tersimpan dari localStorage jika siswa pernah mengisi
  useEffect(() => {
    const savedEmail = localStorage.getItem('kaih_student_email')
    const savedNama = localStorage.getItem('kaih_student_nama')
    const savedKelas = localStorage.getItem('kaih_student_kelas')
    const savedAbsen = localStorage.getItem('kaih_student_absen')
    const savedNisn = localStorage.getItem('kaih_student_nisn')

    if (savedEmail) setEmail(savedEmail)
    if (savedNama) setNama(savedNama)
    if (savedKelas) setKelas(savedKelas)
    if (savedAbsen) setAbsen(savedAbsen)
    if (savedNisn) setNisn(savedNisn)
  }, [])

  // Muat daftar pertanyaan dari Supabase
  useEffect(() => {
    async function fetchQuestions() {
      const { data } = await supabase
        .from('questions')
        .select('id, question_text')
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        setQuestions(data)
      }
    }
    fetchQuestions()
  }, [])

  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length

  const handleSelectScore = (index: number, score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: score,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (answeredCount < totalQuestions) {
      alert(`Mohon lengkapi semua pertanyaan (${answeredCount}/${totalQuestions} terisi).`)
      return
    }

    setSubmitting(true)

    // Simpan identitas ke localStorage agar otomatis terisi di kunjungan berikutnya
    localStorage.setItem('kaih_student_email', email.trim())
    localStorage.setItem('kaih_student_nama', nama.trim())
    localStorage.setItem('kaih_student_kelas', kelas.trim())
    localStorage.setItem('kaih_student_absen', absen.trim())
    localStorage.setItem('kaih_student_nisn', nisn.trim())

    const scoresArray = questions.map((_, idx) => answers[idx] || 0)

    try {
      await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          email: email.trim(),
          nisn: nisn.trim(),
          nama: nama.trim(),
          kelas: kelas.trim(),
          absen: absen.trim(),
          scores: scoresArray,
        }),
      })

      setSubmitted(true)
    } catch (err) {
      console.error('Gagal mengirim survei:', err)
      alert('Terjadi kendala koneksi. Silakan coba kirim ulang.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-lg border border-slate-100 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Evaluasi Berhasil Dikirim!</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Terima kasih, <span className="font-bold text-slate-800">{nama}</span>! Jawaban
            evaluasi dirimu hari ini telah berhasil disimpan dan pesan apresiasi telah dikirim ke{' '}
            <span className="font-semibold text-indigo-600">{email}</span>.
          </p>
          <div className="pt-2 space-y-2.5">
            <Link
              href="/statistik"
              className="block w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all"
            >
              Lihat Statistik Pribadi Saya
            </Link>
            <Link
              href="/"
              className="block w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Tombol Kembali */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold">
            <Sparkles size={13} />
            <span>YUK SURVEY! • 7 KAIH</span>
          </span>
        </div>

        {/* Header Judul */}
        <div className="text-center space-y-2 py-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Form Evaluasi Diri Siswa
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Lengkapi identitas (Email, NISN, Nama, Kelas, Absen) dan isi penilaian kebiasaan
            harianmu (Skala 1 – 5).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kartu Identitas Siswa */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-5">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <User size={18} className="text-indigo-600" />
              <span>Identitas Siswa</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                  Email Aktif Siswa
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama.siswa@sman5smg.sch.id"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                  NISN
                </label>
                <input
                  type="text"
                  required
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Contoh: 0081234567"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Keanu Yusuf Al Ghifari"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                  Kelas
                </label>
                <input
                  type="text"
                  required
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  placeholder="Contoh: XI-3"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                  Nomor Absen
                </label>
                <input
                  type="number"
                  required
                  value={absen}
                  onChange={(e) => setAbsen(e.target.value)}
                  placeholder="Contoh: 15"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Kartu Daftar Pertanyaan Kebiasaan (TANPA LABEL 1. BANGUN PAGI, 2. BERIBADAH, DLL.) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900">
                Daftar Pertanyaan Kebiasaan
              </h2>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">
                {answeredCount} / {totalQuestions} Terisi
              </span>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const selectedVal = answers[idx]

                return (
                  <div
                    key={q.id || idx}
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      selectedVal
                        ? 'bg-indigo-50/30 border-indigo-200'
                        : 'bg-slate-50/60 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                        {q.question_text}
                      </p>
                      <span className="text-xs font-extrabold text-slate-400 shrink-0">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Pilihan Skala 1 - 5 */}
                    <div className="grid grid-cols-5 gap-2 bg-white p-2 rounded-2xl border border-slate-200/80">
                      {SCALE_OPTIONS.map((opt) => {
                        const isSelected = selectedVal === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelectScore(idx, opt.value)}
                            className={`py-2.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm scale-[1.02]'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="text-sm font-extrabold">{opt.value}</span>
                            <span
                              className={`text-[10px] font-semibold mt-0.5 ${
                                isSelected ? 'text-indigo-100' : 'text-slate-400'
                              }`}
                            >
                              {opt.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tombol Kirim Survey */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send size={18} />
            <span>{submitting ? 'Menyimpan Jawaban...' : 'Kirim Survey Sekarang 🚀'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}