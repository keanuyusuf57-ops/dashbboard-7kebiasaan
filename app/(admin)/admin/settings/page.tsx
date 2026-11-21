'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ActivityGalleryManager from '@/components/admin/ActivityGalleryManager'
import {
  Settings,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Type,
  ExternalLink,
  Loader2,
  Eye,
  Upload,
  FolderKanban,
  Users,
  Plus,
  Trash2,
  Pencil,
  Info,
  X,
} from 'lucide-react'
import Link from 'next/link'

const HABIT_GUIDES_DEFAULT = [
  {
    slug: 'bangun-pagi',
    num: 1,
    title: 'Bangun Pagi',
    tag: 'Bangun Pagi',
    summary: 'Membiasakan diri memulai hari lebih awal dengan penuh semangat.',
    whatToDo: ['Bangun pada waktu yang sama setiap hari.'],
    howToDo: ['Atur alarm dan siapkan keperluan esok hari sebelum tidur.'],
    tips: ['Hindari begadang agar tubuh cukup beristirahat.'],
  },
  {
    slug: 'beribadah',
    num: 2,
    title: 'Beribadah',
    tag: 'Beribadah',
    summary: 'Menjalankan ibadah sesuai agama dan kepercayaan masing-masing.',
    whatToDo: ['Luangkan waktu untuk beribadah setiap hari.'],
    howToDo: ['Jalankan ibadah dengan tertib dan penuh kesadaran.'],
    tips: ['Jadikan ibadah sebagai bagian rutin dari kegiatan harian.'],
  },
  {
    slug: 'berolahraga',
    num: 3,
    title: 'Berolahraga',
    tag: 'Berolahraga',
    summary: 'Menjaga kebugaran tubuh melalui aktivitas fisik secara teratur.',
    whatToDo: ['Lakukan aktivitas fisik secara rutin.'],
    howToDo: ['Pilih olahraga yang aman dan sesuai kemampuan.'],
    tips: ['Mulai secara bertahap dan lakukan pemanasan.'],
  },
  {
    slug: 'makan-sehat-dan-bergizi',
    num: 4,
    title: 'Makan Sehat dan Bergizi',
    tag: 'Makan Sehat',
    summary: 'Memilih makanan bergizi seimbang untuk mendukung kesehatan dan aktivitas.',
    whatToDo: ['Konsumsi makanan beragam dengan gizi seimbang.'],
    howToDo: ['Sertakan sayur, buah, sumber protein, dan air yang cukup.'],
    tips: ['Batasi makanan tinggi gula, garam, dan lemak.'],
  },
  {
    slug: 'gemar-belajar',
    num: 5,
    title: 'Gemar Belajar',
    tag: 'Gemar Belajar',
    summary: 'Menumbuhkan rasa ingin tahu dan kebiasaan belajar sepanjang hayat.',
    whatToDo: ['Belajar dan mencari pengetahuan baru setiap hari.'],
    howToDo: ['Buat jadwal belajar dan tetapkan tujuan yang realistis.'],
    tips: ['Kurangi gangguan dan ulangi materi secara berkala.'],
  },
  {
    slug: 'bermasyarakat',
    num: 6,
    title: 'Bermasyarakat',
    tag: 'Bermasyarakat',
    summary: 'Berpartisipasi, peduli, dan menjalin hubungan baik di lingkungan sekitar.',
    whatToDo: ['Bersikap peduli dan berkontribusi di lingkungan sekitar.'],
    howToDo: ['Hormati orang lain, bekerja sama, dan ikut kegiatan positif.'],
    tips: ['Mulailah dari tindakan sederhana seperti membantu sesama.'],
  },
  {
    slug: 'tidur-cepat',
    num: 7,
    title: 'Tidur Cepat',
    tag: 'Tidur Cepat',
    summary: 'Membiasakan tidur tepat waktu agar tubuh cukup beristirahat.',
    whatToDo: ['Tidur tepat waktu dengan durasi yang cukup.'],
    howToDo: ['Buat rutinitas malam dan kurangi penggunaan gawai sebelum tidur.'],
    tips: ['Jaga waktu tidur dan bangun tetap teratur.'],
  },
]

