import {
  useEffect,
  useMemo,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Check,
  Crown,
  Camera,
  FileText,
  Images,
  Pencil,
  Plus,
  Route,
  Search,
  ShieldAlert,
  Trash2,
  Wifi,
  Wrench,
  X,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { UsuarioWeb } from "../App";
import { API_BASE_URL, authFetch, authUrl } from "../lib/api";

type Props = {
  irParaProducao: () => void;
  irParaAdmin?: () => void;
  usuario: UsuarioWeb | null;
  sair: () => void;
};

type StatusDemanda = "Andamento" | "Concluida" | "Devolvida" | "Finalizada";
type PrioridadeDemanda = "Normal" | "Emergencial";
type OpcaoStatusFiltro = "Andamento" | "Concluida" | "Devolvida" | "Finalizada";

type DemandaApi = {
  id: number;
  solicitacao: string;
  cliente: string | null;
  municipio: string | null;
  regional?: string | null;
  id_equipe?: number | null;
  equipe: string | null;
  detalhes?: string | null;
  telefone?: string | null;
  status: StatusDemanda | null;
  prioridade: PrioridadeDemanda | null;
  prazo: string | null;
  data_servico?: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  total_pontos?: number | string | null;
};

type Demanda = {
  id: number;
  solicitacao: string;
  cliente: string;
  municipio: string;
  regional: string;
  id_equipe: number | null;
  equipe: string;
  detalhes: string;
  telefone: string;
  status: StatusDemanda;
  prioridade: PrioridadeDemanda;
  prazo: string;
  data_servico: string;
  latitude: number;
  longitude: number;
  total_pontos: number;
};

type FotoLevantamento = {
  id: number;
  id_ponto_coletado: number;
  nome_arquivo: string;
  caminho_arquivo: string;
  data_foto: string;
};

type PontoLevantamento = {
  id: number;
  id_solicitacao: number;
  ordem_ponto: number;
  latitude: string;
  longitude: string;
  data_coleta: string;
  observacao: string | null;
  fotos: FotoLevantamento[];
};

type AnexoSolicitacao = {
  id: string;
  nome: string;
  tipo: string;
  caminho_arquivo: string;
  criado_em: string;
};

type FormularioDemanda = {
  solicitacao: string;
  cliente: string;
  regional: string;
  municipio: string;
  telefone: string;
  detalhes: string;
  prioridade: PrioridadeDemanda;
  status: StatusDemanda;
  prazo: string;
  data_servico: string;
  latitude: string;
  longitude: string;
  id_equipe: string;
};

type NovaSolicitacao = {
  solicitacao: string;
  nome: string;
  regional: string;
  municipio: string;
  prazo: string;
  id_equipe: string;
  detalhes: string;
  telefone: string;
  latitude: string;
  longitude: string;
  prioridade: PrioridadeDemanda;
  data_servico: string;
};

type NovoAnexoSolicitacao = {
  arquivo: File;
  origem: "upload" | "colar";
  previewUrl?: string;
};

type ResultadoImportacaoLote = {
  mensagem: string;
  totalImportadas: number;
  totalIgnoradas: number;
  importadas: Array<{ linha: number; solicitacao: string }>;
  ignoradas: Array<{ linha: number; motivo: string; solicitacao: string }>;
};

type EquipeApi = {
  id_equipe: number;
  numero: string | null;
  veiculo: string | null;
  placa: string | null;
  status: string | null;
  ultima_latitude: number | string | null;
  ultima_longitude: number | string | null;
};

type EquipeMapa = {
  id: number;
  nome: string;
  status: string;
  online: boolean;
  veiculo: string;
  placa: string;
  latitude: number | null;
  longitude: number | null;
  possuiLocalizacao: boolean;
};

type Dashboard = {
  andamento: number;
  foraPrazo: number;
  emergenciais: number;
  equipesOnline: number;
};

const CENTRO_PADRAO: [number, number] = [-5.0892, -42.8016];
const SATELITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELITE_ATTRIBUTION =
  "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community";
const REGIONAIS_OPCOES = ["PARNAIBA", "FLORIANO", "PICOS", "METROPOLINA"] as const;
const MUNICIPIOS_PIAUI = [
  "Acauã",
  "Agricolândia",
  "Água Branca",
  "Alagoinha do Piauí",
  "Alegrete do Piauí",
  "Alto Longá",
  "Altos",
  "Alvorada do Gurguéia",
  "Amarante",
  "Angical do Piauí",
  "Anísio de Abreu",
  "Antônio Almeida",
  "Aroazes",
  "Aroeiras do Itaim",
  "Arraial",
  "Assunção do Piauí",
  "Avelino Lopes",
  "Baixa Grande do Ribeiro",
  "Barra D'Alcântara",
  "Barras",
  "Barreiras do Piauí",
  "Barro Duro",
  "Batalha",
  "Bela Vista do Piauí",
  "Belém do Piauí",
  "Beneditinos",
  "Bertolínia",
  "Betânia do Piauí",
  "Boa Hora",
  "Bocaina",
  "Bom Jesus",
  "Bom Princípio do Piauí",
  "Bonfim do Piauí",
  "Boqueirão do Piauí",
  "Brasileira",
  "Brejo do Piauí",
  "Buriti dos Lopes",
  "Buriti dos Montes",
  "Cabeceiras do Piauí",
  "Cajazeiras do Piauí",
  "Cajueiro da Praia",
  "Caldeirão Grande do Piauí",
  "Campinas do Piauí",
  "Campo Alegre do Fidalgo",
  "Campo Grande do Piauí",
  "Campo Largo do Piauí",
  "Campo Maior",
  "Canavieira",
  "Canto do Buriti",
  "Capitão de Campos",
  "Capitão Gervásio Oliveira",
  "Caracol",
  "Caraúbas do Piauí",
  "Caridade do Piauí",
  "Castelo do Piauí",
  "Caxingó",
  "Cocal",
  "Cocal de Telha",
  "Cocal dos Alves",
  "Coivaras",
  "Colônia do Gurguéia",
  "Colônia do Piauí",
  "Conceição do Canindé",
  "Coronel José Dias",
  "Corrente",
  "Cristalândia do Piauí",
  "Cristino Castro",
  "Curimatá",
  "Curral Novo do Piauí",
  "Curralinhos",
  "Currais",
  "Demerval Lobão",
  "Dirceu Arcoverde",
  "Dom Expedito Lopes",
  "Dom Inocêncio",
  "Domingos Mourão",
  "Elesbão Veloso",
  "Eliseu Martins",
  "Esperantina",
  "Fartura do Piauí",
  "Flores do Piauí",
  "Floresta do Piauí",
  "Floriano",
  "Francinópolis",
  "Francisco Ayres",
  "Francisco Macedo",
  "Francisco Santos",
  "Fronteiras",
  "Geminiano",
  "Gilbués",
  "Guadalupe",
  "Guaribas",
  "Hugo Napoleão",
  "Ilha Grande",
  "Inhuma",
  "Ipiranga do Piauí",
  "Isaías Coelho",
  "Itainópolis",
  "Itaueira",
  "Jacobina do Piauí",
  "Jaicós",
  "Jardim do Mulato",
  "Jatobá do Piauí",
  "Jerumenha",
  "João Costa",
  "Joaquim Pires",
  "Joca Marques",
  "José de Freitas",
  "Juazeiro do Piauí",
  "Júlio Borges",
  "Jurema",
  "Lagoa Alegre",
  "Lagoa de São Francisco",
  "Lagoa do Barro do Piauí",
  "Lagoa do Piauí",
  "Lagoa do Sítio",
  "Lagoinha do Piauí",
  "Landri Sales",
  "Luís Correia",
  "Luzilândia",
  "Madeiro",
  "Manoel Emídio",
  "Marcolândia",
  "Marcos Parente",
  "Massapê do Piauí",
  "Matias Olímpio",
  "Miguel Alves",
  "Miguel Leão",
  "Milton Brandão",
  "Monsenhor Gil",
  "Monsenhor Hipólito",
  "Monte Alegre do Piauí",
  "Morro Cabeça no Tempo",
  "Morro do Chapéu do Piauí",
  "Murici dos Portelas",
  "Nazaré do Piauí",
  "Nazária",
  "Nossa Senhora de Nazaré",
  "Nossa Senhora dos Remédios",
  "Nova Santa Rita",
  "Novo Oriente do Piauí",
  "Novo Santo Antônio",
  "Oeiras",
  "Olho D'Água do Piauí",
  "Padre Marcos",
  "Paes Landim",
  "Pajeú do Piauí",
  "Palmeira do Piauí",
  "Palmeirais",
  "Paquetá",
  "Parnaguá",
  "Parnaíba",
  "Passagem Franca do Piauí",
  "Patos do Piauí",
  "Pau D'Arco do Piauí",
  "Paulistana",
  "Pavussu",
  "Pedro II",
  "Pedro Laurentino",
  "Picos",
  "Pimenteiras",
  "Pio IX",
  "Piracuruca",
  "Piripiri",
  "Porto",
  "Porto Alegre do Piauí",
  "Prata do Piauí",
  "Queimada Nova",
  "Redenção do Gurguéia",
  "Regeneração",
  "Riacho Frio",
  "Ribeira do Piauí",
  "Ribeiro Gonçalves",
  "Rio Grande do Piauí",
  "Santa Cruz do Piauí",
  "Santa Cruz dos Milagres",
  "Santa Filomena",
  "Santa Luz",
  "Santa Rosa do Piauí",
  "Santana do Piauí",
  "Santo Antônio de Lisboa",
  "Santo Antônio dos Milagres",
  "Santo Inácio do Piauí",
  "São Braz do Piauí",
  "São Félix do Piauí",
  "São Francisco de Assis do Piauí",
  "São Francisco do Piauí",
  "São Gonçalo do Gurguéia",
  "São Gonçalo do Piauí",
  "São João da Canabrava",
  "São João da Fronteira",
  "São João da Serra",
  "São João da Varjota",
  "São João do Arraial",
  "São João do Piauí",
  "São José do Divino",
  "São José do Peixe",
  "São José do Piauí",
  "São Julião",
  "São Lourenço do Piauí",
  "São Luis do Piauí",
  "São Miguel da Baixa Grande",
  "São Miguel do Fidalgo",
  "São Miguel do Tapuio",
  "São Pedro do Piauí",
  "São Raimundo Nonato",
  "Sebastião Barros",
  "Sebastião Leal",
  "Sigefredo Pacheco",
  "Simões",
  "Simplício Mendes",
  "Socorro do Piauí",
  "Sussuapara",
  "Tamboril do Piauí",
  "Tanque do Piauí",
  "Teresina",
  "União",
  "Uruçuí",
  "Valença do Piauí",
  "Várzea Branca",
  "Várzea Grande",
  "Vera Mendes",
  "Vila Nova do Piauí",
  "Wall Ferraz",
] as const;
const STATUS_FILTRO_OPCOES: OpcaoStatusFiltro[] = [
  "Andamento",
  "Concluida",
  "Devolvida",
  "Finalizada",
];

const iconeEquipeOnline = L.divIcon({
  className: "fieldpro-team-dot fieldpro-team-dot--online",
  html: '<span class="fieldpro-team-dot__pulse"></span><span class="fieldpro-team-dot__core"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const iconeEquipeOffline = L.divIcon({
  className: "fieldpro-team-dot fieldpro-team-dot--offline",
  html: '<span class="fieldpro-team-dot__core"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

const iconesDemanda = {
  finalizada: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  concluida: L.divIcon({
    className: "fieldpro-pin fieldpro-pin--light-green",
    html: '<span class="fieldpro-pin__inner"></span>',
    iconSize: [26, 42],
    iconAnchor: [13, 42],
    popupAnchor: [0, -36],
  }),
  emergencialAndamento: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  normalAndamento: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  devolvidaNormal: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
};

const iconePontoLevantamento = L.divIcon({
  className: "fieldpro-point-pin",
  html: '<span class="fieldpro-point-pin__inner"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -10],
});

function parseNumero(valor: number | string | null | undefined) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === "string") {
    const numero = Number(valor);

    if (Number.isFinite(numero)) {
      return numero;
    }
  }

  return null;
}

function formatarPrazo(prazo: string) {
  if (!prazo) {
    return "-";
  }

  const data = new Date(prazo);

  if (Number.isNaN(data.getTime())) {
    return prazo;
  }

  return data.toLocaleDateString("pt-BR");
}

function diferencaDiasPrazo(prazo: string) {
  if (!prazo) {
    return null;
  }

  const hoje = new Date();
  const dataPrazo = new Date(prazo);

  if (Number.isNaN(dataPrazo.getTime())) {
    return null;
  }

  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicioPrazo = new Date(
    dataPrazo.getFullYear(),
    dataPrazo.getMonth(),
    dataPrazo.getDate()
  );

  const diferencaMs = inicioPrazo.getTime() - inicioHoje.getTime();
  return Math.round(diferencaMs / 86400000);
}

function descreverPrazo(prazo: string) {
  const diferenca = diferencaDiasPrazo(prazo);

  if (diferenca === null) {
    return "Prazo nao informado";
  }

  if (diferenca === 0) {
    return "Vence hoje";
  }

  if (diferenca > 0) {
    return `Faltam ${diferenca} dia${diferenca > 1 ? "s" : ""}`;
  }

  const diasAtraso = Math.abs(diferenca);
  return `${diasAtraso} dia${diasAtraso > 1 ? "s" : ""} em atraso`;
}

function prazoBadgeClasse(prazo: string) {
  const diferenca = diferencaDiasPrazo(prazo);

  if (diferenca === null) {
    return "bg-slate-100 text-slate-600";
  }

  if (diferenca < 0) {
    return "bg-rose-100 text-rose-700";
  }

  if (diferenca === 0) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

function normalizarDemandas(dados: DemandaApi[]) {
  return dados.map((demanda, index) => {
    const latitude = parseNumero(demanda.latitude) ?? CENTRO_PADRAO[0] + index * 0.008;
    const longitude = parseNumero(demanda.longitude) ?? CENTRO_PADRAO[1] + index * 0.008;

    return {
      id: demanda.id,
      solicitacao: demanda.solicitacao || `Solicitacao ${demanda.id}`,
      cliente: demanda.cliente || "Cliente nao informado",
      municipio: demanda.municipio || "Municipio nao informado",
      regional: demanda.regional || "",
      id_equipe: demanda.id_equipe ? Number(demanda.id_equipe) : null,
      equipe: demanda.equipe || "Sem equipe",
      detalhes: demanda.detalhes || "",
      telefone: demanda.telefone || "",
      status: demanda.status || "Andamento",
      prioridade: demanda.prioridade || "Normal",
      prazo: demanda.prazo || "",
      data_servico: demanda.data_servico || "",
      latitude,
      longitude,
      total_pontos: Number(demanda.total_pontos) || 0,
    } satisfies Demanda;
  });
}

function normalizarEquipes(dados: EquipeApi[]) {
  return dados.map((equipe) => {
    const online = equipe.status === "Ativo";
    const latitude = parseNumero(equipe.ultima_latitude);
    const longitude = parseNumero(equipe.ultima_longitude);

    return {
      id: equipe.id_equipe,
      nome: equipe.numero || `Equipe ${equipe.id_equipe}`,
      status: online ? "Online" : "Offline",
      online,
      veiculo: equipe.veiculo || "Veiculo nao informado",
      placa: equipe.placa || "-",
      latitude,
      longitude,
      possuiLocalizacao: latitude !== null && longitude !== null,
    } satisfies EquipeMapa;
  });
}

async function buscarDadosEscritorio() {
  const [demandasResposta, equipesResposta, dashboardResposta] = await Promise.all([
    authFetch(`${API_BASE_URL}/escritorio/demandas`),
    authFetch(`${API_BASE_URL}/escritorio/equipes`),
    authFetch(`${API_BASE_URL}/escritorio/dashboard`),
  ]);

  if (!demandasResposta.ok || !equipesResposta.ok || !dashboardResposta.ok) {
    throw new Error("Falha ao carregar dados do escritorio");
  }

  const demandasJson = (await demandasResposta.json()) as DemandaApi[];
  const equipesJson = (await equipesResposta.json()) as EquipeApi[];
  const dashboardJson = (await dashboardResposta.json()) as Dashboard;

  return {
    demandas: normalizarDemandas(demandasJson),
    equipes: normalizarEquipes(equipesJson),
    dashboard: {
      andamento: Number(dashboardJson.andamento) || 0,
      foraPrazo: Number(dashboardJson.foraPrazo) || 0,
      emergenciais: Number(dashboardJson.emergenciais) || 0,
      equipesOnline: Number(dashboardJson.equipesOnline) || 0,
    } satisfies Dashboard,
  };
}

function statusBadgeClasse(status: StatusDemanda, prioridade: PrioridadeDemanda) {
  if (status === "Finalizada") {
    return "bg-green-800 text-white";
  }

  if (status === "Concluida") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Devolvida") {
    return prioridade === "Emergencial"
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-700";
  }

  return "bg-blue-100 text-blue-700";
}

function obterIconeDemanda(demanda: Demanda) {
  if (demanda.status === "Finalizada") {
    return iconesDemanda.finalizada;
  }

  if (demanda.status === "Concluida") {
    return iconesDemanda.concluida;
  }

  if (demanda.status === "Devolvida" && demanda.prioridade === "Emergencial") {
    return iconesDemanda.emergencialAndamento;
  }

  if (demanda.status === "Devolvida" && demanda.prioridade === "Normal") {
    return iconesDemanda.devolvidaNormal;
  }

  if (demanda.status === "Andamento" && demanda.prioridade === "Emergencial") {
    return iconesDemanda.emergencialAndamento;
  }

  return iconesDemanda.normalAndamento;
}

export default function Escritorio({ irParaProducao, irParaAdmin, usuario, sair }: Props) {
  const [demandasBase, setDemandasBase] = useState<Demanda[]>([]);
  const [equipes, setEquipes] = useState<EquipeMapa[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard>({
    andamento: 0,
    foraPrazo: 0,
    emergenciais: 0,
    equipesOnline: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [statusFiltro, setStatusFiltro] = useState<OpcaoStatusFiltro[]>([]);
  const [statusFiltroAberto, setStatusFiltroAberto] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [equipeFiltro, setEquipeFiltro] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [acaoEmAndamentoId, setAcaoEmAndamentoId] = useState<number | null>(null);
  const [demandaEmEdicao, setDemandaEmEdicao] = useState<Demanda | null>(null);
  const [formulario, setFormulario] = useState<FormularioDemanda | null>(null);
  const [anexos, setAnexos] = useState<AnexoSolicitacao[]>([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [abrindoSolicitacao, setAbrindoSolicitacao] = useState(false);
  const [abrindoSolicitacaoLote, setAbrindoSolicitacaoLote] = useState(false);
  const [novaSolicitacao, setNovaSolicitacao] = useState<NovaSolicitacao>({
    solicitacao: "",
    nome: "",
    regional: "",
    municipio: "",
    prazo: "",
    id_equipe: "",
    detalhes: "",
    telefone: "",
    latitude: "",
    longitude: "",
    prioridade: "Normal",
    data_servico: "",
  });
  const [novosAnexosSolicitacao, setNovosAnexosSolicitacao] = useState<NovoAnexoSolicitacao[]>(
    []
  );
  const [planilhaLoteTexto, setPlanilhaLoteTexto] = useState("");
  const [importandoLote, setImportandoLote] = useState(false);
  const [resultadoImportacaoLote, setResultadoImportacaoLote] =
    useState<ResultadoImportacaoLote | null>(null);
  const [demandaLevantamento, setDemandaLevantamento] = useState<Demanda | null>(null);
  const [pontosLevantamento, setPontosLevantamento] = useState<PontoLevantamento[]>([]);
  const [carregandoLevantamento, setCarregandoLevantamento] = useState(false);

  const nomeSolicitacaoDuplicado = useMemo(() => {
    const nome = novaSolicitacao.solicitacao.trim().toLowerCase();
    if (!nome) {
      return false;
    }

    return demandasBase.some((demanda) => demanda.solicitacao.trim().toLowerCase() === nome);
  }, [demandasBase, novaSolicitacao.solicitacao]);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");
      const dados = await buscarDadosEscritorio();

      setDemandasBase(dados.demandas);
      setEquipes(dados.equipes);
      setDashboard(dados.dashboard);
    } catch (error) {
      console.error("Erro ao carregar dados do escritorio:", error);
      setErro("Erro ao carregar dados da API.");
    } finally {
      setCarregando(false);
    }
  }

  async function atualizarStatusDemanda(
    demanda: Demanda,
    proximoStatus: "Finalizada" | "Devolvida"
  ) {
    const mensagem =
      proximoStatus === "Finalizada"
        ? `Deseja finalizar a solicitação ${demanda.solicitacao}?`
        : `Deseja devolver a solicitação ${demanda.solicitacao}?`;

    if (!window.confirm(mensagem)) {
      return;
    }

    try {
      setAcaoEmAndamentoId(demanda.id);

      const resposta = await authFetch(
        `${API_BASE_URL}/escritorio/solicitacoes/${demanda.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: proximoStatus }),
        }
      );

      const dados = (await resposta.json()) as {
        erro?: string;
        demanda?: DemandaApi;
      };

      if (!resposta.ok || !dados.demanda) {
        throw new Error(dados.erro || "Não foi possível atualizar a solicitação.");
      }

      const demandaAtualizada = normalizarDemandas([dados.demanda])[0];

      setDemandasBase((atual) =>
        atual.map((item) => (item.id === demanda.id ? demandaAtualizada : item))
      );
    } catch (error) {
      console.error("Erro ao atualizar solicitação:", error);
      window.alert(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar o status da solicitação."
      );
    } finally {
      setAcaoEmAndamentoId(null);
    }
  }

  function abrirEdicao(demanda: Demanda) {
    setDemandaEmEdicao(demanda);
    setFormulario({
      solicitacao: demanda.solicitacao,
      cliente: demanda.cliente,
      regional: demanda.regional,
      municipio: demanda.municipio,
      telefone: demanda.telefone,
      detalhes: demanda.detalhes,
      prioridade: demanda.prioridade,
      status: demanda.status,
      prazo: demanda.prazo ? demanda.prazo.slice(0, 10) : "",
      data_servico: demanda.data_servico ? demanda.data_servico.slice(0, 10) : "",
      latitude: String(demanda.latitude),
      longitude: String(demanda.longitude),
      id_equipe: demanda.id_equipe ? String(demanda.id_equipe) : "",
    });
    setAnexos([]);
    void carregarAnexos(demanda.id);
  }

  function fecharEdicao() {
    setDemandaEmEdicao(null);
    setFormulario(null);
    setAnexos([]);
    setCarregandoAnexos(false);
    setSalvandoEdicao(false);
  }

  async function abrirLevantamento(demanda: Demanda) {
    try {
      setDemandaLevantamento(demanda);
      setCarregandoLevantamento(true);
      setPontosLevantamento([]);

      const resposta = await authFetch(`${API_BASE_URL}/solicitacoes/${demanda.id}/pontos`);
      const dados = (await resposta.json()) as PontoLevantamento[] | { erro?: string };

      if (!resposta.ok || !Array.isArray(dados)) {
        throw new Error(
          !Array.isArray(dados) && "erro" in dados
            ? dados.erro
            : "Erro ao carregar levantamento."
        );
      }

      setPontosLevantamento(dados);
    } catch (error) {
      console.error("Erro ao carregar levantamento:", error);
      window.alert(
        error instanceof Error ? error.message : "Erro ao carregar levantamento."
      );
      setDemandaLevantamento(null);
    } finally {
      setCarregandoLevantamento(false);
    }
  }

  function fecharLevantamento() {
    setDemandaLevantamento(null);
    setPontosLevantamento([]);
    setCarregandoLevantamento(false);
  }

  function abrirSolicitacao() {
    setNovaSolicitacao({
      solicitacao: "",
      nome: "",
      regional: "",
      municipio: "",
      prazo: "",
      id_equipe: "",
      detalhes: "",
      telefone: "",
      latitude: "",
      longitude: "",
      prioridade: "Normal",
      data_servico: "",
    });
    setNovosAnexosSolicitacao([]);
    setAbrindoSolicitacao(true);
  }

  function abrirSolicitacaoLote() {
    setPlanilhaLoteTexto("");
    setResultadoImportacaoLote(null);
    setAbrindoSolicitacaoLote(true);
  }

  function fecharSolicitacao() {
    setNovosAnexosSolicitacao([]);
    setAbrindoSolicitacao(false);
  }

  function fecharSolicitacaoLote() {
    setAbrindoSolicitacaoLote(false);
  }

  function atualizarNovaSolicitacao(campo: keyof NovaSolicitacao, valor: string) {
    setNovaSolicitacao((atual) => ({ ...atual, [campo]: valor }));
  }

  function adicionarArquivosNaNovaSolicitacao(files: File[]) {
    const arquivosValidos = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (arquivosValidos.length === 0) {
      return;
    }

    setNovosAnexosSolicitacao((atual) => [
      ...atual,
      ...arquivosValidos.map((arquivo) => ({
        arquivo,
        origem: "upload" as const,
        previewUrl: arquivo.type.startsWith("image/") ? URL.createObjectURL(arquivo) : undefined,
      })),
    ]);
  }

  function colarImagemNaNovaSolicitacao(event: ReactClipboardEvent<HTMLDivElement>) {
    const imagens = Array.from(event.clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item, indice) => {
        const arquivo = item.getAsFile();
        if (!arquivo) {
          return null;
        }

        const extensao = arquivo.type.split("/")[1] || "png";
        return new File([arquivo], `imagem-colada-${Date.now()}-${indice}.${extensao}`, {
          type: arquivo.type,
        });
      })
      .filter((arquivo): arquivo is File => arquivo !== null);

    if (imagens.length === 0) {
      return;
    }

    event.preventDefault();
    setNovosAnexosSolicitacao((atual) => [
      ...atual,
      ...imagens.map((arquivo) => ({
        arquivo,
        origem: "colar" as const,
        previewUrl: URL.createObjectURL(arquivo),
      })),
    ]);
  }

  function removerNovoAnexoSolicitacao(indice: number) {
    setNovosAnexosSolicitacao((atual) => {
      const item = atual[indice];
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }

      return atual.filter((_, itemIndice) => itemIndice !== indice);
    });
  }

  async function carregarPlanilhaLote(files: FileList | null) {
    const arquivo = files?.[0];
    if (!arquivo) {
      return;
    }

    const conteudo = await arquivo.text();
    setPlanilhaLoteTexto(conteudo);
  }

  async function salvarNovaSolicitacao() {
    try {
      setSalvandoEdicao(true);

      const resposta = await authFetch(`${API_BASE_URL}/escritorio/solicitacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...novaSolicitacao,
          id_equipe: novaSolicitacao.id_equipe
            ? Number(novaSolicitacao.id_equipe)
            : null,
          latitude: novaSolicitacao.latitude || null,
          longitude: novaSolicitacao.longitude || null,
          data_servico: novaSolicitacao.data_servico || null,
        }),
      });

      const dados = (await resposta.json()) as { erro?: string };

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível abrir a solicitação.");
      }

      await carregarDados();
      fecharSolicitacao();
      window.alert("Solicitação criada com sucesso.");
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      window.alert(
        error instanceof Error ? error.message : "Erro ao abrir solicitação."
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function salvarNovaSolicitacaoComAnexos() {
    const manterCompatibilidade = salvarNovaSolicitacao;
    void manterCompatibilidade;
    if (nomeSolicitacaoDuplicado) {
      window.alert("Nome utilizado. Informe outra solicitação.");
      return;
    }

    try {
      setSalvandoEdicao(true);

      const resposta = await authFetch(`${API_BASE_URL}/escritorio/solicitacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...novaSolicitacao,
          id_equipe: novaSolicitacao.id_equipe
            ? Number(novaSolicitacao.id_equipe)
            : null,
          latitude: novaSolicitacao.latitude || null,
          longitude: novaSolicitacao.longitude || null,
          data_servico: novaSolicitacao.data_servico || null,
        }),
      });

      const dados = (await resposta.json()) as { erro?: string; id?: number };

      if (!resposta.ok || !dados.id) {
        throw new Error(dados.erro || "Não foi possível abrir a solicitação.");
      }

      if (novosAnexosSolicitacao.length > 0) {
        const anexosPayload = await Promise.all(
          novosAnexosSolicitacao.map(
            ({ arquivo }) =>
              new Promise<{ nome: string; tipo: string; conteudoBase64: string }>((resolve, reject) => {
                const leitor = new FileReader();
                leitor.onload = () => {
                  resolve({
                    nome: arquivo.name,
                    tipo: arquivo.type || "application/octet-stream",
                    conteudoBase64: String(leitor.result || ""),
                  });
                };
                leitor.onerror = () => reject(new Error(`Erro ao ler o arquivo ${arquivo.name}`));
                leitor.readAsDataURL(arquivo);
              })
          )
        );

        const respostaAnexos = await authFetch(
          `${API_BASE_URL}/escritorio/solicitacoes/${dados.id}/anexos`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ anexos: anexosPayload }),
          }
        );

        const dadosAnexos = (await respostaAnexos.json()) as { erro?: string };

        if (!respostaAnexos.ok) {
          throw new Error(dadosAnexos.erro || "Não foi possível enviar os anexos.");
        }
      }

      await carregarDados();
      fecharSolicitacao();
      window.alert("Solicitação criada com sucesso.");
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      window.alert(
        error instanceof Error ? error.message : "Erro ao abrir solicitação."
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function importarSolicitacoesEmLote() {
    if (!planilhaLoteTexto.trim()) {
      window.alert("Cole ou carregue uma planilha CSV antes de importar.");
      return;
    }

    try {
      setImportandoLote(true);
      const resposta = await authFetch(`${API_BASE_URL}/escritorio/solicitacoes/lote-csv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conteudo: planilhaLoteTexto }),
      });

      const dados = (await resposta.json()) as ResultadoImportacaoLote | { erro?: string };

      if (!resposta.ok || !("totalImportadas" in dados)) {
        throw new Error("erro" in dados ? dados.erro : "Não foi possível importar a planilha.");
      }

      setResultadoImportacaoLote(dados);
      await carregarDados();
    } catch (error) {
      console.error("Erro ao importar planilha:", error);
      window.alert(
        error instanceof Error ? error.message : "Erro ao importar solicitações em lote."
      );
    } finally {
      setImportandoLote(false);
    }
  }

  async function carregarAnexos(idDemanda: number) {
    try {
      setCarregandoAnexos(true);
      const resposta = await authFetch(`${API_BASE_URL}/escritorio/solicitacoes/${idDemanda}/anexos`);
      const dados = (await resposta.json()) as AnexoSolicitacao[] | { erro?: string };

      if (!resposta.ok || !Array.isArray(dados)) {
        throw new Error(
          !Array.isArray(dados) && "erro" in dados ? dados.erro : "Erro ao carregar anexos."
        );
      }

      setAnexos(dados);
    } catch (error) {
      console.error("Erro ao carregar anexos:", error);
      window.alert(
        error instanceof Error ? error.message : "Erro ao carregar anexos da solicitação."
      );
    } finally {
      setCarregandoAnexos(false);
    }
  }

  function atualizarCampoFormulario(campo: keyof FormularioDemanda, valor: string) {
    setFormulario((atual) => (atual ? { ...atual, [campo]: valor } : atual));
  }

  function alternarStatusFiltro(status: OpcaoStatusFiltro) {
    setStatusFiltro((atual) =>
      atual.includes(status) ? atual.filter((item) => item !== status) : [...atual, status]
    );
  }

  async function salvarEdicao() {
    if (!demandaEmEdicao || !formulario) {
      return;
    }

    try {
      setSalvandoEdicao(true);

      const resposta = await authFetch(`${API_BASE_URL}/escritorio/solicitacoes/${demandaEmEdicao.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          solicitacao: formulario.solicitacao,
          cliente: formulario.cliente,
          regional: formulario.regional,
          municipio: formulario.municipio,
          telefone: formulario.telefone,
          detalhes: formulario.detalhes,
          prioridade: formulario.prioridade,
          status: formulario.status,
          prazo: formulario.prazo || null,
          data_servico: formulario.data_servico || null,
          latitude: formulario.latitude || null,
          longitude: formulario.longitude || null,
          id_equipe: formulario.id_equipe ? Number(formulario.id_equipe) : null,
        }),
      });

      const dados = (await resposta.json()) as { erro?: string; demanda?: DemandaApi };

      if (!resposta.ok || !dados.demanda) {
        throw new Error(dados.erro || "Não foi possível salvar a solicitação.");
      }

      const demandaAtualizada = normalizarDemandas([dados.demanda])[0];

      setDemandasBase((atual) =>
        atual.map((item) => (item.id === demandaEmEdicao.id ? demandaAtualizada : item))
      );
      setDemandaEmEdicao(demandaAtualizada);
      window.alert("Solicitação atualizada com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar solicitação:", error);
      window.alert(
        error instanceof Error ? error.message : "Erro ao salvar a solicitação."
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function excluirSolicitacao() {
    if (!demandaEmEdicao) {
      return;
    }

    if (!window.confirm(`Deseja excluir a solicitação ${demandaEmEdicao.solicitacao}?`)) {
      return;
    }

    try {
      setSalvandoEdicao(true);
      const resposta = await authFetch(`${API_BASE_URL}/escritorio/solicitacoes/${demandaEmEdicao.id}`, {
        method: "DELETE",
      });
      const dados = (await resposta.json()) as { erro?: string };

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível excluir a solicitação.");
      }

      setDemandasBase((atual) => atual.filter((item) => item.id !== demandaEmEdicao.id));
      fecharEdicao();
    } catch (error) {
      console.error("Erro ao excluir solicitação:", error);
      window.alert(
        error instanceof Error ? error.message : "Erro ao excluir a solicitação."
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function adicionarAnexos(files: FileList | null) {
    if (!demandaEmEdicao || !files || files.length === 0) {
      return;
    }

    try {
      setSalvandoEdicao(true);
      const anexosPayload = await Promise.all(
        Array.from(files).map(
          (file) =>
            new Promise<{ nome: string; tipo: string; conteudoBase64: string }>((resolve, reject) => {
              const leitor = new FileReader();
              leitor.onload = () => {
                resolve({
                  nome: file.name,
                  tipo: file.type || "application/octet-stream",
                  conteudoBase64: String(leitor.result || ""),
                });
              };
              leitor.onerror = () => reject(new Error(`Erro ao ler o arquivo ${file.name}`));
              leitor.readAsDataURL(file);
            })
        )
      );

      const resposta = await authFetch(
        `${API_BASE_URL}/escritorio/solicitacoes/${demandaEmEdicao.id}/anexos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ anexos: anexosPayload }),
        }
      );

      const dados = (await resposta.json()) as {
        erro?: string;
        anexos?: AnexoSolicitacao[];
      };

      if (!resposta.ok || !dados.anexos) {
        throw new Error(dados.erro || "Não foi possível adicionar anexos.");
      }

      setAnexos(dados.anexos);
    } catch (error) {
      console.error("Erro ao adicionar anexos:", error);
      window.alert(error instanceof Error ? error.message : "Erro ao adicionar anexos.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function excluirAnexo(anexoId: string) {
    if (!demandaEmEdicao) {
      return;
    }

    if (!window.confirm("Deseja excluir este anexo?")) {
      return;
    }

    try {
      setSalvandoEdicao(true);
      const resposta = await authFetch(
        `${API_BASE_URL}/escritorio/solicitacoes/${demandaEmEdicao.id}/anexos/${anexoId}`,
        {
          method: "DELETE",
        }
      );
      const dados = (await resposta.json()) as {
        erro?: string;
        anexos?: AnexoSolicitacao[];
      };

      if (!resposta.ok || !dados.anexos) {
        throw new Error(dados.erro || "Não foi possível excluir o anexo.");
      }

      setAnexos(dados.anexos);
    } catch (error) {
      console.error("Erro ao excluir anexo:", error);
      window.alert(error instanceof Error ? error.message : "Erro ao excluir anexo.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    void buscarDadosEscritorio()
      .then((dados) => {
        if (!ativo) {
          return;
        }

        setDemandasBase(dados.demandas);
        setEquipes(dados.equipes);
        setDashboard(dados.dashboard);
        setErro("");
      })
      .catch((error) => {
        console.error("Erro ao carregar dados do escritorio:", error);

        if (!ativo) {
          return;
        }

        setErro("Erro ao carregar dados da API.");
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

  const demandas = useMemo(() => {
    const termoBusca = busca.trim().toLowerCase();

    return demandasBase
      .filter((demanda) => {
        const filtroStatus =
          statusFiltro.length === 0 || statusFiltro.includes(demanda.status as OpcaoStatusFiltro);
        const filtroTipo = tipoFiltro === "Todos" || demanda.prioridade === tipoFiltro;
        const filtroEquipe = equipeFiltro === "Todas" || demanda.equipe === equipeFiltro;
        const filtroBusca =
          termoBusca.length === 0 ||
          demanda.solicitacao.toLowerCase().includes(termoBusca) ||
          demanda.cliente.toLowerCase().includes(termoBusca);

        return filtroStatus && filtroTipo && filtroEquipe && filtroBusca;
      })
      .sort((a, b) => {
        const prazoA = diferencaDiasPrazo(a.prazo);
        const prazoB = diferencaDiasPrazo(b.prazo);

        if (prazoA === null && prazoB === null) {
          return a.solicitacao.localeCompare(b.solicitacao);
        }

        if (prazoA === null) {
          return 1;
        }

        if (prazoB === null) {
          return -1;
        }

        if (prazoA !== prazoB) {
          return prazoA - prazoB;
        }

        return a.solicitacao.localeCompare(b.solicitacao);
      });
  }, [busca, demandasBase, equipeFiltro, statusFiltro, tipoFiltro]);

  const centroMapa = useMemo<[number, number]>(() => {
    const equipesComLocalizacao = equipes.filter(
      (equipe) => equipe.latitude !== null && equipe.longitude !== null
    );

    if (equipesComLocalizacao.length > 0) {
      return [
        equipesComLocalizacao[0].latitude as number,
        equipesComLocalizacao[0].longitude as number,
      ];
    }

    if (demandasBase.length > 0) {
      return [demandasBase[0].latitude, demandasBase[0].longitude];
    }

    return CENTRO_PADRAO;
  }, [demandasBase, equipes]);

  const demandasAtivasPorEquipe = useMemo(() => {
    const contagem = new Map<string, number>();

    demandasBase.forEach((demanda) => {
      if (!["Andamento", "Devolvida"].includes(demanda.status)) {
        return;
      }

      const chaveEquipe = demanda.id_equipe
        ? String(demanda.id_equipe)
        : demanda.equipe || "Sem equipe";

      contagem.set(chaveEquipe, (contagem.get(chaveEquipe) || 0) + 1);
    });

    return contagem;
  }, [demandasBase]);

  const centroLevantamento = useMemo<[number, number]>(() => {
    if (pontosLevantamento.length === 0) {
      return CENTRO_PADRAO;
    }

    const primeiroPonto = pontosLevantamento[0];
    return [Number(primeiroPonto.latitude), Number(primeiroPonto.longitude)];
  }, [pontosLevantamento]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dff2fb_0%,_#f7fafc_42%,_#eef4f8_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br from-[#06263f] via-[#0a4d73] to-[#78b7c8] px-6 py-6 text-white shadow-[0_24px_80px_rgba(7,34,56,0.25)]">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-14 left-1/3 h-36 w-36 rounded-full bg-cyan-200/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase text-cyan-100">
                <Wifi size={14} />
                Centro operacional
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Escritorio FieldPro
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-cyan-50/90 sm:text-base">
                Panorama das equipes, demandas em campo e pontos de atencao em um
                painel unico, mais limpo e mais facil de operar.
              </p>

              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <HeroChip label={`${dashboard.andamento} em execucao`} />
                <HeroChip label={`${dashboard.emergenciais} emergenciais`} />
                <HeroChip label={`${equipes.length} equipes mapeadas`} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={irParaProducao}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/16"
              >
                <Route size={17} />
                Producao e rotas
              </button>

              <button
                onClick={abrirSolicitacao}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#083e5f] shadow-lg transition hover:bg-cyan-50"
              >
                <Plus size={17} />
                Abrir solicitacao
              </button>

              <button
                onClick={abrirSolicitacaoLote}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/16"
              >
                <FileText size={17} />
                Criar em lote
              </button>

              {usuario?.perfil === "admin" && irParaAdmin && (
                <button
                  onClick={irParaAdmin}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/16"
                >
                  <Crown size={16} />
                  Admin
                </button>
              )}

              <button
                onClick={sair}
                className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            titulo="Demandas em andamento"
            valor={String(dashboard.andamento)}
            tag="ativas"
            cor="sky"
            icone={<Wrench size={18} />}
          />
          <Card
            titulo="Demandas fora do prazo"
            valor={String(dashboard.foraPrazo)}
            tag="atencao"
            cor="rose"
            icone={<AlertTriangle size={18} />}
          />
          <Card
            titulo="Emergenciais"
            valor={String(dashboard.emergenciais)}
            tag="prioridade"
            cor="amber"
            icone={<ShieldAlert size={18} />}
          />
          <Card
            titulo="Equipes online"
            valor={`${dashboard.equipesOnline}/${equipes.length}`}
            tag="GPS ligado"
            cor="emerald"
            icone={<Wifi size={18} />}
          />
        </section>

        <section className="relative z-20 rounded-[28px] border border-slate-200/70 bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Filtros inteligentes</h2>
              <p className="text-sm text-slate-500">
                Refine o mapa e a listagem com status, tipo, equipe e busca rapida.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
              {demandas.length} demanda(s) visivel(is)
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="relative z-30">
              <button
                type="button"
                onClick={() => setStatusFiltroAberto((atual) => !atual)}
                className="input flex w-full items-center justify-between bg-slate-50 text-left"
              >
                <span className="truncate">
                  {statusFiltro.length === 0 ? "Todos os status" : statusFiltro.join(", ")}
                </span>
                <span className="text-slate-400">{statusFiltroAberto ? "▲" : "▼"}</span>
              </button>

              {statusFiltroAberto ? (
                <div className="absolute left-0 right-0 z-[120] mt-2 rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
                  <button
                    type="button"
                    onClick={() => setStatusFiltro([])}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span>Todos os status</span>
                    {statusFiltro.length === 0 ? <Check size={15} className="text-sky-600" /> : null}
                  </button>

                  {STATUS_FILTRO_OPCOES.map((status) => (
                    <label
                      key={status}
                      className="flex cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>{status}</span>
                      <input
                        type="checkbox"
                        checked={statusFiltro.includes(status)}
                        onChange={() => alternarStatusFiltro(status)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <select className="input bg-slate-50" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
              <option value="Todos">Todos os tipos</option>
              <option value="Normal">Normal</option>
              <option value="Emergencial">Emergencial</option>
            </select>

            <select className="input bg-slate-50" value={equipeFiltro} onChange={(e) => setEquipeFiltro(e.target.value)}>
              <option value="Todas">Todas as equipes</option>
              {equipes.map((equipe) => (
                <option key={equipe.id} value={equipe.nome}>
                  {equipe.nome}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                className="input w-full bg-slate-50 pl-10"
                placeholder="Buscar solicitacao ou cliente"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.9fr]">
          <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 border-b border-slate-200/70 bg-[linear-gradient(135deg,#f8fbfd_0%,#edf6fa_100%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Mapa operacional</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Equipes posicionadas, demandas abertas e prioridade visual por pin.
                </p>
              </div>

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                Dados da API sincronizados
              </span>
            </div>

            <div className="h-[470px] bg-slate-100">
              <MapContainer
                center={centroMapa}
                zoom={13}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution={SATELITE_ATTRIBUTION}
                  url={SATELITE_TILE_URL}
                />

                {equipes.map((equipe) => (
                  equipe.possuiLocalizacao ? (
                    <Marker
                      key={equipe.id}
                      position={[equipe.latitude as number, equipe.longitude as number]}
                      icon={equipe.online ? iconeEquipeOnline : iconeEquipeOffline}
                    >
                      <Popup>
                        <strong>{equipe.nome}</strong>
                        <br />
                        {equipe.status}
                        <br />
                        Veiculo: {equipe.veiculo}
                        <br />
                        Placa: {equipe.placa}
                      </Popup>
                    </Marker>
                  ) : null
                ))}

                {demandas.map((demanda) => (
                  <Marker
                    key={demanda.id}
                    position={[demanda.latitude, demanda.longitude]}
                    icon={obterIconeDemanda(demanda)}
                  >
                    <Popup>
                      <strong>{demanda.solicitacao}</strong>
                      <br />
                      Cliente: {demanda.cliente}
                      <br />
                      Municipio: {demanda.municipio}
                      <br />
                      Equipe: {demanda.equipe}
                      <br />
                      Prioridade: {demanda.prioridade}
                      <br />
                      Status: {demanda.status}
                      <br />
                      Prazo: {descreverPrazo(demanda.prazo)}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200/70 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Leitura rapida</h2>
                <p className="text-sm text-slate-500">Resumo visual das equipes no campo.</p>
              </div>
            </div>

            <div className="space-y-3">
              {equipes.slice(0, 6).map((equipe) => (
                (() => {
                  const demandasAtivas =
                    demandasAtivasPorEquipe.get(String(equipe.id)) || 0;

                  return (
                <div
                  key={equipe.id}
                  className={`rounded-2xl border p-4 ${
                    demandasAtivas === 0
                      ? "border-rose-200 bg-rose-50/80"
                      : "border-slate-200 bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-bold text-slate-900">{equipe.nome}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        Veiculo: {equipe.veiculo}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">Placa: {equipe.placa}</div>
                      <div
                        className={`mt-1 text-sm font-semibold ${
                          demandasAtivas === 0 ? "text-rose-700" : "text-slate-700"
                        }`}
                      >
                        {demandasAtivas} demanda(s) em andamento/devolvido
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {equipe.possuiLocalizacao
                          ? "Coordenada disponivel"
                          : "Sem localizacao registrada"}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        equipe.online
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {equipe.online ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
                  );
                })()
              ))}

              {equipes.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Nenhuma equipe encontrada.
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="rounded-[30px] border border-slate-200/70 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Todas as demandas</h2>
              <p className="text-sm text-slate-500">
                Lista operacional com status, prioridade e equipe responsavel.
              </p>
            </div>

            <button
              onClick={() => void carregarDados()}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold shadow-sm transition hover:border-sky-300 hover:text-sky-700"
            >
              Atualizar
            </button>
          </div>

          {carregando ? (
            <p className="py-12 text-center text-slate-500">Carregando dados da API...</p>
          ) : erro ? (
            <div className="py-12 text-center font-medium text-red-600">{erro}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-2 py-4">Solicitacao</th>
                    <th className="px-2 py-4">Cliente</th>
                    <th className="px-2 py-4">Municipio</th>
                    <th className="px-2 py-4">Equipe</th>
                    <th className="px-2 py-4">Status</th>
                    <th className="px-2 py-4">Prioridade</th>
                    <th className="px-2 py-4">Prazo</th>
                    <th className="px-2 py-4">Acoes</th>
                  </tr>
                </thead>

                <tbody>
                  {demandas.map((demanda) => (
                    <tr
                      key={demanda.id}
                      className="border-b border-slate-100 text-left transition hover:bg-sky-50/50"
                    >
                      <td className="px-2 py-4">
                        <div className="font-bold text-slate-900">{demanda.solicitacao}</div>
                        <div className="mt-1 text-xs text-slate-500">ID #{demanda.id}</div>
                      </td>
                      <td className="px-2 py-4 text-slate-600">{demanda.cliente}</td>
                      <td className="px-2 py-4 text-slate-600">{demanda.municipio}</td>
                      <td className="px-2 py-4 text-slate-600">{demanda.equipe}</td>
                      <td className="px-2 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasse(
                            demanda.status,
                            demanda.prioridade
                          )}`}
                        >
                          {demanda.status}
                        </span>
                      </td>
                      <td className="px-2 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            demanda.prioridade === "Emergencial"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {demanda.prioridade}
                        </span>
                      </td>
                      <td className="px-2 py-4 font-medium text-slate-700">
                        <div>{formatarPrazo(demanda.prazo)}</div>
                        <div className="mt-1">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${prazoBadgeClasse(
                              demanda.prazo
                            )}`}
                          >
                            {descreverPrazo(demanda.prazo)}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => abrirEdicao(demanda)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                          >
                            <Pencil size={13} />
                            Editar
                          </button>
                          <button
                            onClick={() => void abrirLevantamento(demanda)}
                            disabled={demanda.total_pontos === 0}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <Images size={13} />
                            Ver levantamento
                          </button>
                          {demanda.status === "Concluida" ? (
                            <>
                            <button
                              onClick={() => void atualizarStatusDemanda(demanda, "Finalizada")}
                              disabled={acaoEmAndamentoId === demanda.id}
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Finalizar
                            </button>
                            <button
                              onClick={() => void atualizarStatusDemanda(demanda, "Devolvida")}
                              disabled={acaoEmAndamentoId === demanda.id}
                              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Devolver
                            </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {demandas.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <AlertTriangle className="mx-auto mb-2" />
                  Nenhuma demanda encontrada.
                </div>
              )}
            </div>
          )}
        </section>

        {demandaEmEdicao && formulario && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="relative z-[10000] max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[30px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Editar solicitação</h3>
                  <p className="text-sm text-slate-500">
                    Atualize dados, status, equipe, anexos e exclusão da demanda.
                  </p>
                </div>

                <button
                  onClick={fecharEdicao}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Campo
                      label="Solicitação"
                      value={formulario.solicitacao}
                      onChange={(value) => atualizarCampoFormulario("solicitacao", value)}
                    />
                    <Campo
                      label="Cliente"
                      value={formulario.cliente}
                      onChange={(value) => atualizarCampoFormulario("cliente", value)}
                    />
                    <label className="space-y-2 text-sm font-semibold text-slate-600">
                      <span>Regional</span>
                      <select
                        className="input bg-slate-50"
                        value={formulario.regional}
                        onChange={(e) => atualizarCampoFormulario("regional", e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {REGIONAIS_OPCOES.map((regional) => (
                          <option key={regional} value={regional}>
                            {regional}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 text-sm font-semibold text-slate-600">
                      <span>Município</span>
                      <input
                        list="municipios-piaui-edicao"
                        className="input bg-slate-50"
                        value={formulario.municipio}
                        onChange={(e) => atualizarCampoFormulario("municipio", e.target.value)}
                      />
                      <datalist id="municipios-piaui-edicao">
                        {MUNICIPIOS_PIAUI.map((municipio) => (
                          <option key={municipio} value={municipio} />
                        ))}
                      </datalist>
                    </label>
                    <Campo
                      label="Telefone"
                      value={formulario.telefone}
                      onChange={(value) => atualizarCampoFormulario("telefone", value)}
                    />
                    <Campo
                      label="Prazo"
                      type="date"
                      value={formulario.prazo}
                      onChange={(value) => atualizarCampoFormulario("prazo", value)}
                    />
                    <label className="space-y-2 text-sm font-semibold text-slate-600">
                      <span>Status</span>
                      <select
                        className="input bg-slate-50"
                        value={formulario.status}
                        onChange={(e) =>
                          atualizarCampoFormulario("status", e.target.value as StatusDemanda)
                        }
                      >
                        <option value="Andamento">Andamento</option>
                        <option value="Concluida">Concluida</option>
                        <option value="Devolvida">Devolvida</option>
                        <option value="Finalizada">Finalizada</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-sm font-semibold text-slate-600">
                      <span>Prioridade</span>
                      <select
                        className="input bg-slate-50"
                        value={formulario.prioridade}
                        onChange={(e) =>
                          atualizarCampoFormulario(
                            "prioridade",
                            e.target.value as PrioridadeDemanda
                          )
                        }
                      >
                        <option value="Normal">Normal</option>
                        <option value="Emergencial">Emergencial</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-sm font-semibold text-slate-600">
                      <span>Equipe</span>
                      <select
                        className="input bg-slate-50"
                        value={formulario.id_equipe}
                        onChange={(e) => atualizarCampoFormulario("id_equipe", e.target.value)}
                      >
                        <option value="">Sem equipe</option>
                        {equipes.map((equipe) => (
                          <option key={equipe.id} value={equipe.id}>
                            {equipe.nome}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Campo
                      label="Latitude"
                      value={formulario.latitude}
                      onChange={(value) => atualizarCampoFormulario("latitude", value)}
                    />
                    <Campo
                      label="Longitude"
                      value={formulario.longitude}
                      onChange={(value) => atualizarCampoFormulario("longitude", value)}
                    />
                  </div>

                  <label className="block space-y-2 text-sm font-semibold text-slate-600">
                    <span>Detalhes</span>
                    <textarea
                      className="min-h-[130px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      value={formulario.detalhes}
                      onChange={(e) => atualizarCampoFormulario("detalhes", e.target.value)}
                    />
                  </label>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-bold text-slate-900">Anexos</div>
                        <div className="text-sm text-slate-500">
                          Adicione ou exclua arquivos ligados à solicitação.
                        </div>
                      </div>

                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700">
                        <FileText size={14} />
                        Adicionar
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            void adicionarAnexos(e.target.files);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>

                    {carregandoAnexos ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
                        Carregando anexos...
                      </div>
                    ) : anexos.length > 0 ? (
                      <div className="space-y-3">
                        {anexos.map((anexo) => (
                          <div
                            key={anexo.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                          >
                            <div className="min-w-0">
                              <a
                                href={authUrl(anexo.caminho_arquivo)}
                                target="_blank"
                                rel="noreferrer"
                                className="block truncate font-semibold text-slate-800 hover:text-sky-700"
                              >
                                {anexo.nome}
                              </a>
                              <div className="text-xs text-slate-500">
                                {new Date(anexo.criado_em).toLocaleString("pt-BR")}
                              </div>
                            </div>

                            <button
                              onClick={() => void excluirAnexo(anexo.id)}
                              className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
                        Nenhum anexo disponível.
                      </div>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4">
                    <div className="text-base font-bold text-rose-800">Excluir solicitação</div>
                    <p className="mt-1 text-sm text-rose-700">
                      Essa ação remove a solicitação e também apaga anexos e levantamentos vinculados.
                    </p>

                    <button
                      onClick={() => void excluirSolicitacao()}
                      disabled={salvandoEdicao}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={15} />
                      Excluir solicitação
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  onClick={fecharEdicao}
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  Fechar
                </button>
                <button
                  onClick={() => void salvarEdicao()}
                  disabled={salvandoEdicao}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        )}

        {demandaLevantamento && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="relative z-[10000] max-h-[92vh] w-full max-w-6xl overflow-auto rounded-[30px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Levantamento da equipe</h3>
                  <p className="text-sm text-slate-500">
                    {demandaLevantamento.solicitacao} • {demandaLevantamento.total_pontos} ponto(s) coletado(s)
                  </p>
                </div>

                <button
                  onClick={fecharLevantamento}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-6">
                {carregandoLevantamento ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    Carregando levantamento...
                  </div>
                ) : pontosLevantamento.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    Nenhum levantamento disponível.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <div className="text-base font-bold text-slate-900">Mapa do levantamento</div>
                        <div className="text-sm text-slate-500">
                          Visualização espacial dos pontos coletados pela equipe.
                        </div>
                      </div>

                      <div className="h-[360px] bg-slate-100">
                        <MapContainer
                          center={centroLevantamento}
                          zoom={16}
                          scrollWheelZoom
                          style={{ height: "100%", width: "100%" }}
                        >
                          <TileLayer attribution={SATELITE_ATTRIBUTION} url={SATELITE_TILE_URL} />

                          {pontosLevantamento.map((ponto) => (
                            <Marker
                              key={`mapa-ponto-${ponto.id}`}
                              position={[Number(ponto.latitude), Number(ponto.longitude)]}
                              icon={iconePontoLevantamento}
                            >
                              <Popup>
                                <strong>Ponto {ponto.ordem_ponto || ponto.id}</strong>
                                <br />
                                {ponto.fotos.length} foto(s)
                                <br />
                                {new Date(ponto.data_coleta).toLocaleString("pt-BR")}
                              </Popup>
                            </Marker>
                          ))}
                        </MapContainer>
                      </div>
                    </div>

                    {pontosLevantamento.map((ponto) => (
                      <div
                        key={ponto.id}
                        className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-5 shadow-sm"
                      >
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                              <Camera size={13} />
                              Ponto {ponto.ordem_ponto || ponto.id}
                            </div>
                            <div className="mt-3 text-sm text-slate-600">
                              <strong className="text-slate-900">Coletado em:</strong>{" "}
                              {new Date(ponto.data_coleta).toLocaleString("pt-BR")}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              <strong className="text-slate-900">Latitude:</strong> {ponto.latitude}{" "}
                              • <strong className="text-slate-900">Longitude:</strong> {ponto.longitude}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              <strong className="text-slate-900">Observação:</strong>{" "}
                              {ponto.observacao || "Sem observação"}
                            </div>
                          </div>

                          <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                            {ponto.fotos.length} foto(s)
                          </div>
                        </div>

                        {ponto.fotos.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {ponto.fotos.map((foto) => (
                              <a
                                key={foto.id}
                                href={authUrl(foto.caminho_arquivo)}
                                target="_blank"
                                rel="noreferrer"
                                className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                              >
                                <img
                                  src={authUrl(foto.caminho_arquivo)}
                                  alt={foto.nome_arquivo}
                                  className="h-44 w-full object-cover"
                                />
                                <div className="p-3">
                                  <div className="truncate text-sm font-semibold text-slate-800">
                                    {foto.nome_arquivo}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {new Date(foto.data_foto).toLocaleString("pt-BR")}
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
                            Este ponto não possui fotos.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {abrindoSolicitacao && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="relative z-[10000] max-h-[92vh] w-full max-w-4xl overflow-auto rounded-[30px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Abrir solicitação</h3>
                  <p className="text-sm text-slate-500">
                    Cadastre uma nova nota para a equipe de campo.
                  </p>
                </div>

                <button
                  onClick={fecharSolicitacao}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-600">
                  <span>Solicitação</span>
                  <input
                    type="text"
                    className={`input ${
                      nomeSolicitacaoDuplicado
                        ? "border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-500 focus:ring-rose-100"
                        : "bg-slate-50"
                    }`}
                    value={novaSolicitacao.solicitacao}
                    onChange={(value) => atualizarNovaSolicitacao("solicitacao", value.target.value)}
                  />
                  {nomeSolicitacaoDuplicado ? (
                    <span className="block text-xs font-semibold text-rose-600">
                      Nome utilizado.
                    </span>
                  ) : null}
                </label>
                <Campo
                  label="Cliente"
                  value={novaSolicitacao.nome}
                  onChange={(value) => atualizarNovaSolicitacao("nome", value)}
                />
                <label className="space-y-2 text-sm font-semibold text-slate-600">
                  <span>Regional</span>
                  <select
                    className="input bg-slate-50"
                    value={novaSolicitacao.regional}
                    onChange={(e) => atualizarNovaSolicitacao("regional", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {REGIONAIS_OPCOES.map((regional) => (
                      <option key={regional} value={regional}>
                        {regional}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-600">
                  <span>Município</span>
                  <input
                    list="municipios-piaui-novo"
                    className="input bg-slate-50"
                    value={novaSolicitacao.municipio}
                    onChange={(e) => atualizarNovaSolicitacao("municipio", e.target.value)}
                  />
                  <datalist id="municipios-piaui-novo">
                    {MUNICIPIOS_PIAUI.map((municipio) => (
                      <option key={municipio} value={municipio} />
                    ))}
                  </datalist>
                </label>
                <Campo
                  label="Telefone"
                  value={novaSolicitacao.telefone}
                  onChange={(value) => atualizarNovaSolicitacao("telefone", value)}
                />
                <Campo
                  label="Prazo"
                  type="date"
                  value={novaSolicitacao.prazo}
                  onChange={(value) => atualizarNovaSolicitacao("prazo", value)}
                />
                <label className="space-y-2 text-sm font-semibold text-slate-600">
                  <span>Prioridade</span>
                  <select
                    className="input bg-slate-50"
                    value={novaSolicitacao.prioridade}
                    onChange={(e) =>
                      atualizarNovaSolicitacao(
                        "prioridade",
                        e.target.value as PrioridadeDemanda
                      )
                    }
                  >
                    <option value="Normal">Normal</option>
                    <option value="Emergencial">Emergencial</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-600">
                  <span>Equipe</span>
                  <select
                    className="input bg-slate-50"
                    value={novaSolicitacao.id_equipe}
                    onChange={(e) => atualizarNovaSolicitacao("id_equipe", e.target.value)}
                  >
                    <option value="">Sem equipe</option>
                    {equipes.map((equipe) => (
                      <option key={equipe.id} value={equipe.id}>
                        {equipe.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <Campo
                  label="Latitude"
                  value={novaSolicitacao.latitude}
                  onChange={(value) => atualizarNovaSolicitacao("latitude", value)}
                />
                <Campo
                  label="Longitude"
                  value={novaSolicitacao.longitude}
                  onChange={(value) => atualizarNovaSolicitacao("longitude", value)}
                />
                <label className="space-y-2 text-sm font-semibold text-slate-600 md:col-span-2">
                  <span>Detalhes</span>
                  <textarea
                    className="min-h-[130px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    value={novaSolicitacao.detalhes}
                    onChange={(e) => atualizarNovaSolicitacao("detalhes", e.target.value)}
                  />
                </label>
                <div className="space-y-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FileText size={16} />
                    <span>Anexos da solicitação</span>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                      Carregar PDF ou foto
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          adicionarArquivosNaNovaSolicitacao(Array.from(e.target.files ?? []));
                          e.target.value = "";
                        }}
                      />
                    </label>

                    <div
                      onPaste={colarImagemNaNovaSolicitacao}
                      className="rounded-[22px] border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 outline-none transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100"
                      tabIndex={0}
                    >
                      Cole uma foto aqui com <span className="font-semibold text-slate-700">Ctrl+V</span>
                    </div>
                  </div>

                  {novosAnexosSolicitacao.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {novosAnexosSolicitacao.map((anexo, indice) => (
                        <div
                          key={`${anexo.arquivo.name}-${anexo.arquivo.size}-${indice}`}
                          className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white p-3"
                        >
                          {anexo.previewUrl ? (
                            <img
                              src={anexo.previewUrl}
                              alt={anexo.arquivo.name}
                              className="h-14 w-14 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                              <FileText size={20} />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-800">
                              {anexo.arquivo.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {anexo.origem === "colar" ? "Foto colada" : "Arquivo selecionado"}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removerNovoAnexoSolicitacao(indice)}
                            className="rounded-full border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                      Você pode carregar PDF, selecionar foto do computador ou colar uma imagem direto.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  onClick={fecharSolicitacao}
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void salvarNovaSolicitacaoComAnexos()}
                  disabled={salvandoEdicao || nomeSolicitacaoDuplicado}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvandoEdicao ? "Salvando..." : "Criar solicitação"}
                </button>
              </div>
            </div>
          </div>
        )}

        {abrindoSolicitacaoLote && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="relative z-[10000] max-h-[92vh] w-full max-w-4xl overflow-auto rounded-[30px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Criar notas em lote</h3>
                  <p className="text-sm text-slate-500">
                    Importe uma planilha CSV exportada do Excel ou Google Sheets.
                  </p>
                </div>

                <button
                  onClick={fecharSolicitacaoLote}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5 px-6 py-6">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="font-semibold text-slate-800">Cabeçalho esperado</div>
                  <div className="mt-2 break-all font-mono text-xs text-slate-500">
                    solicitacao,nome,regional,municipio,prazo,equipe,telefone,latitude,longitude,prioridade,detalhes
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    `equipe` pode ser o número da equipe ou o nome cadastrado. `prioridade` aceita
                    `Normal` ou `Emergencial`.
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                    Carregar CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        void carregarPlanilhaLote(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <span className="text-sm text-slate-500">
                    Você também pode colar o conteúdo da planilha abaixo.
                  </span>
                </div>

                <label className="block space-y-2 text-sm font-semibold text-slate-600">
                  <span>Conteúdo da planilha</span>
                  <textarea
                    className="min-h-[260px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    value={planilhaLoteTexto}
                    onChange={(e) => setPlanilhaLoteTexto(e.target.value)}
                    placeholder="Cole aqui a planilha CSV..."
                  />
                </label>

                {resultadoImportacaoLote ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-sm font-bold text-emerald-800">
                        {resultadoImportacaoLote.totalImportadas} importada(s)
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-emerald-900">
                        {resultadoImportacaoLote.importadas.map((item) => (
                          <div key={`${item.linha}-${item.solicitacao}`}>
                            Linha {item.linha}: {item.solicitacao}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                      <div className="text-sm font-bold text-amber-800">
                        {resultadoImportacaoLote.totalIgnoradas} ignorada(s)
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-amber-900">
                        {resultadoImportacaoLote.ignoradas.length > 0 ? (
                          resultadoImportacaoLote.ignoradas.map((item) => (
                            <div key={`${item.linha}-${item.solicitacao}-${item.motivo}`}>
                              Linha {item.linha}: {item.solicitacao || "sem nome"} - {item.motivo}
                            </div>
                          ))
                        ) : (
                          <div>Nenhuma linha ignorada.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  onClick={fecharSolicitacaoLote}
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  Fechar
                </button>
                <button
                  onClick={() => void importarSolicitacoesEmLote()}
                  disabled={importandoLote}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importandoLote ? "Importando..." : "Importar planilha"}
                </button>
              </div>
            </div>
          </div>
        )}
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
      <input
        type={type}
        className="input bg-slate-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function HeroChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
      {label}
    </span>
  );
}

function Card({
  titulo,
  valor,
  tag,
  cor,
  icone,
}: {
  titulo: string;
  valor: string;
  tag: string;
  cor: "sky" | "rose" | "amber" | "emerald";
  icone: ReactNode;
}) {
  const estilos = {
    sky: {
      fundo: "from-sky-500 to-cyan-400",
      suave: "bg-sky-50",
      texto: "text-sky-700",
      pill: "bg-sky-100 text-sky-700",
    },
    rose: {
      fundo: "from-rose-500 to-pink-400",
      suave: "bg-rose-50",
      texto: "text-rose-700",
      pill: "bg-rose-100 text-rose-700",
    },
    amber: {
      fundo: "from-amber-500 to-orange-400",
      suave: "bg-amber-50",
      texto: "text-amber-700",
      pill: "bg-amber-100 text-amber-700",
    },
    emerald: {
      fundo: "from-emerald-500 to-teal-400",
      suave: "bg-emerald-50",
      texto: "text-emerald-700",
      pill: "bg-emerald-100 text-emerald-700",
    },
  }[cor];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-slate-100/70 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <div className="mt-3 text-4xl font-black tracking-tight text-slate-900">{valor}</div>
        </div>

        <div className={`rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg ${estilos.fundo}`}>
          {icone}
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${estilos.pill}`}>{tag}</span>
        <span className={`text-xs font-semibold ${estilos.texto}`}>Atualizado agora</span>
      </div>
    </div>
  );
}
