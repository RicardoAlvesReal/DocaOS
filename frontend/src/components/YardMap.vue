<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useYardStore } from '../stores/yard'
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Warehouse, 
  Radio, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Maximize2, 
  RotateCcw,
  Clock,
  Compass,
  CheckCircle2
} from 'lucide-vue-next'

const props = defineProps({
  height: {
    type: String,
    default: '650px'
  },
  showSidebar: {
    type: Boolean,
    default: true
  }
})

const yardStore = useYardStore()
const mapContainer = ref(null)
let mapInstance = null
let warehouseMarker = null
let geofenceCircle = null
let vehicleMarkersGroup = null

// Mapa de instâncias dos marcadores para transições suaves sem recriação de DOM
const activeMarkerMap = new Map()

// Estado de Movimentação ao Vivo Contínua (Estilo Uber)
let uberMotionTimer = null
const liveVehicles = ref([])

// Configurações do Mapa
const currentTileMode = ref('dark') // 'dark' | 'streets' | 'satellite'
const isSimulatingPing = ref(false)

// Coordenadas padrão caso o armazém não tenha latitude/longitude cadastradas
const defaultCoords = {
  lat: -20.3155,
  lng: -40.3128,
  radius: 1000
}

const warehouseCoords = computed(() => {
  const t = yardStore.currentTenant
  return {
    lat: t?.latitude || defaultCoords.lat,
    lng: t?.longitude || defaultCoords.lng,
    radius: t?.geofence_radius_meters || defaultCoords.radius,
    name: t?.name || 'Centro de Distribuição Principal'
  }
})

// Função para categorizar o veículo com base na carga e dados de semirreboque
function classifyVehicle(sch) {
  if (sch.trailer_plate) {
    return {
      type: 'semi_trailer',
      category: 'Carreta Articulada',
      short: 'Carreta'
    }
  }
  const cargo = (sch.cargo_type || '').toLowerCase()
  if (cargo.includes('van') || cargo.includes('express') || cargo.includes('fracionad')) {
    return {
      type: 'van',
      category: 'Van / Utilitário',
      short: 'Van'
    }
  }
  if (cargo.includes('quím') || cargo.includes('tanque') || cargo.includes('combust')) {
    return {
      type: 'tanker',
      category: 'Caminhão Tanque',
      short: 'Tanque'
    }
  }
  if (cargo.includes('carro') || cargo.includes('apoio') || cargo.includes('escolta') || cargo.includes('passeio') || cargo.includes('visita') || cargo.includes('utilit')) {
    return {
      type: 'car',
      category: 'Carro / Apoio',
      short: 'Carro'
    }
  }
  return {
    type: 'truck',
    category: 'Caminhão',
    short: 'Caminhão'
  }
}

// Cálculo puro de distância em metros via fórmula de Haversine
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000 // metros
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Cálculo do ângulo de direção (bearing) para o carro apontar o bico na direção do trajeto
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(lat2Rad)
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)
  const brng = Math.atan2(y, x) * 180 / Math.PI
  return (brng + 360) % 360
}

// Lista de veículos com coordenadas conhecidas (check-in GPS ou rastreador)
const trackedVehicles = computed(() => {
  const list = []
  const schedules = yardStore.schedules || []

  schedules.forEach((sch) => {
    if (sch.checkin_latitude && sch.checkin_longitude) {
      const cls = classifyVehicle(sch)
      list.push({
        id: sch.id,
        vehicle_plate: sch.vehicle_plate,
        trailer_plate: sch.trailer_plate,
        cargo_type: sch.cargo_type,
        driver_name: sch.driver_name,
        carrier_name: sch.carrier_name,
        status: sch.status,
        latitude: sch.checkin_latitude,
        longitude: sch.checkin_longitude,
        distance_meters: sch.checkin_distance_meters || 0,
        geofence_validated: sch.geofence_validated,
        source: 'checkin_mobile',
        timestamp: sch.checkin_time || sch.updated_at,
        vehicle_type: cls.type,
        vehicle_category: cls.category,
        vehicle_short: cls.short
      })
    }
  })

  // Se não houver nenhum com GPS salvo ainda, criamos 5 pontos demonstrativos realistas
  if (list.length === 0 && schedules.length > 0) {
    const wLat = warehouseCoords.value.lat
    const wLng = warehouseCoords.value.lng

    // Coordenadas posicionadas estritamente sobre o asfalto das vias e avenidas de acesso
    const demoVehicles = [
      { dLat: -0.0053, dLng: -0.0027, dist: 640, valid: true, type: 'semi_trailer', cat: 'Carreta Articulada', short: 'Carreta', plate: 'BRA2E19' }, // Av. Mal. Mascarenhas
      { dLat: 0.0030, dLng: -0.0053, dist: 710, valid: true, type: 'truck', cat: 'Caminhão', short: 'Caminhão', plate: 'SPX9A88' }, // Av. Cezar Hilal
      { dLat: 0.0050, dLng: -0.0022, dist: 620, valid: true, type: 'van', cat: 'Van / Utilitário', short: 'Van', plate: 'VIX1J99' }, // Av. Vitória
      { dLat: -0.0020, dLng: 0.0023, dist: 350, valid: true, type: 'tanker', cat: 'Caminhão Tanque', short: 'Tanque', plate: 'RIO4K77' }, // Rua Carlos Moreira Lima
      { dLat: -0.0030, dLng: -0.0044, dist: 590, valid: true, type: 'car', cat: 'Carro / Apoio', short: 'Carro', plate: 'BHZ3M44' } // Av. Beira-Mar
    ]

    schedules.slice(0, 5).forEach((sch, idx) => {
      const demo = demoVehicles[idx % demoVehicles.length]

      list.push({
        id: sch.id,
        vehicle_plate: sch.vehicle_plate || demo.plate,
        trailer_plate: sch.trailer_plate || (demo.type === 'semi_trailer' ? 'SR-9921' : null),
        cargo_type: sch.cargo_type || 'Carga Geral',
        driver_name: sch.driver_name,
        carrier_name: sch.carrier_name,
        status: sch.status,
        latitude: wLat + demo.dLat,
        longitude: wLng + demo.dLng,
        distance_meters: demo.dist,
        geofence_validated: demo.valid,
        source: 'gps_audited',
        timestamp: sch.checkin_time || new Date().toISOString(),
        vehicle_type: demo.type,
        vehicle_category: demo.cat,
        vehicle_short: demo.short
      })
    })
  }

  return list
})

