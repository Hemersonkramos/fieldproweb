import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, MapPin, UserRound } from "lucide-react";
import type { UsuarioWeb } from "../App";
import { API_BASE_URL, salvarToken } from "../lib/api";
import "./LoginWeb.css";

type Props = { entrar: (usuario: UsuarioWeb) => void };

export default function LoginWeb({ entrar }: Props) {
  const [user, setUser] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const enviando = useRef(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando.current) return;
    if (!user.trim() || !senha) {
      setErro("Informe seu usuário e sua senha.");
      return;
    }
    enviando.current = true;
    setCarregando(true);
    setErro("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(`${API_BASE_URL}/login-web`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: user.trim(), senha }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErro(typeof data?.erro === "string" ? data.erro : "Não foi possível entrar. Confira seus dados e tente novamente.");
        return;
      }
      if (typeof data?.token !== "string" || !data.token || !data.usuario) {
        setErro("O servidor retornou uma resposta inválida. Tente novamente.");
        return;
      }
      salvarToken(data.token);
      entrar({ ...(data.usuario as UsuarioWeb), token: data.token });
    } catch {
      setErro(controller.signal.aborted
        ? "O servidor demorou para responder. Tente novamente."
        : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    } finally {
      window.clearTimeout(timeout);
      enviando.current = false;
      setCarregando(false);
    }
  }

  return (
    <main className="fp-login">
      <section className="fp-login-card" aria-labelledby="login-title">
        <div className="fp-login-brand"><MapPin size={34} fill="#198bef" strokeWidth={1.6} aria-hidden="true" /><span>Field<b>Pro</b></span></div>
        <div className="fp-login-heading"><span>AMBIENTE DO ESCRITÓRIO</span><h1 id="login-title">Acesse sua conta</h1></div>
        <form onSubmit={(event) => void handleLogin(event)} aria-busy={carregando}>
          <label className="fp-login-label" htmlFor="login-user">Usuário</label>
          <div className="fp-login-field"><UserRound size={18} aria-hidden="true" /><input id="login-user" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required placeholder="Digite seu usuário" value={user} readOnly={carregando} onChange={(event) => { setUser(event.target.value); setErro(""); }} /></div>
          <label className="fp-login-label" htmlFor="login-password">Senha</label>
          <div className="fp-login-field"><LockKeyhole size={18} aria-hidden="true" /><input id="login-password" name="password" type={mostrarSenha ? "text" : "password"} autoComplete="current-password" required placeholder="Digite sua senha" value={senha} readOnly={carregando} aria-describedby={capsLock ? "login-caps-lock" : undefined} onChange={(event) => { setSenha(event.target.value); setErro(""); }} onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))} onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))} onBlur={() => setCapsLock(false)} /><button className="fp-login-eye" type="button" aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} aria-controls="login-password" onClick={() => setMostrarSenha(!mostrarSenha)}>{mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
          {capsLock && <p id="login-caps-lock" className="fp-login-caps" role="status">Caps Lock está ativado.</p>}
          {erro && <div className="fp-login-error" role="alert"><AlertCircle size={17} /><span>{erro}</span></div>}
          <button type="submit" className="fp-login-submit" disabled={carregando}>{carregando ? <><LoaderCircle size={18} className="fp-login-spinner" />Entrando…</> : <>Entrar<ArrowRight size={18} /></>}</button>
          <span className="fp-login-sr" role="status">{carregando ? "Validando seus dados. Aguarde." : ""}</span>
        </form>
        <details className="fp-login-help"><summary>Precisa de ajuda para acessar?</summary><p>Se esqueceu sua senha ou ainda não tem acesso, entre em contato com o administrador do FieldPro da sua organização.</p></details>
        <footer className="fp-login-footer">Gestão de equipes e serviços em campo</footer>
      </section>
    </main>
  );
}
