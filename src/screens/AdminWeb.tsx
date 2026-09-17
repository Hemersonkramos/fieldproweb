import { useEffect, useRef, useState } from "react";
import { KeyRound, Plus, Shield, Trash2, UserCog, Users, Wrench, MapPin, Menu, Home, Route, Settings, ChevronDown, LogOut, RefreshCw, Search } from "lucide-react";
import { API_BASE_URL, authFetch } from "../lib/api";
import type { UsuarioWeb } from "../App";
import "./Escritorio.css";
import "./AdminWeb.css";

type Props = {
  voltar: () => void;
  irParaProducao: () => void;
  usuario: UsuarioWeb | null;
  sair: () => void;
};

type UsuarioAdmin = {
  id: number;
  nome_completo: string;
  user: string;
  perfil: "admin" | "escritorio" | "equipe";
  id_equipe: number | null;
  equipe: string | null;
};

type EquipeAdmin = {
  id_equipe: number;
  numero_equipe: string;
  veiculo: string | null;
  placa: string | null;
  status: string | null;
};

export default function AdminWeb({ voltar, irParaProducao, usuario, sair }: Props) {
  const [menuRecolhido, setMenuRecolhido] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [buscaEquipe, setBuscaEquipe] = useState("");
  const [perfilFiltro, setPerfilFiltro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const travaAcao = useRef(false);
  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [equipes, setEquipes] = useState<EquipeAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [novoUsuario, setNovoUsuario] = useState({
    nome_completo: "",
    user: "",
    password: "",
    perfil: "escritorio",
    id_equipe: "",
  });

  const [novaEquipe, setNovaEquipe] = useState({
    numero_equipe: "",
    veiculo: "",
    placa: "",
    status: "Ativo",
  });

  async function carregarTudo() {
    try {
      setCarregando(true);
      setErro("");

      const [usuariosResposta, equipesResposta] = await Promise.all([
        authFetch(`${API_BASE_URL}/admin/usuarios`),
        authFetch(`${API_BASE_URL}/admin/equipes`),
      ]);

      if (!usuariosResposta.ok || !equipesResposta.ok) {
        throw new Error("Erro ao carregar dados administrativos.");
      }

      setUsuarios((await usuariosResposta.json()) as UsuarioAdmin[]);
      setEquipes((await equipesResposta.json()) as EquipeAdmin[]);
    } catch (error) {
      console.error(error);
      setErro("Erro ao carregar os dados da administração.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    void Promise.all([
      authFetch(`${API_BASE_URL}/admin/usuarios`),
      authFetch(`${API_BASE_URL}/admin/equipes`),
    ])
      .then(async ([usuariosResposta, equipesResposta]) => {
        if (!usuariosResposta.ok || !equipesResposta.ok) {
          throw new Error("Erro ao carregar dados administrativos.");
        }

        const [usuariosDados, equipesDados] = await Promise.all([
          usuariosResposta.json(),
          equipesResposta.json(),
        ]);

        if (!ativo) {
          return;
        }

        setUsuarios(usuariosDados as UsuarioAdmin[]);
        setEquipes(equipesDados as EquipeAdmin[]);
        setErro("");
      })
      .catch((error) => {
        console.error(error);

        if (ativo) {
          setErro("Erro ao carregar os dados da administração.");
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function criarUsuario() {
    if (!novoUsuario.nome_completo.trim() || !novoUsuario.user.trim() || !novoUsuario.password.trim()) {
      throw new Error("Preencha nome, usuário e senha para criar o cadastro.");
    }
    const resposta = await authFetch(`${API_BASE_URL}/admin/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoUsuario,
        id_equipe: novoUsuario.id_equipe ? Number(novoUsuario.id_equipe) : null,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao criar usuário.");
    }

    setNovoUsuario({
      nome_completo: "",
      user: "",
      password: "",
      perfil: "escritorio",
      id_equipe: "",
    });

    await carregarTudo();
  }

  async function salvarUsuario(usuario: UsuarioAdmin) {
    if (!usuario.nome_completo.trim() || !usuario.user.trim()) throw new Error("Nome e usuário são obrigatórios.");
    const resposta = await authFetch(`${API_BASE_URL}/admin/usuarios/${usuario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario),
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao atualizar usuário.");
    }

    await carregarTudo();
  }

  async function alterarSenha(id: number, novaSenha: string) {
    if (!novaSenha.trim()) throw new Error("Informe a nova senha.");

    const resposta = await authFetch(`${API_BASE_URL}/admin/usuarios/${id}/senha`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: novaSenha }),
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao alterar senha.");
    }

  }

  async function excluirUsuario(id: number) {
    if (!window.confirm("Deseja excluir este usuário?")) {
      return false;
    }

    const resposta = await authFetch(`${API_BASE_URL}/admin/usuarios/${id}`, {
      method: "DELETE",
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao excluir usuário.");
    }

    await carregarTudo();
  }

  async function criarEquipe() {
    if (!novaEquipe.numero_equipe.trim()) throw new Error("Informe o nome ou número da equipe.");
    const resposta = await authFetch(`${API_BASE_URL}/admin/equipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaEquipe),
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao criar equipe.");
    }

    setNovaEquipe({
      numero_equipe: "",
      veiculo: "",
      placa: "",
      status: "Ativo",
    });

    await carregarTudo();
  }

  async function salvarEquipe(equipe: EquipeAdmin) {
    if (!equipe.numero_equipe.trim()) throw new Error("Informe o nome ou número da equipe.");
    const resposta = await authFetch(`${API_BASE_URL}/admin/equipes/${equipe.id_equipe}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(equipe),
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao atualizar equipe.");
    }

    await carregarTudo();
  }

  async function excluirEquipe(id: number) {
    if (!window.confirm("Deseja excluir esta equipe?")) {
      return false;
    }

    const resposta = await authFetch(`${API_BASE_URL}/admin/equipes/${id}`, {
      method: "DELETE",
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao excluir equipe.");
    }

    await carregarTudo();
  }

  async function executar(acao: () => Promise<void | false>) {
    if (travaAcao.current) return false;
    travaAcao.current = true;
    setOcupado(true);
    setFeedback(null);
    try {
      const resultado = await acao();
      if (resultado === false) return false;
      setFeedback({ tipo: "sucesso", texto: "Alteração realizada com sucesso." });
      return true;
    } catch (error) {
      console.error(error);
      setFeedback({ tipo: "erro", texto: error instanceof Error ? error.message : "Erro ao executar ação." });
      return false;
    } finally {
      travaAcao.current = false;
      setOcupado(false);
    }
  }

  const usuariosVisiveis = usuarios.filter((item) =>
    (!perfilFiltro || item.perfil === perfilFiltro) &&
    `${item.nome_completo} ${item.user} ${item.equipe || ""}`.toLocaleLowerCase("pt-BR").includes(buscaUsuario.trim().toLocaleLowerCase("pt-BR"))
  );
  const equipesVisiveis = equipes.filter((item) =>
    `${item.numero_equipe} ${item.veiculo || ""} ${item.placa || ""}`.toLocaleLowerCase("pt-BR").includes(buscaEquipe.trim().toLocaleLowerCase("pt-BR"))
  );

  return (
    <div className={`fp-dashboard fp-admin ${menuRecolhido ? "fp-sidebar-collapsed" : ""}`}>
      <aside className="fp-sidebar">
        <div className="fp-sidebar-brand"><MapPin size={29} fill="#1c8cf0" strokeWidth={1.6} /><span>Field<b>Pro</b></span><button onClick={() => setMenuRecolhido(!menuRecolhido)} aria-label={menuRecolhido ? "Expandir menu" : "Recolher menu"} aria-expanded={!menuRecolhido}><Menu size={20} /></button></div>
        <nav aria-label="Navegação principal"><button onClick={voltar} title="Visão geral"><Home size={21} /><span>Visão geral</span></button><button onClick={irParaProducao} title="Produção e rotas"><Route size={21} /><span>Produção e rotas</span></button><a href="#administracao" className="is-active" aria-current="page" title="Administração"><Settings size={21} /><span>Administração</span></a></nav>
        <div className="fp-sidebar-footer"><Shield size={18} /><div><span>Gestão de acesso</span><strong>FieldPro</strong><small>Administração</small></div></div>
      </aside>
      <div className="fp-workarea" id="administracao">
        <header className="fp-topbar">
          <div className="fp-page-title"><h1>Administração</h1><p>Gerencie usuários, permissões e equipes de campo.</p></div>
          <button className="fp-button" disabled={carregando || ocupado} onClick={() => void carregarTudo()}><RefreshCw size={15} />{carregando ? "Atualizando…" : "Atualizar dados"}</button>
          <div className="fp-user-area"><details className="fp-user-menu"><summary><span className="fp-avatar">{usuario?.nome_completo.split(" ").filter(Boolean).slice(0, 2).map((nome) => nome[0]).join("") || "FP"}</span><span className="fp-user-name"><strong>{usuario?.nome_completo || "FieldPro"}</strong><small>Administrador</small></span><ChevronDown size={14} /></summary><div className="fp-user-dropdown"><button onClick={voltar}><Home size={16} />Voltar ao escritório</button><button onClick={sair}><LogOut size={16} />Sair</button></div></details></div>
        </header>
        <main className="fp-content">
          <section className="fp-metrics" aria-label="Resumo dos cadastros">
            <div className="fp-stat-card fp-stat-sky"><Users size={20} /><p>Usuários cadastrados</p><strong>{carregando ? "—" : usuarios.length}</strong><small>Acessos ao sistema</small></div>
            <div className="fp-stat-card fp-stat-rose"><Shield size={20} /><p>Administradores</p><strong>{carregando ? "—" : usuarios.filter((item) => item.perfil === "admin").length}</strong><small>Gestão de permissões</small></div>
            <div className="fp-stat-card fp-stat-amber"><Wrench size={20} /><p>Equipes cadastradas</p><strong>{carregando ? "—" : equipes.length}</strong><small>Equipes de campo</small></div>
            <div className="fp-stat-card fp-stat-emerald"><UserCog size={20} /><p>Usuários de escritório</p><strong>{carregando ? "—" : usuarios.filter((item) => item.perfil === "escritorio").length}</strong><small>Operação do escritório</small></div>
          </section>
          {feedback && <div className={`fp-admin-feedback ${feedback.tipo}`} role={feedback.tipo === "erro" ? "alert" : "status"}>{feedback.texto}<button onClick={() => setFeedback(null)} aria-label="Fechar mensagem">×</button></div>}
          {ocupado && <p className="fp-admin-pending" role="status">Salvando alteração…</p>}
        {erro && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {erro}
          </div>
        )}

        <fieldset disabled={ocupado || carregando} className="fp-admin-columns" aria-busy={ocupado || carregando}>
          <div className="fp-panel fp-admin-panel">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <Users size={18} />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Usuários</h2>
                <p className="text-sm text-slate-500">Gerencie os dados de acesso e o vínculo com as equipes.</p>
              </div>
            </div>

            <details className="fp-admin-create"><summary><Plus size={16} />Novo usuário</summary>
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Campo label="Nome" value={novoUsuario.nome_completo} onChange={(value) => setNovoUsuario((atual) => ({ ...atual, nome_completo: value }))} />
              <Campo label="Usuário" value={novoUsuario.user} onChange={(value) => setNovoUsuario((atual) => ({ ...atual, user: value }))} />
              <Campo label="Senha" type="password" value={novoUsuario.password} onChange={(value) => setNovoUsuario((atual) => ({ ...atual, password: value }))} />
              <label className="space-y-2 text-sm font-semibold text-slate-600">
                <span>Perfil</span>
                <select className="input bg-slate-50" value={novoUsuario.perfil} onChange={(event) => setNovoUsuario((atual) => ({ ...atual, perfil: event.target.value }))}>
                  <option value="escritorio">Escritório</option>
                  <option value="admin">Admin</option>
                  <option value="equipe">Equipe</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-600 md:col-span-2">
                <span>Equipe vinculada</span>
                <select className="input bg-slate-50" value={novoUsuario.id_equipe} onChange={(event) => setNovoUsuario((atual) => ({ ...atual, id_equipe: event.target.value }))}>
                  <option value="">Sem equipe</option>
                  {equipes.map((equipe) => (
                    <option key={equipe.id_equipe} value={equipe.id_equipe}>
                      {equipe.numero_equipe}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button onClick={() => void executar(criarUsuario)} className="fp-button fp-admin-primary">
              <Plus size={15} />
              Criar usuário
            </button>

            </details>
            <div className="fp-admin-filters"><label className="fp-search"><Search size={16} /><input aria-label="Buscar usuário" placeholder="Buscar nome, usuário ou equipe…" value={buscaUsuario} onChange={(event) => setBuscaUsuario(event.target.value)} /></label><select className="input" aria-label="Filtrar perfil" value={perfilFiltro} onChange={(event) => setPerfilFiltro(event.target.value)}><option value="">Todos os perfis</option><option value="admin">Administrador</option><option value="escritorio">Escritório</option><option value="equipe">Equipe</option></select></div>
            <p className="fp-admin-count">{usuariosVisiveis.length} de {usuarios.length} usuários</p>
            {!carregando && !erro && usuariosVisiveis.length === 0 && <div className="fp-admin-empty">{usuarios.length ? "Nenhum usuário corresponde aos filtros." : "Nenhum usuário cadastrado. Use Novo usuário para começar."}</div>}
            <div className="mt-6 space-y-4">
              {carregando ? (
                <div className="text-sm text-slate-500">Carregando usuários...</div>
              ) : (
                usuariosVisiveis.map((usuario) => (
                  <UsuarioCard
                    key={`${usuario.id}-${usuario.nome_completo}-${usuario.user}-${usuario.perfil}-${usuario.id_equipe ?? "sem-equipe"}`}
                    usuario={usuario}
                    equipes={equipes}
                    onSalvar={(item) => void executar(() => salvarUsuario(item))}
                    onAlterarSenha={(id, senha) => executar(() => alterarSenha(id, senha))}
                    onExcluir={(id) => void executar(() => excluirUsuario(id))}
                  />
                ))
              )}
            </div>
          </div>

          <div className="fp-panel fp-admin-panel">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Wrench size={18} />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Equipes de campo</h2>
                <p className="text-sm text-slate-500">Cadastre, edite veículo, placa e status das equipes.</p>
              </div>
            </div>

            <details className="fp-admin-create"><summary><Plus size={16} />Nova equipe</summary>
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Campo label="Equipe" value={novaEquipe.numero_equipe} onChange={(value) => setNovaEquipe((atual) => ({ ...atual, numero_equipe: value }))} />
              <Campo label="Veículo" value={novaEquipe.veiculo} onChange={(value) => setNovaEquipe((atual) => ({ ...atual, veiculo: value }))} />
              <Campo label="Placa" value={novaEquipe.placa} onChange={(value) => setNovaEquipe((atual) => ({ ...atual, placa: value }))} />
              <label className="space-y-2 text-sm font-semibold text-slate-600">
                <span>Status</span>
                <select className="input bg-slate-50" value={novaEquipe.status} onChange={(event) => setNovaEquipe((atual) => ({ ...atual, status: event.target.value }))}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </label>
            </div>

            <button onClick={() => void executar(criarEquipe)} className="fp-button fp-admin-primary">
              <Plus size={15} />
              Criar equipe
            </button>

            </details>
            <div className="fp-admin-filters"><label className="fp-search"><Search size={16} /><input aria-label="Buscar equipe" placeholder="Buscar equipe, veículo ou placa…" value={buscaEquipe} onChange={(event) => setBuscaEquipe(event.target.value)} /></label></div>
            <p className="fp-admin-count">{equipesVisiveis.length} de {equipes.length} equipes</p>
            {!carregando && !erro && equipesVisiveis.length === 0 && <div className="fp-admin-empty">{equipes.length ? "Nenhuma equipe corresponde à busca." : "Nenhuma equipe cadastrada. Use Nova equipe para começar."}</div>}
            <div className="mt-6 space-y-4">
              {carregando ? (
                <div className="text-sm text-slate-500">Carregando equipes...</div>
              ) : (
                equipesVisiveis.map((equipe) => (
                  <EquipeCard
                    key={`${equipe.id_equipe}-${equipe.numero_equipe}-${equipe.placa ?? "sem-placa"}-${equipe.veiculo ?? "sem-veiculo"}-${equipe.status ?? "sem-status"}`}
                    equipe={equipe}
                    onSalvar={(item) => void executar(() => salvarEquipe(item))}
                    onExcluir={(id) => void executar(() => excluirEquipe(id))}
                  />
                ))
              )}
            </div>
          </div>
        </fieldset>
        </main>
      </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-600">
      <span>{label}</span>
      <input type={type} className="input bg-slate-50" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function UsuarioCard({
  usuario,
  equipes,
  onSalvar,
  onAlterarSenha,
  onExcluir,
}: {
  usuario: UsuarioAdmin;
  equipes: EquipeAdmin[];
  onSalvar: (usuario: UsuarioAdmin) => void;
  onAlterarSenha: (id: number, senha: string) => Promise<boolean>;
  onExcluir: (id: number) => void;
}) {
  const [edicao, setEdicao] = useState(usuario);
  const [editandoSenha, setEditandoSenha] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");

  return (
    <div className="fp-admin-record">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-md bg-sky-50 p-2 text-sky-700">
          <UserCog size={14} />
        </span>
        <strong className="text-slate-900">{usuario.nome_completo}</strong><span className="fp-admin-badge">{usuario.perfil === "admin" ? "Administrador" : usuario.perfil === "escritorio" ? "Escritório" : "Equipe"}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Campo label="Nome" value={edicao.nome_completo} onChange={(value) => setEdicao((atual) => ({ ...atual, nome_completo: value }))} />
        <Campo label="Usuário" value={edicao.user} onChange={(value) => setEdicao((atual) => ({ ...atual, user: value }))} />
        <label className="space-y-2 text-sm font-semibold text-slate-600">
          <span>Perfil</span>
          <select className="input bg-slate-50" value={edicao.perfil} onChange={(event) => setEdicao((atual) => ({ ...atual, perfil: event.target.value as UsuarioAdmin["perfil"] }))}>
            <option value="escritorio">Escritório</option>
            <option value="admin">Admin</option>
            <option value="equipe">Equipe</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold text-slate-600">
          <span>Equipe</span>
          <select className="input bg-slate-50" value={edicao.id_equipe ?? ""} onChange={(event) => setEdicao((atual) => ({ ...atual, id_equipe: event.target.value ? Number(event.target.value) : null }))}>
            <option value="">Sem equipe</option>
            {equipes.map((equipe) => (
              <option key={equipe.id_equipe} value={equipe.id_equipe}>
                {equipe.numero_equipe}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => onSalvar(edicao)} className="fp-button fp-admin-primary">Salvar</button>
        <button onClick={() => { setEditandoSenha(!editandoSenha); setSenha(""); setConfirmacaoSenha(""); }} aria-expanded={editandoSenha} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"><KeyRound size={13} />Senha</button>
        <button onClick={() => onExcluir(usuario.id)} className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"><Trash2 size={13} />Excluir</button>
      </div>
      {editandoSenha && <form className="fp-admin-password" onSubmit={(event) => { event.preventDefault(); if (senha !== confirmacaoSenha) return; void onAlterarSenha(usuario.id, senha).then((sucesso) => { if (sucesso) { setSenha(""); setConfirmacaoSenha(""); setEditandoSenha(false); } }); }}><label>Nova senha<input className="input" type="password" autoComplete="new-password" required value={senha} onChange={(event) => setSenha(event.target.value)} /></label><label>Confirmar nova senha<input className="input" type="password" autoComplete="new-password" required value={confirmacaoSenha} onChange={(event) => setConfirmacaoSenha(event.target.value)} /></label>{confirmacaoSenha && senha !== confirmacaoSenha && <p role="status">As senhas não coincidem.</p>}<div><button className="fp-button fp-admin-primary" disabled={!senha.trim() || senha !== confirmacaoSenha}>Alterar senha</button><button className="fp-button" type="button" onClick={() => { setEditandoSenha(false); setSenha(""); setConfirmacaoSenha(""); }}>Cancelar</button></div></form>}
    </div>
  );
}

function EquipeCard({
  equipe,
  onSalvar,
  onExcluir,
}: {
  equipe: EquipeAdmin;
  onSalvar: (equipe: EquipeAdmin) => void;
  onExcluir: (id: number) => void;
}) {
  const [edicao, setEdicao] = useState(equipe);

  return (
    <div className="fp-admin-record">
      <div className="mb-4 font-bold text-slate-900">{equipe.numero_equipe}</div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Campo label="Equipe" value={edicao.numero_equipe} onChange={(value) => setEdicao((atual) => ({ ...atual, numero_equipe: value }))} />
        <Campo label="Veículo" value={edicao.veiculo || ""} onChange={(value) => setEdicao((atual) => ({ ...atual, veiculo: value }))} />
        <Campo label="Placa" value={edicao.placa || ""} onChange={(value) => setEdicao((atual) => ({ ...atual, placa: value }))} />
        <label className="space-y-2 text-sm font-semibold text-slate-600">
          <span>Status</span>
          <select className="input bg-slate-50" value={edicao.status || "Ativo"} onChange={(event) => setEdicao((atual) => ({ ...atual, status: event.target.value }))}>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => onSalvar(edicao)} className="fp-button fp-admin-primary">Salvar</button>
        <button onClick={() => onExcluir(equipe.id_equipe)} className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"><Trash2 size={13} />Excluir</button>
      </div>
    </div>
  );
}
