'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex w-full flex-col gap-3">
        <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
          7 Kebiasaan
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          Survey Evaluasi Diri
        </div>
      </div>
    </aside>
  )
}

// Web App URL Google Apps Script Spreadsheet milikmu
const GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyDbUppVitsUYkr05w_U5cS6_tZtvxyVsCFGS8sIughWyQZSVrb35P3pKdNughSQT3d/exec'

type Question = {
  id: string
  dimension: string
  question_text: string
}

// Komponen utama form survei (menerima searchParams)
function SurveyForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Tangkap parameter URL dari Game Kuis
  const resultId = searchParams.get('result_id')
  const profileParam = searchParams.get('profile')
  const [userProfile, setUserProfile] = useState<string | null>(null)

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  // State Form Siswa
  const [fullName, setFullName] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [className, setClassName] = useState('')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Efek untuk membaca profil dari URL game
  useEffect(() => {
    if (profileParam) {
      setUserProfile(decodeURIComponent(profileParam))
    }
  }, [profileParam])

  // Mengambil data pertanyaan dari tabel 'questions' Supabase
  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        setQuestions(data)
      } else if (error) {
        console.error('Error fetching questions:', error.message)
      }
      setLoading(false)
    }
    fetchQuestions()
  }, [])

  const handleScoreChange = (qId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: score }))
  }

  // Fungsi Submit Ke Supabase & Google Sheets
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (Object.keys(answers).length < questions.length && questions.length > 0) {
      alert('Mohon jawab seluruh indikator pertanyaan survey!')
      return
    }

    setSubmitting(true)

    // 1. Simpan ke Supabase
    const { error } = await supabase.from('survey_responses').insert([
      {
        full_name: fullName,
        student_number: parseInt(studentNumber) || 0,
        class_name: className,
        answers: answers,
      },
    ])

    // 2. Kirim Data Ke Google Sheets Spreadsheet (Web App Endpoint)
    try {
      await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', // Mencegah pemblokiran CORS browser
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tanggal: new Date().toLocaleString('id-ID'),
          full_name: fullName,
          student_number: studentNumber,
          class_name: className,
          user_profile: userProfile || '-',
          answers: JSON.stringify(answers),
        }),
      })
    } catch (err) {
      console.error('Gagal terkirim ke Google Sheets:', err)
    }

    setSubmitting(false)

    if (!error) {
      setSubmitted(true)
    } else {
      alert('Gagal mengirim survey ke database. Silakan periksa koneksi internet kamu.')
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Survey Berhasil Terkirim!</h1>
          <p className="text-slate-600 font-medium text-sm">
            Terima kasih, <span className="font-bold text-slate-800">{fullName}</span> ({className}). Jawabanmu telah tersimpan dan terhubung ke Google Sheets untuk penilaian gerakan 7 Kebiasaan Anak Indonesia Hebat.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md"
          >
            Isi Form Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* BANNER INTEGRASI GAME KUIS */}
      {userProfile && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 text-white p-6 rounded-3xl shadow-md space-y-2">
          <h2 className="text-xl font-black">
            Halo, {userProfile}! 👋
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-relaxed">
            Hasil kuis kebiasaanmu sudah tersimpan di sistem. Sekarang mari lengkapi instrumen evaluasi diri di bawah ini untuk hasil yang lebih presisi!
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
          Instrumen Evaluasi Diri
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
          Form Penilaian 7 Kebiasaan
        </h1>
        <p className="text-slate-600 font-medium text-sm">
          Isi data diri dan berikan penilaian objektif sesuai kebiasaan harianmu (Skala 1: Sangat Jarang s/d 5: Sangat Selalu).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* IDENTITAS SISWA */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Identitas Siswa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Keanu Yusuf"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 !text-slate-800 !bg-slate-50 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                NIS / NISN
              </label>
              <input
                type="number"
                required
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="Contoh: 12345"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 !text-slate-800 !bg-slate-50 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kelas
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Contoh: X-1 / XI-MIPA-2"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 !text-slate-800 !bg-slate-50 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* DAFTAR PERTANYAAN */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Daftar Pertanyaan Kebiasaan
            </h2>
            <span className="text-xs font-bold text-slate-400">
              Total: {questions.length} Indikator
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500 font-medium animate-pulse">Memuat pertanyaan dari server...</p>
          ) : questions.length === 0 ? (
            <p className="py-8 text-center text-slate-500 font-medium">Belum ada pertanyaan aktif di database.</p>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
                      {q.dimension}
                    </span>
                    <span className="text-xs font-bold text-slate-400">#Pertanyaan {idx + 1}</span>
                  </div>

                  <p className="text-sm font-bold text-slate-800 leading-relaxed">
                    {q.question_text}
                  </p>

                  <div className="pt-2">
                    <div className="flex items-center justify-between max-w-lg mx-auto bg-white p-3 rounded-xl border border-slate-200">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <label
                          key={score}
                          className={`flex flex-col items-center cursor-pointer px-3 py-1.5 rounded-lg transition-all ${
                            answers[q.id] === score
                              ? 'bg-indigo-600 text-white font-extrabold shadow-sm scale-105'
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
                          <span className="text-[10px] opacity-80 mt-0.5">
                            {score === 1 ? 'Jarang' : score === 3 ? 'Cukup' : score === 5 ? 'Selalu' : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 hover:opacity-95 text-white font-extrabold py-4 rounded-2xl shadow-md transition-all text-sm disabled:opacity-50"
            >
              {submitting ? 'Mengirim Jawaban ke Server & Spreadsheet...' : 'Kirim Survey Sekarang 🚀'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// Export default dengan pembungkus Layout 3 Kolom & Suspense
export default function SurveySiswaPage() {
  return (
    <div className="flex bg-slate-50 min-h-screen p-4 gap-6 font-sans">
      <Sidebar />
      <main className="flex-1">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <p className="text-slate-500 font-semibold animate-pulse">Memuat halaman survei...</p>
          </div>
        }>
          <SurveyForm />
        </Suspense>
      </main>
    </div>
  )
}