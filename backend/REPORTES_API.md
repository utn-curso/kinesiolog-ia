# API Reportes - Documentación Rápida

## Endpoints disponibles

### 1. Obtener Reporte Mensual (Sin guardar en BD)
```
GET /api/reports/monthly?year=2026&month=4&kinesiologo_id=1
```
**Parámetros:**
- `year` (int): Año (2000-2100)
- `month` (int): Mes (1-12)
- `kinesiologo_id` (int, opcional): Si no lo pones, kinesiólogo ve el suyo

**Respuesta:**
```json
{
  "kinesiologo_id": 1,
  "kinesiologo_name": "Dr. Juan Pérez",
  "period_start": "2026-04-01T00:00:00",
  "period_end": "2026-05-01T00:00:00",
  "total_appointments": 20,
  "completed_appointments": 18,
  "cancelled_appointments": 1,
  "pending_appointments": 1,
  "completion_rate": 90.0,
  "total_revenue": 90000.0,
  "generated_at": "2026-05-05T14:30:00"
}
```

**Permisos:**
- ✅ Admin (puede ver todos)
- ✅ Kinesiólogo (solo ve sus propios)
- ❌ Paciente (acceso denegado)

---

### 2. Obtener Reporte Custom (Sin guardar en BD)
```
GET /api/reports/custom?period_start=2026-04-01T00:00:00&period_end=2026-04-30T23:59:59&kinesiologo_id=1
```

**Parámetros:**
- `period_start` (datetime): Fecha inicio
- `period_end` (datetime): Fecha fin
- `kinesiologo_id` (int, opcional): ID del kinesiólogo

**Respuesta:** (igual que reporte mensual)

---

### 3. Listar Reportes Guardados (Paginado)
```
GET /api/reports/?skip=0&limit=10&kinesiologo_id=1&report_type=monthly
```

**Parámetros:**
- `skip` (int, default=0): Saltar N registros
- `limit` (int, default=10): Cantidad máxima
- `kinesiologo_id` (int, opcional): Filtrar por kinesiólogo
- `report_type` (string, opcional): "monthly" o "custom"
- `period_start` (datetime, opcional): Filtrar desde fecha
- `period_end` (datetime, opcional): Filtrar hasta fecha

**Respuesta:**
```json
[
  {
    "id": 1,
    "kinesiologo_id": 1,
    "period_start": "2026-04-01T00:00:00",
    "period_end": "2026-05-01T00:00:00",
    "total_appointments": 20,
    "completed_appointments": 18,
    "total_revenue": 90000.0,
    "created_at": "2026-05-05T12:00:00"
  }
]
```

---

### 4. Crear y Guardar Reporte (Solo Admin)
```
POST /api/reports/
Content-Type: application/json

{
  "kinesiologo_id": 1,
  "report_type": "monthly",
  "period_start": "2026-04-01T00:00:00",
  "period_end": "2026-05-01T00:00:00"
}
```

**Respuesta:** (objeto Report completo con ID generado)

**Permisos:**
- ✅ Admin
- ❌ Kinesiólogo
- ❌ Paciente

---

### 5. Ver Detalle de Reporte
```
GET /api/reports/{report_id}
```

**Respuesta:** (objeto Report completo)

---

### 6. Eliminar Reporte (Solo Admin)
```
DELETE /api/reports/{report_id}
```

**Respuesta:**
```json
{
  "message": "Reporte eliminado exitosamente"
}
```

---

## Estadísticas Disponibles

Cada reporte incluye:
- **total_appointments**: Total de citas en el período
- **completed_appointments**: Citas completadas
- **cancelled_appointments**: Citas canceladas
- **pending_appointments**: Citas pendientes
- **completion_rate**: Porcentaje de citas completadas (%)
- **total_revenue**: Ingresos totales ($5000 por cita completada)

---

## Ejemplo de Uso - cURL

### Obtener reporte mensual actual (Abril 2026)
```bash
curl -X GET "http://localhost:8000/api/reports/monthly?year=2026&month=4&kinesiologo_id=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Crear reporte y guardarlo
```bash
curl -X POST "http://localhost:8000/api/reports/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kinesiologo_id": 1,
    "report_type": "monthly",
    "period_start": "2026-04-01T00:00:00",
    "period_end": "2026-05-01T00:00:00"
  }'
```

### Listar reportes guardados (primeros 10)
```bash
curl -X GET "http://localhost:8000/api/reports/?skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Notas Importantes

1. **Monetización**: Por ahora asumimos $5000 por cita completada (configurable en `ReportService`)
2. **Calculos en tiempo real**: `/monthly` y `/custom` NO guardan en BD, solo calculan
3. **Persistencia**: Solo `/reports` POST guarda en BD
4. **Autorización**: Kinesiólogos solo ven sus propios reportes; Admins ven todos
5. **Timestamps**: Todos en UTC
