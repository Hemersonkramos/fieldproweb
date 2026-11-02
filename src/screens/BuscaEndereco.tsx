import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { LoaderCircle, MapPin, Search, X } from "lucide-react";

// Busca de enderecos com sugestoes enquanto digita (como no Google Maps), usando o
// Photon (komoot), servico gratuito baseado no OpenStreetMap. Tambem aceita
// coordenadas coladas ("-5.09, -42.80") ou um link do Google Maps.

export type EnderecoSelecionado = {
  endereco: string;
  municipio: string;
  latitude: number;
  longitude: number;
};

type Sugestao = EnderecoSelecionado & { id: string; detalhe: string };

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
};

const PHOTON_URL = "https://photon.komoot.io";
// Limita ao Brasil e da preferencia a regiao de Teresina (PI).
const BRASIL_BBOX = "-74.0,-34.0,-34.7,5.4";
const REFERENCIA = { lat: -5.0892, lon: -42.8019 };

function montarSugestao(feature: PhotonFeature): Sugestao {
  const p = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;
  const rua = [p.street, p.housenumber].filter(Boolean).join(", ");
  const principal = p.name && p.name !== p.street ? p.name : rua || p.name || "Local sem nome";
  const municipio = p.city || p.county || "";
  const detalhe = [p.name && rua && p.name !== p.street ? rua : "", p.district, municipio, p.state, p.postcode]
    .filter(Boolean)
    .join(" · ");
  return {
    id: `${p.osm_id ?? ""}-${latitude}-${longitude}`,
    endereco: [principal, detalhe].filter(Boolean).join(" - "),
    detalhe,
    municipio,
    latitude,
    longitude,
  };
}

/** "-5.09, -42.80" ou link do Google Maps (".../@-5.09,-42.80,17z" ou "?q=-5.09,-42.80"). */
function lerCoordenadas(texto: string): [number, number] | null {
  const doLink = texto.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || texto.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  const direto = texto.trim().match(/^(-?\d{1,2}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)$/);
  const achado = doLink || direto;
  if (!achado) return null;
  const lat = Number(achado[1]);
  const lng = Number(achado[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

async function buscarEnderecoReverso(lat: number, lng: number): Promise<Partial<EnderecoSelecionado>> {
  try {
    const resposta = await fetch(`${PHOTON_URL}/reverse?lat=${lat}&lon=${lng}`);
    if (!resposta.ok) return {};
    const dados = (await resposta.json()) as { features?: PhotonFeature[] };
    const feature = dados.features?.[0];
    if (!feature) return {};
    const sugestao = montarSugestao(feature);
    return { endereco: sugestao.endereco, municipio: sugestao.municipio };
  } catch {
    return {};
  }
}

const iconePino = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:42px;position:relative;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35))">
    <svg viewBox="0 0 24 34" width="30" height="42"><path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 34 12 34s12-13.2 12-22.1C24 5.3 18.6 0 12 0z" fill="#ea4335"/><circle cx="12" cy="12" r="4.5" fill="#fff"/></svg></div>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

function SeguirPino({ posicao }: { posicao: [number, number] }) {
  const mapa = useMap();
  useEffect(() => {
    mapa.setView(posicao, Math.max(mapa.getZoom(), 16), { animate: true });
  }, [mapa, posicao]);
  return null;
}

function CliqueNoMapa({ aoClicar }: { aoClicar: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(evento) {
      aoClicar(evento.latlng.lat, evento.latlng.lng);
    },
  });
  return null;
}

type Props = {
  latitude: string;
  longitude: string;
  aoSelecionar: (local: EnderecoSelecionado) => void;
};

