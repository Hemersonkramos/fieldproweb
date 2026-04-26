import { useEffect, useState } from "react";
import { KeyRound, Plus, Shield, Trash2, UserCog, Users, Wrench } from "lucide-react";
import { API_BASE_URL, authFetch } from "../lib/api";

type Props = {
  voltar: () => void;
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

export default function AdminWeb({ voltar }: Props) {
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

  async function alterarSenha(id: number) {
    const novaSenha = window.prompt("Digite a nova senha:");

    if (!novaSenha) {
      return;
    }

    const resposta = await authFetch(`${API_BASE_URL}/admin/usuarios/${id}/senha`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: novaSenha }),
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao alterar senha.");
    }

    window.alert("Senha alterada com sucesso.");
  }

  async function excluirUsuario(id: number) {
    if (!window.confirm("Deseja excluir este usuário?")) {
      return;
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
      return;
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

  async function executar(acao: () => Promise<void>) {
    try {
      await acao();
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Erro ao executar ação.");
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_38%,_#edf4f8_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-white/70 bg-gradient-to-br from-[#1e1b4b] via-[#0f3b68] to-[#2b7aa3] px-6 py-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase text-cyan-100">
                <Shield size={14} />
                Gestão administrativa
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Administração FieldPro</h1>
              <p className="mt-3 text-sm leading-6 text-sky-50/90 sm:text-base">
                Criação de usuários, equipes de campo, troca de senha, edição de dados
                e concessão de acesso administrativo.
              </p>
            </div>

            <button
              onClick={voltar}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b3157] shadow-lg transition hover:bg-sky-50"
            >
              Voltar ao escritório
            </button>
          </div>
        </header>

        {erro && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {erro}
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <Users size={18} />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Usuários</h2>
                <p className="text-sm text-slate-500">Crie, edite, troque senha e conceda acesso admin.</p>
              </div>
            </div>

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

            <button onClick={() => void executar(criarUsuario)} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800">
              <Plus size={15} />
              Criar usuário
            </button>

            <div className="mt-6 space-y-4">
              {carregando ? (
                <div className="text-sm text-slate-500">Carregando usuários...</div>
              ) : (
                usuarios.map((usuario) => (
                  <UsuarioCard
                    key={`${usuario.id}-${usuario.nome_completo}-${usuario.user}-${usuario.perfil}-${usuario.id_equipe ?? "sem-equipe"}`}
                    usuario={usuario}
                    equipes={equipes}
                    onSalvar={(item) => void executar(() => salvarUsuario(item))}
                    onAlterarSenha={(id) => void executar(() => alterarSenha(id))}
                    onExcluir={(id) => void executar(() => excluirUsuario(id))}
                  />
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Wrench size={18} />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Equipes de campo</h2>
                <p className="text-sm text-slate-500">Cadastre, edite veículo, placa e status das equipes.</p>
              </div>
            </div>

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

            <button onClick={() => void executar(criarEquipe)} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800">
              <Plus size={15} />
              Criar equipe
            </button>

            <div className="mt-6 space-y-4">
              {carregando ? (
                <div className="text-sm text-slate-500">Carregando equipes...</div>
              ) : (
                equipes.map((equipe) => (
                  <EquipeCard
                    key={`${equipe.id_equipe}-${equipe.numero_equipe}-${equipe.placa ?? "sem-placa"}-${equipe.status ?? "sem-status"}`}
                    equipe={equipe}
                    onSalvar={(item) => void executar(() => salvarEquipe(item))}
                    onExcluir={(id) => void executar(() => excluirEquipe(id))}
                  />
                ))
              )}
            </div>
          </div>
        </section>
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
  onAlterarSenha: (id: number) => void;
  onExcluir: (id: number) => void;
}) {
  const [edicao, setEdicao] = useState(usuario);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-xl bg-slate-900 p-2 text-white">
          <UserCog size={14} />
        </span>
        <strong className="text-slate-900">{usuario.nome_completo}</strong>
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
        <button onClick={() => onSalvar(edicao)} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Salvar</button>
        <button onClick={() => onAlterarSenha(usuario.id)} className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"><KeyRound size={13} />Senha</button>
        <button onClick={() => onExcluir(usuario.id)} className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"><Trash2 size={13} />Excluir</button>
      </div>
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
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
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
        <button onClick={() => onSalvar(edicao)} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Salvar</button>
        <button onClick={() => onExcluir(equipe.id_equipe)} className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"><Trash2 size={13} />Excluir</button>
      </div>
    </div>
  );
}
