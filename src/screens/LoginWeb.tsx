import { useState } from "react";

import type { UsuarioWeb } from "../App";
import { API_BASE_URL, salvarToken } from "../lib/api";

type Props = {
  entrar: (usuario: UsuarioWeb) => void;
};

export default function LoginWeb({ entrar }: Props) {
  const [user, setUser] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function handleLogin() {
    try {
      setErro("");

      const res = await fetch(`${API_BASE_URL}/login-web`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.erro || "Erro ao logar");
        return;
      }

      salvarToken(data.token);
      entrar({ ...(data.usuario as UsuarioWeb), token: data.token });
    } catch {
      setErro("Erro ao conectar com servidor");
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "linear-gradient(135deg, #0A3A63, #021B33)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#f8fafc",
          padding: 30,
          borderRadius: 20,
          width: 340,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        {/* Ícone */}
        <div
          style={{
            width: 50,
            height: 50,
            background: "#0A3A63",
            borderRadius: 12,
            margin: "0 auto 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
          }}
        >
          🗺️
        </div>

        <h2 style={{ margin: 0 }}>FieldPro Web</h2>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
          Ambiente do escritório
        </p>

        <input
          placeholder="Usuário"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 10,
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            outline: "none",
          }}
        />

        <input
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 10,
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            outline: "none",
          }}
        />

        {erro && (
          <p style={{ color: "red", fontSize: 12 }}>{erro}</p>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "none",
            background: "#0A3A63",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          Entrar
        </button>

        <div
          style={{
            marginTop: 15,
            fontSize: 11,
            color: "#94a3b8",
            background: "#e2e8f0",
            padding: 8,
            borderRadius: 10,
          }}
        >
          “insira seus dados
        </div>
      </div>
    </div>
  );
}