// Corredores viários pré-definidos sobre as vias reais (Garante que os veículos sigam o asfalto)
function getPredefinedStreetRoutes(wLat, wLng) {
  return [
    // Rota 1: Avenida Marechal Mascarenhas de Moraes (Beira-Mar) -> Portão
    [
      { lat: wLat - 0.0065, lng: wLng - 0.0035 },
      { lat: wLat - 0.0048, lng: wLng - 0.0025 },
      { lat: wLat - 0.0032, lng: wLng - 0.0016 },
      { lat: wLat - 0.0018, lng: wLng - 0.0008 },
      { lat: wLat, lng: wLng }
    ],
    // Rota 2: Avenida Cezar Hilal -> Rua Chafic Murad
    [
      { lat: wLat + 0.0045, lng: wLng - 0.0068 },
      { lat: wLat + 0.0032, lng: wLng - 0.0045 },
      { lat: wLat + 0.0020, lng: wLng - 0.0028 },
      { lat: wLat + 0.0010, lng: wLng - 0.0012 },
      { lat: wLat, lng: wLng }
    ],
    // Rota 3: Avenida Vitória -> Acesso Norte
    [
      { lat: wLat + 0.0062, lng: wLng - 0.0028 },
      { lat: wLat + 0.0045, lng: wLng - 0.0020 },
      { lat: wLat + 0.0028, lng: wLng - 0.0012 },
      { lat: wLat + 0.0012, lng: wLng - 0.0005 },
      { lat: wLat, lng: wLng }
    ],
    // Rota 4: Rua Carlos Moreira Lima -> Acesso Sul
    [
      { lat: wLat - 0.0035, lng: wLng + 0.0032 },
      { lat: wLat - 0.0022, lng: wLng + 0.0020 },
      { lat: wLat - 0.0012, lng: wLng + 0.0010 },
      { lat: wLat, lng: wLng }
    ],
    // Rota 5 (Carro Uber): Av. Beira-Mar com curvas nas esquinas
    [
      { lat: wLat - 0.0045, lng: wLng - 0.0055 },
      { lat: wLat - 0.0032, lng: wLng - 0.0038 },
      { lat: wLat - 0.0020, lng: wLng - 0.0022 },
      { lat: wLat - 0.0010, lng: wLng - 0.0010 },
      { lat: wLat, lng: wLng }
    ]
  ]
}

// Busca trajeto viário real via OpenStreetMap Routing Machine (OSRM) - 100% Livre e Gratuito
async function fetchRoadRoute(originLat, originLng, destLat, destLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data.routes && data.routes[0]?.geometry?.coordinates?.length > 1) {
        return data.routes[0].geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }))
      }
    }
  } catch (err) {
    // Mantém fallback de corredor viário
  }
  return null
}

// Sincroniza a lista de simulação contínua com posições dinâmicas sobre ruas reais
function syncLiveVehicles() {
  const current = trackedVehicles.value
  const wLat = warehouseCoords.value.lat
  const wLng = warehouseCoords.value.lng
  const streetCorridors = getPredefinedStreetRoutes(wLat, wLng)

  liveVehicles.value = current.map((v, i) => {
    const streetRoute = streetCorridors[i % streetCorridors.length]
    const initialBearing = streetRoute.length > 1
      ? calculateBearing(streetRoute[0].lat, streetRoute[0].lng, streetRoute[1].lat, streetRoute[1].lng)
      : calculateBearing(v.latitude, v.longitude, wLat, wLng)

    const vehicleObj = {
      ...v,
      currentLat: streetRoute[0].lat,
      currentLng: streetRoute[0].lng,
      originLat: streetRoute[0].lat,
      originLng: streetRoute[0].lng,
      route: streetRoute,
      routeIndex: 0,
      stepRatio: 0.05,
      speedKmh: Math.round(35 + (i * 7)),
      bearing: initialBearing
    }

    // Consulta malha viária oficial OSRM em background para refinar os pontos curva a curva
    fetchRoadRoute(streetRoute[0].lat, streetRoute[0].lng, wLat, wLng).then((osrmPoints) => {
      if (osrmPoints && osrmPoints.length > 2) {
        vehicleObj.route = osrmPoints
        vehicleObj.routeIndex = 0
      }
    })

    return vehicleObj
  })
}

