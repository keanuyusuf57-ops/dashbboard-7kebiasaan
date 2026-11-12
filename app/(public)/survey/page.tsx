'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ClipboardCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

const GOOGLE_SHEET_API_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL ||
  'https://script.google.com/macros/s/AKfycbyGCDCIQMCbgqy0l3hAjtuZs_Ed9F6xsj09cU9oxxnG72WizU_Q0sOVobnRtvYjGS5T/exec'

const DEFAULT_QUESTIONS = [
  '1. Bangun tidur sebelum pukul 05.30 pagi setiap hari sehingga tidak terlambat sekolah.',
  '2. Menjalankan ibadah sesuai dengan agama/kepercayaan tepat waktu dan khidmat.',
  '3. Mengawali dan mengakhiri kegiatan harian (belajar dan makan) dengan berdoa.',
  '4. Melakukan aktivitas fisik atau olahraga (berlari, senam, bersepeda) minimal 3 kali seminggu.',
  '5. Berpartisipasi aktif dalam kegiatan olahraga di sekolah atau ekstrakurikuler.',
  '6. Memilih makanan/jajanan sehat yang mengandung buah, sayur, atau protein saat di sekolah dan rumah.',
  '7. Meluangkan waktu membaca buku (non-pelajaran/literasi) minimal 15–30 menit setiap hari.',
  '8. Membantu pekerjaan rumah tangga (menyapu, mencuci piring, menjaga adik) tanpa diperintah.',
  '9. Tidur malam tidak melebihi pukul 21.30/22.00 agar istirahat mencukupi.',
  '10. Mematikan atau tidak menggunakan gadget/smartphone saat mendekati jam tidur malam.',
]

const SCALE_OPTIONS = [
  { value: 1, label: 'Tidak Pernah' },
  { value: 2, label: 'Jarang' },
  { value: 3, label: 'Kadang-kadang' },
  { value: 4, label: 'Sering' },
  { value: 5, label: 'Selalu' },
]

export default function SurveyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nama, setNama] = useState('')
  const [kelas, setKelas] = useState('')
  const [email, setEmail] = useState('')
  const [questions, setQuestions] = useState<string[]>(DEFAULT_QUESTIONS)
  const [answers, setAnswers] = useState<number[]>(Array(10).fill(0))
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Isi otomatis email & identitas jika siswa pernah mengisi sebelumnya
    const savedEmail = localStorage.getItem('kaih_student_email')
    const savedNama = localStorage.getItem('kaih_student_nama')
    const savedKelas = localStorage.getItem('kaih_student_kelas')
    if (savedEmail) setEmail(savedEmail)
    if (savedNama) setNama(savedNama)
    if (savedKelas) setKelas(savedKelas)

    // Ambil pertanyaan terbaru dari Admin jika tersedia di Supabase
    async function loadQuestions() {
      try {
        const { data } = await supabase
          .from('survey_questions')
          .select('*')
          .order('display_order', { ascending: true })

        if (data && data.length >= 10) {
          const mapped = data
            .slice(0, 10)
            .map((q: any, i: number) => q.question_text || q.text || DEFAULT_QUESTIONS[i])
          setQuestions(mapped)
        }
      } catch {
        // Tetap gunakan DEFAULT_QUESTIONS jika tabel tidak ditemukan
      }
    }
    loadQuestions()
  }, [])

  const handleSelectScore = (questionIndex: number, scoreValue: number) => {
    setAnswers((prev) => {
      const updated = [...prev]
      updated[questionIndex] = scoreValue
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanNama = nama.trim()
    const cleanKelas = kelas.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanNama || !cleanKelas || !cleanEmail) {
      setErrorMsg('Harap lengkapi Nama Lengkap, Kelas, dan Email Pribadi kalian terlebih dahulu.')
      return
    }

    const unansweredIdx = answers.findIndex((val) => val < 1 || val > 5)
    if (unansweredIdx !== -1) {
      setErrorMsg(`Indikator nomor ${unansweredIdx + 1} belum dipilih. Silakan lengkapi semua indikator.`)
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        action: 'submit',
        timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        nama: cleanNama,
        kelas: cleanKelas,
        email: cleanEmail,
        scores: answers,
      }

      await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      // Simpan identitas ke localStorage agar halaman Statistik Pribadi langsung membacanya
      localStorage.setItem('kaih_student_email', cleanEmail)
      localStorage.setItem('kaih_student_nama', cleanNama)
      localStorage.setItem('kaih_student_kelas', cleanKelas)

      setSubmitted(true)

      // Beri jeda 1.5 detik agar Google Apps Script selesai menulis baris sebelum membuka Statistik Pribadi
      setTimeout(() => {
        router.push('/statistik')
      }, 1500)
    } catch (err) {
      console.error('Gagal mengirim survei:', err)
      setErrorMsg('Terjadi gangguan jaringan saat mengirim jawaban. Silakan coba kembali.')
      setSubmitting(false)
    }
  }

  const filledCount = answers.filter((v) => v >= 1 && v <= 5).length

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={34} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Survei Berhasil Terkirim!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Terima kasih, <strong>{nama}</strong>. Mengarahkan otomatis ke halaman{' '}
            <strong>Statistik Pribadi</strong> untuk menampilkan hasil dan rata-rata pengisianmu...
          </p>
          <div className="pt-2">
            <Link
              href="/statistik"
              className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Lihat Statistik Pribadi Sekarang →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
        {/* Header Survei */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 rounded-3xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
              <Sparkles size={13} />
              <span>Evaluasi Harian • 7 KAIH</span>
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-200 hover:text-white"
            >
              <ArrowLeft size={14} />
              <span>Beranda</span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Survei Kebiasaan Anak Indonesia Hebat
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
            Isilah dengan jujur sesuai aktivitas kalian hari ini. Hasil pengisian akan langsung terekap di halaman Statistik Pribadi.
          </p>

          {/* Progress Bar Pengisian */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-indigo-200">
              <span>Progres Pengisian Indikator</span>
              <span>{filledCount} / 10 Terisi</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${(filledCount / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Identitas Siswa */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-indigo-600" />
              <span>Identitas Siswa</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Tuliskan nama lengkap kalian"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Kelas
                </label>
                <input
                  type="text"
                  required
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  placeholder="Contoh: X-1 / XI-4 / XII-2"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Aktif Siswa
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tuliskan email pribadi kalian (contoh: nama@gmail.com)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Gunakan email yang sama setiap hari agar riwayat dan rata-rata nilai kalian tergabung otomatis di Statistik Pribadi.
                </p>
              </div>
            </div>
          </div>

          {/* Daftar 10 Pertanyaan Skala 1 - 5 */}
          <div className="space-y-4">
            {questions.map((questionText, qIdx) => (
              <div
                key={qIdx}
                className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4"
              >
                <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                  {questionText}
                </p>

                <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                  {SCALE_OPTIONS.map((opt) => {
                    const isSelected = answers[qIdx] === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectScore(qIdx, opt.value)}
                        className={`flex flex-col items-center justify-center py-2.5 px-1 sm:py-3 sm:px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm scale-[1.02]'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50/60 hover:border-indigo-300'
                        }`}
                      >
                        <span className="text-base sm:text-lg font-black">{opt.value}</span>
                        <span
                          className={`text-[9px] sm:text-[11px] font-semibold mt-0.5 leading-tight ${
                            isSelected ? 'text-indigo-100' : 'text-slate-500'
                          }`}
                        >
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-extrabold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send size={18} />
            <span>{submitting ? 'Mengirim ke Spreadsheet...' : 'Kirim Jawaban Survei'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}