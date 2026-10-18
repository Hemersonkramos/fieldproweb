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
  MapPin,
  Menu,
  Home,
  Map as MapIcon,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, ScaleControl, useMap } from "react-leaflet";
import "./Escritorio.css";
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
type OpcaoTipoFiltro = PrioridadeDemanda;

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
  online?: boolean | number | string | null;
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
const TIPO_FILTRO_OPCOES: OpcaoTipoFiltro[] = ["Normal", "Emergencial"];

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

const iconePontoLevantamento = (ordem: number) => L.divIcon({
  className: "fieldpro-point-pin",
  html: `<span class="fieldpro-point-pin__inner"></span><span class="fieldpro-point-pin__label">P.${Number(ordem)}</span>`,
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

  const data = parsePrazoLocal(prazo);

  if (!data) {
    return prazo;
  }

  return data.toLocaleDateString("pt-BR");
}

function parsePrazoLocal(prazo: string) {
  const [ano, mes, dia] = prazo.slice(0, 10).split("-").map(Number);

  if (!ano || !mes || !dia) {
    const data = new Date(prazo);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  return new Date(ano, mes - 1, dia);
}

function diferencaDiasPrazo(prazo: string) {
  if (!prazo) {
    return null;
  }

  const hoje = new Date();
  const dataPrazo = parsePrazoLocal(prazo);

  if (!dataPrazo) {
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
    const online = equipe.online === true || equipe.online === 1 || equipe.online === "1";
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
  const [tipoFiltro, setTipoFiltro] = useState<OpcaoTipoFiltro[]>([]);
  const [tipoFiltroAberto, setTipoFiltroAberto] = useState(false);
  const [equipeFiltro, setEquipeFiltro] = useState<string[]>([]);
  const [equipeFiltroAberto, setEquipeFiltroAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [municipioFiltro, setMunicipioFiltro] = useState("");
  const [buscaEquipe, setBuscaEquipe] = useState("");
  const [abaEquipe, setAbaEquipe] = useState<"todas" | "online" | "offline">("todas");
  const [menuRecolhido, setMenuRecolhido] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  const [secaoAtiva, setSecaoAtiva] = useState("visao-geral");
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

  function alternarTipoFiltro(tipo: OpcaoTipoFiltro) {
    setTipoFiltro((atual) =>
      atual.includes(tipo) ? atual.filter((item) => item !== tipo) : [...atual, tipo]
    );
  }

  function alternarEquipeFiltro(equipe: string) {
    setEquipeFiltro((atual) =>
      atual.includes(equipe)
        ? atual.filter((item) => item !== equipe)
        : [...atual, equipe]
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
      fecharEdicao();
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

    const carregarPainel = (mostrarCarregando: boolean) => {
      if (mostrarCarregando) {
        setCarregando(true);
      }

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
          if (ativo && mostrarCarregando) {
            setCarregando(false);
          }
        });
    };

    carregarPainel(true);

    const intervalo = window.setInterval(() => carregarPainel(false), 60 * 1000);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, []);

  const demandas = useMemo(() => {
    const termoBusca = busca.trim().toLowerCase();

    return demandasBase
      .filter((demanda) => {
        const filtroStatus =
          statusFiltro.length === 0 || statusFiltro.includes(demanda.status as OpcaoStatusFiltro);
        const filtroTipo =
          tipoFiltro.length === 0 || tipoFiltro.includes(demanda.prioridade);
        const filtroEquipe =
          equipeFiltro.length === 0 ||
          (demanda.equipe !== null && equipeFiltro.includes(demanda.equipe));
        const filtroBusca =
          termoBusca.length === 0 ||
          demanda.solicitacao.toLowerCase().includes(termoBusca) ||
          demanda.cliente.toLowerCase().includes(termoBusca);

        return filtroStatus && filtroTipo && filtroEquipe && filtroBusca &&
          (!municipioFiltro || demanda.municipio === municipioFiltro);
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
  }, [busca, demandasBase, equipeFiltro, statusFiltro, tipoFiltro, municipioFiltro]);

  const municipios = [...new Set(demandasBase.map((demanda) => demanda.municipio).filter(Boolean))].sort();
  const equipesVisiveis = equipes.filter((equipe) => {
    const correspondeAba = abaEquipe === "todas" || (abaEquipe === "online" ? equipe.online : !equipe.online);
    const termo = buscaEquipe.trim().toLocaleLowerCase("pt-BR");
    return correspondeAba && `${equipe.nome} ${equipe.veiculo} ${equipe.placa}`.toLocaleLowerCase("pt-BR").includes(termo);
  });

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
    <div className={`fp-dashboard ${menuRecolhido ? "fp-sidebar-collapsed" : ""}`} id="visao-geral">
      <aside className="fp-sidebar">
        <div className="fp-sidebar-brand"><MapPin size={29} fill="#1c8cf0" strokeWidth={1.6} /><span>Field<b>Pro</b></span><button onClick={() => setMenuRecolhido(!menuRecolhido)} aria-label={menuRecolhido ? "Expandir menu" : "Recolher menu"} aria-expanded={!menuRecolhido}><Menu size={20} /></button></div>
        <nav aria-label="Navegação principal">
          {[{ id: "visao-geral", label: "Visão geral", icon: <Home size={21} /> }, { id: "solicitacoes", label: "Solicitações", icon: <FileText size={21} /> }, { id: "mapa", label: "Mapa", icon: <MapIcon size={21} /> }, { id: "equipes", label: "Equipes", icon: <Users size={21} /> }].map((item) => (
            <a key={item.id} href={`#${item.id}`} title={item.label} className={secaoAtiva === item.id ? "is-active" : ""} aria-current={secaoAtiva === item.id ? "location" : undefined} onClick={() => setSecaoAtiva(item.id)}>{item.icon}<span>{item.label}</span></a>
          ))}
          <button onClick={irParaProducao} title="Produção e rotas"><Route size={21} /><span>Produção e rotas</span></button>
          {usuario?.perfil === "admin" && irParaAdmin && <button onClick={irParaAdmin} title="Administração"><Settings size={21} /><span>Administração</span></button>}
        </nav>
        <div className="fp-sidebar-footer"><i className={erro ? "has-error" : ""} /><div><span>Centro operacional</span><strong>FieldPro</strong><small>{carregando ? "Sincronizando" : erro ? "Sem conexão com a API" : "Conectado"}</small></div></div>
      </aside>
      <div className="fp-workarea">
        <header className="fp-topbar">
          <div className="fp-page-title"><h1>Central de operações</h1><p>Acompanhamento de equipes, demandas e serviços em campo.</p></div>
          <div className="fp-header-tools">
            <label className="fp-municipality"><MapPin size={17} /><select aria-label="Filtrar por município" value={municipioFiltro} onChange={(event) => setMunicipioFiltro(event.target.value)}><option value="">Todos os municípios</option>{municipios.map((municipio) => <option key={municipio} value={municipio}>{municipio}</option>)}</select></label>
            <label className="fp-search fp-header-search"><Search size={17} /><input aria-label="Buscar solicitação ou cliente" placeholder="Buscar solicitação ou cliente…" value={busca} onChange={(event) => setBusca(event.target.value)} /></label>
          </div>
          <div className="fp-user-area"><details className="fp-user-menu"><summary><span className="fp-avatar">{usuario?.nome_completo.split(" ").filter(Boolean).slice(0, 2).map((nome) => nome[0]).join("") || "FP"}</span><span className="fp-user-name"><strong>{usuario?.nome_completo || "FieldPro"}</strong><small>{usuario?.perfil === "admin" ? "Administrador" : "Escritório"}</small></span><ChevronDown size={14} /></summary><div className="fp-user-dropdown"><button onClick={abrirSolicitacaoLote}><FileText size={16} />Criar solicitações em lote</button><button onClick={sair}><LogOut size={16} />Sair</button></div></details><button onClick={abrirSolicitacao} className="fp-new-request"><Plus size={18} />Nova solicitação</button></div>
        </header>
        <div className="fp-content">
        <section className="fp-metrics">
          <Card
            titulo="Em andamento"
            valor={String(dashboard.andamento)}
            tag="solicitações ativas"
            cor="sky"
            icone={<Wrench size={18} />}
          />
          <Card
            titulo="Fora do prazo"
            valor={String(dashboard.foraPrazo)}
            tag="solicitações em atraso"
            cor="rose"
            icone={<AlertTriangle size={18} />}
          />
          <Card
            titulo="Emergenciais"
            valor={String(dashboard.emergenciais)}
            tag="alta prioridade"
            cor="amber"
            icone={<ShieldAlert size={18} />}
          />
          <Card
            titulo="Equipes online"
            valor={`${dashboard.equipesOnline}/${equipes.length}`}
            tag="equipes conectadas"
            cor="emerald"
            icone={<Wifi size={18} />}
          />
        </section>

        <div className="fp-operation-grid">
          <section id="mapa" className="fp-panel fp-map-panel">
            <div className="fp-panel-heading">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Mapa operacional</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Equipes posicionadas, demandas abertas e prioridade visual por pin.
                </p>
              </div>

              <span className={`fp-sync ${erro ? "fp-sync-error" : ""}`} role="status"><i />{carregando ? "Sincronizando…" : erro ? "Falha na sincronização" : "Dados sincronizados"}</span>
            </div>

                    <section className="office-filters fp-map-filters relative z-20">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="relative z-30">
              <button
                type="button"
                onClick={() => {
                  setTipoFiltroAberto(false);
                  setEquipeFiltroAberto(false);
                  setStatusFiltroAberto((atual) => !atual);
                }}
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

            <div className="relative z-20">
              <button
                type="button"
                onClick={() => {
                  setStatusFiltroAberto(false);
                  setEquipeFiltroAberto(false);
                  setTipoFiltroAberto((atual) => !atual);
                }}
                className="input flex w-full items-center justify-between bg-slate-50 text-left"
              >
                <span className="truncate">
                  {tipoFiltro.length === 0 ? "Todos os tipos" : tipoFiltro.join(", ")}
                </span>
                <span className="text-slate-400">{tipoFiltroAberto ? "▲" : "▼"}</span>
              </button>

              {tipoFiltroAberto ? (
                <div className="absolute left-0 right-0 z-[120] mt-2 rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
                  <button
                    type="button"
                    onClick={() => setTipoFiltro([])}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span>Todos os tipos</span>
                    {tipoFiltro.length === 0 ? (
                      <Check size={15} className="text-sky-600" />
                    ) : null}
                  </button>

                  {TIPO_FILTRO_OPCOES.map((tipo) => (
                    <label
                      key={tipo}
                      className="flex cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>{tipo}</span>
                      <input
                        type="checkbox"
                        checked={tipoFiltro.includes(tipo)}
                        onChange={() => alternarTipoFiltro(tipo)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative z-10">
              <button
                type="button"
                onClick={() => {
                  setStatusFiltroAberto(false);
                  setTipoFiltroAberto(false);
                  setEquipeFiltroAberto((atual) => !atual);
                }}
                className="input flex w-full items-center justify-between bg-slate-50 text-left"
              >
                <span className="truncate">
                  {equipeFiltro.length === 0
                    ? "Todas as equipes"
                    : equipeFiltro.join(", ")}
                </span>
                <span className="text-slate-400">
                  {equipeFiltroAberto ? "▲" : "▼"}
                </span>
              </button>

              {equipeFiltroAberto ? (
                <div className="absolute left-0 right-0 z-[120] mt-2 max-h-72 overflow-y-auto rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
                  <button
                    type="button"
                    onClick={() => setEquipeFiltro([])}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span>Todas as equipes</span>
                    {equipeFiltro.length === 0 ? (
                      <Check size={15} className="text-sky-600" />
                    ) : null}
                  </button>

                  {equipes.map((equipe) => (
                    <label
                      key={equipe.id}
                      className="flex cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <span className="truncate pr-3">{equipe.nome}</span>
                      <input
                        type="checkbox"
                        checked={equipeFiltro.includes(equipe.nome)}
                        onChange={() => alternarEquipeFiltro(equipe.nome)}
                        className="h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

          </div>
          {(statusFiltro.length > 0 || tipoFiltro.length > 0 || equipeFiltro.length > 0 || busca || municipioFiltro) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              {[
                ...(municipioFiltro ? [{ label: `Município: ${municipioFiltro}`, remover: () => setMunicipioFiltro("") }] : []),
                ...statusFiltro.map((valor) => ({ label: `Status: ${valor}`, remover: () => alternarStatusFiltro(valor) })),
                ...tipoFiltro.map((valor) => ({ label: `Tipo: ${valor}`, remover: () => alternarTipoFiltro(valor) })),
                ...equipeFiltro.map((valor) => ({ label: `Equipe: ${valor}`, remover: () => alternarEquipeFiltro(valor) })),
                ...(busca ? [{ label: `Busca: ${busca}`, remover: () => setBusca("") }] : []),
              ].map((filtro) => (
                <button key={filtro.label} type="button" onClick={filtro.remover}
                  aria-label={`Remover filtro ${filtro.label}`}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-800 transition hover:bg-sky-100">
                  <span className="truncate">{filtro.label}</span><X size={13} className="shrink-0" />
                </button>
              ))}
              <button type="button" onClick={() => {
                setStatusFiltro([]);
                setTipoFiltro([]);
                setEquipeFiltro([]);
                setBusca("");
                setMunicipioFiltro("");
                setStatusFiltroAberto(false);
                setTipoFiltroAberto(false);
                setEquipeFiltroAberto(false);
              }} className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
                Limpar filtros
              </button>
            </div>
          )}
        </section>



            <div className="fp-map-canvas">
              <MapContainer
                center={centroMapa}
                zoom={13}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <AjustarTamanhoMapa />
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
                <ScaleControl position="bottomleft" imperial={false} />
              </MapContainer>
              <div className="fp-map-legend"><strong>Demandas no mapa</strong><span><i className="fp-dot-blue" />Em andamento</span><span><i className="fp-dot-red" />Emergencial</span><span><i className="fp-dot-orange" />Devolvida</span><span><i className="fp-dot-green" />Concluída / finalizada</span></div>
            </div>
          </section>

<section id="equipes" className="fp-panel fp-teams-panel">
            <div className="fp-panel-heading"><h2>Equipes em campo</h2><span className="fp-sync"><i />{equipes.length} equipes</span></div>
            <div className="fp-team-tabs" role="group" aria-label="Filtrar equipes por conexão">
              {(["todas", "online", "offline"] as const).map((aba) => (
                <button key={aba} aria-pressed={abaEquipe === aba} className={abaEquipe === aba ? "is-active" : ""} onClick={() => setAbaEquipe(aba)}>
                  {aba === "todas" ? "Todas" : aba === "online" ? "Online" : "Offline"} ({aba === "todas" ? equipes.length : equipes.filter((equipe) => aba === "online" ? equipe.online : !equipe.online).length})
                </button>
              ))}
            </div>
            <label className="fp-search fp-team-search"><Search size={16} /><input value={buscaEquipe} onChange={(event) => setBuscaEquipe(event.target.value)} aria-label="Buscar equipe ou veículo" placeholder="Buscar equipe ou veículo…" /></label>
            <div className="fp-team-list">
              {equipesVisiveis.map((equipe) => (
                (() => {
                  const demandasAtivas =
                    demandasAtivasPorEquipe.get(String(equipe.id)) || 0;

                  return (
                <div
                  key={equipe.id}
                  className="fp-team-card"
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
                          demandasAtivas === 0 ? "text-slate-500" : "text-slate-700"
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

              {equipesVisiveis.length === 0 && (
                <div className="fp-empty-teams"><Users size={48} strokeWidth={1.3} /><strong>{carregando ? "Carregando equipes…" : "Nenhuma equipe encontrada."}</strong><p>{buscaEquipe || abaEquipe !== "todas" ? "Tente outra busca ou altere o filtro de conexão." : erro ? "Não foi possível carregar as equipes. Tente atualizar os dados." : "As equipes cadastradas aparecerão aqui."}</p></div>
              )}
            </div>
          </section>
                </div>
        <section id="solicitacoes" className="fp-panel fp-demands-panel">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Solicitações</h2>
              <p className="text-sm text-slate-500">
                Lista operacional com status, prioridade e equipe responsável.
              </p>
            </div>

            <button
              onClick={() => void carregarDados()}
              className="fp-button"
            >
              <RefreshCw size={15} /> Atualizar
            </button>
          </div>

          {carregando ? (
            <p className="py-12 text-center text-slate-500">Carregando dados da API...</p>
          ) : erro ? (
            <div className="fp-data-error" role="alert"><FileText size={32} strokeWidth={1.4} /><strong>Erro ao carregar dados.</strong><p>{erro}</p><span>Verifique sua conexão e tente atualizar.</span></div>
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
                    <th className="whitespace-nowrap px-2 py-4">Prazo</th>
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
                      <td className="whitespace-nowrap px-2 py-4 font-medium text-slate-700">
                        <div>{formatarPrazo(demanda.prazo)}</div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold ${prazoBadgeClasse(
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

        </div>
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

                          {pontosLevantamento.map((ponto, index) => (
                            <Marker
                              key={`mapa-ponto-${ponto.id}`}
                              position={[Number(ponto.latitude), Number(ponto.longitude)]}
                              icon={iconePontoLevantamento(ponto.ordem_ponto || index + 1)}
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

function AjustarTamanhoMapa() {
  const mapa = useMap();
  useEffect(() => {
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa]);
  return null;
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
    <div className={`fp-stat-card fp-stat-${cor}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{titulo}</p>
          <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-slate-900">{valor}</div>
        </div>

        <div className={`rounded-xl p-2.5 ${estilos.suave} ${estilos.texto}`}>
          {icone}
        </div>
      </div>

      <div className="mt-2">
        <span className={`text-xs font-medium ${estilos.texto}`}>{tag}</span>
      </div>
    </div>
  );
}