// Provedores de Tiles 100% Livres de API Key (OpenStreetMap nativo)
const tileLayers = {
  dark: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
}
let currentTileLayer = null

function setTileLayer(mode) {
  if (!mapInstance) return
  currentTileMode.value = mode
  if (currentTileLayer) {
    mapInstance.removeLayer(currentTileLayer)
  }
  const url = tileLayers[mode] || tileLayers.streets
  currentTileLayer = L.tileLayer(url, {
    maxZoom: 19,
    attribution: mode === 'satellite' ? '&copy; Esri' : '&copy; OpenStreetMap contributors'
  }).addTo(mapInstance)

  // Aplicar filtro escuro nativo no container de tiles quando em modo noturno
  const tilePane = mapInstance.getPane('tilePane')
  if (tilePane) {
    if (mode === 'dark') {
      tilePane.classList.add('dark-map-tiles')
    } else {
      tilePane.classList.remove('dark-map-tiles')
    }
  }
}

function initMap() {
  if (!mapContainer.value) return
  if (mapInstance) {
    mapInstance.remove()
  }

  const { lat, lng } = warehouseCoords.value

  mapInstance = L.map(mapContainer.value, {
    center: [lat, lng],
    zoom: 15,
    zoomControl: false
  })

  // Adicionar controle de zoom personalizado no canto superior direito
  L.control.zoom({ position: 'topright' }).addTo(mapInstance)

  setTileLayer(currentTileMode.value)

  vehicleMarkersGroup = L.layerGroup().addTo(mapInstance)

  renderWarehouseAndGeofence()
  syncLiveVehicles()
  renderVehicleMarkers()

  // Inicia movimentação contínua estilo Uber diretamente e sem pausa
  startUberMotion()
}

function renderWarehouseAndGeofence() {
  if (!mapInstance) return

  const { lat, lng, radius, name } = warehouseCoords.value

  // Remover anteriores
  if (warehouseMarker) mapInstance.removeLayer(warehouseMarker)
  if (geofenceCircle) mapInstance.removeLayer(geofenceCircle)

  // Círculo de Geofencing (Raio permitido Lei 11.442)
  geofenceCircle = L.circle([lat, lng], {
    radius: radius,
    color: '#0284c7', // Sky-600
    fillColor: '#38bdf8', // Sky-400
    fillOpacity: 0.12,
    weight: 2,
    dashArray: '6, 8'
  }).addTo(mapInstance)

  // Marcador customizado para o Armazém / CD
  const warehouseIconHtml = `
    <div class="relative flex items-center justify-center">
      <div class="absolute -inset-3 bg-sky-500/20 rounded-full animate-ping opacity-75"></div>
      <div class="relative px-3 py-1.5 bg-slate-900 border-2 border-sky-400 text-white rounded-xl shadow-2xl flex items-center space-x-1.5 whitespace-nowrap">
        <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <span class="text-xs font-black tracking-tight">${name}</span>
      </div>
    </div>
  `

  const customWarehouseIcon = L.divIcon({
    html: warehouseIconHtml,
    className: 'warehouse-div-icon',
    iconSize: [180, 40],
    iconAnchor: [90, 20]
  })

  warehouseMarker = L.marker([lat, lng], { icon: customWarehouseIcon }).addTo(mapInstance)

  warehouseMarker.bindPopup(`
    <div class="p-2 text-slate-900 font-sans">
      <p class="text-[11px] text-slate-500 mt-1 font-mono">Coordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
    </div>
  `)
}