export default function BuscaEndereco({ latitude, longitude, aoSelecionar }: Props) {
  const [texto, setTexto] = useState("");
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [destaque, setDestaque] = useState(-1);
  const consultaRef = useRef(0);

  const posicao = useMemo<[number, number] | null>(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return latitude && longitude && Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  }, [latitude, longitude]);

  // Sugestoes com espera de 350 ms apos a ultima tecla (nao sobrecarrega o servico).
  useEffect(() => {
    const termo = texto.trim();
    // Texto curto ou coordenadas: aoDigitar ja limpou as sugestoes.
    if (termo.length < 3 || lerCoordenadas(termo)) return;

    const consulta = ++consultaRef.current;
    const temporizador = window.setTimeout(async () => {
      try {
        const parametros = new URLSearchParams({
          q: termo,
          limit: "6",
          bbox: BRASIL_BBOX,
          lat: String(REFERENCIA.lat),
          lon: String(REFERENCIA.lon),
        });
        const resposta = await fetch(`${PHOTON_URL}/api/?${parametros.toString()}`);
        if (!resposta.ok) throw new Error("Serviço de endereços indisponível.");
        const dados = (await resposta.json()) as { features?: PhotonFeature[] };
        if (consulta !== consultaRef.current) return;
        setSugestoes((dados.features ?? []).map(montarSugestao));
        setErro("");
        setDestaque(-1);
      } catch {
        if (consulta !== consultaRef.current) return;
        setSugestoes([]);
        setErro("Não foi possível buscar endereços agora. Você pode clicar no mapa ou colar as coordenadas.");
      } finally {
        if (consulta === consultaRef.current) setCarregando(false);
      }
    }, 350);

    return () => window.clearTimeout(temporizador);
  }, [texto]);

  function escolher(sugestao: Sugestao) {
    aoSelecionar(sugestao);
    setTexto(sugestao.endereco);
    setAberto(false);
    setSugestoes([]);
  }

  async function marcarPonto(lat: number, lng: number) {
    const base = { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    aoSelecionar({ ...base, endereco: "", municipio: "" });
    const reverso = await buscarEnderecoReverso(lat, lng);
    if (reverso.endereco || reverso.municipio) {
      aoSelecionar({ ...base, endereco: reverso.endereco ?? "", municipio: reverso.municipio ?? "" });
      if (reverso.endereco) setTexto(reverso.endereco);
    }
  }

  function aoDigitar(valor: string) {
    setTexto(valor);
    setAberto(true);
    const buscavel = valor.trim().length >= 3 && !lerCoordenadas(valor);
    if (!buscavel) {
      consultaRef.current += 1; // descarta respostas de buscas anteriores
      setSugestoes([]);
    }
    setCarregando(buscavel);
    const coordenadas = lerCoordenadas(valor);
    if (coordenadas) void marcarPonto(coordenadas[0], coordenadas[1]);
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (!aberto || sugestoes.length === 0) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setDestaque((atual) => (atual + 1) % sugestoes.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setDestaque((atual) => (atual <= 0 ? sugestoes.length - 1 : atual - 1));
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      escolher(sugestoes[destaque >= 0 ? destaque : 0]);
    } else if (evento.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div className="space-y-3 md:col-span-2">
      <label className="block space-y-2 text-sm font-semibold text-slate-600">
        <span>Endereço</span>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input bg-slate-50 pl-10 pr-10"
            placeholder="Busque rua, número, bairro ou local — ou cole coordenadas / link do Google Maps"
            value={texto}
            onChange={(e) => aoDigitar(e.target.value)}
            onFocus={() => setAberto(true)}
            onBlur={() => window.setTimeout(() => setAberto(false), 150)}
            onKeyDown={aoTeclar}
            role="combobox"
            aria-expanded={aberto && sugestoes.length > 0}
            aria-controls="sugestoes-endereco"
            aria-autocomplete="list"
            autoComplete="off"
          />
          {carregando ? (
            <LoaderCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          ) : texto ? (
            <button
              type="button"
              onClick={() => {
                setTexto("");
                setSugestoes([]);
              }}
              aria-label="Limpar busca de endereço"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          ) : null}

          {aberto && sugestoes.length > 0 && (
            <ul
              id="sugestoes-endereco"
              role="listbox"
              className="absolute left-0 right-0 top-full z-[10050] mt-1 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
            >
              {sugestoes.map((sugestao, indice) => (
                <li key={sugestao.id} role="option" aria-selected={indice === destaque}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => escolher(sugestao)}
                    className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-sky-50 ${
                      indice === destaque ? "bg-sky-50" : ""
                    }`}
                  >
                    <MapPin size={16} className="mt-0.5 shrink-0 text-rose-500" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {sugestao.endereco.split(" - ")[0]}
                      </span>
                      <span className="block truncate text-xs font-normal text-slate-500">{sugestao.detalhe}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      {erro && <p className="text-xs font-semibold text-amber-700">{erro}</p>}

      <div className="overflow-hidden rounded-[24px] border border-slate-200">
        <div className="h-56">
          <MapContainer
            center={posicao ?? [REFERENCIA.lat, REFERENCIA.lon]}
            zoom={posicao ? 16 : 12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CliqueNoMapa aoClicar={(lat, lng) => void marcarPonto(lat, lng)} />
            {posicao && (
              <>
                <SeguirPino posicao={posicao} />
                <Marker
                  position={posicao}
                  icon={iconePino}
                  draggable
                  eventHandlers={{
                    dragend(evento) {
                      const ponto = (evento.target as L.Marker).getLatLng();
                      void marcarPonto(ponto.lat, ponto.lng);
                    },
                  }}
                />
              </>
            )}
          </MapContainer>
        </div>
        <p className="bg-slate-50 px-4 py-2 text-xs text-slate-500">
          {posicao
            ? `Local: ${posicao[0].toFixed(6)}, ${posicao[1].toFixed(6)} — arraste o pino ou clique no mapa para ajustar.`
            : "Escolha um endereço na busca ou clique no mapa para marcar o local da demanda."}
        </p>
      </div>
    </div>
  );
}
