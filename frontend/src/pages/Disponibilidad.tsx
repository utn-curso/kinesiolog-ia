import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '../components/AdminLayout'
import { useAuthStore } from '../context/auth'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { timeSlotApi, type TimeSlotPayload } from '../services/api'

interface TimeSlotRow {
  id: number
  kinesiologo_id: number
  start_time: string
  end_time: string
  start_hour: string
  end_hour: string
  is_available: boolean
}

function todayLocalISODate(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function validateSlot(
  startDate: string,
  endDate: string,
  startClock: string,
  endClock: string,
): string | null {
  if (!startDate || !endDate || !startClock || !endClock) return 'Completá todos los campos.'
  if (endDate < startDate) return 'La fecha de fin debe ser igual o posterior al inicio.'
  const norm = (t: string) => (t.length === 5 ? `${t}:00` : t)
  const [sh, sm, ss] = norm(startClock).split(':').map((x) => Number(x))
  const [eh, em, es] = norm(endClock).split(':').map((x) => Number(x))
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 'Horas inválidas.'
  const startM = sh * 60 + (sm || 0) + (ss || 0) / 60
  const endM = eh * 60 + (em || 0) + (es || 0) / 60
  if (endM <= startM) return 'La hora de fin debe ser posterior al inicio.'
  const mins = endM - startM
  if (mins < 60) return 'La duración mínima es 60 minutos (1 hora).'
  if (mins % 60 !== 0) return 'La duración debe ser un múltiplo de 60 minutos (1, 2, 3 horas…).'
  return null
}

function toTimePayload(clock: string): string {
  if (clock.length === 5) return `${clock}:00`
  return clock
}

export default function Disponibilidad() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [slots, setSlots] = useState<TimeSlotRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startClock, setStartClock] = useState('')
  const [endClock, setEndClock] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const minDateStr = useMemo(() => todayLocalISODate(), [])

  useEffect(() => {
    if (user?.role !== 'kinesiologo') {
      navigate('/dashboard', { replace: true })
      return
    }
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await timeSlotApi.listMine()
        const sorted = (data as TimeSlotRow[]).sort((x, y) => {
          const dc = x.start_time.localeCompare(y.start_time)
          return dc !== 0 ? dc : x.start_hour.localeCompare(y.start_hour)
        })
        setSlots(sorted)
        setError('')
      } catch (e: unknown) {
        const err = e as { apiMessage?: string; message?: string }
        setError(err.apiMessage || err.message || 'No se pudieron cargar los horarios.')
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.role, navigate])

  const resetForm = () => {
    setStartDate('')
    setEndDate('')
    setStartClock('')
    setEndClock('')
    setEditingId(null)
    setError('')
  }

  const startEdit = (row: TimeSlotRow) => {
    setEditingId(row.id)
    setStartDate(row.start_time.slice(0, 10))
    setEndDate(row.end_time.slice(0, 10))
    setStartClock(row.start_hour.slice(0, 5))
    setEndClock(row.end_hour.slice(0, 5))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const clientErr = validateSlot(startDate, endDate, startClock, endClock)
    if (clientErr) {
      setError(clientErr)
      return
    }
    const payload: TimeSlotPayload = {
      start_time: startDate,
      end_time: endDate,
      start_hour: toTimePayload(startClock),
      end_hour: toTimePayload(endClock),
      is_available: true,
    }
    setSaving(true)
    try {
      if (editingId !== null) {
        await timeSlotApi.update(editingId, payload)
      } else {
        await timeSlotApi.create(payload)
      }
      const { data } = await timeSlotApi.listMine()
      const sorted = (data as TimeSlotRow[]).sort((x, y) => {
        const dc = x.start_time.localeCompare(y.start_time)
        return dc !== 0 ? dc : x.start_hour.localeCompare(y.start_hour)
      })
      setSlots(sorted)
      resetForm()
    } catch (e: unknown) {
      const err = e as { apiMessage?: string; message?: string }
      setError(err.apiMessage || err.message || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta franja de disponibilidad?')) return
    setError('')
    try {
      await timeSlotApi.delete(id)
      setSlots((prev) => prev.filter((s) => s.id !== id))
      if (editingId === id) resetForm()
    } catch (e: unknown) {
      const err = e as { apiMessage?: string; message?: string }
      setError(err.apiMessage || err.message || 'No se pudo eliminar.')
    }
  }

  if (loading) {
    return (
      <AdminLayout pageTitle="Mis horarios">
        <div className="flex justify-center py-24 text-slate-500 font-semibold text-sm">Cargando…</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout pageTitle="Mis horarios">
      <div className="max-w-4xl mx-auto space-y-6">
        <p className="text-sm text-slate-600">
          Definí el rango de días y la franja horaria en que aceptás turnos. Duración mínima 60 minutos y sólo en
          múltiplos de 1 hora (el sistema usa hora Argentina en el servidor). En la reserva pública los pacientes ven
          huecos cada 1 hora: el primer turno del día coincide con el inicio de la franja y el último puede terminar a la
          misma hora de fin (inclusive).
        </p>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Card className="p-8 shadow-xl border-slate-100">
          <h3 className="text-lg font-extrabold text-slate-900 mb-1">
            {editingId ? 'Editar franja' : 'Nueva franja'}
          </h3>
          <p className="text-xs text-slate-500 mb-6">La fecha de inicio del rango debe ser hoy o futura.</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Desde (fecha)</label>
                <input
                  type="date"
                  required
                  min={minDateStr}
                  value={startDate}
                  onChange={(ev) => setStartDate(ev.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 bg-white shadow-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hasta (fecha)</label>
                <input
                  type="date"
                  required
                  min={startDate || minDateStr}
                  value={endDate}
                  onChange={(ev) => setEndDate(ev.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 bg-white shadow-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hora inicio (franja)</label>
                <input
                  type="time"
                  required
                  step={3600}
                  value={startClock}
                  onChange={(ev) => setStartClock(ev.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 bg-white shadow-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hora fin (franja)</label>
                <input
                  type="time"
                  required
                  step={3600}
                  min={startClock || undefined}
                  value={endClock}
                  onChange={(ev) => setEndClock(ev.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 bg-white shadow-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear franja'}
              </Button>
              {editingId !== null && (
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  Cancelar edición
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="p-8 shadow-xl border-slate-100">
          <h3 className="text-lg font-extrabold text-slate-900 mb-4">Franjas cargadas</h3>
          {slots.length === 0 ? (
            <p className="text-sm text-slate-500">
              Todavía no cargaste disponibilidad. Sin franjas, los pacientes no verán huecos para reservar contigo.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {slots.map((s) => (
                <li key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
                  <div className="text-sm">
                    <div className="font-bold text-slate-900">
                      {new Date(s.start_time + 'T12:00:00').toLocaleDateString('es-AR', { dateStyle: 'medium' })}
                      {' — '}
                      {new Date(s.end_time + 'T12:00:00').toLocaleDateString('es-AR', { dateStyle: 'medium' })}
                      <span className="font-semibold text-slate-600">
                        {' · '}
                        {s.start_hour.slice(0, 5)} – {s.end_hour.slice(0, 5)}
                      </span>
                    </div>
                    {!s.is_available && (
                      <div className="text-xs text-amber-600 font-semibold mt-1">Marcada como no disponible</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" className="text-xs py-1.5" onClick={() => startEdit(s)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs py-1.5 text-red-700 border-red-100 hover:bg-red-50"
                      onClick={() => handleDelete(s.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
