'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminTimPengembangPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<any[]>([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadMembers = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .order('display_order', { ascending: true })
    if (data) setMembers(data)
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !role.trim()) return
    setSubmitting(true)

    let photoUrl = ''
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data: uploadData } = await supabase.storage
        .from('team-photos')
        .upload(fileName, photoFile)

      if (uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('team-photos')
          .getPublicUrl(fileName)
        photoUrl = publicUrlData.publicUrl
      }
    }

    await supabase.from('team_members').insert([
      {
        name: name.trim(),
        role: role.trim(),
        photo_url: photoUrl,
        display_order: Number(displayOrder) || 0,
      },
    ])

    setName('')
    setRole('')
    setDisplayOrder(0)
    setPhotoFile(null)
    setSubmitting(false)
    loadMembers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus anggota tim ini?')) return
    await supabase.from('team_members').delete().eq('id', id)
    loadMembers()
  }

  return (
    <div className="p-6 sm:p-10 space-y-6 font-sans max-w-5xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Kelola Tim Pengembang</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tambah, ubah, atau hapus susunan tim pengembang yang tampil pada halaman publik tentang dashboard.
        </p>
      </div>

      {/* Form Tambah Anggota Tim Baru */}
      <form
        onSubmit={handleAddMember}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-5"
      >
        <h2 className="text-base font-extrabold text-slate-900">+ Tambah Anggota Tim Baru</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pak Nico / Keanu Yusuf"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
              Peran / Jabatan (Role)
            </label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Contoh: Lead Developer / Pembina"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
              Foto Profil (Pilih Berkas Foto)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
              Urutan Tampil (Display Order)
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm cursor-pointer"
        >
          {submitting ? 'Menambahkan...' : 'Tambah Anggota'}
        </button>
      </form>

      {/* Daftar Tim Pengembang */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">
          Daftar Tim Pengembang ({members.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={m.name}
                    className="h-12 w-12 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    {m.name?.[0] || 'T'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{m.name}</p>
                  <p className="text-xs font-semibold text-blue-600 truncate">{m.role}</p>
                  <p className="text-[11px] text-slate-400">Urutan: {m.display_order}</p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(m.id)}
                className="px-3 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold shrink-0 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}