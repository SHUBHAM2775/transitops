/**
 * Smart Dispatch Recommendation Engine
 * 
 * Scores and ranks Vehicle+Driver pairs for trip allocation
 * using a weighted multi-factor mathematical model.
 * 
 * Score = w₁·CapacityFit + w₂·DriverReliability + w₃·VehicleEfficiency + w₄·LicenseMatch + Penalties
 */

// ─── Types ──────────────────────────────────────────────────

export interface DispatchVehicle {
  id: string;
  name: string;        // e.g. "VAN-05"
  type: string;        // e.g. "Van", "Truck", "Mini"
  capacityKg: number;  // max load in kg
  odometer: number;    // current reading in km
  status: "Available" | "On Trip" | "In Shop" | "Retired";
  region: string;
}

export interface DispatchDriver {
  id: string;
  name: string;
  licenseCategory: string;  // "LMV" or "HMV"
  licenseExpiry: string;    // e.g. "12/2028" or "03/2025 EXPIRE"
  tripCompletionRate: number; // 0–100
  status: "Available" | "On Trip" | "Off Duty" | "Suspended";
}

export interface TripParams {
  cargoWeightKg: number;
  plannedDistanceKm: number;
}

export interface ScoreBreakdown {
  capacityFit: number;       // 0–1
  driverReliability: number; // 0–1
  vehicleEfficiency: number; // 0–1
  licenseMatch: number;      // 0 or 1
}

export interface ScoredCandidate {
  vehicle: DispatchVehicle;
  driver: DispatchDriver;
  score: number;             // 0–100
  breakdown: ScoreBreakdown;
  warnings: string[];
  disqualified: boolean;
  disqualifyReason?: string;
}

// ─── Constants (tune these) ─────────────────────────────────

const WEIGHTS = {
  capacityFit: 0.35,
  driverReliability: 0.25,
  vehicleEfficiency: 0.20,
  licenseMatch: 0.20,
} as const;

const MAX_ODOMETER_THRESHOLD = 500_000; // km — vehicles above this are penalized heavily

// License requirements per vehicle type
const LICENSE_REQUIREMENTS: Record<string, string> = {
  truck: "HMV",
  van: "LMV",
  mini: "LMV",
  bus: "HMV",
};

// ─── Helpers ────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function isLicenseExpired(expiry: string): boolean {
  // Handle formats like "03/2025 EXPIRE", "12/2028", "08/2021"
  const cleaned = expiry.replace(/\s*EXPIRE\s*/i, "").trim();
  const parts = cleaned.split("/");
  if (parts.length !== 2) return true;
  
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(year)) return true;
  
  const expiryDate = new Date(year, month - 1); // first of the expiry month
  return expiryDate < new Date();
}

function getRequiredLicense(vehicleType: string): string {
  return LICENSE_REQUIREMENTS[vehicleType.toLowerCase()] || "LMV";
}

// ─── Core Scoring ───────────────────────────────────────────

export function scoreCandidate(
  vehicle: DispatchVehicle,
  driver: DispatchDriver,
  trip: TripParams
): ScoredCandidate {
  const warnings: string[] = [];
  
  // ── Hard Disqualifications ──
  
  if (vehicle.status !== "Available") {
    return {
      vehicle, driver, score: 0,
      breakdown: { capacityFit: 0, driverReliability: 0, vehicleEfficiency: 0, licenseMatch: 0 },
      warnings: [], disqualified: true,
      disqualifyReason: `Vehicle is ${vehicle.status}`,
    };
  }
  
  if (driver.status !== "Available") {
    return {
      vehicle, driver, score: 0,
      breakdown: { capacityFit: 0, driverReliability: 0, vehicleEfficiency: 0, licenseMatch: 0 },
      warnings: [], disqualified: true,
      disqualifyReason: `Driver is ${driver.status}`,
    };
  }
  
  if (trip.cargoWeightKg > vehicle.capacityKg) {
    return {
      vehicle, driver, score: 0,
      breakdown: { capacityFit: 0, driverReliability: 0, vehicleEfficiency: 0, licenseMatch: 0 },
      warnings: [], disqualified: true,
      disqualifyReason: `Cargo ${trip.cargoWeightKg}kg exceeds capacity ${vehicle.capacityKg}kg`,
    };
  }
  
  if (isLicenseExpired(driver.licenseExpiry)) {
    return {
      vehicle, driver, score: 0,
      breakdown: { capacityFit: 0, driverReliability: 0, vehicleEfficiency: 0, licenseMatch: 0 },
      warnings: [], disqualified: true,
      disqualifyReason: `Driver license expired (${driver.licenseExpiry})`,
    };
  }
  
  // ── Factor 1: Capacity Fit (0–1) ──
  // Perfect = cargo exactly matches capacity. Penalize both overkill and tight fits.
  const capacityRatio = trip.cargoWeightKg / vehicle.capacityKg;
  const capacityFit = clamp(1 - Math.abs(1 - capacityRatio * 1.1), 0, 1); 
  // sweet spot is ~90% utilization
  
  const marginKg = vehicle.capacityKg - trip.cargoWeightKg;
  if (marginKg < 50) {
    warnings.push(`Tight margin: only ${marginKg}kg spare`);
  }
  
  // ── Factor 2: Driver Reliability (0–1) ──
  const driverReliability = clamp(driver.tripCompletionRate / 100, 0, 1);
  
  // ── Factor 3: Vehicle Efficiency (0–1) ──
  // Lower mileage = better
  const vehicleEfficiency = clamp(1 - (vehicle.odometer / MAX_ODOMETER_THRESHOLD), 0, 1);
  
  if (vehicle.odometer > 300_000) {
    warnings.push(`High mileage: ${vehicle.odometer.toLocaleString()} km`);
  }
  
  // ── Factor 4: License Match (0 or 1) ──
  const requiredLicense = getRequiredLicense(vehicle.type);
  const licenseMatch = driver.licenseCategory === requiredLicense || driver.licenseCategory === "HMV" ? 1 : 0;
  // HMV holders can drive LMV vehicles too
  
  if (licenseMatch === 0) {
    warnings.push(`License mismatch: ${driver.licenseCategory} for ${vehicle.type} (needs ${requiredLicense})`);
  }
  
  // ── Weighted Score ──
  const rawScore = (
    WEIGHTS.capacityFit * capacityFit +
    WEIGHTS.driverReliability * driverReliability +
    WEIGHTS.vehicleEfficiency * vehicleEfficiency +
    WEIGHTS.licenseMatch * licenseMatch
  ) * 100;
  
  const score = Math.round(clamp(rawScore, 0, 100));
  
  return {
    vehicle,
    driver,
    score,
    breakdown: { capacityFit, driverReliability, vehicleEfficiency, licenseMatch },
    warnings,
    disqualified: false,
  };
}

// ─── Rank All Pairs ─────────────────────────────────────────

export function rankCandidates(
  vehicles: DispatchVehicle[],
  drivers: DispatchDriver[],
  trip: TripParams
): ScoredCandidate[] {
  const results: ScoredCandidate[] = [];
  
  for (const vehicle of vehicles) {
    for (const driver of drivers) {
      const scored = scoreCandidate(vehicle, driver, trip);
      if (!scored.disqualified) {
        results.push(scored);
      }
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  return results;
}
