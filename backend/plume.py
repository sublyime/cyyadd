import math
from typing import Literal

# Pasquill-Gifford stability classes
STABILITY_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F']


# Briggs plume rise model (simplified)
def plume_rise_briggs(Qh, u, stability, terrain_slope=0.0, building_height=0.0):
    """
    Qh: buoyancy flux (m^4/s^3)
    u: wind speed (m/s)
    stability: 'A'-'F'
    terrain_slope: radians (positive = uphill, negative = downhill)
    building_height: height of nearby building (m)
    Returns plume rise (delta_h) in meters, adjusted for terrain/buildings
    """
    # Gaussian puff model (instantaneous release)
    # Base rise
    if stability in ['A', 'B', 'C']:
        delta_h = 1.6 * (Qh ** (1/3)) / u
    else:
        delta_h = 2.6 * (Qh ** (1/3)) / u
    # Terrain effect: uphill reduces rise, downhill increases
    delta_h *= (1 + 0.5 * terrain_slope)
    # Building downwash: if building is tall, reduce rise
    if building_height > 0:
        delta_h = min(delta_h, 3 * building_height)
    return delta_h


# Gaussian plume model with terrain and building effects
def gaussian_plume(
    x, y, z, Q, u, H, sy, sz,
    terrain_height=0.0, terrain_gradient=0.0, building_height=0.0
):
    """
    x: downwind (m)
    y: crosswind (m)
    z: height (m)
    Q: emission rate (g/s)
    u: wind speed (m/s)
    H: effective stack height (m)
    sy, sz: dispersion parameters (m)
    terrain_height: height difference at (x, y) vs. source (m)
    terrain_gradient: slope (radians, positive = uphill)
    # Instantaneous release helper (calls puff at t>0)
    building_height: height of nearby building (m)
    """
    # Adjust effective height for terrain
    H_eff = H + terrain_height
    # Building downwash: if plume below 2.5x building, force plume to building top
    if building_height > 0 and H_eff < 2.5 * building_height:
        H_eff = building_height
    exp1 = math.exp(-0.5 * (y / sy) ** 2)
    exp2 = math.exp(-0.5 * ((z - H_eff) / sz) ** 2)
    exp3 = math.exp(-0.5 * ((z + H_eff) / sz) ** 2)
    denom = 2 * math.pi * u * sy * sz
    return (Q / denom) * exp1 * (exp2 + exp3)

# Dispersion parameters (Pasquill-Gifford, surface)
def pasquill_gifford_sigmas(x, stability: Literal['A','B','C','D','E','F']):
    # x: downwind distance (m)
    # Returns (sy, sz) in meters
    # Example coefficients for rural, surface release
    coeffs = {
        'A': (0.22, 0.20),
        'B': (0.16, 0.12),
        'C': (0.11, 0.08),
        'D': (0.08, 0.06),
        'E': (0.06, 0.03),
        'F': (0.04, 0.016)
    }
    a, b = coeffs[stability]
    sy = a * x ** 0.894
    sz = b * x ** 0.894
    return sy, sz
