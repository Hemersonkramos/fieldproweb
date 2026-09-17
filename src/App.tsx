import { useState } from "react";
import LoginWeb from "./screens/LoginWeb";
import Escritorio from "./screens/Escritorio";
import ProducaoWeb from "./screens/ProducaoWeb";
import AdminWeb from "./screens/AdminWeb";
import { limparToken } from "./lib/api";

type Tela = "login" | "escritorio" | "producao" | "admin";

export type UsuarioWeb = {
  id: number;
  nome_completo: string;
  user: string;
  perfil: "admin" | "escritorio";
  token: string;
};

function criarUsuarioDemo(): UsuarioWeb {
  return {
    id: 0,
    nome_completo: "Modo desenvolvimento",
    user: "dev",
    perfil: "admin",
    token: "dev-token",
  };
}

export default function App() {
  const [tela, setTela] = useState<Tela>(() => (import.meta.env.DEV ? "escritorio" : "login"));
  const [usuario, setUsuario] = useState<UsuarioWeb | null>(() =>
    import.meta.env.DEV ? criarUsuarioDemo() : null,
  );

  return (
    <>
      {tela === "login" && (
        <LoginWeb
          entrar={(usuarioLogado) => {
            setUsuario(usuarioLogado);
            setTela("escritorio");
          }}
        />
      )}

      {tela === "escritorio" && (
        <Escritorio
          irParaProducao={() => setTela("producao")}
          irParaAdmin={
            usuario?.perfil === "admin" ? () => setTela("admin") : undefined
          }
          usuario={usuario}
          sair={() => {
            limparToken();
            setUsuario(import.meta.env.DEV ? criarUsuarioDemo() : null);
            setTela(import.meta.env.DEV ? "escritorio" : "login");
          }}
        />
      )}

      {tela === "producao" && (
        <ProducaoWeb
          voltar={() => setTela("escritorio")}
          usuario={usuario}
          irParaAdmin={usuario?.perfil === "admin" ? () => setTela("admin") : undefined}
          sair={() => {
            limparToken();
            setUsuario(import.meta.env.DEV ? criarUsuarioDemo() : null);
            setTela(import.meta.env.DEV ? "escritorio" : "login");
          }}
        />
      )}

      {tela === "admin" && usuario?.perfil === "admin" && (
        <AdminWeb
          voltar={() => setTela("escritorio")}
          irParaProducao={() => setTela("producao")}
          usuario={usuario}
          sair={() => {
            limparToken();
            setUsuario(import.meta.env.DEV ? criarUsuarioDemo() : null);
            setTela(import.meta.env.DEV ? "escritorio" : "login");
          }}
        />
      )}
    </>
  );
}
