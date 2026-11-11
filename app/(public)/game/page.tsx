'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Option = {
  text: string
  habit: string
}

type QuestionData = {
  id: string
  time_slot: number
  pertanyaan: string
  opsi_a: Option
  opsi_b: Option
  opsi_c: Option
}

type AnswerRecord = {
  questionText: string
  selectedOptionText: string
  habit: string
}

export default function GameKuisPage() {
  const supabase = createClient()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [screen, setScreen] = useState<'start' | 'quiz' | 'result'>('start')
  const [currentQuestions, setCurrentQuestions] = useState<QuestionData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [userAnswers, setUserAnswers] = useState<AnswerRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [timerText, setTimerText] = useState('🔄 Rotasi Soal Berikutnya: --:--:--')
  const [resultTitle, setResultTitle] = useState('')
  const [resultDesc, setResultDesc] = useState('')
  const [personalTips, setPersonalTips] = useState<string[]>([])
  const [awarenessLevel, setAwarenessLevel] = useState<string>('')
  const [awarenessDesc, setAwarenessDesc] = useState<string>('')
  const [savedResultId, setSavedResultId] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<boolean>(false)

  // AUDIO FX STATE
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // STATISTIK KOMUNITAS
  const [communityPercentage, setCommunityPercentage] = useState<number | null>(null)
  const [totalPlayers, setTotalPlayers] = useState<number>(0)

  // SINTESIS SUARA AUDIO FX (Web Audio API)
  const playSound = (type: 'click' | 'fanfare') => {
    if (isMuted) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      if (type === 'click') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(600, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
      } else if (type === 'fanfare') {
        const notes = [440, 554.37, 659.25, 880]
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.3)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(ctx.currentTime + idx * 0.1)
          osc.stop(ctx.currentTime + idx * 0.1 + 0.3)
        })
      }
    } catch (e) {
      console.warn('Audio FX Error:', e)
    }
  }

  // Hitung Time Slot Saat Ini (0: 00-06, 1: 06-12, 2: 12-18, 3: 18-24)
  const getCurrentTimeSlot = () => {
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 6) return 0
    if (hour >= 6 && hour < 12) return 1
    if (hour >= 12 && hour < 18) return 2
    return 3
  }

  // Timer Rotasi 6 Jam
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const secondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
      const sixHoursInSeconds = 6 * 3600
      const secondsUntilNextSlot = sixHoursInSeconds - (secondsInDay % sixHoursInSeconds)

      const hours = Math.floor(secondsUntilNextSlot / 3600)
      const minutes = Math.floor((secondsUntilNextSlot % 3600) / 60)
      const seconds = secondsUntilNextSlot % 60

      setTimerText(
        `🔄 Rotasi Soal Berikutnya: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  // Mulai Kuis & Fetch Soal dari Supabase
  const startGame = async () => {
    playSound('click')
    setScreen('quiz')
    setCurrentIndex(0)
    setScores({})
    setUserAnswers([])
    setCommunityPercentage(null)
    setCopiedText(false)
    setLoading(true)

    const activeSlot = getCurrentTimeSlot()

    try {
      const { data, error } = await supabase
        .from('bank_soal')
        .select('*')
        .eq('time_slot', activeSlot)
        .limit(10)

      if (error) throw error

      if (data && data.length > 0) {
        setCurrentQuestions(data as QuestionData[])
      } else {
        alert('Belum ada data soal untuk slot jam ini di database!')
        setScreen('start')
      }
    } catch (err: any) {
      console.error('Gagal mengambil data kuis:', err?.message || err)
      alert(`Gagal terhubung ke database Supabase: ${err?.message || 'Periksa koneksi RLS'}`)
      setScreen('start')
    } finally {
      setLoading(false)
    }
  }

  // Pilih Opsi Jawaban
  const selectOption = (option: Option) => {
    playSound('click')
    const currentQ = currentQuestions[currentIndex]

    setScores((prev) => ({
      ...prev,
      [option.habit]: (prev[option.habit] || 0) + 1,
    }))

    const newAnswer: AnswerRecord = {
      questionText: currentQ.pertanyaan,
      selectedOptionText: option.text,
      habit: option.habit,
    }

    const updatedAnswers = [...userAnswers, newAnswer]
    setUserAnswers(updatedAnswers)

    if (currentIndex + 1 < currentQuestions.length) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      showResult(updatedAnswers)
    }
  }

  // Tampilkan Hasil Kuis & Simpan Ke Database
  const showResult = async (finalAnswers: AnswerRecord[]) => {
    setScreen('result')
    playSound('fanfare')

    let topHabit = 'Teratur'
    let maxScore = -1

    const tempScores: Record<string, number> = {}
    finalAnswers.forEach((ans) => {
      tempScores[ans.habit] = (tempScores[ans.habit] || 0) + 1
    })

    for (const [habit, score] of Object.entries(tempScores)) {
      if (score > maxScore) {
        maxScore = score
        topHabit = habit
      }
    }

    if (maxScore >= 8) {
      setAwarenessLevel('Fokus & Konsisten Tinggi 🎯')
      setAwarenessDesc('Jawabanmu menunjukkan kecenderungan karakter yang sangat kuat dan konsisten di satu bidang utama.')
    } else if (maxScore >= 5) {
      setAwarenessLevel('Seimbang & Reflektif ⚖️')
      setAwarenessDesc('Kamu memiliki keseimbangan kebiasaan yang fleksibel dan mempertimbangkan situasi secara matang.')
    } else {
      setAwarenessLevel('Eksploratif & Dinamis 🌟')
      setAwarenessDesc('Jawabanmu bervariasi secara alami, menandakan kamu siap mencoba berbagai kebiasaan positif baru.')
    }

    let title = '⚡ Si Pelopor Disiplin & Sehat'
    let desc =
      'Hebat! Kamu selalu konsisten dalam menjaga kebiasaan positif seperti bangun pagi dan menjaga kesehatan tubuh. Kamu panutan yang luar biasa!'
    let tips = [
      '💡 Pasang alarm berjarak dan langsung bangun tanpa tekan snooze biar energimu tidak drop.',
      '🥗 Cobalah sesekali bawa bekal buah atau jus dari rumah buat variasi nutrisi di sekolah.',
      '😴 Usahakan matikan layar HP 30 menit sebelum tidur biar kualitas tidurmu makin maksimal.'
    ]

    if (topHabit === 'Gemar Membaca') {
      title = '🌱 Si Cerdas Pembelajar Sejati'
      desc =
        'Kamu adalah anak yang selalu ingin tahu dan teratur! Rasa penasaranmu pada ilmu pengetahuan akan membawamu meraih cita-cita yang tinggi.'
      tips = [
        '📚 Buat target membaca santai minimal 10-15 halaman per hari dari buku impianmu.',
        '📝 Coba buat catatan ringkas atau rangkuman kreatif (mind map) biar ilmunya awet di kepala.',
        '🤝 Bagikan info menarik atau fakta unik yang baru kamu baca ke teman kelasmu!'
      ]
    } else if (topHabit === 'Gotong Royong' || topHabit === 'Sosial') {
      title = '🤝 Si Bintang Gotong Royong'
      desc =
        'Kamu punya kepedulian sosial yang tinggi! Sikap ramah dan suka membantumu membuat teman-teman merasa nyaman berada di dekatmu.'
      tips = [
        '✨ Tetap jadi inisiator kebaikan saat ada kegiatan kelompok atau piket kelas.',
        '💙 Ingat untuk tetap luangkan waktu istirahat buat diri sendiri alias "me time".',
        '💬 Jadilah pendengar yang baik ketika temanmu butuh tempat bercerita.'
      ]
    }

    setResultTitle(title)
    setResultDesc(desc)
    setPersonalTips(tips)

    try {
      const { data, error } = await supabase
        .from('hasil_kuis')
        .insert([{ profil_hasil: title, skor: tempScores }])
        .select()

      if (!error && data && data.length > 0) {
        setSavedResultId(data[0].id)
      }

      const { data: allResults, error: fetchErr } = await supabase
        .from('hasil_kuis')
        .select('profil_hasil')

      if (!fetchErr && allResults) {
        const total = allResults.length
        const matchCount = allResults.filter((r) => r.profil_hasil === title).length
        const percentage = total > 0 ? Math.round((matchCount / total) * 100) : 100

        setTotalPlayers(total)
        setCommunityPercentage(percentage)
      }
    } catch (err: any) {
      console.error('Gagal menyimpan/mengambil data statistik:', err?.message || err)
    }
  }

  // FUNGSI BAGIKAN TEKS HASIL
  const copyShareText = () => {
    playSound('click')
    const textToShare = `🎮 Tipe Kebiasaan Hebatku: ${resultTitle}\n"${resultDesc}"\n\nYuk ikutan kuis 7 Kebiasaan Anak Indonesia Hebat SMAN 5 Semarang!`
    navigator.clipboard.writeText(textToShare)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 3000)
  }

  // FUNGSI GENERATE GAMBAR POSTER PNG (SELARAS WARNA KUIS + KARAKTER MASKOT HD)
  const downloadResultCard = () => {
    playSound('click')
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Canvas Resolusi Tinggi Vertikal (640 x 960 px)
    canvas.width = 640
    canvas.height = 960

    // 1. Latar Belakang Selaras Tema Kuis (#F0F9F4 Soft Emerald)
    ctx.fillStyle = '#F0F9F4'
    ctx.fillRect(0, 0, 640, 960)

    // Frame/Border Luar Poster Hijau Kebiasaan
    ctx.strokeStyle = '#2ECC71'
    ctx.lineWidth = 6
    ctx.strokeRect(16, 16, 608, 928)

    // Aksen Ornamen Lingkaran Dekoratif Soft Green
    ctx.fillStyle = 'rgba(46, 204, 113, 0.08)'
    ctx.beginPath()
    ctx.arc(520, 100, 160, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(100, 880, 200, 0, Math.PI * 2)
    ctx.fill()

    // 2. Header Title "7 KEBIASAAN ANAK HEBAT" (Typography Khas Poster)
    ctx.textAlign = 'center'
    
    // Angka "7" Hijau Emerald Kuis
    ctx.fillStyle = '#27AE60'
    ctx.font = '900 76px "Arial Black", sans-serif'
    ctx.fillText('7', 110, 92)

    // Teks 2 Baris Hijau Tua #1E8449
    ctx.fillStyle = '#1E8449'
    ctx.font = '900 32px "Arial Black", sans-serif'
    ctx.fillText('KEBIASAAN', 340, 78)
    ctx.fillText('ANAK HEBAT', 340, 114)

    // Badge Subtitle Profil Siswa
    ctx.fillStyle = '#E8F8F5'
    ctx.beginPath()
    ctx.roundRect(80, 134, 480, 36, 18)
    ctx.fill()
    ctx.fillStyle = '#1E8449'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText(`PROFIL: ${resultTitle.toUpperCase()}`, 320, 157)

    // 3. Menggambar Karakter Maskot Kuis Daun HD di Canvas
    const drawCanvasMascot = (cX: number, cY: number) => {
      ctx.save()
      ctx.translate(cX, cY)

      // Badan Daun (Emerald Green)
      ctx.fillStyle = '#80C242'
      ctx.strokeStyle = '#468826'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(0, 0, 42, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Tangkai Atas
      ctx.fillStyle = '#468826'
      ctx.beginPath()
      ctx.ellipse(0, -42, 6, 12, 0, 0, Math.PI * 2)
      ctx.fill()

      // Mata Berbinar
      ctx.fillStyle = '#1C2D42'
      ctx.beginPath()
      ctx.arc(-14, -6, 7, 0, Math.PI * 2)
      ctx.arc(14, -6, 7, 0, Math.PI * 2)
      ctx.fill()

      // Kilau Mata Putih
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(-16, -8, 2.5, 0, Math.PI * 2)
      ctx.arc(12, -8, 2.5, 0, Math.PI * 2)
      ctx.fill()

      // Pipi Merona
      ctx.fillStyle = 'rgba(255, 118, 117, 0.8)'
      ctx.beginPath()
      ctx.arc(-22, 4, 5, 0, Math.PI * 2)
      ctx.arc(22, 4, 5, 0, Math.PI * 2)
      ctx.fill()

      // Senyum Manis
      ctx.strokeStyle = '#3A6E1F'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 2, 10, 0.2, Math.PI - 0.2)
      ctx.stroke()

      // Aksesoris Bintang Mas di Samping Maskot
      ctx.fillStyle = '#F1C40F'
      ctx.beginPath()
      ctx.arc(38, -30, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    // 4. Helper Fungsi Menggambar Hexagon Sarang Lebah
    const drawHexagon = (
      x: number, 
      y: number, 
      radius: number, 
      fillColor: string, 
      strokeColor: string,
      title: string,
      isActive: boolean = false
    ) => {
      ctx.save()
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const hX = x + radius * Math.cos(angle)
        const hY = y + radius * Math.sin(angle)
        if (i === 0) ctx.moveTo(hX, hY)
        else ctx.lineTo(hX, hY)
      }
      ctx.closePath()

      ctx.fillStyle = fillColor
      ctx.fill()
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isActive ? 4 : 2
      ctx.stroke()

      // Teks Kebiasaan di Dalam Hexagon
      ctx.fillStyle = isActive ? '#FFFFFF' : '#2C3E50'
      ctx.font = isActive ? 'bold 13px sans-serif' : '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(title, x, y + 4)

      ctx.restore()
    }

    // 5. Grid Hexagon Sarang Lebah (7 Kebiasaan)
    const centerX = 320
    const centerY = 370
    const r = 68 // Radius Hexagon

    const habits = [
      { name: 'Taat Beribadah', x: centerX, y: centerY, isCenter: true },
      { name: 'Rajin Belajar', x: centerX, y: centerY - r * 1.73 },
      { name: 'Makan Sehat', x: centerX + r * 1.5, y: centerY - r * 0.865 },
      { name: 'Tidur Cepat', x: centerX + r * 1.5, y: centerY + r * 0.865 },
      { name: 'Rajin Olahraga', x: centerX, y: centerY + r * 1.73 },
      { name: 'Bermasyarakat', x: centerX - r * 1.5, y: centerY + r * 0.865 },
      { name: 'Bangun Pagi', x: centerX - r * 1.5, y: centerY - r * 0.865 },
    ]

    habits.forEach((h) => {
      const isHighlighted = h.isCenter || resultTitle.toLowerCase().includes(h.name.toLowerCase().split(' ')[0])
      const fillColor = isHighlighted ? '#27AE60' : '#FFFFFF'
      const strokeColor = isHighlighted ? '#1E8449' : '#A6ACAF'
      drawHexagon(h.x, h.y, r, fillColor, strokeColor, h.name, isHighlighted)
    })

    // Lukis Karakter Maskot tepat di atas Hexagon Pusat
    drawCanvasMascot(centerX, centerY)

    // 6. Kartu Putih Informasi & Tips (Bagian Bawah)
    const boxY = 575
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = '#2ECC71'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(40, boxY, 560, 260, 24)
    ctx.fill()
    ctx.stroke()

    // Deskripsi Profil
    ctx.fillStyle = '#1E8449'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('💡 Refleksi Kebiasaan Kamu:', 65, boxY + 36)

    ctx.fillStyle = '#4A5568'
    ctx.font = '13px sans-serif'
    
    const words = resultDesc.split(' ')
    let line = ''
    let lineY = boxY + 62
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' '
      let metrics = ctx.measureText(testLine)
      if (metrics.width > 500 && n > 0) {
        ctx.fillText(line, 65, lineY)
        line = words[n] + ' '
        lineY += 20
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, 65, lineY)

    // Action Tip Utama
    if (personalTips.length > 0) {
      ctx.fillStyle = '#27AE60'
      ctx.font = 'bold 13px sans-serif'
      ctx.fillText('📌 Tips Utama:', 65, lineY + 32)
      ctx.fillStyle = '#2D3748'
      ctx.font = '12px sans-serif'
      ctx.fillText(personalTips[0], 65, lineY + 52)
    }

    // Badge Refleksi Diri (Pola Karakter)
    ctx.fillStyle = '#E8F8F5'
    ctx.beginPath()
    ctx.roundRect(65, boxY + 190, 510, 42, 12)
    ctx.fill()
    ctx.fillStyle = '#1E8449'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(`🧠 Status Refleksi: ${awarenessLevel}`, 80, boxY + 216)

    // 7. Footer Resmi Sekolah
    ctx.fillStyle = '#7F8C8D'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SMAN 5 SEMARANG — GERAKAN 7 KEBIASAAN ANAK INDONESIA HEBAT', 320, 885)

    // Download PNG
    const imageURI = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `Poster_7Kebiasaan_${resultTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    link.href = imageURI
    link.click()
  }

  // Komponen SVG Maskot Dinamis
  const MascotSVG = ({ variant }: { variant?: string }) => (
    <svg className="w-32 h-32 mx-auto drop-shadow-md hover:scale-105 transition-all animate-bounce" viewBox="0 0 200 220">
      <path d="M 100 25 C 160 30, 185 85, 175 140 C 165 180, 135 195, 100 195 C 65 195, 35 180, 25 140 C 15 85, 40 30, 100 25 Z" fill="#80C242" stroke="#468826" strokeWidth="3"/>
      <path d="M 100 30 L 100 190" stroke="#5E9C30" strokeWidth="2.5" opacity="0.6"/>
      <path d="M 100 25 C 85 10, 85 -5, 100 -5 C 115 -5, 115 10, 100 25 Z" fill="#80C242" stroke="#468826" strokeWidth="2"/>
      <ellipse cx="72" cy="110" rx="16" ry="20" fill="#1C2D42"/>
      <ellipse cx="72" cy="110" rx="14" ry="18" fill="#1E78B4"/>
      <ellipse cx="72" cy="114" rx="9" ry="12" fill="#38B6FF"/>
      <circle cx="67" cy="100" r="6" fill="#FFFFFF"/>
      <ellipse cx="128" cy="110" rx="16" ry="20" fill="#1C2D42"/>
      <ellipse cx="128" cy="110" rx="14" ry="18" fill="#1E78B4"/>
      <ellipse cx="128" cy="114" rx="9" ry="12" fill="#38B6FF"/>
      <circle cx="123" cy="100" r="6" fill="#FFFFFF"/>
      <path d="M 62 82 Q 72 78 80 84" stroke="#3A6E1F" strokeWidth="3" fill="none"/>
      <path d="M 138 82 Q 128 78 120 84" stroke="#3A6E1F" strokeWidth="3" fill="none"/>
      <ellipse cx="58" cy="128" rx="9" ry="5" fill="#FF7675" opacity="0.85"/>
      <ellipse cx="142" cy="128" rx="9" ry="5" fill="#FF7675" opacity="0.85"/>
      <path d="M 88 126 Q 100 142 112 126 Z" fill="#D63031"/>
      <rect x="75" y="185" width="12" height="15" fill="#69AB2D" rx="4"/>
      <rect x="113" y="185" width="12" height="15" fill="#69AB2D" rx="4"/>

      {variant === 'reading' && (
        <>
          <circle cx="72" cy="110" r="17" fill="none" stroke="#2C3E50" strokeWidth="4"/>
          <circle cx="128" cy="110" r="17" fill="none" stroke="#2C3E50" strokeWidth="4"/>
          <line x1="89" y1="110" x2="111" y2="110" stroke="#2C3E50" strokeWidth="4"/>
        </>
      )}
      {variant === 'star' && (
        <polygon points="100,5 106,20 122,20 109,30 114,45 100,35 86,45 91,30 78,20 94,20" fill="#F1C40F" stroke="#F39C12" strokeWidth="1.5"/>
      )}
    </svg>
  )

  const currentQ = currentQuestions[currentIndex]

  return (
    <div className="min-h-screen bg-[#F0F9F4] flex items-center justify-center p-4">
      {/* Element Canvas tersembunyi untuk perakit poster PNG */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-white w-full max-w-xl rounded-3xl border-4 border-[#2ECC71] shadow-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* TOP BAR: TIMER & AUDIO TOGGLE */}
        <div className="flex items-center justify-between gap-2">
          <div className="bg-[#E8F8F5] text-[#1E8449] border border-[#2ECC71] py-1.5 px-4 rounded-full text-xs font-semibold text-center flex-1">
            {timerText}
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="bg-emerald-100 hover:bg-emerald-200 text-[#1E8449] p-1.5 rounded-full text-xs font-bold transition-all px-3 flex items-center gap-1"
          >
            {isMuted ? '🔇 Audio Off' : '🔊 Audio On'}
          </button>
        </div>

        {/* 1. LAYAR UTAMA */}
        {screen === 'start' && (
          <div className="text-center space-y-5">
            <MascotSVG />
            <h1 className="text-2xl font-extrabold text-[#1E8449]">Tipe Kebiasaan Hebatmu</h1>
            <p className="text-sm text-gray-600 font-medium">
              Jawab 10 pertanyaan santai untuk menemukan tipe karakter 7 Kebiasaan Anak Indonesia Hebat!
            </p>
            <button
              onClick={startGame}
              className="w-full bg-[#27AE60] hover:bg-[#1E8449] text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-base"
            >
              Mulai Kuis Sekarang
            </button>
          </div>
        )}

        {/* 2. LAYAR KUIS */}
        {screen === 'quiz' && (
          <div className="space-y-6">
            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2ECC71] h-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / (currentQuestions.length || 1)) * 100}%`,
                }}
              ></div>
            </div>

            <div className="text-xs font-bold text-gray-400 text-right">
              Pertanyaan {currentIndex + 1}/{currentQuestions.length || 10}
            </div>

            {loading ? (
              <p className="text-center italic text-gray-500 py-8">Memuat pertanyaan dari database...</p>
            ) : currentQ ? (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 text-center min-h-[60px] flex items-center justify-center">
                  {currentQ.pertanyaan}
                </h2>

                <div className="flex flex-col gap-3">
                  {[currentQ.opsi_a, currentQ.opsi_b, currentQ.opsi_c].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectOption(opt)}
                      className="w-full text-left bg-white border-2 border-[#2ECC71] hover:bg-[#E8F8F5] text-gray-800 p-4 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* 3. LAYAR HASIL */}
        {screen === 'result' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <MascotSVG variant={resultTitle.includes('Cerdas') ? 'reading' : 'star'} />
              <span className="text-xs font-bold text-[#1E8449] bg-[#E8F8F5] px-3 py-1 rounded-full uppercase">
                Profil Kebiasaan Kamu
              </span>
              <h2 className="text-xl font-extrabold text-[#1E8449]">{resultTitle}</h2>
              <div className="bg-[#E8F8F5] p-4 rounded-2xl text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                {resultDesc}
              </div>
            </div>

            {/* BADGE KESADARAN DIRI */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-[#1E8449] text-xs font-extrabold uppercase tracking-wider">
                🧠 Indikator Refleksi Kebiasaan
              </p>
              <p className="text-sm font-extrabold text-blue-900">
                Pola Karakter: <span className="text-blue-600">{awarenessLevel}</span>
              </p>
              <p className="text-xs text-gray-600 leading-normal">
                {awarenessDesc}
              </p>
            </div>

            {/* KARTU STATISTIK KOMUNITAS REAL-TIME */}
            {communityPercentage !== null && (
              <div className="bg-emerald-600 text-white rounded-2xl p-4 text-center space-y-1 shadow-md">
                <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
                  📊 Statistik Teman Sekolah
                </p>
                <p className="text-base sm:text-lg font-black">
                  <span className="text-yellow-300 text-xl font-black">{communityPercentage}%</span> siswa SMAN 5 Semarang juga bertipe {resultTitle}!
                </p>
                <p className="text-[11px] text-emerald-100 italic">
                  (Dihitung dari {totalPlayers} total penyelesaian kuis)
                </p>
              </div>
            )}

            {/* SARAN PERSONAL (TIPS SANTAI) */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-extrabold text-[#1E8449] uppercase tracking-wider flex items-center gap-1.5">
                📌 Tips Kebiasaan Buat Kamu
              </h3>
              <ul className="space-y-2">
                {personalTips.map((tip, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-gray-700 font-medium leading-normal">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* RINGKASAN JAWABAN SISWA */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                📝 Ringkasan Jawaban Kamu ({userAnswers.length} Soal)
              </h3>
              <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 text-left">
                {userAnswers.map((ans, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                    <p className="text-xs font-bold text-gray-800">
                      {idx + 1}. {ans.questionText}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 py-1 px-2.5 rounded-lg inline-block">
                      Pilihanmu: {ans.selectedOptionText}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* TOMBOL AKSI */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => router.push(`/survey?result_id=${savedResultId || ''}&profile=${encodeURIComponent(resultTitle)}`)}
                className="w-full bg-[#27AE60] hover:bg-[#1E8449] text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-sm"
              >
                Lanjutkan ke Web Survei Utama 🚀
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={downloadResultCard}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-all text-xs shadow"
                >
                  🖼️ Unduh Poster (PNG)
                </button>

                <button
                  onClick={copyShareText}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl transition-all text-xs shadow"
                >
                  {copiedText ? '✅ Teks Disalin!' : '📤 Salin Teks Profil'}
                </button>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-white border-2 border-[#2ECC71] hover:bg-[#E8F8F5] text-[#1E8449] font-bold py-3 rounded-2xl transition-all text-sm"
              >
                🔄 Ulangi Kuis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}