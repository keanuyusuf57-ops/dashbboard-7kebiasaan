'use client'

import { Sparkles, Target, CheckCircle2, Flame } from 'lucide-react'

const HABIT_COACHING_DB = [
  {
    name: 'Bangun Pagi',
    motivation: 'Memulai hari lebih awal memberi ketenangan pikiran sebelum pelajaran pertama dimulai.',
    microSteps: [
      'Pasang 2 alarm berjarak 5 menit (misal 05.00 dan 05.05) dan letakkan HP agak jauh dari tempat tidur.',
      'Segera buka tirai kamar dan minum segelas air putih begitu bangun agar rasa kantuk hilang.',
      'Siapkan seragam dan buku pelajaran sejak malam hari agar pagi hari tidak terburu-buru.',
    ],
  },
  {
    name: 'Beribadah',
    motivation: 'Ketekunan beribadah menjaga ketenangan batin dan memperkuat integritas dirimu setiap hari.',
    microSteps: [
      'Gunakan pengingat waktu ibadah di ponsel agar tidak terlewat di sela aktivitas sekolah.',
      'Luangkan 2 menit untuk berdoa dengan penuh kesadaran sebelum memulai belajar di kelas.',
      'Ajak teman sebangku untuk saling mengingatkan waktu ibadah berjamaah di sekolah.',
    ],
  },
  {
    name: 'Berolahraga',
    motivation: 'Tubuh yang bugar meningkatkan konsentrasi otak saat mengikuti pelajaran di kelas.',
    microSteps: [
      'Lakukan peregangan ringan (stretching) selama 5 menit setiap pagi setelah bangun tidur.',
      'Pilih jalan kaki cepat atau naik tangga sekolah dengan penuh semangat minimal 3 kali seminggu.',
      'Ikuti kegiatan olahraga sore atau senam bersama teman minimal 20–30 menit.',
    ],
  },
  {
    name: 'Makan Sehat & Bergizi',
    motivation: 'Asupan nutrisi seimbang adalah bahan bakar utama energi dan daya ingatmu di sekolah.',
    microSteps: [
      'Biasakan sarapan bergizi sebelum pukul 06.30 meski dalam porsi sederhana.',
      'Bawa botol minum isi ulang (tumbler) ke sekolah dan targetkan habis minimal 2 kali pengisian.',
      'Tambahkan minimal 1 porsi sayur atau buah pada menu makan siangmu hari ini.',
    ],
  },
  {
    name: 'Gemar Membaca',
    motivation: 'Membaca 15 menit sehari memperluas wawasan dan melatih daya analisis kritis.',
    microSteps: [
      'Bawa 1 buku bacaan ringan di dalam tas untuk dibaca saat jam istirahat atau menunggu jemputan.',
      'Terapkan aturan "5 halaman sebelum membuka media sosial" setiap sore.',
      'Catat 1 kutipan atau poin menarik dari bacaanmu hari ini di buku catatan kecil.',
    ],
  },
  {
    name: 'Bermasyarakat & Membantu Orang Tua',
    motivation: 'Kepedulian terhadap keluarga dan lingkungan sekitar membentuk karakter pemimpin yang empatik.',
    microSteps: [
      'Ambil 1 tugas rumah tangga rutin setiap hari (merapikan meja makan, menyapu, atau mencuci piring).',
      'Pastikan area meja dan kolong kursimu di kelas bersih sebelum pulang sekolah.',
      'Sapa dan tawarkan bantuan kecil kepada teman atau guru yang membutuhkan di sekitarmu.',
    ],
  },
  {
    name: 'Istirahat Cukup',
    motivation: 'Tidur berkualitas sebelum pukul 22.00 memulihkan memori otak dan menjaga suasana hati.',
    microSteps: [
      'Aktifkan mode "Jangan Ganggu / Sleep Mode" di HP mulai pukul 21.30 WIB.',
      'Selesaikan tugas sekolah sebelum pukul 21.00 agar tidak terpaksa begadang.',
      'Redupkan lampu kamar 15 menit sebelum tidur agar tubuh lebih cepat rileks.',
    ],
  },
  {
    name: 'Belajar Tekun',
    motivation: 'Konsistensi belajar sedikit demi sedikit jauh lebih efektif daripada sistem kebut semalam.',
    microSteps: [
      'Ulangi catatan pelajaran hari ini selama 15 menit di sore hari saat ingatan masih segar.',
      'Gunakan teknik fokus 25 menit belajar + 5 menit istirahat tanpa distraksi notifikasi.',
      'Tandai bagian materi yang belum dipahami untuk ditanyakan kepada guru atau teman besok.',
    ],
  },
  {
    name: 'Bersosialisasi Baik',
    motivation: 'Komunikasi yang santun dan terbuka membangun lingkungan belajar yang nyaman di SMAN 5 Semarang.',
    microSteps: [
      'Biasakan mengucapkan salam, terima kasih, dan permisi dengan tulus kepada warga sekolah.',
      'Dengarkan pendapat teman secara aktif saat berdiskusi kelompok tanpa memotong pembicaraan.',
      'Luangkan waktu mengobrol langsung saat istirahat tanpa terpaku pada layar ponsel.',
    ],
  },
  {
    name: 'Mengatur Waktu',
    motivation: 'Pengelolaan waktu yang rapi membuatmu tetap produktif tanpa merasa kewalahan.',
    microSteps: [
      'Tulis 3 prioritas utama yang wajib selesai hari ini di secarik kertas atau catatan HP.',
      'Kerjakan tugas yang paling sulit terlebih dahulu saat energi masih penuh.',
      'Sisihkan waktu khusus untuk istirahat dan hobi setelah seluruh kewajiban selesai.',
    ],
  },
]

