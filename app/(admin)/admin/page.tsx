import { Search, Bell, Volume2, ArrowRight } from "lucide-react";

// Temporary fallback to avoid build errors when the dashboard chart component is missing.
// Replaced by the real component path if the file is added later.
const SafeHabitDonutChart = () => (
  <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
    Habit chart unavailable
  </div>
);

function Sidebar() {
  return (
    <aside className="w-60 shrink-0 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <h1 className="mb-6 text-lg font-bold text-indigo-700">7 KAIH</h1>
      <nav className="space-y-2 text-sm font-medium text-slate-600">
        <a href="/admin" className="block rounded-xl bg-indigo-50 p-3 text-indigo-700">Dashboard</a>
        <a href="/admin/beranda" className="block rounded-xl p-3 hover:bg-slate-50">Kelola Beranda</a>
        <a href="/survey" className="block rounded-xl p-3 hover:bg-slate-50">Survei</a>
        <a href="/statistik" className="block rounded-xl p-3 hover:bg-slate-50">Statistik</a>
      </nav>
    </aside>
  );
}

export default function AdminPage() {
  return (
    <div className="flex bg-slate-50 min-h-screen p-4 gap-6 font-sans">
      {/* Sidebar Navigasi Kiri */}
      <Sidebar />

      {/* Konten Utama Dashboard */}
      <main className="flex-1 space-y-6">
        {/* Top Header Bar */}
        <header className="flex justify-between items-center bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl w-72">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Cari kebiasaan atau fitur..."
              className="bg-transparent text-sm focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 text-xs font-semibold px-3">
              <Volume2 size={18} />
              <span>Audio FX: ON</span>
            </button>
            <button className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Hero Banner Gradasi Ungu - Biru */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 text-white p-6 rounded-3xl shadow-md flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Halo, Admin & Siswa SMAN 5 Semarang! 👋</h2>
            <p className="text-indigo-100 text-sm mt-1">
              Rotasi kuis berikutnya dalam <span className="font-semibold text-white">04:32:15</span>
            </p>
          </div>
          <a
            href="/game"
            className="bg-white text-indigo-700 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2"
          >
            Mulai Kuis Rotasi <ArrowRight size={16} />
          </a>
        </div>

        {/* Area Tengah: Donut Chart Progress & Aksi Cepat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SafeHabitDonutChart />

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg mb-2">Aksi Cepat</h3>
              <p className="text-xs text-slate-500 mb-4">Akses fitur utama 7 KAIH secara langsung.</p>
              <div className="space-y-3">
                <a 
                  href="/admin/beranda" 
                  className="block w-full p-4 bg-indigo-50 text-indigo-700 rounded-2xl font-semibold text-sm text-center hover:bg-indigo-100 transition-all"
                >
                  Kelola / Edit Beranda
                </a>
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
                  Unduh Poster PNG (Canvas)
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Panel Statistik Kanan */}
      <aside className="w-80 space-y-6 hidden xl:block">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-base mb-4">Aktivitas Komunitas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Siswa Berpartisipasi</span>
              <span className="font-bold text-indigo-600">1,245 Siswa</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[78%]" />
            </div>
            <p className="text-[11px] text-slate-400">78% dari total siswa aktif minggu ini</p>
          </div>
        </div>
      </aside>
    </div>
  );
}