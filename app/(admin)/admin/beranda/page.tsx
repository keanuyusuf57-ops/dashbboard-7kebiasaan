'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function EditBerandaPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [configId, setConfigId] = useState<string | null>(null)

  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroMediaUrl, setHeroMediaUrl] = useState('')
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video'>('image')
  const [uploadingFile, setUploadingFile] = useState(false)

  // Fetch Data Konfigurasi Beranda
  useEffect(() => {
    async function fetchHomeConfig() {
      try {
        const { data, error } = await supabase
          .from('home_config')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error('Error fetching home_config:', error.message || error)
        }

        if (data) {
          setConfigId(data.id)
          setHeroTitle(data.hero_title || '')
          setHeroSubtitle(data.hero_subtitle || '')
          setHeroMediaUrl(data.hero_media_url || '')
          setHeroMediaType(data.hero_media_type || 'image')
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHomeConfig()
  }, [])

  // Handle Unggah Media ke Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `hero_${Date.now()}.${fileExt}`
    const filePath = `hero-banners/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('hero-media')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert(`Gagal mengunggah media: ${uploadError.message}. Pastikan bucket "hero-media" diset Public.`)
      setUploadingFile(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('hero-media')
      .getPublicUrl(filePath)

    setHeroMediaUrl(publicUrlData.publicUrl)
    setHeroMediaType(file.type.startsWith('video') ? 'video' : 'image')
    setUploadingFile(false)
  }

  // Handle Simpan Konfigurasi Beranda
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      hero_media_url: heroMediaUrl,
      hero_media_type: heroMediaType,
      updated_at: new Date().toISOString(),
    }

    let queryError: any = null

    if (configId) {
      const { error } = await supabase
        .from('home_config')
        .update(payload)
        .eq('id', configId)
        .select()
      queryError = error
    } else {
      const { data, error } = await supabase
        .from('home_config')
        .insert([payload])
        .select()

      if (data && data.length > 0) {
        setConfigId(data[0].id)
      }
      queryError = error
    }

    setSubmitting(false)

    if (!queryError) {
      alert('Berhasil menyimpan perubahan Beranda!')
    } else {
      const errorMsg = queryError.message || queryError.details || JSON.stringify(queryError)
      console.error('Supabase Save Error Detailed:', errorMsg)
      alert(`Gagal menyimpan perubahan: ${errorMsg}`)
    }
  }

  if (loading) return <p className="p-6 text-gray-700 font-semibold">Memuat konfigurasi beranda...</p>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Beranda Utama</h1>
        <p className="text-sm font-medium text-gray-600">
          Kelola judul, subjudul, dan media Hero Banner yang tampil di halaman depan siswa.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
            Judul Utama (Hero Title)
          </label>
          <input
            type="text"
            required
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder="Penilaian 7 Kebiasaan Anak Indonesia Hebat"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 !text-gray-900 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
            Subjudul (Hero Subtitle)
          </label>
          <textarea
            rows={3}
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="Gerakan Karakter Unggul Siswa-Siswi SMAN 5 Semarang"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 !text-gray-900 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
            Unggah Media Hero (Gambar / Video)
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            disabled={uploadingFile}
            className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploadingFile && <p className="text-xs text-blue-600 mt-2 font-semibold animate-pulse">Mengunggah media...</p>}

          {heroMediaUrl && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 max-w-sm">
              <p className="text-xs font-bold text-gray-700 mb-2">Pratinjau Media Saat Ini:</p>
              {heroMediaType === 'video' ? (
                <video src={heroMediaUrl} controls className="w-full h-36 object-cover rounded-lg" />
              ) : (
                <img src={heroMediaUrl} alt="Preview" className="w-full h-36 object-cover rounded-lg" />
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || uploadingFile}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-all text-sm disabled:opacity-50"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Perubahan Beranda'}
        </button>
      </form>
    </div>
  )
}