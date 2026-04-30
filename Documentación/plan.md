# Plan: KineMov - Plataforma de Gestión de Turnos de Kinesiología

### TL;DR
Construiremos una aplicación **full-stack scalable** con:
- **Backend**: FastAPI + PostgreSQL (seguro, async, documentado)
- **Frontend**: React + TypeScript (moderno, type-safe)
- **Estructura**: Polyrepo (backend/ y frontend/ separados)
- **12 fases** de implementación, parcialmente paralelizables
- **~18-24 horas** de desarrollo estimado

---

### Estructura del Proyecto
```
kinesiolog-ia/
├── backend/           # FastAPI + PostgreSQL
├── frontend/          # React + TypeScript
├── Documentación/     # (ya existe)
└── README.md
```

---

### Tech Stack Confirmado ✅
| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI (Python) + SQLAlchemy ORM |
| Frontend | React 18 + TypeScript + Vite |
| Base de Datos | PostgreSQL |
| Auth | JWT + bcrypt |
| Payment | Mock/simulado |
| Notificaciones | Email (SMTP) + SMS (Twilio) |
| Styling | Tailwind CSS |

---

### Modelos Principales
**7 tablas core**: users, kinesiologos, services, appointments, time_slots, payments, notifications

---

### Fases de Implementación (12 total)

| #  |           Fase           | Duración | Depende | Status |
|----|--------------------------|----------|---------|--------|
| 1  |   Preparación proyecto   |    1h    |    -    |   ⏳   |
| 2  |   Backend estructurado   |   2-3h   |    -    |   ⏳   |
| 3  |      Frontend setup      |   2-3h   |    -    |   ⏳   |
| 4  |  **Backend APIs Core**   |   4-5h   |   #2    |  🔑   |
| 5  |  Pagos + Notificaciones  |   2-3h   |   #4    |   ⏳   |
| 6  |       Landing Page       |  1.5-2h  |   #3    |   ⏳   |
| 7  |    **Auth Frontend**     |  1-1.5h  |  #3,#2  |  🔑   |
| 8  | **Flujo Reserva Turnos** |   3-4h   |  #7,#4  |  🔑   |
| 9  |     Dashboard Admin      |   2-3h   |  #3,#7  |   ⏳   |
| 10 |    Agenda Kinesiologo    |   2-3h   |  #9,#4  |   ⏳   |
| 11 |       Testing + QA       |    2h    |  Todas  |   ⏳   |
| 12 |    Docs + Setup Local    |   1.5h   |  Todas  |   ⏳   |

**Nota**: Fases #2 y #3 son **paralelizables**. #4 es bloqueante para muchas otras.

---

### Requisitos a Instalar

**Backend:**
- Python 3.9+
- PostgreSQL 13+
- pip

**Frontend:**
- Node.js 16+ + npm
- (opcional) Docker para BD local

---

### Carpetas Principales
**Backend:**
```
backend/app/
├── api/           # Rutas REST
├── models/        # SQLAlchemy models
├── schemas/       # Validación Pydantic
├── services/      # Lógica de negocio
├── middlewares/   # Auth, CORS
└── utils/         # Email, SMS
```

**Frontend:**
```
frontend/src/
├── components/    # React components
├── pages/         # Páginas (Landing, Dashboard, etc)
├── hooks/         # Custom hooks
├── services/      # API calls
├── types/         # TypeScript types
└── context/       # Auth state
```

---

### Decisiones Clave Tomadas ✅
- ✅ **FastAPI** en lugar de Django (más ligero, mejor para APIs)
- ✅ **Polyrepo** en lugar de monorepo (separación clara de concerns)
- ✅ **Vite** en lugar de CRA (build más rápido)
- ✅ **PostgreSQL** (escalable, ACID compliant)
- ✅ **Email + SMS** para notificaciones (confirmaciones + recordatorios)
- ✅ **Mock payment** por ahora (Stripe después si es necesario)

6. Type Safety: Mantener TypeScript strict en frontend + validación Pydantic en backend
