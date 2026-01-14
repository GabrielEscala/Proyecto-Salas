"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Container, Paper, TextField, Typography, Alert } from "@mui/material";
import { useTheme } from "@/lib/theme-context";

export default function AdminLogin() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { mode } = useTheme();

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = String(code || "").trim().toUpperCase();
    if (!trimmed) {
      setError("Ingresa el código administrador.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed })
      });

      if (!res.ok) {
        setError("Código administrador inválido.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("No pudimos validar el código. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          p: 4,
          border: `1px solid ${mode === "dark" ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.35)"}`,
          backgroundColor: mode === "dark" ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.9)"
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 900, color: mode === "dark" ? "#e2e8f0" : "#0f172a" }}>
          Acceso Administrador
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: mode === "dark" ? "rgba(226,232,240,0.7)" : "rgba(51,65,85,0.75)" }}>
          Ingresa el código para administrar reservas
        </Typography>

        <Box component="form" onSubmit={submit} sx={{ mt: 3 }}>
          <TextField
            label="Código administrador"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="CXL-GG212508"
            fullWidth
            autoFocus
          />

          {error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}

          <Box sx={{ mt: 3, display: "grid", gap: 1.5 }}>
            <Button type="submit" variant="contained" disabled={loading} sx={{ borderRadius: 3, height: 48, fontWeight: 900, textTransform: "none" }}>
              {loading ? "Verificando..." : "Entrar"}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => router.push("/")}
              sx={{ borderRadius: 3, height: 48, fontWeight: 900, textTransform: "none" }}
            >
              Volver
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
