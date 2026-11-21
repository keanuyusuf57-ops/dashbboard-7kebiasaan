'use client'

import { useState, useEffect } from 'react'
import { Sparkles, ClipboardList, BarChart3, Award, ArrowRight, X, HelpCircle } from 'lucide-react'

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Selamat Datang di Dashboard 7KAIH',
    desc: 'Platform pemantauan dan pembiasaan 7 Kebiasaan Anak Indonesia Hebat SMAN 5 Semarang berbasis data real-time.',
    icon: Sparkles,
    accent: 'bg-indigo-100 text-indigo-800',
  },
  {
    step: 2,
    title: 'Isi Survei Harian & Kumpulkan XP',
    desc: 'Gunakan menu "Yuk Survey!" untuk mengevaluasi 10 indikator harianmu, lalu uji pemahamanmu di menu "Main Game".',
    icon: ClipboardList,
    accent: 'bg-emerald-100 text-emerald-800',
  },
  {
    step: 3,
    title: 'Pantau Grafik Sekolah & Rapor Pribadi',
    desc: 'Lihat tren kelas, prediksi target sekolah, hingga rekomendasi pribadi di menu "Statistik Saya" secara otomatis.',
    icon: BarChart3,
    accent: 'bg-amber-100 text-amber-800',
  },
]

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasSeen = localStorage.getItem('kaih_onboarding_seen_v1')
    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('kaih_onboarding_seen_v1', 'true')
    setIsOpen(false)
    setCurrentStep(0)
  }

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleClose()
    }
  }

  const active = TOUR_STEPS[currentStep]
  const ActiveIcon = active.icon

  return (
    <>
      {/* Tombol Mini Bantuan untuk Membuka Panduan Kapan Saja */}
      <button
        type="button"
        onClick={() => {
          setCurrentStep(0)
          setIsOpen(true)
        }}
        title="Panduan Penggunaan Dashboard"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 hover:bg-white border border-white text-indigo-900 text-xs font-extrabold transition-all cursor-pointer shrink-0"
      >
        <HelpCircle size={14} className="text-indigo-700" />
        <span>Panduan</span>
      </button>

      {/* Modal Panduan Interaktif 3 Langkah */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-indigo-100 space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={handleClose}
              aria-label="Tutup panduan"
              className="absolute right-4 top-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${active.accent}`}>
                <ActiveIcon size={22} />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                  Langkah {active.step} dari {TOUR_STEPS.length}
                </span>
                <h3 className="font-heading text-base sm:text-lg font-black text-slate-950 leading-snug">
                  {active.title}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {active.desc}
            </p>

            {/* Indikator Titik Langkah */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStep ? 'w-6 bg-indigo-700' : 'w-2 bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Lewati
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-extrabold cursor-pointer shadow-xs"
                >
                  <span>{currentStep === TOUR_STEPS.length - 1 ? 'Mulai Jelajahi' : 'Lanjut'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}