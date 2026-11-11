'use client'

import { useState } from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Radar, Bar } from 'react-chartjs-2'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
)

export default function StatistikPage() {
  const [studentName, setStudentName] = useState('')
  const [className, setClassName] = useState('')
  const [isSearched, setIsSearched] = useState(false)

  // Contoh Data Rata-Rata Karakter Siswa (Skala 1 - 5)
  const categories = [
    'Bangun Pagi',
    'Beribadah',
    'Berolahraga',
    'Makan Sehat',
    'Gemar Membaca',
    'Bermasyarakat',
    'Istirahat Cukup',
  ]

  // Mock data skor perkembangan siswa vs Rata-rata Sekolah
  const studentScores = [4.5, 4.8, 3.8, 4.2, 4.0, 4.6, 3.9]
  const schoolAverage = [4.1, 4.5, 3.6, 4.0, 3.7, 4.2, 3.8]

  const radarData = {
    labels: categories,
    datasets: [
      {
        label: 'Skor Saya',
        data: studentScores,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3B82F6',
        borderWidth: 2,
        pointBackgroundColor: '#2563EB',
      },
      {
        label: 'Rata-Rata Sekolah',
        data: schoolAverage,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10B981',
        borderWidth: 2,
        pointBackgroundColor: '#059669',
      },
    ],
  }

  const barData = {
    labels: categories,
    datasets: [
      {
        label: 'Capaian Kebiasaan (%)',
        data: studentScores.map((score) => (score / 5) * 100),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899',
          '#06B6D4',
        ],
        borderRadius: 8,
      },
    ],
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (studentName.trim()) {
      setIsSearched(true)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Analytics & Insights
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
          Statistik & Perkembangan Siswa
        </h1>
        <p className="text-gray-600 font-medium leading-relaxed">
          Cari nama dan kelasmu untuk melihat grafik evaluasi diri berdasarkan 7 Kebiasaan Anak Indonesia Hebat SMAN 5 Semarang.
        </p>
      </div>

      {/* Form Pencarian Siswa */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            required
            placeholder="Masukkan Nama Lengkap Siswa..."
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 !text-gray-900 !bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all text-sm"
          >
            Cari Grafik
          </button>
        </form>
      </div>

      {/* Section Grafik & Dashboard Progress */}
      {isSearched && (
        <div className="space-y-8 animate-fadeIn">
          {/* Ringkasan Skor Kartu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Total Skor Rata-Rata</p>
              <h3 className="text-3xl font-extrabold mt-2">4.26 / 5.0</h3>
              <p className="text-xs text-blue-100 mt-1 font-medium">Sangat Baik (Karakter Unggul)</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Kebiasaan Tertinggi</p>
              <h3 className="text-2xl font-extrabold mt-2">Beribadah</h3>
              <p className="text-xs text-emerald-100 mt-1 font-medium">Skor 4.8 - Tepat Waktu & Konsisten</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-2xl shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-100">Perlu Ditingkatkan</p>
              <h3 className="text-2xl font-extrabold mt-2">Berolahraga</h3>
              <p className="text-xs text-amber-100 mt-1 font-medium">Skor 3.8 - Target minimal 3x seminggu</p>
            </div>
          </div>

          {/* Radar Chart & Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                Analisis Karakter Radar 7 Kebiasaan
              </h3>
              <div className="w-full max-w-md h-80">
                <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                Persentase Capaian per Dimensi
              </h3>
              <div className="w-full max-w-md h-80">
                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}