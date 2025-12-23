/**
 * Genera un código único para cancelación/edición de reservas
 * Formato: CXL-XXXXXX (6 caracteres alfanuméricos)
 * Nota: Este código puede repetirse entre diferentes grupos de reservas,
 * pero todas las reservas del mismo grupo deben compartir el mismo código.
 */
export function generateCancelCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sin I, O, 0, 1 para evitar confusión
  let code = "CXL-";
  // Aumentar la longitud para reducir colisiones
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Valida formato de código de cancelación
 */
export function isValidCancelCode(code) {
  return /^CXL-[A-Z2-9]{8}$/.test(code);
}

