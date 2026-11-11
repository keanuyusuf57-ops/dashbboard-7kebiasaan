import { Suspense } from 'react'
import HeroSection from '@/components/public/HeroSection'

export default function HomePage() {
  const habits = [
    { title: '1. Bangun Pagi', desc: 'Membiasakan diri bangun tepat waktu untuk memulai hari dengan disiplin.' },
    { title: '2. Beribadah', desc: 'Taat menjalankan ibadah sesuai keyakinan masing-masing.' },
    { title: '3. Berolahraga', desc: 'Menjaga kesehatan dan kebugaran jasmani secara teratur.' },
    { title: '4. Makan Sehat & Bergizi', desc: 'Mengonsumsi makanan yang bernutrisi untuk mendukung tumbuh kembang.' },
    { title: '5. Gemar Membaca', desc: 'Mengembangkan minat baca untuk menambah wawasan dan literasi.' },
    { title: '6. Membantu Orang Tua', desc: 'Aktif berinteraksi, peduli lingkungan, dan bergotong royong.' },
    { title: '7. Istirahat Cukup', desc: 'Menjaga pola tidur yang teratur untuk pemulihan energi fisik dan mental.' },
  ]

  return (
    <div>
      <Suspense
        fallback={
          <div className="h-[480px] bg-gray-900 flex items-center justify-center text-white">
            <p className="text-gray-400 animate-pulse font-semibold">Memuat Beranda...</p>
          </div>
        }
      >
        <HeroSection />
      </Suspense>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            7 Kebiasaan Anak Indonesia Hebat
          </h2>
          <p className="text-gray-700 font-medium">
            Panduan kebiasaan positif menurut Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) untuk membentuk generasi yang berkarakter, mandiri, dan berdaya saing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-blue-600 mb-2">{item.title}</h3>
              <p className="text-gray-700 text-sm font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}