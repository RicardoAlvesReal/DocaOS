import math
from typing import Tuple, Optional


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula a distância geodésica em metros entre duas coordenadas GPS
    usando a fórmula de Haversine (esferoide terrestre de raio médio 6.371.000m).
    Execução pura em Python com latência de microssegundos e zero dependências externas.
    """
    R = 6371000.0  # Raio médio da Terra em metros

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))

    return R * c


def validate_driver_geofence(
    driver_lat: Optional[float],
    driver_lon: Optional[float],
    warehouse_lat: Optional[float],
    warehouse_lon: Optional[float],
    radius_meters: int = 1000
) -> Tuple[bool, Optional[float], str]:
    """
    Valida se o motorista está dentro do raio permitido de cerca eletrônica (Geofence).
    Retorna uma tupla: (is_inside: bool, distance_meters: float, status_code: str)
    status_code: 'DENTRO_DO_PATIO' | 'FORA_DO_RAIO' | 'SEM_COORDENADAS'
    """
    if driver_lat is None or driver_lon is None:
        return False, None, "SEM_GPS"

    # Se o armazém ainda não tiver latitude/longitude configurada, considera coordenadas padrão do pátio
    if warehouse_lat is None or warehouse_lon is None:
        # Pátio logístico padrão de demonstração / fallback
        warehouse_lat = -20.3155
        warehouse_lon = -40.3128

    distance = calculate_haversine_distance(driver_lat, driver_lon, warehouse_lat, warehouse_lon)
    is_inside = distance <= radius_meters

    status_code = "DENTRO_DO_PATIO" if is_inside else "FORA_DO_RAIO"
    return is_inside, round(distance, 1), status_code


def format_distance(distance_meters: Optional[float]) -> str:
    """Formata distância para leitura humana amigável (ex: '350 m' ou '2.4 km')"""
    if distance_meters is None:
        return "N/D"
    if distance_meters < 1000:
        return f"{int(distance_meters)} m"
    return f"{distance_meters / 1000.0:.1f} km"
