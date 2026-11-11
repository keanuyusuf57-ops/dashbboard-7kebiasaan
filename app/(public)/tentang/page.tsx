import { Suspense } from 'react'
import TeamList from '@/components/public/TeamList'

export default function TentangPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Judul & Deskripsi Halaman (Statis) */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tentang Dashboard 7 Kebiasaan
        </h1>
        <p className="text-gray-700 font-medium leading-relaxed">
          Dashboard Penilaian 7 Kebiasaan Anak Indonesia Hebat SMAN 5 Semarang merupakan platform digital 
          yang dirancang untuk memonitor, mengukur, dan mendukung pembentukan karakter unggul siswa-siswi 
          sesuai dengan panduan Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen).
        </p>
      </div>

      {/* Bagian Tim Pengembang (Dinamis Async Component dengan Suspense) */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Tim Pengembang & Pengelola
        </h2>

        <Suspense
          fallback={
            <div className="text-center py-12">
              <p className="text-gray-700 font-semibold text-sm animate-pulse">
                Memuat data tim pengembang...
              </p>
            </div>
          }
        >
          <TeamList />
        </Suspense>
      </div>
    </div>
  )
}