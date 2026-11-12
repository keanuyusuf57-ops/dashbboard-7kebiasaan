'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Save, LayoutGrid, Edit3, FileText, BarChart2 } from 'lucide-react'

const GOOGLE_SHEET_API_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL ||
  'https://script.google.com/macros/s/AKfycbyGCDCIQMCbgqy0l3hAjtuZs_Ed9F6xsj09cU9oxxnG72WizU_Q0sOVobnRtvYjGS5T/exec'

export default function AdminDashboardPage() {
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'dashboard' | 'kelola'>('dashboard')
  const [completion, setCompletion] = useState(0)
  const [totalSubmissions, setTotalSubmissions] = useState(0)
  const [uniqueStudents, setUniqueStudents] = useState(0)

  const [homeConfigId, setHomeConfigId] = useState<string | null>(null)
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroMediaUrl, setHeroMediaUrl] = useState('')
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video'>('image')
  const [savingHome, setSavingHome] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: homeData } = await supabase
        .from('home_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (homeData) {
        setHomeConfigId(homeData.id)
        setHeroTitle(homeData.hero_title || '')
        setHeroSubtitle(homeData.hero_subtitle || '')
        setHeroMediaUrl(homeData.hero_media_url || '')
        setHeroMediaType(homeData.hero_media_type === 'video' ? 'video' : 'image')
      }

      try {
        const res = await fetch(GOOGLE_SHEET_API_URL)
        const json = await res.json()
        if (json.status === 'success' && Array.isArray(json.data)) {
          const rows = json.data
          setTotalSubmissions(rows.length)

          const studentSet = new Set(rows.map((r: any) => r.email || r.nama).filter(Boolean))
          setUniqueStudents(studentSet.size)

          let validSum = 0
          let validCount = 0
          rows.forEach((r: any) => {
            if (Array.isArray(r.scores)) {
              r.scores.forEach((rawVal: any) => {
                const val = Number(rawVal)
                if (!isNaN(val) && val >= 1 && val <= 5) {
                  validSum += val
                  validCount++
                }
              })
            }
          })

          if (validCount > 0) {
            const avg = validSum / validCount
            setCompletion(Math.min(100, Math.round((avg / 5) * 100)))
          }
        }
      } catch (err) {
        console.error('Gagal mengambil statistik:', err)
      }
    }

    loadData()
  }, [])

  const handleSaveHomeConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingHome(true)

    const payload = {
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      hero_media_url: heroMediaUrl,
      hero_media_type: heroMediaType,
      updated_at: new Date().toISOString(),
    }

    const { error } = homeConfigId
      ? await supabase.from('home_config').update(payload).eq('id', homeConfigId)
      : await supabase.from('home_config').insert([payload])

    setSavingHome(false)
    if (!error) {
      alert('Tampilan Beranda berhasil diperbarui!')
      setActiveTab('dashboard')
    } else {
      alert('Gagal menyimpan: ' + error.message)
    }
  }

  return (
    <div className="flex bg-slate-50 min-h-screen p-5 gap-6 font-sans">
      <aside className="w-56 bg-white rounded-3xl shadow-sm border border-slate-100 p-4 hidden md:flex flex-col shrink-0">
        <nav className="space-y-1.5 text-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid size={16} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('kelola')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl font-semibold transition-all cursor-pointer ${
              activeTab === 'kelola'
                ? 'bg-indigo-50 text-indigo-600 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Edit3 size={16} />
            <span>Kelola Beranda</span>
          </button>

          <a
            href="/survey"
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 font-semibold"
          >
            <FileText size={16} />
            <span>Survei</span>
          </a>

          <a
            href="/statistik"
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 font-semibold"
          >
            <BarChart2 size={16} />
            <span>Statistik</span>
          </a>

          <div className="pt-4">
            <a
              href="/"
              className="block px-4 py-2 text-xs font-bold text-indigo-600 hover:underline"
            >
              ← Lihat Web Publik
            </a>
          </div>
        </nav>
      </aside>

      <main className="flex-1 space-y-6 min-w-0">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 text-white p-7 rounded-3xl shadow-md space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            Halo, Admin & Siswa SMAN 5 Semarang! 👋
          </h2>
          <p className="text-indigo-100 text-sm">
            Kelola tampilan halaman utama dan pantau rekap data 7 KAIH secara langsung.
          </p>
          <div>
            <a
              href="/game"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm hover:bg-indigo-50 transition-all shadow-sm"
            >
              Mulai Kuis Rotasi <ArrowRight size={15} />
            </a>
          </div>
        </div>

        {activeTab === 'kelola' ? (
          <form
            onSubmit={handleSaveHomeConfig}
            className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-5"
          >
            <h3 className="text-lg font-extrabold text-slate-800">Kelola & Edit Tampilan Beranda</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Judul Utama Beranda
              </label>
              <input
                type="text"
                required
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Subjudul / Deskripsi Beranda
              </label>
              <textarea
                rows={3}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Tipe Media
                </label>
                <select
                  value={heroMediaType}
                  onChange={(e) => setHeroMediaType(e.target.value as 'image' | 'video')}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold"
                >
                  <option value="image">Gambar (Image)</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  URL Gambar / Logo Hero
                </label>
                <input
                  type="text"
                  value={heroMediaUrl}
                  onChange={(e) => setHeroMediaUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={savingHome}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl text-sm cursor-pointer"
              >
                <Save size={16} />
                <span>{savingHome ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Progress Kebiasaan</h3>
                  <p className="text-xs text-slate-500">Ringkasan capaian dari Spreadsheet</p>
                </div>
                <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full">
                  {completion}%
                </span>
              </div>

              <div className="flex items-center justify-center py-4">
                <div className="relative h-44 w-44">
                  <div className="absolute inset-0 rounded-full bg-slate-100" />
                  <div
                    className="absolute inset-0 rounded-full transition-all duration-700"
                    style={{
                      background: `conic-gradient(#6366f1 0 ${completion}%, #e2e8f0 ${completion}% 100%)`,
                    }}
                  />
                  <div className="absolute inset-4 rounded-full bg-white shadow-inner flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-extrabold text-slate-800">{completion}%</div>
                      <div className="text-[11px] text-slate-500">Tercapai</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Kebiasaan</p>
                  <p className="font-bold text-slate-800 mt-1">7 dari 7</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wide text-indigo-500">Total Rekapan</p>
                  <p className="font-bold text-indigo-700 mt-1">{totalSubmissions} Data</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg mb-1">Aksi Cepat</h3>
              <p className="text-xs text-slate-500 mb-5">
                Akses fitur utama 7 KAIH secara langsung.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('kelola')}
                  className="block w-full p-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-sm text-center hover:bg-indigo-100 transition-all cursor-pointer"
                >
                  Kelola / Edit Beranda
                </button>
                <a
                  href="/survey"
                  className="block w-full p-4 bg-purple-50 text-purple-700 rounded-2xl font-bold text-sm text-center hover:bg-purple-100 transition-all"
                >
                  Isi Survei Evaluasi Diri
                </a>
                <a
                  href="/statistik"
                  className="block w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold text-sm text-center hover:bg-blue-100 transition-all"
                >
                  Lihat Statistik Siswa
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <aside className="w-64 space-y-6 hidden xl:block shrink-0">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Total Siswa Berpartisipasi</span>
            <span className="font-bold text-indigo-600">{uniqueStudents} Siswa</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {completion}% indeks rata-rata kebiasaan dari {totalSubmissions} rekapan Spreadsheet
          </p>
        </div>
      </aside>
    </div>
  )
}