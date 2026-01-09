-- Migración: Agregar campos para cancelación, edición, invitados y equipamiento

-- Agregar email y código de cancelación a bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS cancel_code TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- IMPORTANTE: cancel_code se reutiliza para reservas con múltiples horarios, por lo tanto NO debe ser único.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_cancel_code_key'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_cancel_code_key;
  END IF;
END $$;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS bookings_cancel_code_idx ON bookings(cancel_code);
CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings(email);
CREATE INDEX IF NOT EXISTS bookings_room_date_idx ON bookings(room_id, date);

-- Tabla de invitados
CREATE TABLE IF NOT EXISTS booking_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  invited_at timestamp with time zone DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS booking_guests_booking_idx ON booking_guests(booking_id);
CREATE INDEX IF NOT EXISTS booking_guests_email_idx ON booking_guests(email);

-- Agregar equipamiento a las salas
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS equipment TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS capacity INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Actualizar salas con equipamiento de ejemplo
UPDATE rooms SET 
  equipment = ARRAY['Proyector', 'Pizarra', 'WiFi', 'Aire acondicionado'],
  capacity = 10,
  description = 'Sala de reuniones equipada'
WHERE name IN ('Sala Caracas', 'Sala Beirut', 'Sala Aruba');

UPDATE rooms SET 
  equipment = ARRAY['WiFi', 'Aire acondicionado'],
  capacity = 4,
  description = 'Cabina individual para reuniones pequeñas'
WHERE name LIKE 'Cabina%';

