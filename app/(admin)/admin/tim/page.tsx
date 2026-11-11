'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type TeamMember = {
  id: string
  name: string
  role: string
  photo_url?: string
  display_order: number
}

export default function EditTimPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Fetch daftar anggota tim dari Supabase
  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching team members:', error.message)
    } else if (data) {
      setMembers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  // Handle Unggah Foto dari Perangkat ke Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `team_${Date.now()}.${fileExt}`
    const filePath = `team-photos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('hero-media')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert(`Gagal mengunggah foto: ${uploadError.message}. Pastikan bucket "hero-media" diset Public.`)
      setUploadingFile(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('hero-media')
      .getPublicUrl(filePath)

    setPhotoUrl(publicUrlData.publicUrl)
    setUploadingFile(false)
  }

  // Handle Tambah / Update Anggota Tim
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !role.trim()) return
    setSubmitting(true)

    const payload = {
      name,
      role,
      photo_url: photoUrl,
      display_order: Number(displayOrder),
    }

    if (editingId) {
      const { error } = await supabase
        .from('team_members')
        .update(payload)
        .eq('id', editingId)

      if (!error) {
        setEditingId(null)
        resetForm()
        await fetchMembers()
      } else {
        alert(`Gagal memperbarui anggota tim: ${error.message}`)
      }
    } else {
      const { error } = await supabase
        .from('team_members')
        .insert([payload])

      if (!error) {
        resetForm()
        await fetchMembers()
      } else {
        alert(`Gagal menambah anggota tim: ${error.message}`)
      }
    }
    setSubmitting(false)
  }

  // Handle Hapus Anggota Tim
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus anggota tim ini?')) return
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (!error) {
      await fetchMembers()
    } else {
      alert(`Gagal menghapus anggota tim: ${error.message}`)
    }
  }

  const resetForm = () => {
    setName('')
    setRole('')
    setPhotoUrl('')
    setDisplayOrder(0)
    setEditingId(null)
  }

  const handleEdit = (member: TeamMember) => {
    setEditingId(member.id)
    setName(member.name)
    setRole(member.role)
    setPhotoUrl(member.photo_url || '')
    setDisplayOrder(member.display_order || 0)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Tim Pengembang</h1>
        <p className="text-sm font-medium text-gray-600">
          Tambah, ubah, atau hapus susunan tim pengembang yang tampil pada halaman publik tentang dashboard.
        </p>
      </div>

      {/* FORM INPUT TIM */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-600 text-lg">{editingId ? '✎' : '+'}</span>{' '}
          {editingId ? 'Edit Anggota Tim' : 'Tambah Anggota Tim Baru'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Pak Nico / Keanu Yusuf"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 !text-gray-900 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Peran / Jabatan (Role)
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Contoh: Lead Developer / Pembina"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 !text-gray-900 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* UNGGAH FOTO DARI PERANGKAT */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Foto Profil (Pilih Berkasa Foto)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {uploadingFile && (
                <p className="text-xs text-blue-600 mt-1 font-semibold animate-pulse">
                  Mengunggah foto...
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Urutan Tampil (Display Order)
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 !text-gray-900 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* PREVIEW FOTO */}
          {photoUrl && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 max-w-xs">
              <img
                src={photoUrl}
                alt="Preview Foto"
                className="w-10 h-10 rounded-full object-cover border border-blue-500"
              />
              <span className="text-xs text-emerald-600 font-bold">✓ Foto Berhasil Diunggah</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || uploadingFile}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow transition-all disabled:opacity-50 text-sm"
            >
              {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Anggota'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2.5 rounded-xl text-sm"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* DAFTAR ANGGOTA TIM */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          Daftar Tim Pengembang ({members.length})
        </h2>

        {loading ? (
          <p className="text-gray-700 text-sm font-medium">Memuat data tim...</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500 text-sm font-medium">Belum ada anggota tim yang ditambahkan.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {members.map((m) => (
              <div key={m.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={m.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`}
                    alt={m.name}
                    className="w-12 h-12 rounded-full object-cover border border-blue-500 flex-shrink-0"
                    onError={(e) => {
                      // Fallback jika foto gagal dimuat
                      ;(e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(m.name)
                    }}
                  />
                  <div className="truncate">
                    <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs font-semibold text-blue-600 truncate">{m.role}</p>
                    <span className="text-[10px] text-gray-400">Urutan: {m.display_order}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(m)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold px-2 py-1 rounded border border-blue-200 bg-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-bold px-2 py-1 rounded border border-red-200 bg-white"
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