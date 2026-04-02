# KineMov - Plataforma de Gestión de Turnos de Kinesiología

Una aplicación full-stack para gestionar turnos de kinesiología, conectando pacientes con profesionales de la salud.

## 🚀 Stack Tecnológico

- **Backend**: FastAPI + Python + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT
- **Notificaciones**: Email + SMS

## 📁 Estructura del Proyecto

```
kinesiolog-ia/
├── backend/           # API FastAPI
├── frontend/          # App React
├── docker/            # Configuración Docker
├── Documentación/     # Prototipos y plan
└── README.md
```

## 🛠️ Instalación y Setup

### Prerrequisitos
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+ (o Docker)
- Docker (opcional)

### 1. Clonar y navegar
```bash
git clone <repo-url>
cd kinesiolog-ia
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Frontend
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Base de Datos
```bash
# Con Docker
docker compose -f docker/docker-compose.yml up -d

# O instalar PostgreSQL localmente
```

### 5. Variables de Entorno
Copia `.env.example` a `.env` y configura:
- DATABASE_URL
- JWT_SECRET
- EMAIL_HOST, etc.

## 📋 Fases de Desarrollo

Ver [Documentación/plan.md](Documentación/plan.md) para el plan completo de implementación.

## 🏃‍♂️ Ejecutar

```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```

## 📚 API Documentation

Una vez corriendo el backend, visita `http://localhost:8000/docs` para la documentación Swagger.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.