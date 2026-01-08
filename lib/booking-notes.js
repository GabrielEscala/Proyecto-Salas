export const composeBookingNotes = ({ company, clients }) => {
  const base = String(company || "").trim();
  const clientsText = String(clients || "").trim();
  if (!clientsText) return base;
  if (!base) return `Clientes: ${clientsText}`;
  return `${base}\nClientes: ${clientsText}`;
};

export const parseBookingNotes = (notes) => {
  const text = String(notes || "");
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { company: null, clients: null };
  }

  const lowerClientsPrefix = "clientes:";
  const clientsLine = lines.find((l) => l.toLowerCase().startsWith(lowerClientsPrefix));

  const company = lines[0] || null;
  const clients = clientsLine
    ? clientsLine.slice(lowerClientsPrefix.length).trim() || null
    : null;

  return { company, clients };
};
