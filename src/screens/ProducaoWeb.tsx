import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ClipboardList,
  Filter,
  Gauge,
  Map,
  RefreshCcw,
  Route,
  Trophy,
  Truck,
  MapPin,
  Menu,
  Home,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, ScaleControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL, authFetch } from "../lib/api";
import type { UsuarioWeb } from "../App";
import "./Escritorio.css";
import "./ProducaoWeb.css";

type Props = {
  voltar: () => void;
  usuario: UsuarioWeb | null;
  irParaAdmin?: () => void;
  sair: () => void;
};

type ProducaoApi = {
  id_equipe: number;
  equipe: string;
  km: number | string;
  pontos: number | string;
  notas?: number | string;
  veiculo?: string | null;
  placa?: string | null;
  status?: string | null;
};

type Producao = {
  id_equipe: number;
  equipe: string;
  km: number;
  pontos: number;
  notas: number;
  veiculo: string;
  placa: string;
  status: string;
};

type RotaPonto = [number, number];

const CENTRO_PADRAO: [number, number] = [-5.0892, -42.8016];
const SATELITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELITE_ATTRIBUTION =
  "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function normalizarProducao(dados: ProducaoApi[]) {
  return dados.map((item) => ({
    id_equipe: Number(item.id_equipe),
    equipe: item.equipe || "Equipe sem nome",
    km: Number(item.km) || 0,
    pontos: Number(item.pontos) || 0,
    notas: Number(item.notas) || 0,
    veiculo: item.veiculo || "Veiculo nao informado",
    placa: item.placa || "-",
    status: item.status || "Offline",
  })) satisfies Producao[];
}

function montarParametrosPeriodo(dataInicial: string, dataFinal: string) {
  const parametros = new URLSearchParams();

  if (dataInicial) {
    parametros.set("data_inicial", dataInicial);
  }

  if (dataFinal) {
    parametros.set("data_final", dataFinal);
  }

  return parametros;
}

async function buscarProducao(dataInicial: string, dataFinal: string) {
  const parametros = montarParametrosPeriodo(dataInicial, dataFinal);
  const sufixo = parametros.toString() ? `?${parametros.toString()}` : "";
  const resposta = await authFetch(`${API_BASE_URL}/escritorio/producao${sufixo}`);

  if (!resposta.ok) {
    throw new Error("Falha ao carregar producao");
  }

  const dados = (await resposta.json()) as ProducaoApi[];
  return normalizarProducao(dados);
}

async function buscarRota(idEquipe: number | undefined, dataInicial: string, dataFinal: string) {
  const parametros = montarParametrosPeriodo(dataInicial, dataFinal);

  if (idEquipe) {
    parametros.set("id_equipe", String(idEquipe));
  }

  const sufixo = parametros.toString() ? `?${parametros.toString()}` : "";
  const resposta = await authFetch(`${API_BASE_URL}/escritorio/rota${sufixo}`);

  if (!resposta.ok) {
    throw new Error("Falha ao carregar rota");
  }

  const dados = (await resposta.json()) as Array<[number, number]>;

  return dados.filter(
    (ponto) =>
      Array.isArray(ponto) &&
      ponto.length === 2 &&
      Number.isFinite(Number(ponto[0])) &&
      Number.isFinite(Number(ponto[1]))
  ) as RotaPonto[];
}