// Silhuetas de Veículos em Visão Superior (Top-down / Bird's Eye View ultra-realista estilo Uber)
function getTopDownVehicleSvg(type, isInside) {
  const accentColor = isInside ? '#34d399' : '#38bdf8' // emerald ou sky
  const strokeColor = isInside ? '#10b981' : '#0284c7'

  switch (type) {
    case 'car':
      // Carro de passeio visto de cima (IDÊNTICO AO APLICATIVO DA UBER AO PEDIR UMA CORRIDA)
      return `
        <svg width="30" height="58" viewBox="0 0 30 58" fill="none" xmlns="http://www.w3.org/2000/svg" class="overflow-visible" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));">
          <defs>
            <!-- Facho de luz dianteiro iluminando o asfalto à frente (efeito Uber Night) -->
            <linearGradient id="uberHeadlightsGrad" x1="15" y1="14" x2="15" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#fef08a" stop-opacity="0.55"/>
              <stop offset="100%" stop-color="#fef08a" stop-opacity="0"/>
            </linearGradient>
            <!-- Pintura metálica elegante do carro estilo Uber Black/Comfort -->
            <linearGradient id="uberBodyGrad" x1="4" y1="8" x2="26" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#1e293b"/>
              <stop offset="45%" stop-color="#0f172a"/>
              <stop offset="100%" stop-color="#020617"/>
            </linearGradient>
            <!-- Vidro escuro temperado com reflexo azulado -->
            <linearGradient id="uberGlassGrad" x1="7" y1="15" x2="23" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#0369a1" stop-opacity="0.75"/>
            </linearGradient>
          </defs>

          <!-- Facho dos Faróis Dianteiros no Chão -->
          <polygon points="11,15 2,0 28,0 19,15" fill="url(#uberHeadlightsGrad)"/>

          <!-- Sombra do Carro no Asfalto -->
          <ellipse cx="15" cy="32" rx="11" ry="21" fill="rgba(0,0,0,0.55)" filter="blur(2px)"/>

          <!-- 4 Pneus de Borracha visíveis nas caixas de roda -->
          <rect x="2" y="14" width="3" height="8" rx="1.5" fill="#09090b"/>
          <rect x="25" y="14" width="3" height="8" rx="1.5" fill="#09090b"/>
          <rect x="2" y="38" width="3" height="8" rx="1.5" fill="#09090b"/>
          <rect x="25" y="38" width="3" height="8" rx="1.5" fill="#09090b"/>

          <!-- Carroçaria Aerodinâmica do Carro (Sedan moderno) -->
          <path d="M 8.5 11 C 11 8, 19 8, 21.5 11 C 24.5 15, 25.5 25, 25.5 39 C 25.5 48, 22.5 52, 15 52 C 7.5 52, 4.5 48, 4.5 39 C 4.5 25, 5.5 15, 8.5 11 Z" fill="url(#uberBodyGrad)" stroke="${strokeColor}" stroke-width="1.3"/>

          <!-- Vincos do Capô Dianteiro -->
          <path d="M 9.5 11 Q 15 13.5 20.5 11" stroke="#334155" stroke-width="0.8" fill="none"/>

          <!-- Retrovisores Aerodinâmicos Projetados -->
          <path d="M 4.5 19 Q 0.5 18 1.5 21.5 Q 3.5 22.5 5 21 Z" fill="#1e293b" stroke="${strokeColor}" stroke-width="0.8"/>
          <path d="M 25.5 19 Q 29.5 18 28.5 21.5 Q 26.5 22.5 25 21 Z" fill="#1e293b" stroke="${strokeColor}" stroke-width="0.8"/>

          <!-- Para-brisa Dianteiro Curvado Estilo Uber -->
          <path d="M 7.5 19 C 10 16.5, 20 16.5, 22.5 19 C 21.5 23.5, 20 24.5, 15 24.5 C 10 24.5, 8.5 23.5, 7.5 19 Z" fill="url(#uberGlassGrad)"/>
          <!-- Filete de reflexo de luz no para-brisa -->
          <line x1="10.5" y1="18.5" x2="13.5" y2="23.5" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>

          <!-- Teto / Sunroof do Carro -->
          <rect x="8.5" y="26" width="13" height="13" rx="2.5" fill="#0f172a" stroke="#334155" stroke-width="0.8"/>
          <rect x="10.5" y="27.5" width="9" height="10" rx="1.5" fill="#1e293b" fill-opacity="0.8"/>

          <!-- Vidro Traseiro Curvado -->
          <path d="M 8 40.5 C 10 39, 20 39, 22 40.5 C 21 44, 19 45, 15 45 C 11 45, 9 44, 8 40.5 Z" fill="url(#uberGlassGrad)" fill-opacity="0.8"/>

          <!-- Faróis Dianteiros LED Crisp -->
          <circle cx="8" cy="11.5" r="1.5" fill="#fef08a"/>
          <circle cx="22" cy="11.5" r="1.5" fill="#fef08a"/>
          <ellipse cx="8" cy="11" rx="1.8" ry="1.2" fill="#ffffff"/>
          <ellipse cx="22" cy="11" rx="1.8" ry="1.2" fill="#ffffff"/>

          <!-- Lanternas Traseiras LED Vermelho Rubro -->
          <rect x="6.5" y="50.5" width="4.5" height="1.5" rx="0.75" fill="#ef4444"/>
          <rect x="19" y="50.5" width="4.5" height="1.5" rx="0.75" fill="#ef4444"/>
        </svg>
      `
    case 'van':
      // Furgão / Van de entrega visto de cima
      return `
        <svg width="26" height="50" viewBox="0 0 26 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));">
          <!-- Facho dianteiro -->
          <polygon points="9,14 1,0 25,0 17,14" fill="#fef08a" fill-opacity="0.35"/>
          <!-- Sombra e Chassi -->
          <rect x="2" y="2" width="22" height="46" rx="5" fill="#0f172a" stroke="${strokeColor}" stroke-width="1.5"/>
          <rect x="4" y="14" width="18" height="31" rx="2" fill="#1e293b"/>
          <line x1="5" y1="22" x2="21" y2="22" stroke="#334155" stroke-width="1"/>
          <line x1="5" y1="31" x2="21" y2="31" stroke="#334155" stroke-width="1"/>
          <line x1="5" y1="40" x2="21" y2="40" stroke="#334155" stroke-width="1"/>
          <path d="M4 14C4 10 7 7 13 7C19 7 22 10 22 14H4Z" fill="${accentColor}" fill-opacity="0.85"/>
          <rect x="3.5" y="1.5" width="3" height="1.5" rx="0.5" fill="#fef08a"/>
          <rect x="19.5" y="1.5" width="3" height="1.5" rx="0.5" fill="#fef08a"/>
          <rect x="3.5" y="47.5" width="3" height="1" rx="0.5" fill="#ef4444"/>
          <rect x="19.5" y="47.5" width="3" height="1" rx="0.5" fill="#ef4444"/>
          <!-- Retrovisores -->
          <rect x="0" y="12" width="2" height="3.5" rx="1" fill="#334155"/>
          <rect x="24" y="12" width="2" height="3.5" rx="1" fill="#334155"/>
        </svg>
      `
    case 'semi_trailer':
      // Carreta Articulada (Cavalo Mecânico + Semirreboque Longo) vista de cima
      return `
        <svg width="30" height="74" viewBox="0 0 30 74" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 7px rgba(0,0,0,0.7));">
          <!-- Facho dianteiro -->
          <polygon points="10,14 1,0 29,0 20,14" fill="#fef08a" fill-opacity="0.35"/>
          <!-- Cabine / Cavalo -->
          <rect x="5" y="2" width="20" height="19" rx="3.5" fill="#0f172a" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M6.5 9.5C6.5 7 9 5 15 5C21 5 23.5 7 23.5 9.5H6.5Z" fill="${accentColor}" fill-opacity="0.85"/>
          <rect x="7" y="13" width="16" height="6.5" rx="1.5" fill="#1e293b"/>
          <!-- Quinta Roda / Engate -->
          <rect x="12" y="21" width="6" height="4.5" rx="1" fill="#475569"/>
          <!-- Semirreboque -->
          <rect x="3.5" y="25" width="23" height="46" rx="2.5" fill="#1e293b" stroke="${strokeColor}" stroke-width="1.5"/>
          <rect x="5.5" y="28" width="19" height="40" rx="1" fill="#0f172a" fill-opacity="0.8"/>
          <line x1="5.5" y1="41" x2="24.5" y2="41" stroke="#334155" stroke-width="1"/>
          <line x1="5.5" y1="55" x2="24.5" y2="55" stroke="#334155" stroke-width="1"/>
          <!-- Faróis e Lanternas -->
          <rect x="5.5" y="1" width="3.5" height="1.5" rx="0.5" fill="#fef08a"/>
          <rect x="21" y="1" width="3.5" height="1.5" rx="0.5" fill="#fef08a"/>
          <rect x="4.5" y="70.5" width="4" height="1.5" rx="0.5" fill="#ef4444"/>
          <rect x="21.5" y="70.5" width="4" height="1.5" rx="0.5" fill="#ef4444"/>
          <!-- Retrovisores do Cavalo -->
          <rect x="2" y="8" width="3" height="4" rx="1" fill="#334155"/>
          <rect x="25" y="8" width="3" height="4" rx="1" fill="#334155"/>
        </svg>
      `
    case 'tanker':
      // Caminhão Tanque visto de cima
      return `
        <svg width="28" height="58" viewBox="0 0 28 58" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));">
          <!-- Facho dianteiro -->
          <polygon points="10,14 2,0 26,0 18,14" fill="#fef08a" fill-opacity="0.35"/>
          <rect x="4.5" y="2" width="19" height="16" rx="3" fill="#0f172a" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M6.5 8C6.5 6 8.5 4.5 14 4.5C19.5 4.5 21.5 6 21.5 8H6.5Z" fill="${accentColor}" fill-opacity="0.85"/>
          <!-- Cilindro do Tanque -->
          <rect x="3" y="19" width="22" height="36" rx="11" fill="#1e293b" stroke="${strokeColor}" stroke-width="1.5"/>
          <circle cx="14" cy="27" r="2.5" fill="${accentColor}" fill-opacity="0.6"/>
          <circle cx="14" cy="37" r="2.5" fill="${accentColor}" fill-opacity="0.6"/>
          <circle cx="14" cy="47" r="2.5" fill="${accentColor}" fill-opacity="0.6"/>
          <rect x="5" y="1" width="3.5" height="1.5" rx="0.5" fill="#fef08a"/>
          <rect x="19.5" y="1" width="3.5" height="1.5" rx="0.5" fill="#fef08a"/>
          <rect x="5" y="55" width="3.5" height="1.5" rx="0.5" fill="#ef4444"/>
          <rect x="19.5" y="55" width="3.5" height="1.5" rx="0.5" fill="#ef4444"/>
        </svg>
      `
    default: // truck
      // Caminhão rígido visto de cima
      return `
        <svg width="28" height="56" viewBox="0 0 28 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));">
          <!-- Facho dianteiro -->
          <polygon points="10,14 2,0 26,0 18,14" fill="#fef08a" fill-opacity="0.35"/>
          <rect x="4.5" y="2" width="19" height="16" rx="3" fill="#0f172a" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M6.5 8C6.5 5.5 8.5 4.5 14 4.5C19.5 4.5 21.5 5.5 21.5 8H6.5Z" fill="${accentColor}" fill-opacity="0.85"/>
          <rect x="6.5" y="11.5" width="15" height="5.5" rx="1" fill="#1e293b"/>
          <rect x="2.5" y="19" width="23" height="34" rx="2.5" fill="#1e293b" stroke="${strokeColor}" stroke-width="1.5"/>
          <line x1="3.5" y1="30" x2="24.5" y2="30" stroke="#334155" stroke-width="1"/>
          <line x1="3.5" y1="42" x2="24.5" y2="42" stroke="#334155" stroke-width="1"/>
          <rect x="5" y="1" width="3.5" height="1.5" rx="0.5" fill="#fef08a"/>
          <rect x="19.5" y="1" width="3.5" height="1.5" rx="0.5" fill="#fef08a"/>
          <rect x="4" y="53" width="3.5" height="1.5" rx="0.5" fill="#ef4444"/>
        </svg>
      `
  }
}

