'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Question = {
  id?: string
  dimension: string
  question_text: string
}

const HABIT_DIMENSIONS = [
  '1. Bangun Pagi',
  '2. Beribadah',
  '3. Berolahraga',
  '4. Makan Sehat & Bergizi',
  '5. Gemar Membaca',
  '6. Membantu Orang Tua',
  '7. Istirahat Cukup',
]

export default function EditSurveyPage() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const [dimension, setDimension] = useState(HABIT_DIMENSIONS[0])
  const [questionText, setQuestionText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Ambil data pertanyaan langsung dari database tanpa auto-seed berulang
  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching questions:', error.message)
    } else if (data) {
      setQuestions(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionText.trim()) return
    setSubmitting(true)

    if (editingId) {
      const { error } = await supabase
        .from('questions')
        .update({ dimension, question_text: questionText })
        .eq('id', editingId)
      if (!error) {
        setEditingId(null)
        setQuestionText('')
        await fetchQuestions()
      } else {
        alert(`Gagal memperbarui pertanyaan: ${error.message}`)
      }
    } else {
      const { error } = await supabase
        .from('questions')
        .insert([{ dimension, question_text: questionText }])
      if (!error) {
        setQuestionText('')
        await fetchQuestions()
      } else {
        alert(`Gagal menambah pertanyaan: ${error.message}`)
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Yakin ingin menghapus pertanyaan ini?')) return
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) {
      await fetchQuestions()
    } else {
      alert(`Gagal menghapus pertanyaan: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Pertanyaan Survey</h1>
        <p className="text-sm font-medium text-gray-600">
          Kelola daftar instrumen pertanyaan 7 Kebiasaan Anak Indonesia Hebat.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-600 text-lg">{editingId ? '✎' : '+'}</span>{' '}
          {editingId ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Tambahan'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Dimensi Kebiasaan
              </label>
              <select
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 !text-gray-900 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
              >
                {HABIT_DIMENSIONS.map((dim) => (
                  <option key={dim} value={dim} className="!text-gray-900 !bg-white font-medium">
                    {dim}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Teks Pertanyaan
              </label>
              <input
                type="text"
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Masukkan teks pertanyaan tambahan..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 !text-gray-900 placeholder-gray-400 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow transition-all disabled:opacity-50 text-sm"
            >
              {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Pertanyaan'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setQuestionText('') }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2.5 rounded-xl text-sm"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          Daftar Pertanyaan Aktif ({questions.length})
        </h2>

        {loading ? (
          <p className="text-gray-700 text-sm font-medium">Memuat pertanyaan...</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
                <div>
                  <span className="inline-block text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md">
                    {q.dimension}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-2">
                    {idx + 1}. {q.question_text}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => { setEditingId(q.id || null); setDimension(q.dimension); setQuestionText(q.question_text) }}
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}