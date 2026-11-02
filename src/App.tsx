import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import LoginWeb from "./screens/LoginWeb";
import Escritorio from "./screens/Escritorio";
import { carregarSessao, limparSessao, salvarSessao } from "./lib/api";
import { useSessaoInatividade } from "./lib/useSessaoInatividade";
import { FeedbackHost } from "./components/Feedback";
import { notificar } from "./lib/feedback";

// Producao e Administracao so sao baixadas quando abertas: o carregamento
// inicial do escritorio fica menor.
const ProducaoWeb = lazy(() => import("./screens/ProducaoWeb"));
const AdminWeb = lazy(() => import("./screens/AdminWeb"));

type Tela = "login" | "escritorio" | "producao" | "admin";

export type UsuarioWeb = {
  id: number;
  nome_completo: string;
  user: string;
  perfil: "admin" | "escritorio";
  token: string;
};

const TELA_KEY = "fieldpro_web_tela";

function criarUsuarioDemo(): UsuarioWeb {
  return {
    id: 0,
    nome_completo: "Modo desenvolvimento",
    user: "dev",
    perfil: "admin",
    token: "dev-token",
  };
}

function telaSalva(usuario: UsuarioWeb): Tela {
  let tela: string | null = null;
  try {
    tela = sessionStorage.getItem(TELA_KEY);
  } catch {
    tela = null;
  }
  if (tela === "producao") return "producao";
  if (tela === "admin" && usuario.perfil === "admin") return "admin";
  return "escritorio";
}

const VISUALIZAR_LOGIN = new URLSearchParams(window.location.search).get("tela") === "login";
const MODO_DEMO = import.meta.env.DEV && !VISUALIZAR_LOGIN && !carregarSessao<UsuarioWeb>();

export default function App() {
  // Ao recarregar a pagina, a sessao gravada (ate 1h sem uso) e restaurada.
  const [usuario, setUsuario] = useState<UsuarioWeb | null>(() =>
    carregarSessao<UsuarioWeb>() ?? (MODO_DEMO ? criarUsuarioDemo() : null)
  );
  const [tela, setTela] = useState<Tela>(() => {
    if (VISUALIZAR_LOGIN) return "login";
    const sessao = carregarSessao<UsuarioWeb>();
    if (sessao) return telaSalva(sessao);
    return MODO_DEMO ? "escritorio" : "login";
  });

  useEffect(() => {
    try {
      if (tela === "login") sessionStorage.removeItem(TELA_KEY);
      else sessionStorage.setItem(TELA_KEY, tela);
    } catch {
      // ignorado
    }
  }, [tela]);

  const sair = useCallback((motivo?: "inatividade") => {
    if (motivo === "inatividade") {
      notificar("Sua sessão expirou. Entre novamente para continuar.", "info");
    }
    limparSessao();
    setUsuario(MODO_DEMO ? criarUsuarioDemo() : null);
    setTela(MODO_DEMO ? "escritorio" : "login");
  }, []);

  // Sessao real (fora do modo demonstracao): expira apos 1h sem uso.
  useSessaoInatividade(
    Boolean(usuario) && usuario?.token !== "dev-token" && tela !== "login",
    () => sair("inatividade")
  );

  const carregandoTela = <div className="fp-tela-carregando" role="status">Carregando…</div>;

  return (
    <>
      <FeedbackHost />
      {import.meta.env.DEV && (
        <a
          href={tela === "login" ? window.location.pathname : "?tela=login"}
          className="dev-screen-shortcut"
        >
          {tela === "login" ? "← Voltar ao escritório" : "Visualizar login"}
        </a>
      )}
      <div key={tela} className="fp-tela">
      {tela === "login" && (
        <LoginWeb
          entrar={(usuarioLogado) => {
            salvarSessao(usuarioLogado);
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
          sair={() => sair()}
        />
      )}

      {tela === "producao" && (
        <Suspense fallback={carregandoTela}>
          <ProducaoWeb
            voltar={() => setTela("escritorio")}
            usuario={usuario}
            irParaAdmin={usuario?.perfil === "admin" ? () => setTela("admin") : undefined}
            sair={() => sair()}
          />
        </Suspense>
      )}

      {tela === "admin" && usuario?.perfil === "admin" && (
        <Suspense fallback={carregandoTela}>
          <AdminWeb
            voltar={() => setTela("escritorio")}
            irParaProducao={() => setTela("producao")}
            usuario={usuario}
            sair={() => sair()}
          />
        </Suspense>
      )}
      </div>
    </>
  );
}
