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

export default function App() {
  const [tela, setTela] = useState<Tela>("login");
  const [usuario, setUsuario] = useState<UsuarioWeb | null>(null);

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
            setUsuario(null);
            setTela("login");
          }}
        />
      )}

      {tela === "producao" && (
        <ProducaoWeb
          voltar={() => setTela("escritorio")}
        />
      )}

      {tela === "admin" && usuario?.perfil === "admin" && (
        <AdminWeb
          voltar={() => setTela("escritorio")}
        />
      )}
    </>
  );
}