type PersonalHabitCoachProps = {
  studentName?: string
  studentAverages: number[]
}

export default function PersonalHabitCoach({
  studentName = 'Siswa Hebat',
  studentAverages,
}: PersonalHabitCoachProps) {
  const validScores = studentAverages.map((val, idx) => ({
    idx,
    score: Number.isFinite(val) ? val : 0,
  }))

  const hasData = validScores.some((item) => item.score > 0)
  if (!hasData) return null

  const sortedAsc = [...validScores]
    .filter((item) => item.score > 0)
    .sort((a, b) => a.score - b.score)

  const weakest = sortedAsc[0] || validScores[0]
  const strongest = sortedAsc[sortedAsc.length - 1] || validScores[0]
  const coachPlan = HABIT_COACHING_DB[weakest.idx] || HABIT_COACHING_DB[0]
  const strongestName = HABIT_COACHING_DB[strongest.idx]?.name || 'Kebiasaan Positif'

  return (
    <section className="kaih-glass-card p-5 sm:p-7 rounded-3xl space-y-4 border border-indigo-200/80">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
            <Sparkles size={12} />
            <span>AI Personal Habit Coach</span>
          </span>
          <h3 className="font-heading text-lg sm:text-xl font-black text-[#090D16] mt-2">
            Rekomendasi Pendampingan Karakter untuk {studentName}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 inline-flex items-center gap-1">
            <Flame size={13} />
            Terkuat: {strongestName} ({strongest.score.toFixed(1)})
          </span>
        </div>
      </div>

      <div className="bg-white/85 border border-white rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm font-extrabold">
          <Target size={16} className="text-amber-600 shrink-0" />
          <span>
            Fokus Peningkatan Utamamu: <strong>{coachPlan.name}</strong> (Skor Saat Ini:{' '}
            {weakest.score.toFixed(2)} / 4.0)
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
          "{coachPlan.motivation}"
        </p>

        <div className="pt-1 space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-800">
            3 Langkah Mikro Harian yang Bisa Kamu Mulai Hari Ini:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {coachPlan.microSteps.map((step, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-2.5"
              >
                <CheckCircle2 size={16} className="text-indigo-700 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-slate-900 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}