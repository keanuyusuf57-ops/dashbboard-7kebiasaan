'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const GOOGLE_SHEET_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL ||
  'https://script.google.com/macros/s/AKfycbyGCDCIQMCbgqy0l3hAjtuZs_Ed9F6xsj09cU9oxxnG72WizU_Q0sOVobnRtvYjGS5T/exec'

type Question = {
  id: string
  dimension: string
  question_text: string
}

const DEFAULT_SPREADSHEET_QUESTIONS: Question[] = [
  { id: 'q1', dimension: 'Bangun Pagi', question_text: 'Saya bangun tidur sebelum pukul 05.30 pagi setiap hari sehingga tidak terlambat sekolah' },
  { id: 'q2', dimension: 'Beribadah', question_text: '3 hari sebelumnya saya menjalankan ibadah sesuai dengan agama/kepercayaan saya tepat waktu dan khidmat' },
  { id: 'q3', dimension: 'Beribadah', question_text: '3 hari sebelumnya saya mengawali dan mengakhiri kegiatan harian (seperti belajar dan makan) dengan berdoa' },
  { id: 'q4', dimension: 'Berolahraga', question_text: '3 hari sebelumnya saya melakukan aktivitas fisik atau olahraga (misalnya berlari, senam, bersepeda) minimal 3 kali seminggu' },
  { id: 'q5', dimension: 'Berolahraga', question_text: '3 hari sebelumnya saya berpartisipasi aktif dalam kegiatan olahraga di sekolah atau ekstrakurikuler' },
  { id: 'q6', dimension: 'Makan Sehat', question_text: '3 hari sebelumnya saya memilih makanan/jajanan sehat yang mengandung buah, sayur, atau protein saat di sekolah dan rumah' },
  { id: 'q7', dimension: 'Gemar Membaca', question_text: '3 hari sebelumnya saya meluangkan waktu membaca buku (non-pelajaran/literasi) minimal 15–30 menit setiap hari' },
  { id: 'q8', dimension: 'Bermasyarakat', question_text: '3 hari sebelumnya saya membantu pekerjaan rumah tangga (misalnya menyapu, mencuci piring, menjaga adik) di rumah tanpa diperintah' },
  { id: 'q9', dimension: 'Tidur Cepat', question_text: '3 hari sebelumnya saya tidur malam tidak melebihi pukul 21.30/22.00' },
  { id: 'q10', dimension: 'Tidur Cepat', question_text: '3 hari sebelumnya saya mematikan atau tidak menggunakan gadget/smartphone saat mendekati jam tidur malam' },
]

function SurveyForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const profileParam = searchParams.get('profile')
  const [userProfile, setUserProfile] = useState<string | null>(null)

  const [questions, setQuestions] = useState<Question[]>(DEFAULT_SPREADSHEET_QUESTIONS)
  const [loading, setLoading] = useState(true)

  // 5 Kolom Identitas Siswa sesuai permintaan: Email, NISN, Nama, Kelas, Absen
  const [email, setEmail] = useState('')
  const [nisn, setNisn] = useState('')
  const [fullName, setFullName] = useState('')
  const [className, setClassName] = useState('')
  const [absen, setAbsen] = useState('')

  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (profileParam) setUserProfile(decodeURIComponent(profileParam))
    const savedEmail = localStorage.getItem('kaih_student_email')
    if (savedEmail) setEmail(savedEmail)
  }, [profileParam])

  useEffect(() => {
    async function fetchQuestions() {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: true })

      if (data && data.length === 10) {
        setQuestions(data)
      } else {
        setQuestions(DEFAULT_SPREADSHEET_QUESTIONS)
      }
      setLoading(false)
    }
    fetchQuestions()
  }, [])

  const handleScoreChange = (qId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: score }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (Object.keys(answers).length < questions.length) {
      alert('Mohon jawab seluruh 10 indikator pertanyaan survey!')
      return
    }

    setSubmitting(true)
    localStorage.setItem('kaih_student_email', email.trim().toLowerCase())

    const orderedScores: Record<string, number> = {}
    questions.forEach((q, idx) => {
      orderedScores[`q${idx + 1}`] = answers[q.id] || 0
    })

    // 1. Simpan ke Supabase
    await supabase.from('survey_responses').insert([
      {
        full_name: fullName.trim(),
        student_number: parseInt(absen) || parseInt(nisn) || 0,
        class_name: className.trim(),
        answers: { email: email.trim(), nisn: nisn.trim(), absen: absen.trim(), ...answers },
      },
    ])

    // 2. Kirim ke Google Spreadsheet & Picu Email Terima Kasih
    try {
      await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          nisn: nisn.trim(),
          nama: fullName.trim(),
          kelas: className.trim(),
          absen: absen.trim(),
          user_profile: userProfile || '-',
          ...orderedScores,
        }),
      })
      setSubmitted(true)
    } catch (err) {
      console.error('Gagal mengirim ke Spreadsheet:', err)
      alert('Gagal mengirim survey ke Spreadsheet. Silakan periksa koneksi internet.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-12 px-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Survey Berhasil Terkirim!</h1>
          <p className="text-slate-600 font-medium text-sm leading-relaxed">
            Terima kasih, <span className="font-bold text-slate-800">{fullName}</span> (Kelas {className} / Absen {absen}). Jawabanmu sudah masuk ke Spreadsheet dan pesan ucapan terima kasih telah dikirim ke <span className="font-bold text-indigo-600">{email}</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/statistik"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md"
            >
              Lihat Statistik Saya 📊
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-100 text-slate-700 font-bold px-6 py-2.5 rounded-xl text-sm"
            >
              Isi Form Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
          Yuk Survey! • 7 KAIH
        </span>
        <h1 className="text-3xl font-extrabold text-slate-800">
          Form Evaluasi Diri Siswa
        </h1>
        <p className="text-slate-600 text-sm">
          Lengkapi identitas (Email, NISN, Nama, Kelas, Absen) dan isi penilaian kebiasaan harianmu (Skala 1 – 5).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* IDENTITAS SISWA: EMAIL, NISN, NAMA, KELAS, ABSEN */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Identitas Siswa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Email Aktif Siswa
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: siswa@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                NISN
              </label>
              <input
                type="text"
                required
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                placeholder="Contoh: 0081234567"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Keanu Yusuf Al Ghifari"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Kelas
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Contoh: XI-3"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Nomor Absen
              </label>
              <input
                type="number"
                required
                value={absen}
                onChange={(e) => setAbsen(e.target.value)}
                placeholder="Contoh: 15"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* DAFTAR 10 PERTANYAAN */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">Daftar Pertanyaan Kebiasaan</h2>
            <span className="text-xs font-bold text-slate-400">
              {Object.keys(answers).length} / {questions.length} Terisi
            </span>
          </div>

          {loading ? (
            <p className="py-6 text-center text-slate-500 animate-pulse">Memuat pertanyaan...</p>
          ) : (
            <div className="space-y-5">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
                      {q.dimension}
                    </span>
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{q.question_text}</p>
                  <div className="flex items-center justify-between max-w-lg mx-auto bg-white p-2.5 rounded-xl border border-slate-200">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <label
                        key={score}
                        className={`flex flex-col items-center cursor-pointer px-3 py-1.5 rounded-lg transition-all ${
                          answers[q.id] === score
                            ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100 font-semibold'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question_${q.id}`}
                          value={score}
                          required
                          checked={answers[q.id] === score}
                          onChange={() => handleScoreChange(q.id, score)}
                          className="sr-only"
                        />
                        <span className="text-sm">{score}</span>
                        <span className="text-[10px] opacity-80">
                          {score === 1 ? 'Jarang' : score === 3 ? 'Cukup' : score === 5 ? 'Selalu' : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 text-white font-extrabold py-4 rounded-2xl shadow-md text-sm disabled:opacity-50"
          >
            {submitting ? 'Mengirim ke Spreadsheet & Email...' : 'Kirim Survey Sekarang 🚀'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function SurveySiswaPage() {
  return (
    <div className="flex bg-slate-50 min-h-screen p-4 gap-6 font-sans">
      <aside className="hidden lg:flex w-60 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex-col gap-2">
        <Link href="/" className="rounded-2xl bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-600">
          ← Kembali ke Beranda
        </Link>
        <Link href="/statistik" className="rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Statistik Pribadi
        </Link>
      </aside>
      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center">Memuat halaman survei...</div>}>
          <SurveyForm />
        </Suspense>
      </main>
    </div>
  )
}