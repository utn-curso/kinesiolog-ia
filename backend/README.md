# KineMov Backend

API REST para la plataforma KineMov construida con FastAPI.

## Tecnologías

- **FastAPI**: Framework web moderno y rápido
- **SQLAlchemy**: ORM para PostgreSQL
- **Alembic**: Migraciones de base de datos
- **Pydantic**: Validación de datos
- **JWT**: Autenticación
- **Aiosmtplib**: Emails asíncronos
- **Twilio**: SMS

## Instalación

1. Crear entorno virtual:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Levantar base de datos:
```bash
docker compose -f ../../docker/docker-compose.yml up -d
```

5. Crear tablas (desarrollo):
```bash
python -c "from app.database import create_tables; import asyncio; asyncio.run(create_tables())"
```

## Ejecutar

```bash
# Desarrollo con auto-reload
python -m uvicorn app.main:app --reload

# Producción
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Estructura

```
backend/
├── app/
│   ├── api/          # Rutas API
│   ├── models/       # Modelos SQLAlchemy
│   ├── schemas/      # Schemas Pydantic
│   ├── services/     # Lógica de negocio
│   ├── middlewares/  # Auth, CORS
│   ├── utils/        # Email, SMS
│   ├── config.py     # Configuración
│   ├── database.py   # Conexión BD
│   └── main.py       # Punto de entrada
├── alembic/          # Migraciones
├── requirements.txt  # Dependencias
└── README.md
```

## Testing

```bash
pytest
```

## Migraciones

```bash
# Crear nueva migración
alembic revision --autogenerate -m "Descripción"

# Ejecutar migraciones
alembic upgrade head
```