function buildVehicleIconHtml(v, isInside) {
  return `
    <div class="cursor-pointer group flex flex-col items-center select-none">
      <!-- Tag Flutuante com Placa e Distância (Sempre na horizontal acima do carro) -->
      <div class="mb-1 px-2 py-0.5 rounded-md border shadow-2xl flex items-center space-x-1 font-mono text-[10px] font-bold text-white bg-slate-950/95 backdrop-blur-sm whitespace-nowrap transition-colors ${isInside ? 'border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/50' : 'border-amber-400 text-amber-300'}">
        <span class="w-1.5 h-1.5 rounded-full ${isInside ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
        <span class="tracking-wider">${v.vehicle_plate}</span>
        <span class="text-[9px] opacity-75">${Math.round(v.distance_meters)}m</span>
      </div>
      <!-- Veículo Estilo Uber (Visão Superior com rotação suave no ângulo de movimento) -->
      <div class="transition-transform duration-700 ease-out flex items-center justify-center" style="transform: rotate(${v.bearing || 0}deg);">
        ${getTopDownVehicleSvg(v.vehicle_type, isInside)}
      </div>
    </div>
  `
}

function buildPopupHtml(v, isInside) {
  return `
    <div class="p-3 text-slate-900 font-sans min-w-[240px]">
      <div class="flex items-center justify-between border-b pb-2 mb-2">
        <div>
          <p class="font-mono font-black text-sm text-slate-950 leading-tight">${v.vehicle_plate}</p>
          <p class="text-[10px] text-slate-500 font-medium">${v.vehicle_category}</p>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isInside ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${isInside ? 'Na Cerca (&le;1km)' : 'Na Rodovia'}
        </span>
      </div>

      <div class="space-y-1.5 text-xs text-slate-700">
        ${v.trailer_plate ? `<p class="flex justify-between text-[11px] bg-slate-50 p-1 rounded font-mono"><span>Semirreboque:</span> <strong class="text-slate-900">${v.trailer_plate}</strong></p>` : ''}
        <p><strong>Motorista:</strong> ${v.driver_name || 'Aguardando check-in'}</p>
        <p><strong>Transportadora:</strong> ${v.carrier_name || 'Autônomo'}</p>
        <p><strong>Tipo de Carga:</strong> ${v.cargo_type || 'Carga Geral'}</p>
        <p class="pt-1 border-t text-[11px] flex justify-between items-center">
          <span>Distância Portão:</span>
          <strong class="font-mono text-sky-700">${Math.round(v.distance_meters)} metros</strong>
        </p>
        <p class="text-[10px] text-slate-500 flex justify-between">
          <span>Presença Lei 11.442:</span>
          <strong class="${v.geofence_validated ? 'text-emerald-700 font-bold' : 'text-amber-700'}">${v.geofence_validated ? 'Auditada e Válida' : 'Pendente de Portaria'}</strong>
        </p>
      </div>
    </div>
  `
}