type UploadTarget = 'logo' | 'poster' | 'hero'

type TeamMember = {
  id: string
  nama: string
  peran: string
  kelas_atau_jabatan: string
  deskripsi: string
  foto_url: string | null
  urutan: number
}

const DEFAULT_ABOUT_WHAT =
  'Platform Digital 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) SMAN 5 Semarang adalah sistem evaluasi karakter, edukasi pembiasaan harian, dan gamifikasi interaktif berbasis web yang dikembangkan untuk memantau penerapan tujuh dimensi karakter utama pelajar secara terstruktur dan real-time.'

const DEFAULT_ABOUT_PURPOSE =
  'Web ini digunakan oleh siswa SMAN 5 Semarang untuk mengisi survei refleksi kebiasaan harian (10 indikator skala 1–4), mempelajari panduan praktis 7 kebiasaan, menguji pemahaman melalui kuis interaktif berhadiah XP, serta memantau rapor perkembangan karakter pribadi. Bagi guru dan administrator sekolah, platform ini berfungsi sebagai pusat analitik untuk memetakan indeks karakter per kelas secara objektif.'

const DEFAULT_ABOUT_WHY =
  'Platform ini dibangun untuk menjawab kebutuhan pencatatan dan pembinaan karakter siswa yang modern, transparan, dan mudah diakses dari perangkat apa pun. Dengan mengubah evaluasi karakter menjadi pengalaman visual yang interaktif dan terukur, siswa terdorong membangun kebiasaan positif secara konsisten tanpa merasa terbebani.'

