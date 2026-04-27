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

### 2. Backend Setup
```bash
cd backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno (opcional)
# Crear archivo .env con:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost/kinemov
# JWT_SECRET=your_secret_key
# EMAIL_HOST=smtp.gmail.com
# etc.
```

### 3. Base de Datos
```bash
# Opción 1: PostgreSQL local
createdb kinemov
# Configurar DATABASE_URL en .env

# Opción 2: SQLite (desarrollo)
# Usar DATABASE_URL=sqlite+aiosqlite:///./kinemov.db (por defecto)

# Opción 3: Docker
docker run --name kinemov-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:13
```

### 4. Ejecutar Backend
```bash
# Desde directorio backend/
uvicorn app.main:app --reload

# API disponible en: http://127.0.0.1:8000
# Docs: http://127.0.0.1:8000/docs
```

### 5. Frontend Setup
```bash
cd ../frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# App disponible en: http://localhost:5173
```

### 6. Configuración Inicial
```bash
# Crear usuario admin (desde backend/)
# Usar endpoint POST /api/auth/register o script manual

# Crear kinesiólogos de prueba
# Usar la interfaz de admin o scripts
```

## 🔧 Configuración Avanzada

### Variables de Entorno (.env)
```env
# Base de datos
DATABASE_URL=sqlite+aiosqlite:///./kinemov.db

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
FRONTEND_URL=http://localhost:5173
```

### Docker Setup
```bash
# Construir y ejecutar
docker-compose up --build

# Servicios disponibles:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:8000
# - Base de datos: localhost:5432
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro

### Turnos
- `GET /api/appointments/` - Listar turnos
- `POST /api/appointments/` - Crear turno
- `GET /api/appointments/available-slots/{kinesiologo_id}` - Slots disponibles

### Usuarios
- `GET /api/users/kinesiologos` - Listar kinesiólogos
- `GET /api/users/me` - Perfil propio

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🚀 Despliegue

### Producción
```bash
# Backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
npm run build
npm run preview
```

### Docker Producción
```bash
docker build -t kinemov-backend .
docker build -t kinemov-frontend -f frontend/Dockerfile .
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

- **Email**: info@kinemov.com.ar
- **Web**: https://kinemov.com.ar
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
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