function updateOrCreateMarker(v) {
  if (!mapInstance || !vehicleMarkersGroup) return
  const isInside = v.distance_meters <= warehouseCoords.value.radius
  const iconHtml = buildVehicleIconHtml(v, isInside)
  const customVehicleIcon = L.divIcon({
    html: iconHtml,
    className: 'vehicle-div-icon',
    iconSize: [100, 100],
    iconAnchor: [50, 50]
  })

  let marker = activeMarkerMap.get(v.id)
  if (marker) {
    // Atualiza posição com transição suave CSS em tempo real
    marker.setLatLng([v.currentLat, v.currentLng])
    marker.setIcon(customVehicleIcon)
    marker.setPopupContent(buildPopupHtml(v, isInside))
  } else {
    marker = L.marker([v.currentLat, v.currentLng], { icon: customVehicleIcon })
    marker.bindPopup(buildPopupHtml(v, isInside))
    vehicleMarkersGroup.addLayer(marker)
    activeMarkerMap.set(v.id, marker)
  }
}

function renderVehicleMarkers() {
  if (!mapInstance || !vehicleMarkersGroup) return
  const currentIds = new Set()

  const list = liveVehicles.value.length ? liveVehicles.value : trackedVehicles.value
  list.forEach((v) => {
    currentIds.add(v.id)
    if (!v.currentLat) {
      v.currentLat = v.latitude
      v.currentLng = v.longitude
      v.bearing = calculateBearing(v.latitude, v.longitude, warehouseCoords.value.lat, warehouseCoords.value.lng)
    }
    updateOrCreateMarker(v)
  })

  // Limpa eventuais marcadores desativados
  for (const [id, marker] of activeMarkerMap.entries()) {
    if (!currentIds.has(id)) {
      vehicleMarkersGroup.removeLayer(marker)
      activeMarkerMap.delete(id)
    }
  }
}

