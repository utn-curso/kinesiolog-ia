# KineMov Frontend

Aplicación React + TypeScript para la plataforma KineMov.

## Tecnologías

- **React 18**: Framework UI
- **TypeScript**: Type safety
- **Vite**: Build tool rápido
- **Tailwind CSS**: Styling
- **React Router**: Routing
- **Axios**: HTTP client
- **Zustand**: State management
- **React Hook Form**: Form validation
- **Zod**: Schema validation
- **Date-fns**: Date utilities
- **Lucide React**: Icons

## Instalación

```bash
npm install
```

## Ejecutar

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview build
npm run preview
```

## Estructura

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/         # Páginas de la app
│   ├── services/      # API calls
│   ├── context/       # Zustand stores
│   ├── hooks/         # Custom hooks
│   ├── types/         # TypeScript types
│   ├── utils/         # Helpers
│   ├── styles/        # CSS y Tailwind
│   └── App.tsx        # App principal
├── public/            # Assets estáticos
└── package.json
```

## Componentes Principales

- **Layout**: Layout base con navbar
- **Button**: Botón reutilizable con variantes
- **Card**: Contenedor con estilos
- **Input**: Input field estilizado

## Estado Global

- **Auth Store**: Manejo de autenticación con JWT
- Persistencia automática en localStorage

## API Integration

- Axios configurado con interceptores
- Auto-refresh de tokens
- Manejo automático de errores 401

## Styling

- Tailwind CSS con configuración personalizada
- Colores del brand (teal, coral, blue, green)
- Componentes con clases CSS
- Responsive design

## Desarrollo

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit
```