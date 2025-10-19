import math
from typing import Literal, Tuple

STABILITY_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F']

def plume_rise_briggs(
    Qh: float, 
    u: float, 
    stability: str, 
    terrain_slope: float = 0.0, 
    building_height: float = 0.0
) -> float:
    """
    Calculate plume rise using Briggs model.
    
    Args:
        Qh: Buoyancy flux (m^4/s^3)
        u: Wind speed (m/s)
        stability: Pasquill-Gifford stability class ('A'-'F')
        terrain_slope: Slope in radians (positive = uphill, negative = downhill)
        building_height: Height of nearby building (m)
    
    Returns:
        Plume rise (delta_h) in meters
    """
    if u <= 0:
        raise ValueError("Wind speed must be positive")
    
    # Base rise calculation
    if stability in ['A', 'B', 'C']:
        delta_h = 1.6 * (Qh ** (1/3)) / u
    else:
        delta_h = 2.6 * (Qh ** (1/3)) / u
    
    # Terrain effect: uphill reduces rise, downhill increases
    delta_h *= (1 + 0.5 * terrain_slope)
    
    # Building downwash: if building is tall, limit rise to 3x building height
    if building_height > 0:
        delta_h = min(delta_h, 3 * building_height)
    
    return max(0, delta_h)

def gaussian_plume(
    x: float,
    y: float,
    z: float,
    Q: float,
    u: float,
    H: float,
    sy: float,
    sz: float,
    terrain_height: float = 0.0,
    terrain_gradient: float = 0.0,
    building_height: float = 0.0
) -> float:
    """
    Calculate Gaussian plume concentration at a receptor point.
    
    Args:
        x: Downwind distance (m)
        y: Crosswind distance (m)
        z: Height above ground (m)
        Q: Emission rate (g/s)
        u: Wind speed (m/s)
        H: Effective stack height (m)
        sy: Lateral dispersion parameter (m)
        sz: Vertical dispersion parameter (m)
        terrain_height: Height difference at receptor vs. source (m)
        terrain_gradient: Terrain slope (radians)
        building_height: Height of nearby building (m)
    
    Returns:
        Concentration at receptor (µg/m³ or g/m³ depending on Q units)
    """
    if x <= 0 or u <= 0 or sy <= 0 or sz <= 0:
        raise ValueError("x, u, sy, sz must all be positive")
    
    # Adjust effective height for terrain
    H_eff = H + terrain_height
    
    # Building downwash: if plume below 2.5x building height, force to building top
    if building_height > 0 and H_eff < 2.5 * building_height:
        H_eff = building_height
    
    # Ensure positive height
    H_eff = max(0, H_eff)
    
    # Gaussian formula with reflection at ground (z=0)
    try:
        # Lateral component
        exp_y = math.exp(-0.5 * (y / sy) ** 2)
        
        # Vertical components (direct + reflection)
        exp_z_up = math.exp(-0.5 * ((z - H_eff) / sz) ** 2) if sz > 0 else 0
        exp_z_down = math.exp(-0.5 * ((z + H_eff) / sz) ** 2) if sz > 0 else 0
        
        # Denominator
        denom = 2 * math.pi * u * sy * sz
        
        if denom == 0:
            return 0.0
        
        # Calculate concentration
        c = (Q / denom) * exp_y * (exp_z_up + exp_z_down)
        
        return max(0, c)
    except (ValueError, OverflowError):
        return 0.0

def pasquill_gifford_sigmas(
    x: float, 
    stability: Literal['A', 'B', 'C', 'D', 'E', 'F']
) -> Tuple[float, float]:
    """
    Calculate Pasquill-Gifford dispersion parameters.
    
    Args:
        x: Downwind distance (m)
        stability: Pasquill-Gifford stability class
    
    Returns:
        Tuple of (sy, sz) dispersion parameters in meters
    """
    if x <= 0:
        raise ValueError("Downwind distance must be positive")
    
    if stability not in STABILITY_CLASSES:
        raise ValueError(f"Stability must be one of {STABILITY_CLASSES}")
    
    # Coefficients for rural, surface-level release
    # Based on Pasquill-Gifford curves
    coeffs = {
        'A': (0.22, 0.20),    # Very unstable
        'B': (0.16, 0.12),    # Unstable
        'C': (0.11, 0.08),    # Slightly unstable
        'D': (0.08, 0.06),    # Neutral
        'E': (0.06, 0.03),    # Slightly stable
        'F': (0.04, 0.016)    # Stable
    }
    
    a, b = coeffs[stability]
    
    # Power law relationship: sigma = a * x^b
    sy = a * (x ** 0.894)
    sz = b * (x ** 0.894)
    
    return sy, sz

def calculate_stability_sigma(
    x: float,
    u: float,
    solar_radiation: float = 500.0,
    cloud_cover: float = 0.5,
    wind_category: int = 3
) -> Tuple[str, float, float]:
    """
    Estimate Pasquill-Gifford stability class and sigmas based on meteorology.
    
    Args:
        x: Downwind distance (m)
        u: Wind speed (m/s)
        solar_radiation: Solar radiation (W/m²), 0-1000
        cloud_cover: Cloud cover fraction (0-1)
        wind_category: Wind speed category (1-6)
    
    Returns:
        Tuple of (stability_class, sy, sz)
    """
    # Simplified stability estimation
    if solar_radiation > 700 and cloud_cover < 0.3:
        if u < 2:
            stability = 'A'
        elif u < 4:
            stability = 'B'
        else:
            stability = 'C'
    elif solar_radiation > 400 and cloud_cover < 0.6:
        stability = 'C'
    elif cloud_cover > 0.7 and u > 4:
        stability = 'D'
    elif cloud_cover > 0.8 and u < 2:
        stability = 'E'
    elif cloud_cover > 0.9 and u < 3:
        stability = 'F'
    else:
        stability = 'D'  # Default to neutral
    
    sy, sz = pasquill_gifford_sigmas(x, stability)
    return stability, sy, sz