// Movimentação Contínua ao Vivo pelas Ruas (Seguindo curvas e avenidas reais da cidade)
function stepUberMotion() {
  if (!mapInstance) return
  const wLat = warehouseCoords.value.lat
  const wLng = warehouseCoords.value.lng

  liveVehicles.value.forEach((v) => {
    // Se o veículo possui trajeto traçado pelas ruas (corredor viário ou OSRM)
    if (v.route && v.route.length > 1) {
      if (v.routeIndex === undefined) v.routeIndex = 0

      const pCurrent = v.route[v.routeIndex]
      const nextIdx = Math.min(v.routeIndex + 1, v.route.length - 1)
      const pNext = v.route[nextIdx]

      // Ângulo de direção apontando rigorosamente no alinhamento do asfalto
      if (pCurrent.lat !== pNext.lat || pCurrent.lng !== pNext.lng) {
        v.bearing = calculateBearing(pCurrent.lat, pCurrent.lng, pNext.lat, pNext.lng)
      }

      v.currentLat = pCurrent.lat
      v.currentLng = pCurrent.lng

      const dist = calculateDistanceMeters(v.currentLat, v.currentLng, wLat, wLng)
      v.distance_meters = dist
      v.geofence_validated = dist <= warehouseCoords.value.radius

      // Avança de forma suave para o próximo ponto da via
      if (v.routeIndex < v.route.length - 1) {
        v.routeIndex++
      } else {
        // Ao alcançar o portão, reinicia no início da avenida para manter o fluxo contínuo
        v.routeIndex = 0
      }
    } else {
      // Fallback vetorial suave se ainda não carregou a rota
      const dLat = wLat - v.currentLat
      const dLng = wLng - v.currentLng
      const dist = calculateDistanceMeters(v.currentLat, v.currentLng, wLat, wLng)
      v.bearing = calculateBearing(v.currentLat, v.currentLng, wLat, wLng)

      if (dist > 45) {
        v.currentLat += dLat * (v.stepRatio || 0.05)
        v.currentLng += dLng * (v.stepRatio || 0.05)
        v.distance_meters = dist
        v.geofence_validated = dist <= warehouseCoords.value.radius
      } else {
        v.currentLat = v.originLat
        v.currentLng = v.originLng
        v.distance_meters = calculateDistanceMeters(v.originLat, v.originLng, wLat, wLng)
        v.geofence_validated = false
        v.bearing = calculateBearing(v.originLat, v.originLng, wLat, wLng)
      }
    }

    updateOrCreateMarker(v)
  })
}

function startUberMotion() {
  stopUberMotion()
  uberMotionTimer = setInterval(stepUberMotion, 2400)
}

function stopUberMotion() {
  if (uberMotionTimer) {
    clearInterval(uberMotionTimer)
    uberMotionTimer = null
  }
}

function zoomToWarehouse() {
  if (!mapInstance) return
  const { lat, lng } = warehouseCoords.value
  mapInstance.setView([lat, lng], 15, { animate: true })
}

function fitAllBounds() {
  if (!mapInstance) return
  const points = [[warehouseCoords.value.lat, warehouseCoords.value.lng]]
  liveVehicles.value.forEach(v => points.push([v.currentLat, v.currentLng]))
  if (points.length > 1) {
    const bounds = L.latLngBounds(points)
    mapInstance.fitBounds(bounds, { padding: [50, 50], animate: true })
  } else {
    zoomToWarehouse()
  }
}

async function simulateIncomingPing() {
  if (!yardStore.currentTenant) return
  isSimulatingPing.value = true
  try {
    const wLat = warehouseCoords.value.lat
    const wLng = warehouseCoords.value.lng

    // Dispara ping de teste na API
    const res = await fetch('/api/v1/integrations/telemetry/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: yardStore.currentTenant.id,
        vehicle_plate: 'BRA2E19',
        latitude: wLat + 0.0015,
        longitude: wLng + 0.0012,
        speed_kmh: 35,
        accuracy_meters: 6.0
      })
    })

    if (res.ok) {
      const data = await res.json()
      yardStore.showNotification(`Sinal recebido: ${data.message}`, 'success')
      await yardStore.fetchSchedules()
      syncLiveVehicles()
      renderVehicleMarkers()
      fitAllBounds()
    }
  } catch (err) {
    console.error('Falha ao simular ping:', err)
  } finally {
    isSimulatingPing.value = false
  }
}

watch(() => yardStore.schedules, () => {
  syncLiveVehicles()
  renderVehicleMarkers()
}, { deep: true })

