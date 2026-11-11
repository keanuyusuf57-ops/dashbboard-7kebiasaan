import { redirect } from 'next/navigation'

export default function AdminPage() {
  // Mengarahkan otomatis /admin ke menu pertama yaitu Edit Beranda
  redirect('/admin/beranda')
}