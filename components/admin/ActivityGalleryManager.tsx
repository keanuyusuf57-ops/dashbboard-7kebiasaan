'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Camera,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Check,
  X,
  Loader2,
  Calendar,
} from 'lucide-react'

type ActivityItem = {
  id: string
  judul: string
  kategori_kebiasaan: string
  deskripsi: string | null
  image_url: string
  tanggal_kegiatan: string
}

const HABIT_CATEGORIES = [
  'Bangun Pagi',
  'Beribadah',
  'Berolahraga',
  'Makan Sehat & Bergizi',
  'Gemar Membaca',
  'Bermasyarakat',
  'Istirahat Cukup',
  '7 KAIH',
]

export default function ActivityGalleryManager() {
  const supabase = createClient()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // State Form (untuk Tambah & Edit)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [judul, setJudul] = useState('')
  const [kategori, setKategori] = useState('Gemar Membaca')
  const [deskripsi, setDeskripsi] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10))
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('school_activities')
      .select('*')
      .order('tanggal_kegiatan', { ascending: false })

    if (!error && data) {
      setItems(data as ActivityItem[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const resetForm = () => {
    setEditingId(null)
    setJudul('')
    setKategori('Gemar Membaca')
    setDeskripsi('')
    setImageUrl('')
    setTanggal(new Date().toISOString().slice(0, 10))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setStatusMsg(null)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('activity-photos')
      .upload(fileName, file)

    if (uploadError) {
      setStatusMsg(`Gagal mengunggah foto: ${uploadError.message}`)
    } else {
      const { data: urlData } = supabase.storage
        .from('activity-photos')
        .getPublicUrl(fileName)
      setImageUrl(urlData.publicUrl)
      setStatusMsg('Foto berhasil diunggah!')
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!judul.trim() || !imageUrl.trim()) return

    setSaving(true)
    setStatusMsg(null)

    const payload = {
      judul: judul.trim(),
      kategori_kebiasaan: kategori,
      deskripsi: deskripsi.trim() || null,
      image_url: imageUrl.trim(),
      tanggal_kegiatan: tanggal,
    }

    if (editingId) {
      const { error } = await supabase
        .from('school_activities')
        .update(payload)
        .eq('id', editingId)

      if (!error) {
        setStatusMsg('Kegiatan berhasil diperbarui dan langsung tayang di halaman Tentang.')
        resetForm()
        fetchItems()
      } else {
        setStatusMsg(`Gagal memperbarui: ${error.message}`)
      }
    } else {
      const { error } = await supabase.from('school_activities').insert(payload)

      if (!error) {
        setStatusMsg('Kegiatan baru berhasil ditambahkan ke Galeri!')
        resetForm()
        fetchItems()
      } else {
        setStatusMsg(`Gagal menambah: ${error.message}`)
      }
    }

    setSaving(false)
  }

  const handleEditClick = (item: ActivityItem) => {
    setEditingId(item.id)
    setJudul(item.judul)
    setKategori(item.kategori_kebiasaan)
    setDeskripsi(item.deskripsi || '')
    setImageUrl(item.image_url)
    setTanggal(item.tanggal_kegiatan || new Date().toISOString().slice(0, 10))
    setStatusMsg(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus dokumentasi kegiatan ini?')) return
    const { error } = await supabase.from('school_activities').delete().eq('id', id)
    if (!error) {
      if (editingId === id) resetForm()
      fetchItems()
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-[11px] font-extrabold uppercase tracking-wider">
            <Camera size={13} />
            <span>Manajemen Galeri Sekolah</span>
          </span>
          <h2 className="font-heading text-lg sm:text-xl font-black text-slate-950 mt-1.5">
            Kelola Foto &amp; Dokumentasi Kegiatan 7 KAIH
          </h2>
        </div>
        <span className="text-xs font-bold text-slate-500">
          Otomatis tampil di halaman <strong>/tentang</strong>
        </span>
      </div>

      {/* Form Tambah / Edit Kegiatan */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            {editingId ? 'Edit Dokumentasi Kegiatan' : 'Tambah Dokumentasi Kegiatan Baru'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <X size={14} />
              <span>Batal Edit</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            required
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul Kegiatan (cth: Jumat Sehat SMALA)"
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />

          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {HABIT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            type="date"
            required
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        {/* Input Foto: Unggah File atau URL */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8">
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL Foto (otomatis terisi jika mengunggah file di samping)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="md:col-span-4">
            <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-950 text-xs font-extrabold cursor-pointer transition-all">
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              <span>{uploading ? 'Mengunggah...' : 'Unggah Foto dari Perangkat'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <textarea
          rows={2}
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Deskripsi singkat kegiatan pembiasaan di SMAN 5 Semarang..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          {statusMsg ? (
            <p className="text-xs font-bold text-indigo-800">{statusMsg}</p>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
          >
            {editingId ? <Check size={15} /> : <Plus size={15} />}
            <span>
              {saving
                ? 'Menyimpan...'
                : editingId
                ? 'Simpan Perubahan'
                : 'Tambahkan ke Galeri'}
            </span>
          </button>
        </div>
      </form>

      {/* Daftar Kegiatan Tersimpan */}
      {loading ? (
        <p className="text-xs font-bold text-slate-500 animate-pulse">Memuat daftar galeri...</p>
      ) : items.length === 0 ? (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
          Belum ada foto kegiatan kustom di database (saat ini halaman /tentang menampilkan 3 foto
          contoh bawaan). Tambahkan kegiatan pertamamu melalui form di atas untuk menggantinya!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 rounded-2xl overflow-hidden bg-white flex flex-col justify-between"
            >
              <div>
                <div className="relative h-40 bg-slate-100">
                  <img
                    src={item.image_url}
                    alt={item.judul}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-indigo-950/85 text-amber-300 text-[10px] font-extrabold">
                    {item.kategori_kebiasaan}
                  </span>
                </div>

                <div className="p-3.5 space-y-1">
                  <h4 className="text-sm font-black text-slate-950 line-clamp-1">{item.judul}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{item.deskripsi}</p>
                </div>
              </div>

              <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Calendar size={12} />
                  {item.tanggal_kegiatan}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleEditClick(item)}
                    title="Edit Kegiatan"
                    className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title="Hapus Kegiatan"
                    className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}