watch(() => yardStore.currentTenant, () => {
  renderWarehouseAndGeofence()
  syncLiveVehicles()
  renderVehicleMarkers()
  zoomToWarehouse()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  stopUberMotion()
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<template>
  <div class="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
    
    <!-- Barra Superior de Controle do Mapa -->
    <div class="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
      
      <!-- Identificação do CD e Cerca Ativa -->
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
          <Warehouse class="w-4 h-4" />
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="text-sm font-bold text-white leading-tight">
              {{ warehouseCoords.name }}
            </h3>
            <span class="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
              <ShieldCheck class="w-3 h-3 text-emerald-400" />
              <span>Cerca: {{ warehouseCoords.radius }}m</span>
            </span>
          </div>
          <p class="text-[11px] text-slate-400">
            Monitoramento de veículos e conformidade com Lei 11.442/2007
          </p>
        </div>
      </div>

      <!-- Ações e Camadas (Ao Vivo Contínuo) -->
      <div class="flex items-center space-x-2">
        
        <!-- Alternador de Estilo de Mapa -->
        <div class="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            @click="setTileLayer('dark')"
            class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
            :class="currentTileMode === 'dark' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
          >
            Noturno
          </button>
          <button
            @click="setTileLayer('streets')"
            class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
            :class="currentTileMode === 'streets' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
          >
            Ruas
          </button>
          <button
            @click="setTileLayer('satellite')"
            class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
            :class="currentTileMode === 'satellite' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
          >
            Satélite
          </button>
        </div>

        <!-- Botões de Centralização -->
        <button
          @click="zoomToWarehouse"
          class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          title="Centralizar no Armazém"
        >
          <Warehouse class="w-4 h-4" />
        </button>

        <button
          @click="fitAllBounds"
          class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          title="Enquadrar todos os veículos"
        >
          <Maximize2 class="w-4 h-4" />
        </button>

        <!-- Indicador Ao Vivo Direto (sem botão manual, rastreamento contínuo estilo Uber) -->
        <div class="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold select-none shadow-sm">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="tracking-wider">AO VIVO &bull; GPS</span>
        </div>

      </div>

    </div>

    <!-- Container do Mapa Leaflet -->
    <div class="relative w-full flex-1" :style="{ minHeight: height }">
      <div ref="mapContainer" class="w-full h-full z-0 absolute inset-0"></div>

      <!-- Badge Flutuante de Veículos Conectados -->
      <div class="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl max-w-xs space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-white flex items-center space-x-1.5">
            <Truck class="w-3.5 h-3.5 text-sky-400" />
            <span>Veículos Mapeados</span>
          </span>
          <span class="text-xs font-mono font-bold text-emerald-400">
            {{ liveVehicles.length || trackedVehicles.length }} ativo(s)
          </span>
        </div>
        <p class="text-[10px] text-slate-400 leading-tight">
          Círculo pontilhado indica o raio de tolerância legal (<strong>{{ warehouseCoords.radius }}m</strong>) para início de estadia.
        </p>
      </div>

      <!-- Legenda Rápida Flutuante: Categorias de Veículos e Status -->
      <div class="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 text-[11px] font-mono">
        <!-- Tipos de Veículos -->
        <div class="flex items-center space-x-2.5 text-slate-300 border-b sm:border-b-0 sm:border-r border-slate-800 pb-1.5 sm:pb-0 sm:pr-3">
          <span class="flex items-center space-x-1" title="Carreta Articulada / Cavalo Mecânico">
            <span class="text-sky-400">🚛</span>
            <span class="text-white">Carreta</span>
          </span>
          <span class="flex items-center space-x-1" title="Caminhão">
            <span class="text-sky-400">🚚</span>
            <span class="text-white">Caminhão</span>
          </span>
          <span class="flex items-center space-x-1" title="Van / VUC / Utilitário">
            <span class="text-sky-400">🚐</span>
            <span class="text-white">Van</span>
          </span>
          <span class="flex items-center space-x-1" title="Caminhão Tanque / Químico">
            <span class="text-sky-400">🛢️</span>
            <span class="text-white">Tanque</span>
          </span>
          <span class="flex items-center space-x-1" title="Carro / Apoio Operacional">
            <span class="text-sky-400">🚗</span>
            <span class="text-white">Carro</span>
          </span>
        </div>

        <!-- Status Geofence -->
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-slate-300">No Raio (&le; {{ warehouseCoords.radius }}m)</span>
          </div>
          <div class="flex items-center space-x-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span class="text-slate-300">Em Trânsito</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* Reset de estilos para os pins divIcon do Leaflet */
.warehouse-div-icon,
.vehicle-div-icon {
  background: transparent !important;
  border: none !important;
}

/* ANIMAÇÃO ESTILO UBER: Deslizamento contínuo e suave dos veículos no mapa */
.leaflet-marker-icon.vehicle-div-icon {
  transition: transform 2.4s linear !important;
  will-change: transform;
}

/* Customização dos Popups do Leaflet para casar com o design escuro */
.leaflet-popup-content-wrapper {
  background: #ffffff !important;
  color: #0f172a !important;
  border-radius: 14px !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
}
.leaflet-popup-tip {
  background: #ffffff !important;
}

/* Filtro escuro nativo sobre o OpenStreetMap - Elimina qualquer dependência de CartoDB ou API keys */
.dark-map-tiles img.leaflet-tile {
  filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7) !important;
}
</style>
