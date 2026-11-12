'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Bell, ArrowRight, Save, LayoutDashboard, Edit3 } from 'lucide-react'

const GOOGLE_SHEET_API_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL ||
  'https://script.google.com/macros/s/AKfycbyGCDCIQMCbgqy0l3hAjtuZs_Ed9F6xsj09cU9oxxnG72WizU_Q0sOVobnRtvYjGS5T/exec'

function AdminHabitDonutChart({ completion, totalRows }: { completion: number; totalRows: number }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Progress Kebiasaan</h3>
          <p className="text-xs text-slate-500">Ringkasan capaian dari Spreadsheet</p>
        </div>
        <span className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full">
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
              <div className="text-3xl font-bold text-slate-800">{completion}%</div>
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
          <p className="font-bold text-indigo-700 mt-1">{totalRows} Data</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const supabase = createClient()

  // Tab Navigasi Internal Admin ('dashboard' | 'beranda')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'beranda'>('dashboard')

  // State Data Live Spreadsheet
  const [completion, setCompletion] = useState(0)
  const [totalSubmissions, setTotalSubmissions] = useState(0)
  const [uniqueStudents, setUniqueStudents] = useState(0)

  // State Edit Beranda (Sesuai tabel home_config di Supabase)
  const [homeConfigId, setHomeConfigId] = useState<string | null>(null)
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroMediaUrl, setHeroMediaUrl] = useState('')
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video'>('image')
  const [savingHome, setSavingHome] = useState(false)

  // 1. Ambil pengaturan Beranda dari tabel home_config
  useEffect(() => {
    async function loadHomeConfig() {
      const { data } = await supabase
        .from('home_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setHomeConfigId(data.id)
        setHeroTitle(data.hero_title || '')
        setHeroSubtitle(data.hero_subtitle || '')
        setHeroMediaUrl(data.hero_media_url || '')
        setHeroMediaType(data.hero_media_type === 'video' ? 'video' : 'image')
      }
    }
    loadHomeConfig()
  }, [])

  // 2. Ambil statistik real-time dari Google Spreadsheet
  useEffect(() => {
    async function fetchSpreadsheetStats() {
      try {
        const res = await fetch(GOOGLE_SHEET_API_URL)
        const json = await res.json()
        if (json.status === 'success' && Array.isArray(json.data)) {
          const rows = json.data
          setTotalSubmissions(rows.length)

          const studentsSet = new Set(rows.map((r: any) => r.email || r.nama))
          setUniqueStudents(studentsSet.size)

          if (rows.length > 0) {
            let totalScoreSum = 0
            let totalCount = 0
            rows.forEach((r: any) => {
              if (Array.isArray(r.scores)) {
                r.scores.forEach((val: number) => {
                  totalScoreSum += Number(val) || 0
                  totalCount++
                })
              }
            })
            if (totalCount > 0) {
              const avg = totalScoreSum / totalCount
              setCompletion(Math.round((avg / 5) * 100))
            }
          }
        }
      } catch (err) {
        console.error('Gagal mengambil statistik spreadsheet:', err)
      }
    }
    fetchSpreadsheetStats()
  }, [])

  // 3. Simpan perubahan Edit Beranda ke home_config
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
      alert('Tampilan Beranda berhasil diperbarui dan langsung tampil di halaman depan!')
    } else {
      alert('Gagal menyimpan perubahan Beranda: ' + error.message)
    }
  }

  return (
    <div className="flex bg-slate-50 min-h-screen p-4 gap-6 font-sans">
      {/* Sidebar Navigasi Kiri */}
      <aside className="w-60 shrink-0 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm hidden lg:block">
        <h1 className="mb-6 text-lg font-bold text-indigo-700">7 KAIH Admin</h1>
        <nav className="space-y-2 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left flex items-center gap-2.5 rounded-xl p-3 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('beranda')}
            className={`w-full text-left flex items-center gap-2.5 rounded-xl p-3 transition-all ${
              activeTab === 'beranda'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:bg-slate-50'
            }`}
          >
            <Edit3 size={17} />
            <span>Kelola Beranda</span>
          </button>

          <a href="/survey" className="block rounded-xl p-3 hover:bg-slate-50">
            Survei
          </a>
          <a href="/statistik" className="block rounded-xl p-3 hover:bg-slate-50">
            Statistik
          </a>
          <a href="/" className="block rounded-xl p-3 text-indigo-600 hover:bg-indigo-50 mt-4 font-semibold">
            ← Lihat Web Publik
          </a>
        </nav>
      </aside>

      {/* Konten Utama Dashboard */}
      <main className="flex-1 space-y-6">
        {/* Top Header Bar (Tanpa Audio FX: ON) */}
        <header className="flex justify-between items-center bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl w-72">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Cari kebiasaan atau fitur..."
              className="bg-transparent text-sm focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(activeTab === 'dashboard' ? 'beranda' : 'dashboard')}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all text-xs font-bold"
            >
              {activeTab === 'dashboard' ? '✏️ Edit Beranda' : '← Kembali ke Dashboard'}
            </button>
            <button className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Hero Banner Gradasi Ungu - Biru */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 text-white p-6 rounded-3xl shadow-md flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Halo, Admin & Siswa SMAN 5 Semarang! 👋</h2>
            <p className="text-indigo-100 text-sm mt-1">
              Kelola tampilan halaman utama dan pantau rekap data 7 KAIH secara langsung.
            </p>
          </div>
          <a
            href="/game"
            className="bg-white text-indigo-700 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2"
          >
            Mulai Kuis Rotasi <ArrowRight size={16} />
          </a>
        </div>

        {/* TAMPILAN 1: EDIT BERANDA (Tampil saat Kelola Beranda diklik) */}
        {activeTab === 'beranda' ? (
          <form
            onSubmit={handleSaveHomeConfig}
            className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-5 max-w-3xl"
          >
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-slate-800">Kelola & Edit Tampilan Beranda</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ubah judul utama, deskripsi, atau media banner yang ditampilkan kepada siswa di halaman Beranda.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Judul Utama Beranda (Hero Title)
              </label>
              <input
                type="text"
                required
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Contoh: Penilaian 7 Kebiasaan Anak Indonesia Hebat"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Subjudul / Deskripsi Beranda (Hero Subtitle)
              </label>
              <textarea
                rows={4}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Tuliskan keterangan atau ajakan untuk siswa SMAN 5 Semarang..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tipe Media
                </label>
                <select
                  value={heroMediaType}
                  onChange={(e) => setHeroMediaType(e.target.value as 'image' | 'video')}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="image">Gambar (Image)</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  URL Gambar / Video Hero (Opsional)
                </label>
                <input
                  type="text"
                  value={heroMediaUrl}
                  onChange={(e) => setHeroMediaUrl(e.target.value)}
                  placeholder="https://... (kosongkan jika hanya menampilkan teks)"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingHome}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold px-6 py-3.5 rounded-2xl text-sm shadow-md transition-all disabled:opacity-50"
              >
                <Save size={16} />
                <span>{savingHome ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Beranda'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          /* TAMPILAN 2: DASHBOARD UTAMA (Donut Chart Live & Aksi Cepat) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminHabitDonutChart completion={completion} totalRows={totalSubmissions} />

            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg mb-2">Aksi Cepat</h3>
                <p className="text-xs text-slate-500 mb-4">Akses fitur utama 7 KAIH secara langsung.</p>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('beranda')}
                    className="block w-full p-4 bg-indigo-50 text-indigo-700 rounded-2xl font-semibold text-sm text-center hover:bg-indigo-100 transition-all"
                  >
                    Kelola / Edit Beranda
                  </button>
                  <a
                    href="/survey"
                    className="block w-full p-4 bg-purple-50 text-purple-700 rounded-2xl font-semibold text-sm text-center hover:bg-purple-100 transition-all"
                  >
                    Isi Survei Evaluasi Diri
                  </a>
                  <a
                    href="/statistik"
                    className="block w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-semibold text-sm text-center hover:bg-blue-100 transition-all"
                  >
                    Lihat Statistik Siswa
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Panel Statistik Kanan (Live dari Spreadsheet) */}
      <aside className="w-80 space-y-6 hidden xl:block">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-base mb-4">Aktivitas Komunitas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Siswa Berpartisipasi</span>
              <span className="font-bold text-indigo-600">{uniqueStudents || totalSubmissions} Siswa</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-700"
                style={{ width: `${completion || 78}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {completion}% indeks rata-rata kebiasaan dari {totalSubmissions} rekapan Spreadsheet
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}

// Di dalam useEffect pengambilan data Database Survey Admin:
async function loadAllSurveyDatabase() {
  // 1. Ambil data dari Google Spreadsheet (1.153+ data gabungan GForm & Web)
  let sheetRows: any[] = []
  try {
    const res = await fetch(GOOGLE_SHEET_API_URL)
    const json = await res.json()
    if (json.status === 'success' && Array.isArray(json.data)) {
      sheetRows = json.data.map((r: any, idx: number) => {
        const validCount = Array.isArray(r.scores)
          ? r.scores.filter((v: any) => Number(v) >= 1 && Number(v) <= 5).length
          : 10
        const parsedDate = r.timestamp ? new Date(r.timestamp).toISOString().split('T')[0] : '-'
        return {
          id: `sheet-${idx}`,
          full_name: r.nama || r.email || 'Tanpa Nama',
          student_number: r.absen || r.nisn || '-',
          class_name: r.kelas || '-',
          submission_date: parsedDate,
          answered_count: `${validCount} Soal Terisi`,
          source: 'Spreadsheet',
        }
      })
    }
  } catch (err) {
    console.error('Gagal memuat data spreadsheet ke admin:', err)
  }

  // Urutkan dari yang paling terbaru di atas
  return sheetRows.reverse()
}