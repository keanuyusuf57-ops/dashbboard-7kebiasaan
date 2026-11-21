'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquarePlus, Send, CheckCircle2, X } from 'lucide-react'

type FeedbackModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const supabase = createClient()
  const [nama, setNama] = useState('')
  const [kelas, setKelas] = useState('')
  const [kategori, setKategori] = useState('Ide Kegiatan 7 KAIH')
  const [pesan, setPesan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pesan.trim()) return
    setSubmitting(true)

    const { error } = await supabase.from('student_feedback').insert({
      nama_pengirim: nama.trim() || 'Siswa SMAN 5 Semarang',
      kelas: kelas.trim().toUpperCase() || '-',
      kategori,
      pesan: pesan.trim(),
    })

    setSubmitting(false)
    if (!error) {
      setSubmitted(true)
      setPesan('')
      setTimeout(() => {
        setSubmitted(false)
        onClose()
      }, 2200)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-indigo-100 space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup form umpan balik"
          className="absolute right-4 top-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
        >
          <X size={16} />
        </button>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-[11px] font-extrabold uppercase tracking-wider">
            <MessageSquarePlus size={13} />
            <span>Suara Siswa SMALA</span>
          </span>
          <h3 className="font-heading text-lg sm:text-xl font-black text-slate-950 mt-2">
            Kirim Umpan Balik &amp; Usulan
          </h3>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Sampaikan ide kegiatan pembiasaan positif atau saran pengembangan dashboard.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <p className="text-xs sm:text-sm font-bold">
              Terima kasih! Masukanmu telah berhasil dikirim ke database sekolah.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama (Opsional)"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <input
                type="text"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="Kelas (cth: XI-4)"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Ide Kegiatan 7 KAIH">Ide Kegiatan 7 KAIH</option>
              <option value="Saran Fitur Dashboard">Saran Fitur Dashboard</option>
              <option value="Kendala Pengisian">Kendala Pengisian</option>
            </select>

            <textarea
              required
              rows={3}
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              placeholder="Tulis saran, ide kegiatan, atau masukanmu di sini..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || !pesan.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send size={14} />
                <span>{submitting ? 'Mengirim...' : 'Kirim Masukan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}