export default function ProducaoWeb({ voltar, usuario, irParaAdmin, sair }: Props) {
  const [menuRecolhido, setMenuRecolhido] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  const [dados, setDados] = useState<Producao[]>([]);
  const [rota, setRota] = useState<RotaPonto[]>([]);
  const [equipeSelecionada, setEquipeSelecionada] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [ordenacao, setOrdenacao] = useState<"notas" | "pontos" | "km">("notas");

  async function carregarTudo(idEquipe?: number | null) {
    try {
      setCarregando(true);
      setErro("");

      const producao = await buscarProducao(dataInicial, dataFinal);
      const equipeAlvo =
        idEquipe && producao.some((item) => item.id_equipe === idEquipe)
          ? idEquipe
          : producao[0]?.id_equipe ?? null;
      const rotaApi = equipeAlvo
        ? await buscarRota(equipeAlvo, dataInicial, dataFinal)
        : [];

      setDados(producao);
      setEquipeSelecionada(equipeAlvo);
      setRota(rotaApi);
    } catch (error) {
      console.error("Erro ao carregar producao:", error);
      setErro("Erro ao carregar dados da API.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    void buscarProducao(dataInicial, dataFinal)
      .then(async (producao) => {
        if (!ativo) {
          return;
        }

        const equipeInicial = producao[0]?.id_equipe ?? null;
        const rotaInicial = equipeInicial
          ? await buscarRota(equipeInicial, dataInicial, dataFinal)
          : [];

        if (!ativo) {
          return;
        }

        setDados(producao);
        setEquipeSelecionada(equipeInicial);
        setRota(rotaInicial);
        setErro("");
      })
      .catch((error) => {
        console.error("Erro ao carregar producao:", error);

        if (ativo) {
          setErro("Erro ao carregar dados da API.");
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
  }, [dataFinal, dataInicial]);

  useEffect(() => {
    let ativo = true;

    const intervalo = window.setInterval(() => {
      void buscarProducao(dataInicial, dataFinal)
        .then((producao) => {
          if (ativo) {
            setDados(producao);
          }
        })
        .catch((error) => {
          console.error("Erro ao atualizar status das equipes:", error);
        });
    }, 30 * 1000);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [dataFinal, dataInicial]);

  const equipeDestaque = useMemo(() => {
    if (dados.length === 0) {
      return null;
    }

    return [...dados].sort((a, b) => b.notas - a.notas)[0];
  }, [dados]);

  const kmTotal = useMemo(() => dados.reduce((total, item) => total + item.km, 0), [dados]);
  const pontosTotal = useMemo(
    () => dados.reduce((total, item) => total + item.pontos, 0),
    [dados]
  );
  const notasTotal = useMemo(
    () => dados.reduce((total, item) => total + item.notas, 0),
    [dados]
  );

  const dadosOrdenados = useMemo(() => {
    const lista = [...dados];

    lista.sort((a, b) => {
      if (ordenacao === "pontos") {
        return b.pontos - a.pontos;
      }

      if (ordenacao === "km") {
        return b.km - a.km;
      }

      return b.notas - a.notas;
    });

    return lista;
  }, [dados, ordenacao]);

  const centroMapa = rota.length > 0 ? rota[0] : CENTRO_PADRAO;

  return (
    <div className={`fp-dashboard fp-production ${menuRecolhido ? "fp-sidebar-collapsed" : ""}`}>
      <aside className="fp-sidebar">
        <div className="fp-sidebar-brand"><MapPin size={29} fill="#1c8cf0" strokeWidth={1.6} /><span>Field<b>Pro</b></span><button onClick={() => setMenuRecolhido(!menuRecolhido)} aria-label={menuRecolhido ? "Expandir menu" : "Recolher menu"} aria-expanded={!menuRecolhido}><Menu size={20} /></button></div>
        <nav aria-label="Navegação principal">
          <button onClick={voltar} title="Visão geral"><Home size={21} /><span>Visão geral</span></button>
          <a href="#producao" className="is-active" aria-current="page" title="Produção e rotas"><Route size={21} /><span>Produção e rotas</span></a>
          {usuario?.perfil === "admin" && irParaAdmin && <button onClick={irParaAdmin} title="Administração"><Settings size={21} /><span>Administração</span></button>}
        </nav>
        <div className="fp-sidebar-footer"><i className={erro ? "has-error" : ""} /><div><span>Centro operacional</span><strong>FieldPro</strong><small>{carregando ? "Sincronizando" : erro ? "Falha na sincronização" : "Conectado"}</small></div></div>
      </aside>
      <div className="fp-workarea" id="producao">
        <header className="fp-topbar">
          <div className="fp-page-title"><h1>Produção e rotas</h1><p>Acompanhamento de trajetos e produtividade das equipes.</p></div>
          <button className="fp-button" disabled={carregando} onClick={() => void carregarTudo(equipeSelecionada)}><RefreshCcw size={15} />{carregando ? "Atualizando…" : "Atualizar dados"}</button>
          <div className="fp-user-area"><details className="fp-user-menu"><summary><span className="fp-avatar">{usuario?.nome_completo.split(" ").filter(Boolean).slice(0, 2).map((nome) => nome[0]).join("") || "FP"}</span><span className="fp-user-name"><strong>{usuario?.nome_completo || "FieldPro"}</strong><small>{usuario?.perfil === "admin" ? "Administrador" : "Escritório"}</small></span><ChevronDown size={14} /></summary><div className="fp-user-dropdown"><button onClick={voltar}><Home size={16} />Voltar ao escritório</button><button onClick={sair}><LogOut size={16} />Sair</button></div></details></div>
        </header>
        <main className="fp-content">
        <section className="fp-metrics">
          <Kpi
            titulo="Equipe destaque"
            valor={equipeDestaque?.equipe || "-"}
            detalhe={`${equipeDestaque?.notas || 0} concluídas/finalizadas`}
            cor="emerald"
            icone={<Trophy size={18} />}
          />
          <Kpi
            titulo="KM percorrido"
            valor={kmTotal.toFixed(1)}
            detalhe="km"
            cor="sky"
            icone={<Gauge size={18} />}
          />
          <Kpi
            titulo="Pontos coletados"
            valor={pontosTotal}
            detalhe="total"
            cor="amber"
            icone={<Map size={18} />}
          />
          <Kpi
            titulo="Notas registradas"
            valor={notasTotal}
            detalhe="concluídas/finalizadas"
            cor="violet"
            icone={<ClipboardList size={18} />}
          />
        </section>

        <section className="fp-panel fp-period-panel">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Filtro de período</h2>
              <p className="text-sm text-slate-500">
                Escolha o período para consultar os indicadores e os trajetos.
              </p>
            </div>

            <div className="fp-period-label">
              <Filter size={14} />
              Período operacional
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-2 text-sm font-semibold text-slate-600">
              <span>Data inicial</span>
              <input
                type="date"
                className="input bg-slate-50"
                value={dataInicial}
                onChange={(event) => setDataInicial(event.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-600">
              <span>Data final</span>
              <input
                type="date"
                className="input bg-slate-50"
                value={dataFinal}
                onChange={(event) => setDataFinal(event.target.value)}
              />
            </label>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setDataInicial("");
                  setDataFinal("");
                }}
                className="fp-button"
              >
                Limpar período
              </button>
            </div>
          </div>
        </section>

        <section className="fp-operation-grid">
          <section className="fp-panel fp-map-panel">
            <div className="fp-panel-heading fp-route-heading">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Rota da equipe</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Selecione uma equipe para visualizar o trajeto registrado.
                </p>
              </div>

              <div className="fp-route-controls">
                <select
                  aria-label="Equipe da rota"
                  disabled={carregando || dados.length === 0}
                  value={equipeSelecionada ?? ""}
                  onChange={(event) => {
                    const valor = Number(event.target.value);
                    void carregarTudo(valor);
                  }}
                  className="fp-select"
                >
                  {dados.length === 0 && <option value="">Nenhuma equipe disponível</option>}
                  {dados.map((item) => (
                    <option key={item.id_equipe} value={item.id_equipe}>
                      {item.equipe}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => void carregarTudo(equipeSelecionada)}
                  className="fp-button"
                >
                  <RefreshCcw size={15} />
                  Atualizar
                </button>
              </div>
            </div>

            <div className="fp-production-map">
              {carregando ? (
                <CentralMessage mensagem="Carregando mapa da equipe..." />
              ) : erro ? (
                <CentralMessage mensagem={erro} />
              ) : rota.length > 0 ? (
                <MapContainer center={centroMapa} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <AjustarMapaProducao />
                  <ScaleControl position="bottomleft" imperial={false} />
                  <TileLayer attribution={SATELITE_ATTRIBUTION} url={SATELITE_TILE_URL} />

                  <Polyline
                    positions={rota}
                    pathOptions={{
                      color: "#0a4e80",
                      weight: 6,
                      opacity: 0.9,
                    }}
                  />

                  {rota.map((posicao, index) => (
                    <Marker key={`${posicao[0]}-${posicao[1]}-${index}`} position={posicao}>
                      <Popup>{index === 0 ? "Início da rota" : `Ponto ${index + 1}`}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <CentralMessage mensagem="Nenhuma rota encontrada para esta equipe." />
              )}
            </div>
          </section>

          <section className="fp-panel fp-production-teams">
            <div className="mb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Produção por equipe</h2>
                  <p className="text-sm text-slate-500">
                    Clique em uma equipe para destacar a rota e comparar a produtividade.
                  </p>
                </div>

                <label className="space-y-1 text-sm font-semibold text-slate-600">
                  <span>Ordenar por</span>
                  <select
                    className="fp-select"
                    value={ordenacao}
                    onChange={(event) =>
                      setOrdenacao(event.target.value as "notas" | "pontos" | "km")
                    }
                  >
                    <option value="notas">Notas registradas</option>
                    <option value="pontos">Pontos coletados</option>
                    <option value="km">KM percorrido</option>
                  </select>
                </label>
              </div>
            </div>

            {erro && !carregando ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center text-sm font-medium text-rose-700">
                {erro}
              </div>
            ) : (
              <div className="fp-production-team-list">
                {dadosOrdenados.map((item) => (
                  <button
                    key={item.id_equipe}
                    onClick={() => void carregarTudo(item.id_equipe)}
                    aria-pressed={item.id_equipe === equipeSelecionada}
                    className={`fp-production-team ${
                      item.id_equipe === equipeSelecionada
                        ? "is-selected"
                        : ""
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-sky-50 p-2 text-sky-700">
                            <Truck size={14} />
                          </span>
                          <strong className="text-base text-slate-900">{item.equipe}</strong>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {item.veiculo} • {item.placa}
                        </div>
                      </div>

                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          item.status === "Offline"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <MiniCard titulo="KM" valor={item.km.toFixed(1)} />
                      <MiniCard titulo="Pontos" valor={item.pontos} />
                      <MiniCard titulo="Concl./Final." valor={item.notas} />
                    </div>
                  </button>
                ))}

                {!carregando && dados.length === 0 && (
                  <div className="fp-production-empty">
                    Nenhum dado de produção encontrado.
                  </div>
                )}
              </div>
            )}
          </section>
        </section>
        </main>
      </div>
    </div>
  );
}

function CentralMessage({ mensagem }: { mensagem: string }) {
  return (
    <div className="fp-production-map-message">
      {mensagem}
    </div>
  );
}

function Kpi({
  titulo,
  valor,
  detalhe,
  cor,
  icone,
}: {
  titulo: string;
  valor: string | number;
  detalhe: string;
  cor: "emerald" | "sky" | "amber" | "violet";
  icone: ReactNode;
}) {
  return (
    <div className={`fp-stat-card fp-stat-${cor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p>{titulo}</p><div className="fp-production-stat-value" title={String(valor)}>{valor}</div></div>
        <div className={`fp-production-stat-icon fp-icon-${cor}`}>{icone}</div>
      </div>
      <div className="fp-production-stat-detail">{detalhe}</div>
    </div>
  );
}

function MiniCard({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="fp-production-mini">
      <div className="text-[11px] font-medium text-slate-500">
        {titulo}
      </div>
      <strong className="mt-1 block text-xl font-semibold text-slate-900">{valor}</strong>
    </div>
  );
}

function AjustarMapaProducao() {
  const mapa = useMap();
  useEffect(() => {
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa]);
  return null;
}
