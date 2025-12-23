## Control corporativo de salas y cabinas

Aplicación Next.js (App Router) con estética corporativa para reservar salas/cabinas en intervalos de 30 minutos. Usa Supabase PostgreSQL como backend y está lista para desplegar en Vercel.

### 1. Requisitos
- Node.js ≥ 20 y npm
- Cuenta Supabase (proyecto Postgres listo)
- Cuenta Vercel (opcional para deploy)

### 2. Configurar Supabase
1. Crea un nuevo proyecto en Supabase.
2. Ejecuta `supabase/schema.sql` desde el editor SQL para crear tablas, índices y seed de salas.
3. Ejecuta `supabase/migrations.sql` para agregar campos de email, códigos de cancelación, equipamiento e invitados.
4. Copia las llaves del proyecto:
   - `Project URL`
   - `Service role key` (se usa solo en el backend Next.js)
   - `anon` key si deseas exponerla en el cliente (opcional en este proyecto porque todo pasa por las API Routes).

### 2.1. Configurar Resend (Opcional pero recomendado)
1. Crea una cuenta en [Resend](https://resend.com) (3,000 emails/mes gratis).
2. Crea un API key desde el dashboard.
3. Verifica un dominio o usa el dominio de prueba `onboarding@resend.dev`.
4. Agrega `RESEND_API_KEY` y `RESEND_FROM_EMAIL` a tus variables de entorno.

### 3. Variables de entorno
Duplica `.env.example` con el nombre `.env.local` y completa:

```
SUPABASE_URL="https://<tu-proyecto>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
NEXT_PUBLIC_SUPABASE_URL="https://<tu-proyecto>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"

# Email (Resend) - Opcional pero recomendado
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="Reservas <noreply@tudominio.com>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Para producción usar tu dominio
```

> Para producción en Vercel crea las mismas variables desde **Project Settings → Environment Variables**.

### 4. Instalación y uso local
```bash
npm install
npm run dev
# abre http://localhost:3000
```

### 5. Deploy en Vercel
1. `vercel init` o conecta el repo desde el dashboard.
2. Configura las variables de entorno anteriores en el proyecto Vercel.
3. El build command por defecto (`next build`) y output (`.next`) ya están listos.

### 6. Estructura relevante
- `app/` → App Router + API Routes (`/api/rooms`, `/api/bookings`, `/api/bookings/upcoming`).
- `components/` → UI modular usando Tailwind + Material UI.
- `lib/` → constantes, helpers de tiempo y cliente Supabase.
- `supabase/schema.sql` → schema + seed de salas.

### 7. Funcionalidades principales

#### Reservas
- **Reserva múltiple**: Selecciona varios bloques consecutivos para reservar rangos completos.
- **Código de cancelación/edición**: Cada reserva genera un código único que se envía por email.
- **Gestión de reservas**: Accede a `/manage/[codigo]` para cancelar o editar tu reserva.
- **Invitados**: Agrega invitados a tu reserva y reciben email automático.

#### Visualización
- **Vista de calendario**: Calendario mensual con reservas marcadas.
- **Búsqueda en tiempo real**: Filtra reservas por nombre, sala o horario.
- **Agrupación inteligente**: Las reservas consecutivas se muestran como rangos (ej: "15:00 - 16:30").
- **Equipamiento de salas**: Muestra capacidad y equipamiento de cada sala.

#### Notificaciones
- **Email de confirmación**: Recibe código de cancelación por email.
- **Invitaciones**: Los invitados reciben email automático.
- **Alertas de conflicto**: Notificación cuando alguien más reserva el mismo slot.

#### UX/UI
- **Modo oscuro**: Toggle para cambiar entre modo claro y oscuro.
- **Responsive**: Optimizado para móviles y tablets.
- **Búsqueda y filtros**: Encuentra reservas rápidamente.
- **Vista de calendario**: Navega por meses y ve todas las reservas.

### 8. Notas técnicas
- Slots configurables en `lib/constants.js` (00:00–23:30 cada 30 min, cubriendo 24 horas).
- Validaciones: no fechas pasadas, no horarios pasados en el día actual, evita doble reserva.
- Agrupación automática de reservas consecutivas de la misma persona en la misma sala.
- Cache de reservas para mejorar rendimiento.
- Paginación automática para días con muchas reservas.

