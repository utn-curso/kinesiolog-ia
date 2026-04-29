# 🚀 Guía de Setup para Desarrolladores

## 📋 Requisitos Previos
- **Python 3.9+** - [Descargar](https://www.python.org/downloads/)
- **Node.js 16+** - [Descargar](https://nodejs.org/)
- **Git** - [Descargar](https://git-scm.com/)
- **PostgreSQL** (opcional - puedes usar SQLite para desarrollo)

## ✅ Setup Inicial (PRIMERA VEZ)

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd kinesiolog-ia
```

### 2. Backend Setup

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
.\venv\Scripts\activate
# En Linux/Mac:
# source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env (copiar de .env.example)
# En Windows:
copy .env.example .env
# En Linux/Mac:
# cp .env.example .env

# Editar .env si es necesario (cambiar JWT_SECRET, credenciales, etc.)
```

### 3. Frontend Setup

```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env (copiar de .env.example)
# En Windows:
copy .env.example .env
# En Linux/Mac:
# cp .env.example .env
```

## 🎯 Cómo Ejecutar el Proyecto

### Terminal 1 - Backend
```bash
cd backend
.\venv\Scripts\activate  # o: source venv/bin/activate
uvicorn app.main:app --reload
```
Backend disponible en: **http://localhost:8000**
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Frontend disponible en: **http://localhost:5173**

## 📦 Actualizar Dependencias

Si alguien agrega una nueva librería:

**Backend:**
```bash
cd backend
.\venv\Scripts\activate
pip install nueva-libreria
pip freeze > requirements.txt  # Actualizar requirements.txt
```
Commit y push `requirements.txt`

**Frontend:**
```bash
cd frontend
npm install nueva-libreria
```
Commit y push `package-lock.json`

## 🗂️ Estructura de Carpetas a IGNORAR (Git)
- `backend/venv/` - Entorno virtual local
- `frontend/node_modules/` - Dependencias de Node
- `backend/.env` - Variables de entorno (archivos locales)
- `frontend/.env` - Variables de entorno
- `*.pyc`, `__pycache__/` - Archivos compilados de Python

**Todos estos están en `.gitignore`** ✅

## 🐘 Opcional: PostgreSQL con Docker

Si prefieres usar PostgreSQL en lugar de SQLite:

```bash
# Desde la raíz del proyecto
docker-compose -f docker/docker-compose.yml up -d

# En backend/.env, comentar SQLite y descomentar:
# DATABASE_URL=postgresql+asyncpg://kinemov:secret123@localhost:5432/kinemov
```

## 🆘 Troubleshooting

### "venv no funciona"
- Elimina la carpeta `venv/`
- Crea uno nuevo: `python -m venv venv`
- Instala de nuevo: `pip install -r requirements.txt`

### "node_modules corrupto"
- Elimina carpeta `node_modules/` y `package-lock.json`
- Ejecuta: `npm install`

### "Error de importación en Python"
- Verifica que el venv esté activado
- Verifica que ejecutaste `pip install -r requirements.txt`

## 📝 Notas Importantes
- **NUNCA hagas commit de `venv/` o `node_modules/`**
- **NUNCA hagas commit de `.env`** (solo `.env.example`)
- Cada desarrollador tiene su propio `.env` local
- Las dependencias se comparten mediante `requirements.txt` y `package-lock.json`
