'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

  // Mengambil data pertanyaan dari tabel 'questions'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (Object.keys(answers).length < questions.length) {
      alert('Mohon jawab seluruh indikator pertanyaan survey!')
      return
    }

    setSubmitting(true)

    const { error } = await supabase.from('survey_responses').insert([
      {
        full_name: fullName,
        student_number: parseInt(studentNumber),
        class_name: className,
        answers: answers,
      },
    ])

    setSubmitting(false)

    if (!error) {
      setSubmitted(true)
    } else {
      alert('Gagal mengirim survey. Silakan periksa koneksi internet kamu.')
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Survey Berhasil Terkirim!</h1>
          <p className="text-gray-600 font-medium text-sm">
            Terima kasih, <span className="font-bold text-gray-900">{fullName}</span> ({className}). Jawabanmu telah tersimpan untuk penilaian gerakan 7 Kebiasaan Anak Indonesia Hebat.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
          >
            Isi Form Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* BANNER INTEGRASI GAME KUIS */}
      {userProfile && (
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white p-6 rounded-3xl shadow-md space-y-2">
          <h2 className="text-xl font-black">
            Halo, {userProfile}! 👋
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
            Hasil kuis kebiasaanmu sudah tersimpan di sistem. Sekarang mari lengkapi instrumen evaluasi diri di bawah ini untuk hasil yang lebih presisi!
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Instrumen Evaluasi Diri
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          Form Penilaian 7 Kebiasaan
        </h1>
        <p className="text-gray-600 font-medium text-sm">
          Isi data diri dan berikan penilaian objektif sesuai kebiasaan harianmu (Skala 1: Sangat Jarang s/d 5: Sangat Selalu).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* IDENTITAS SISWA */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Identitas Siswa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Keanu Yusuf"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 !text-gray-900 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                NIS / NISN
              </label>
              <input
                type="number"
                required
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="Contoh: 12345"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 !text-gray-900 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Kelas
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Contoh: X-1 / XI-MIPA-2"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 !text-gray-900 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* DAFTAR PERTANYAAN */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Daftar Pertanyaan Kebiasaan
            </h2>
            <span className="text-xs font-bold text-gray-500">
              Total: {questions.length} Indikator
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500 font-medium animate-pulse">Memuat pertanyaan dari server...</p>
          ) : questions.length === 0 ? (
            <p className="py-8 text-center text-gray-500 font-medium">Belum ada pertanyaan aktif.</p>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/80 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                      {q.dimension}
                    </span>
                    <span className="text-xs font-bold text-gray-400">#Pertanyaan {idx + 1}</span>
                  </div>

                  <p className="text-sm font-bold text-gray-900 leading-relaxed">
                    {q.question_text}
                  </p>

                  <div className="pt-2">
                    <div className="flex items-center justify-between max-w-lg mx-auto bg-white p-3 rounded-xl border border-gray-200">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <label
                          key={score}
                          className={`flex flex-col items-center cursor-pointer px-3 py-1.5 rounded-lg transition-all ${
                            answers[q.id] === score
                              ? 'bg-blue-600 text-white font-extrabold shadow-sm scale-105'
                              : 'text-gray-700 hover:bg-gray-100 font-semibold'
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
              disabled={submitting || loading || questions.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {submitting ? 'Mengirim Jawaban...' : 'Kirim Survey Sekarang'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// Export default dengan pembungkus Suspense agar aman saat Prerendering / Build
export default function SurveySiswaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F0F9F4] p-4">
        <p className="text-gray-500 font-semibold animate-pulse">Memuat halaman survei...</p>
      </div>
    }>
      <SurveyForm />
    </Suspense>
  )
}