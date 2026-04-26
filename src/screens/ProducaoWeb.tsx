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
} from "lucide-react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL, authFetch } from "../lib/api";

type Props = {
  voltar: () => void;
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

export default function ProducaoWeb({ voltar }: Props) {
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#eff6ff_30%,_#f8fafc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br from-[#071f38] via-[#0a355e] to-[#4e8db0] px-6 py-6 text-white shadow-[0_24px_80px_rgba(2,23,48,0.25)]">
          <div className="absolute -right-8 top-0 h-44 w-44 rounded-full bg-cyan-200/15 blur-3xl" />
          <div className="absolute -bottom-10 left-1/4 h-36 w-36 rounded-full bg-blue-100/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase text-cyan-100">
                <Route size={14} />
                Monitoramento de campo
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Producao e desempenho das equipes
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-sky-50/90 sm:text-base">
                Painel para comparar equipes, visualizar rotas registradas e ler a
                produtividade do dia com muito mais clareza.
              </p>

              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <HeroChip label={`${dados.length} equipes monitoradas`} />
                <HeroChip label={`${pontosTotal} pontos totais`} />
                <HeroChip label={`${notasTotal} solicitacoes concluidas/finalizadas`} />
              </div>
            </div>

            <button
              onClick={voltar}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0a355e] shadow-lg transition hover:bg-sky-50"
            >
              Voltar ao escritorio
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi
            titulo="Equipe destaque"
            valor={equipeDestaque?.equipe || "-"}
            detalhe={`${equipeDestaque?.notas || 0} concluidas/finalizadas`}
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
            detalhe="concluidas/finalizadas"
            cor="violet"
            icone={<ClipboardList size={18} />}
          />
        </section>

        <section className="rounded-[28px] border border-slate-200/70 bg-white/85 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Filtro de período</h2>
              <p className="text-sm text-slate-500">
                Recalcule produção, rota e indicadores por data inicial e final.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
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
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700"
              >
                Limpar período
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.9fr]">
          <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 border-b border-slate-200/70 bg-[linear-gradient(135deg,#f8fbff_0%,#edf5ff_100%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Rota da equipe</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Selecione uma equipe para visualizar o trajeto registrado e a leitura
                  operacional do mapa.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={equipeSelecionada ?? ""}
                  onChange={(event) => {
                    const valor = Number(event.target.value);
                    void carregarTudo(valor);
                  }}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                >
                  {dados.map((item) => (
                    <option key={item.id_equipe} value={item.id_equipe}>
                      {item.equipe}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => void carregarTudo(equipeSelecionada)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700"
                >
                  <RefreshCcw size={15} />
                  Atualizar
                </button>
              </div>
            </div>

            <div className="h-[470px] bg-slate-100">
              {carregando ? (
                <CentralMessage mensagem="Carregando mapa da equipe..." />
              ) : erro ? (
                <CentralMessage mensagem={erro} />
              ) : rota.length > 0 ? (
                <MapContainer center={centroMapa} zoom={13} style={{ height: "100%", width: "100%" }}>
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
                      <Popup>{index === 0 ? "Inicio da rota" : `Ponto ${index + 1}`}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <CentralMessage mensagem="Nenhuma rota encontrada para esta equipe." />
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200/70 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="mb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Producao por equipe</h2>
                  <p className="text-sm text-slate-500">
                    Clique em uma equipe para destacar a rota e comparar a produtividade.
                  </p>
                </div>

                <label className="space-y-1 text-sm font-semibold text-slate-600">
                  <span>Ordenar por</span>
                  <select
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
              <div className="space-y-4">
                {dadosOrdenados.map((item) => (
                  <button
                    key={item.id_equipe}
                    onClick={() => void carregarTudo(item.id_equipe)}
                    className={`w-full rounded-[24px] border p-4 text-left shadow-sm transition ${
                      item.id_equipe === equipeSelecionada
                        ? "border-sky-300 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fbff_100%)] shadow-[0_14px_40px_rgba(59,130,246,0.12)]"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-xl bg-slate-900 p-2 text-white">
                            <Truck size={14} />
                          </span>
                          <strong className="text-base text-slate-900">{item.equipe}</strong>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {item.veiculo} • {item.placa}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
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
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Nenhum dado de producao encontrado.
                  </div>
                )}
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
}

function HeroChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
      {label}
    </span>
  );
}

function CentralMessage({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-6 text-center text-sm font-semibold text-slate-500">
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
  const estilos = {
    emerald: {
      gradiente: "from-emerald-500 to-teal-400",
      pill: "bg-emerald-100 text-emerald-700",
    },
    sky: {
      gradiente: "from-sky-500 to-cyan-400",
      pill: "bg-sky-100 text-sky-700",
    },
    amber: {
      gradiente: "from-amber-500 to-orange-400",
      pill: "bg-amber-100 text-amber-700",
    },
    violet: {
      gradiente: "from-violet-500 to-fuchsia-400",
      pill: "bg-violet-100 text-violet-700",
    },
  }[cor];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-slate-100/60 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <div className="mt-3 text-4xl font-black tracking-tight text-slate-900">{valor}</div>
        </div>

        <div className={`rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg ${estilos.gradiente}`}>
          {icone}
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${estilos.pill}`}>{detalhe}</span>
        <span className="text-xs font-semibold text-slate-400">Visao consolidada</span>
      </div>
    </div>
  );
}

function MiniCard({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {titulo}
      </div>
      <strong className="mt-1 block text-2xl text-slate-900">{valor}</strong>
    </div>
  );
}
