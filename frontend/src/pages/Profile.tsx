import { useState } from 'react'
import { AdminLayout } from '../components/AdminLayout'
import { userApi } from '../services/api'
import { useAuthStore } from '../context/auth'

export default function Profile() {
  const user = useAuthStore((state) => state.user)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      await userApi.updateMe({ full_name: fullName.trim(), phone: phone.trim() || null })
      await checkAuth()
      setMessage('Perfil actualizado correctamente.')
    } catch (err: any) {
      setError(err.apiMessage || err.message || 'Error al actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout pageTitle="Mi Perfil">
      <div className="max-w-[900px] mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xl font-extrabold text-slate-800">Datos de la cuenta</h3>
          <p className="mt-2 text-sm text-slate-500">Aquí puedes actualizar tu nombre y teléfono de contacto.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {message && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">
                Nombre completo
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Correo electrónico
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                Teléfono
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
            </div>

            {user?.role === 'kinesiologo' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                <p className="font-bold text-slate-800">Perfil de kinesiólogo</p>
                <p className="mt-2">Tu rol es <span className="font-semibold capitalize">kinesiólogo</span>.</p>
                <p className="mt-2">Si necesitas actualizar tu especialidad o tu número de licencia, por favor contacta al administrador o gestiona esa información desde el panel de administración.</p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm text-slate-500">
                <p className="font-semibold text-slate-700">Información importante</p>
                <p>El correo electrónico no se puede cambiar desde aquí para mantener la sesión segura.</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