export default function PengaturanTampilanPage() {
  const supabase = createClient()

  const [configId, setConfigId] = useState<string | null>(null)
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [heroMediaUrl, setHeroMediaUrl] = useState('')
  const [posterUrl, setPosterUrl] = useState('')

  // State Narasi Halaman Tentang
  const [aboutWhat, setAboutWhat] = useState(DEFAULT_ABOUT_WHAT)
  const [aboutPurpose, setAboutPurpose] = useState(DEFAULT_ABOUT_PURPOSE)
  const [aboutWhy, setAboutWhy] = useState(DEFAULT_ABOUT_WHY)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // State Tim Pembuat / Pengembang Dashboard
  const [teamList, setTeamList] = useState<TeamMember[]>([])
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [memberNama, setMemberNama] = useState('')
  const [memberPeran, setMemberPeran] = useState('')
  const [memberJabatan, setMemberJabatan] = useState('')
  const [memberDeskripsi, setMemberDeskripsi] = useState('')
  const [memberFotoUrl, setMemberFotoUrl] = useState('')
  const [memberUrutan, setMemberUrutan] = useState<number>(1)
  const [savingMember, setSavingMember] = useState(false)

  // State foto & ringkasan tiap-tiap dari 7 Kebiasaan
  const [habitImages, setHabitImages] = useState<Record<string, string>>({})
  const [habitSummaries, setHabitSummaries] = useState<Record<string, string>>({})
  const [savingHabitSlug, setSavingHabitSlug] = useState<string | null>(null)
  const [savedHabitSlug, setSavedHabitSlug] = useState<string | null>(null)

  const loadTeamMembers = async () => {
    const { data } = await supabase
      .from('about_team')
      .select('*')
      .order('urutan', { ascending: true })
    if (data) setTeamList(data as TeamMember[])
  }

  useEffect(() => {
    async function loadAllConfigs() {
      setLoading(true)

      const [{ data }, { data: guidesData }, { data: teamData }] = await Promise.all([
        supabase
          .from('home_config')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('habit_guides').select('*'),
        supabase.from('about_team').select('*').order('urutan', { ascending: true }),
      ])

      if (data) {
        setConfigId(data.id)
        setHeroTitle(data.hero_title || 'Gerakan 7 Kebiasaan Anak Indonesia Hebat')
        setHeroSubtitle(
          data.hero_subtitle ||
            'Membangun generasi berkarakter, sehat, cerdas, dan berakhlak mulia di SMAN 5 Semarang.'
        )
        setLogoUrl(data.logo_url || '')
        setHeroMediaUrl(data.hero_media_url || '')
        setPosterUrl(data.poster_url || '')
        if (data.about_what) setAboutWhat(data.about_what)
        if (data.about_purpose) setAboutPurpose(data.about_purpose)
        if (data.about_why) setAboutWhy(data.about_why)
      }

      if (teamData) {
        setTeamList(teamData as TeamMember[])
        setMemberUrutan(teamData.length + 1)
      }

      const imgMap: Record<string, string> = {}
      const sumMap: Record<string, string> = {}
      HABIT_GUIDES_DEFAULT.forEach((h) => {
        sumMap[h.slug] = h.summary
      })

      if (guidesData) {
        guidesData.forEach((row: any) => {
          if (row.image_url) imgMap[row.slug] = row.image_url
          if (row.summary && row.summary.trim().length > 20) sumMap[row.slug] = row.summary
        })
      }

      setHabitImages(imgMap)
      setHabitSummaries(sumMap)
      setLoading(false)
    }
    loadAllConfigs()
  }, [supabase])

  const uploadToSupabase = async (file: File, prefix: string): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG, PNG, WEBP, atau SVG).')
      return null
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5 MB.')
      return null
    }

    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('hero-media')
      .upload(fileName, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      alert(`Gagal mengunggah gambar: ${uploadError.message}`)
      return null
    }

    const { data: publicData } = supabase.storage.from('hero-media').getPublicUrl(fileName)
    return publicData?.publicUrl || null
  }

  const handleFileUpload = async (file: File | undefined, target: UploadTarget) => {
    if (!file) return
    setUploadingField(target)
    const url = await uploadToSupabase(file, target)
    if (url) {
      if (target === 'logo') setLogoUrl(url)
      if (target === 'poster') setPosterUrl(url)
      if (target === 'hero') setHeroMediaUrl(url)
    }
    setUploadingField(null)
  }

  const handleMemberPhotoUpload = async (file: File | undefined) => {
    if (!file) return
    setUploadingField('team-member')
    const url = await uploadToSupabase(file, 'team')
    if (url) setMemberFotoUrl(url)
    setUploadingField(null)
  }

  const resetMemberForm = () => {
    setEditingMemberId(null)
    setMemberNama('')
    setMemberPeran('')
    setMemberJabatan('')
    setMemberDeskripsi('')
    setMemberFotoUrl('')
    setMemberUrutan(teamList.length + 1)
  }

  const handleEditMemberClick = (member: TeamMember) => {
    setEditingMemberId(member.id)
    setMemberNama(member.nama)
    setMemberPeran(member.peran)
    setMemberJabatan(member.kelas_atau_jabatan || '')
    setMemberDeskripsi(member.deskripsi || '')
    setMemberFotoUrl(member.foto_url || '')
    setMemberUrutan(member.urutan || 1)
  }

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberNama.trim() || !memberPeran.trim()) return

    setSavingMember(true)
    const payload = {
      nama: memberNama.trim(),
      peran: memberPeran.trim(),
      kelas_atau_jabatan: memberJabatan.trim() || null,
      deskripsi: memberDeskripsi.trim() || null,
      foto_url: memberFotoUrl.trim() || null,
      urutan: Number(memberUrutan) || 1,
      updated_at: new Date().toISOString(),
    }

    if (editingMemberId) {
      const { error } = await supabase
        .from('about_team')
        .update(payload)
        .eq('id', editingMemberId)

      if (error) {
        alert(`Gagal memperbarui anggota tim: ${error.message}`)
      } else {
        await loadTeamMembers()
        resetMemberForm()
      }
    } else {
      const { error } = await supabase.from('about_team').insert([payload])

      if (error) {
        alert(`Gagal menambahkan pembuat/anggota tim: ${error.message}`)
      } else {
        await loadTeamMembers()
        resetMemberForm()
      }
    }
    setSavingMember(false)
  }

  const handleDeleteMember = async (id: string, nama: string) => {
    if (!confirm(`Hapus "${nama}" dari daftar pembuat/tim pengembang?`)) return
    const { error } = await supabase.from('about_team').delete().eq('id', id)
    if (error) {
      alert(`Gagal menghapus: ${error.message}`)
    } else {
      if (editingMemberId === id) resetMemberForm()
      await loadTeamMembers()
    }
  }

  const handleHabitPhotoUpload = async (file: File | undefined, slug: string) => {
    if (!file) return
    setUploadingField(`habit-${slug}`)
    const url = await uploadToSupabase(file, `habit-${slug}`)
    if (url) {
      setHabitImages((prev) => ({ ...prev, [slug]: url }))
    }
    setUploadingField(null)
  }

  const handleSaveHabitGuide = async (slug: string) => {
    const base = HABIT_GUIDES_DEFAULT.find((h) => h.slug === slug)
    if (!base) return

    setSavingHabitSlug(slug)
    const payload = {
      slug: base.slug,
      habit_number: base.num,
      title: base.title,
      tag: base.tag,
      image_url: (habitImages[slug] || '').trim() || null,
      summary: (habitSummaries[slug] || base.summary).trim(),
      what_to_do: base.whatToDo,
      how_to_do: base.howToDo,
      tips: base.tips,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('habit_guides')
      .upsert(payload, { onConflict: 'slug' })

    if (error) {
      alert(`Gagal menyimpan foto kebiasaan ${base.title}: ${error.message}`)
    } else {
      setSavedHabitSlug(slug)
      setTimeout(() => setSavedHabitSlug(null), 3000)
    }
    setSavingHabitSlug(null)
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)

    const fullPayload: Record<string, any> = {
      hero_title: heroTitle.trim(),
      hero_subtitle: heroSubtitle.trim(),
      logo_url: logoUrl.trim() || null,
      hero_media_url: heroMediaUrl.trim() || null,
      poster_url: posterUrl.trim() || null,
      about_what: aboutWhat.trim() || null,
      about_purpose: aboutPurpose.trim() || null,
      about_why: aboutWhy.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (configId) {
      const { error } = await supabase.from('home_config').update(fullPayload).eq('id', configId)
      if (error) {
        alert(`Gagal menyimpan pengaturan: ${error.message}`)
      } else {
        setSavedSuccess(true)
      }
    } else {
      const { data, error } = await supabase
        .from('home_config')
        .insert([fullPayload])
        .select()
        .single()

      if (error) {
        alert(`Gagal membuat konfigurasi: ${error.message}`)
      } else if (data) {
        setConfigId(data.id)
        setSavedSuccess(true)
      }
    }

    setSaving(false)
    setTimeout(() => setSavedSuccess(false), 4000)
  }

  return (
    <div className="space-y-8 font-sans text-[#090D16]">
      {/* Banner Header */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-800 to-sky-700 text-white p-6 sm:p-8 shadow-xl border border-indigo-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-extrabold text-sky-200 mb-2">
            <Settings size={13} />
            <span>KUSTOMISASI BERANDA, HALAMAN TENTANG & TIM PEMBUAT</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-white">
            Pengaturan Tampilan & Tim Nexara
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1">
            Atur tampilan Beranda, penjelasan tujuan website di laman Tentang, profil pembuat dashboard, foto 7 kebiasaan, serta galeri kegiatan sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-extrabold text-white"
          >
            <ExternalLink size={14} />
            <span>Beranda</span>
          </Link>
          <Link
            href="/tentang"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-sky-400/25 hover:bg-sky-400/35 border border-sky-300/30 text-xs font-extrabold text-white"
          >
            <ExternalLink size={14} />
            <span>Laman Tentang</span>
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>Perubahan Beranda dan Laman Tentang berhasil disimpan dan langsung aktif!</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white/95 p-10 rounded-3xl text-center text-xs font-bold text-slate-500 animate-pulse">
          Memuat konfigurasi dari Supabase...
        </div>
      ) : (
        <>
          {/* === BAGIAN 1: PENGATURAN BERANDA & PENJELASAN LAMAN TENTANG === */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveConfig}
              className="lg:col-span-7 bg-white/95 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5"
            >
              <h2 className="font-heading text-base font-extrabold text-[#090D16] flex items-center gap-2 border-b border-slate-200 pb-3">
                <Type size={18} className="text-indigo-700" />
                <span>1. Konten Beranda & 3 Media Utama</span>
              </h2>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1.5">
                  Judul Utama Hero Beranda
                </label>
                <input
                  type="text"
                  required
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 bg-white text-sm font-bold text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1.5">
                  Deskripsi / Subjudul Beranda
                </label>
                <textarea
                  rows={2}
                  required
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 bg-white text-sm font-medium text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Logo */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-700">
                    Logo Sekolah / Nexara
                  </label>
                  <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer">
                    {uploadingField === 'logo' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span>{uploadingField === 'logo' ? 'Unggah...' : 'Pilih Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => handleFileUpload(e.target.files?.[0], 'logo')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Poster */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-700">
                    Poster Infografis
                  </label>
                  <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer">
                    {uploadingField === 'poster' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span>{uploadingField === 'poster' ? 'Unggah...' : 'Pilih Poster'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => handleFileUpload(e.target.files?.[0], 'poster')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Banner Hero */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-700">
                    Banner Hero Utama
                  </label>
                  <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer">
                    {uploadingField === 'hero' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span>{uploadingField === 'hero' ? 'Unggah...' : 'Pilih Banner'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => handleFileUpload(e.target.files?.[0], 'hero')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sub-bagian Edit Penjelasan Laman Tentang */}
              <div className="pt-3 border-t border-slate-200 space-y-4">
                <h3 className="font-heading text-sm font-extrabold text-indigo-900 flex items-center gap-2">
                  <Info size={16} className="text-indigo-700" />
                  <span>Penjelasan Web di Laman "Tentang 7 KAIH"</span>
                </h3>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                    Tentang Apa Web Ini?
                  </label>
                  <textarea
                    rows={3}
                    value={aboutWhat}
                    onChange={(e) => setAboutWhat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-white text-xs sm:text-sm text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                    Digunakan Untuk Apa? (Fungsi & Manfaat)
                  </label>
                  <textarea
                    rows={3}
                    value={aboutPurpose}
                    onChange={(e) => setAboutPurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-white text-xs sm:text-sm text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                    Mengapa Platform Ini Dibuat? (Latar Belakang)
                  </label>
                  <textarea
                    rows={3}
                    value={aboutWhy}
                    onChange={(e) => setAboutWhy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-white text-xs sm:text-sm text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || uploadingField !== null}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 hover:opacity-95 text-white text-xs sm:text-sm font-extrabold shadow-md cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Simpan Pengaturan Beranda & Tentang</span>
              </button>
            </form>

            {/* Live Preview */}
            <div className="lg:col-span-5 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="font-heading text-base font-extrabold text-[#090D16] flex items-center gap-2 border-b border-slate-200 pb-3">
                <Eye size={18} className="text-indigo-700" />
                <span>Pratinjau Langsung Beranda</span>
              </h2>

              <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-sky-700 text-white p-5 space-y-3 shadow-md">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Preview Logo"
                    className="h-12 w-12 rounded-xl object-cover bg-white/10 p-1 border border-white/20"
                  />
                )}
                <h3 className="font-heading text-lg font-black leading-snug">
                  {heroTitle || 'Judul Hero Beranda'}
                </h3>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  {heroSubtitle || 'Deskripsi beranda akan tampil di sini.'}
                </p>
              </div>

              {posterUrl && (
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold uppercase text-slate-600">
                    Poster Infografis
                  </p>
                  <img
                    src={posterUrl}
                    alt="Pratinjau Poster"
                    className="w-full max-h-36 object-cover rounded-2xl border border-slate-200"
                  />
                </div>
              )}

              {heroMediaUrl && (
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold uppercase text-slate-600">
                    Banner Hero Utama
                  </p>
                  <img
                    src={heroMediaUrl}
                    alt="Pratinjau Banner Hero"
                    className="w-full max-h-36 object-cover rounded-2xl border border-slate-200"
                  />
                </div>
              )}
            </div>
          </div>

          {/* === BAGIAN 2: KELOLA PEMBUAT DASHBOARD / TIM PENGEMBANG NEXARA === */}
          <div className="bg-white/95 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-[#090D16] flex items-center gap-2">
                  <Users size={20} className="text-indigo-700" />
                  <span>2. Edit Pembuat Dashboard & Tim Pengembang (Laman Tentang)</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tambahkan atau perbaiki nama pembuat dashboard, peran/divisi, kelas/jabatan, foto profil, dan deskripsi kontribusi yang tampil di halaman Tentang 7 KAIH.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Tambah / Edit Anggota Tim */}
              <form
                onSubmit={handleSaveTeamMember}
                className="lg:col-span-5 p-5 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-extrabold text-indigo-950">
                    {editingMemberId ? 'Edit Data Pembuat / Anggota' : 'Tambah Pembuat / Anggota Baru'}
                  </h3>
                  {editingMemberId && (
                    <button
                      type="button"
                      onClick={resetMemberForm}
                      className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <X size={13} />
                      <span>Batal Edit</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={memberNama}
                    onChange={(e) => setMemberNama(e.target.value)}
                    placeholder="Contoh: Tim Nexara / Nama Siswa / Guru Pembina"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#090D16]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-700 mb-1">
                      Peran / Divisi *
                    </label>
                    <input
                      type="text"
                      required
                      value={memberPeran}
                      onChange={(e) => setMemberPeran(e.target.value)}
                      placeholder="Contoh: Lead Developer & UI/UX"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-[#090D16]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-700 mb-1">
                      Kelas / Jabatan
                    </label>
                    <input
                      type="text"
                      value={memberJabatan}
                      onChange={(e) => setMemberJabatan(e.target.value)}
                      placeholder="Contoh: XI-1 / SMAN 5 Semarang"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-[#090D16]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-700 mb-1">
                      Foto Profil (Opsional)
                    </label>
                    <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer">
                      {uploadingField === 'team-member' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>
                        {uploadingField === 'team-member'
                          ? 'Mengunggah...'
                          : memberFotoUrl
                          ? 'Ganti Foto Profil'
                          : 'Pilih Foto Profil'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingField !== null}
                        onChange={(e) => handleMemberPhotoUpload(e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-700 mb-1">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={memberUrutan}
                      onChange={(e) => setMemberUrutan(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#090D16]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-700 mb-1">
                    Deskripsi Kontribusi / Bio Singkat
                  </label>
                  <textarea
                    rows={2}
                    value={memberDeskripsi}
                    onChange={(e) => setMemberDeskripsi(e.target.value)}
                    placeholder="Contoh: Merancang arsitektur database Supabase, analitik dashboard, dan antarmuka pengguna."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-[#090D16]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingMember || uploadingField !== null}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer disabled:opacity-60"
                >
                  {savingMember ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : editingMemberId ? (
                    <Save size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                  <span>
                    {editingMemberId ? 'Simpan Perubahan Pembuat' : 'Tambahkan ke Daftar Pembuat'}
                  </span>
                </button>
              </form>

              {/* Daftar Pembuat / Tim Pengembang Tersimpan */}
              <div className="lg:col-span-7 space-y-3">
                {teamList.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1">
                    <p className="text-xs font-extrabold text-slate-700">
                      Belum ada data pembuat dashboard di database.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Gunakan formulir di sebelah kiri untuk menambahkan nama pembuat atau anggota tim pengembang Nexara.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {teamList.map((member) => (
                      <div
                        key={member.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                          editingMemberId === member.id
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-300'
                            : 'bg-slate-50 border-slate-200/90'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {member.foto_url ? (
                            <img
                              src={member.foto_url}
                              alt={member.nama}
                              className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                              {member.nama.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-black uppercase text-indigo-700">
                              #{member.urutan} • {member.peran}
                            </span>
                            <h4 className="font-heading text-sm font-extrabold text-[#090D16] truncate">
                              {member.nama}
                            </h4>
                            {member.kelas_atau_jabatan && (
                              <p className="text-[11px] font-semibold text-slate-600 truncate">
                                {member.kelas_atau_jabatan}
                              </p>
                            )}
                            {member.deskripsi && (
                              <p className="text-[11px] text-slate-700 mt-1 line-clamp-2 leading-snug">
                                {member.deskripsi}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70">
                          <button
                            type="button"
                            onClick={() => handleEditMemberClick(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-300 text-[11px] font-extrabold text-indigo-800 cursor-pointer"
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.id, member.nama)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-300 text-[11px] font-extrabold text-rose-700 cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* === BAGIAN 3: KELOLA FOTO & PENJELASAN 7 KEBIASAAN === */}
          <div className="bg-white/95 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-[#090D16] flex items-center gap-2">
                  <FolderKanban size={20} className="text-indigo-700" />
                  <span>3. Kelola Foto & Penjelasan 7 Kebiasaan</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pilih foto ilustrasi masing-masing kebiasaan agar tampil dominan pada halaman penjelasan tiap kebiasaan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {HABIT_GUIDES_DEFAULT.map((habit) => {
                const currentImg = habitImages[habit.slug] || ''
                const currentSummary = habitSummaries[habit.slug] || habit.summary
                const isUploading = uploadingField === `habit-${habit.slug}`
                const isSaving = savingHabitSlug === habit.slug
                const isSaved = savedHabitSlug === habit.slug

                return (
                  <div
                    key={habit.slug}
                    className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[10px] font-black">
                          #{habit.num} • {habit.tag}
                        </span>
                        <Link
                          href={`/kebiasaan/${habit.slug}`}
                          target="_blank"
                          className="text-[11px] font-extrabold text-indigo-700 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Lihat Laman</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>

                      <h3 className="font-heading text-base font-extrabold text-[#090D16]">
                        {habit.title}
                      </h3>

                      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white h-36 flex items-center justify-center">
                        {currentImg ? (
                          <img
                            src={currentImg}
                            alt={habit.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4 text-slate-400">
                            <ImageIcon size={24} className="mx-auto mb-1" />
                            <p className="text-[11px] font-semibold">Belum ada foto</p>
                          </div>
                        )}
                      </div>

                      <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer transition-colors">
                        {isUploading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        <span>{isUploading ? 'Mengunggah...' : 'Pilih Foto Kebiasaan'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingField !== null}
                          onChange={(e) => handleHabitPhotoUpload(e.target.files?.[0], habit.slug)}
                          className="hidden"
                        />
                      </label>

                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                          Ringkasan Penjelasan
                        </label>
                        <textarea
                          rows={2}
                          value={currentSummary}
                          onChange={(e) =>
                            setHabitSummaries((prev) => ({
                              ...prev,
                              [habit.slug]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-[#090D16]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving || isUploading}
                      onClick={() => handleSaveHabitGuide(habit.slug)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all cursor-pointer ${
                        isSaved ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-indigo-800'
                      }`}
                    >
                      {isSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isSaved ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Save size={14} />
                      )}
                      <span>{isSaved ? 'Tersimpan!' : 'Simpan Foto & Teks'}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* === BAGIAN 4: KELOLA GALERI FOTO & DOKUMENTASI KEGIATAN (LAMAN TENTANG) === */}
          <ActivityGalleryManager />
        </>
      )}
    </div>
  )
}