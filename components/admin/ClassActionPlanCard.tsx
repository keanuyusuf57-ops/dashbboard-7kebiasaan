'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, Users, AlertTriangle } from 'lucide-react'

const CLASS_INTERVENTION_PROGRAMS = [
  {
    habit: 'Bangun Pagi',
    programTitle: 'Gerakan Apel Pagi & Presensi Ceria Sebelum 06.50 WIB',
    waliKelasAction:
      'Wali kelas mengirim pengingat singkat di grup kelas pukul 05.15 WIB selama 1 minggu dan memberikan apresiasi bagi kelompok absen yang hadir tepat waktu 100%.',
  },
  {
    habit: 'Beribadah',
    programTitle: 'Pembiasaan Doa Bersama & Duta Rohani Kelas',
    waliKelasAction:
      'Menunjuk koordinator rohani kelas secara bergilir untuk memimpin doa awal pelajaran dan mengingatkan waktu ibadah berjamaah saat istirahat.',
  },
  {
    habit: 'Berolahraga',
    programTitle: 'Jumat Bugar & Tantangan 10.000 Langkah Antar Kelompok',
    waliKelasAction:
      'Mengadakan peregangan bersama 5 menit sebelum jam pelajaran ke-5 dan membentuk kelompok olahraga ringan mingguan di kelas.',
  },
  {
    habit: 'Makan Sehat & Bergizi',
    programTitle: 'Program Bekal Sehat & Sarapan Bersama Kelas',
    waliKelasAction:
      'Mengagendakan kegiatan membawa bekal bergizi seimbang (4 sehat) pada hari tertentu dan edukasi pengurangan minuman tinggi gula.',
  },
  {
    habit: 'Gemar Membaca',
    programTitle: 'Pojok Literasi 15 Menit Sebelum Jam Pertama',
    waliKelasAction:
      'Mewajibkan setiap siswa membawa 1 buku bacaan non-pelajaran dan mengadakan sesi berbagi 1 menit ulasan buku setiap hari Senin.',
  },
  {
    habit: 'Bermasyarakat & Membantu Orang Tua',
    programTitle: 'Jurnal Bakti Rumah & Gotong Royong Kebersihan Kelas',
    waliKelasAction:
      'Mengevaluasi jadwal piket kelas berbasis tim dan mengajak siswa berbagi cerita aksi membantu orang tua saat jam perwalian.',
  },
  {
    habit: 'Istirahat Cukup',
    programTitle: 'Kampanye Detoks Gawai Pukul 21.30 WIB (Bebas Begadang)',
    waliKelasAction:
      'Menyepakati jam batas diskusi tugas kelompok di grup kelas maksimal pukul 21.00 WIB agar siswa dapat tidur cukup sebelum pukul 22.00 WIB.',
  },
  {
    habit: 'Belajar Tekun',
    programTitle: 'Klinik Belajar Sebaya (Peer Tutoring) Kelas',
    waliKelasAction:
      'Memasangkan siswa dengan pemahaman kuat sebagai tutor sebaya untuk mendampingi teman sekelas menjelang ulangan harian.',
  },
  {
    habit: 'Bersosialisasi Baik',
    programTitle: 'Rotasi Kelompok Diskusi Lintas Minat',
    waliKelasAction:
      'Mengatur rotasi tempat duduk dan anggota kelompok tugas secara berkala agar seluruh siswa saling mengenal dan kompak.',
  },
  {
    habit: 'Mengatur Waktu',
    programTitle: 'Lokakarya Mini Perencanaan Jadwal Mingguan Siswa',
    waliKelasAction:
      'Membimbing siswa menyusun pembagian waktu antara kegiatan OSIS/ekstrakurikuler dan penyelesaian tugas sekolah saat jam bimbingan.',
  },
]

type ClassActionPlanCardProps = {
  selectedClass: string
  classRows: any[]
}

export default function ClassActionPlanCard({
  selectedClass,
  classRows,
}: ClassActionPlanCardProps) {
  const [copied, setCopied] = useState(false)

  if (!selectedClass || selectedClass === 'ALL' || classRows.length === 0) {
    return null
  }

  // Hitung rata-rata 10 indikator khusus kelas terpilih
  const averages = Array.from({ length: 10 }, (_, idx) => {
    const vals = classRows
      .map((r) => {
        if (Array.isArray(r.answers_json) && r.answers_json[idx] !== undefined) {
          return Number(r.answers_json[idx])
        }
        return Number(r[`q${idx + 1}`])
      })
      .filter((v) => Number.isFinite(v) && v >= 1 && v <= 4)

    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  })

  let lowestIdx = 0
  averages.forEach((val, idx) => {
    if (val > 0 && (averages[lowestIdx] === 0 || val < averages[lowestIdx])) {
      lowestIdx = idx
    }
  })

  const lowestScore = averages[lowestIdx] || 0
  const plan = CLASS_INTERVENTION_PROGRAMS[lowestIdx] || CLASS_INTERVENTION_PROGRAMS[0]

  const summaryText = `*AI Action Plan 7 KAIH - Kelas ${selectedClass} (SMAN 5 Semarang)*\n• Total Data Masuk: ${classRows.length} rekapan\n• Prioritas Pembinaan Kelas: *${plan.habit}* (Skor Rata-rata: ${lowestScore.toFixed(2)}/4.0)\n• Rekomendasi Program: *${plan.programTitle}*\n• Tindak Lanjut Wali Kelas: ${plan.waliKelasAction}`

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-200 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles size={12} />
            <span>AI Action Plan Per Kelas</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-800">
            <Users size={14} className="text-indigo-700" />
            Kelas {selectedClass} ({classRows.length} Data)
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-extrabold cursor-pointer transition-all"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          <span>{copied ? 'Tersalin untuk Wali Kelas' : 'Salin Rekomendasi Kelas'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4 bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-800 text-xs font-extrabold">
            <AlertTriangle size={14} />
            <span>Indikator Terendah Kelas {selectedClass}</span>
          </div>
          <p className="text-base font-black text-amber-950">
            {plan.habit} ({lowestScore.toFixed(2)} / 4.0)
          </p>
        </div>

        <div className="md:col-span-8 space-y-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-800">
            Program Rekomendasi: {plan.programTitle}
          </p>
          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
            {plan.waliKelasAction}
          </p>
        </div>
      </div>
    </div>
  )
}