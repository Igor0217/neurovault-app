// ── NeuroBehavior — Biometría Conductual ─────────────────────────────────────
// Mide el comportamiento del usuario al ingresar su patrón GhostLogin
// y genera una puntuación de riesgo 0-100

export interface TouchEvent_NV {
  iconIndex:   number;   // qué ícono tocó
  timestamp:   number;   // ms desde epoch
  x:           number;   // coordenada X del toque
  y:           number;   // coordenada Y del toque
  touchArea:   number;   // área estimada del toque (radiusX * radiusY)
}

export interface BehaviorProfile {
  avgTimeBetweenTouches: number;  // ms promedio entre toques
  avgTouchArea:          number;  // área promedio del toque
  totalLoginTime:        number;  // ms totales para completar el patrón
  touchSequenceSpeed:    number;  // toques por segundo
  avgDistanceBetween:    number;  // distancia promedio entre toques (px)
  timestamp:             number;  // cuándo fue registrado
}

export interface RiskResult {
  score:       number;   // 0-100
  level:       'safe' | 'warning' | 'danger';
  label:       string;
  confidence:  number;   // % confianza
  details:     string[]; // explicación
}

const PROFILES_KEY  = 'nv_behavior_profiles';
const MAX_PROFILES  = 10; // mantener últimos 10 registros

// ── Guardar / cargar perfiles ────────────────────────────────────────────────
export function loadProfiles(): BehaviorProfile[] {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]'); }
  catch { return []; }
}

export function saveProfile(profile: BehaviorProfile) {
  const all = loadProfiles();
  all.push(profile);
  // Mantener solo los últimos MAX_PROFILES
  const trimmed = all.slice(-MAX_PROFILES);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(trimmed));
}

export function clearProfiles() {
  localStorage.removeItem(PROFILES_KEY);
}

// ── Construir perfil desde eventos ──────────────────────────────────────────
export function buildProfile(events: TouchEvent_NV[]): BehaviorProfile | null {
  if (events.length < 2) return null;

  const times: number[] = [];
  const areas: number[] = [];
  const distances: number[] = [];

  for (let i = 1; i < events.length; i++) {
    times.push(events[i].timestamp - events[i-1].timestamp);
    areas.push(events[i].touchArea);
    const dx = events[i].x - events[i-1].x;
    const dy = events[i].y - events[i-1].y;
    distances.push(Math.sqrt(dx*dx + dy*dy));
  }
  areas.push(events[0].touchArea); // incluir primer toque

  const avg = (arr: number[]) => arr.reduce((a,b) => a+b, 0) / arr.length;

  const totalTime = events[events.length-1].timestamp - events[0].timestamp;

  return {
    avgTimeBetweenTouches: avg(times),
    avgTouchArea:          avg(areas),
    totalLoginTime:        totalTime,
    touchSequenceSpeed:    events.length / (totalTime / 1000),
    avgDistanceBetween:    avg(distances),
    timestamp:             Date.now(),
  };
}

// ── Calcular distancia entre dos perfiles (KNN) ──────────────────────────────
function profileDistance(a: BehaviorProfile, b: BehaviorProfile): number {
  // Normalizar cada métrica y calcular distancia euclidiana ponderada
  const weights = {
    avgTimeBetweenTouches: 0.35,
    avgTouchArea:          0.15,
    totalLoginTime:        0.25,
    touchSequenceSpeed:    0.15,
    avgDistanceBetween:    0.10,
  };

  const normalize = (val: number, ref: number) =>
    ref === 0 ? 0 : Math.abs(val - ref) / ref;

  let dist = 0;
  dist += normalize(a.avgTimeBetweenTouches, b.avgTimeBetweenTouches) * weights.avgTimeBetweenTouches;
  dist += normalize(a.avgTouchArea,          b.avgTouchArea)          * weights.avgTouchArea;
  dist += normalize(a.totalLoginTime,        b.totalLoginTime)        * weights.totalLoginTime;
  dist += normalize(a.touchSequenceSpeed,    b.touchSequenceSpeed)    * weights.touchSequenceSpeed;
  dist += normalize(a.avgDistanceBetween,    b.avgDistanceBetween)    * weights.avgDistanceBetween;

  return dist;
}

// ── Calcular perfil promedio de referencia ───────────────────────────────────
function averageProfile(profiles: BehaviorProfile[]): BehaviorProfile {
  const avg = (key: keyof BehaviorProfile) =>
    (profiles.reduce((s, p) => s + (p[key] as number), 0)) / profiles.length;

  return {
    avgTimeBetweenTouches: avg('avgTimeBetweenTouches'),
    avgTouchArea:          avg('avgTouchArea'),
    totalLoginTime:        avg('totalLoginTime'),
    touchSequenceSpeed:    avg('touchSequenceSpeed'),
    avgDistanceBetween:    avg('avgDistanceBetween'),
    timestamp:             Date.now(),
  };
}

// ── Evaluación de riesgo principal ───────────────────────────────────────────
export function evaluateRisk(current: BehaviorProfile): RiskResult {
  const profiles = loadProfiles();

  // Si hay menos de 3 perfiles, aún estamos aprendiendo
  if (profiles.length < 3) {
    return {
      score:      0,
      level:      'safe',
      label:      'Aprendiendo tu comportamiento',
      confidence: Math.round((profiles.length / 3) * 100),
      details:    [
        `Registros recopilados: ${profiles.length} de 3 mínimos`,
        'El sistema necesita más ingresos para establecer tu perfil',
        'Por ahora el acceso es normal — sin restricciones',
      ],
    };
  }

  // KNN: usar los últimos 7 perfiles como referencia
  const reference = profiles.slice(-7);
  const avgRef    = averageProfile(reference);
  const dist      = profileDistance(current, avgRef);

  // Convertir distancia a score 0-100
  // dist ~0 = idéntico al patrón habitual → score bajo = seguro
  // dist >1 = muy diferente → score alto = peligroso
  const rawScore = Math.min(100, Math.round(dist * 100));

  // Determinar nivel
  let level: RiskResult['level'];
  let label: string;
  const details: string[] = [];

  // Analizar qué métricas se desviaron
  const timeDiff  = Math.abs(current.avgTimeBetweenTouches - avgRef.avgTimeBetweenTouches) / avgRef.avgTimeBetweenTouches;
  const speedDiff = Math.abs(current.touchSequenceSpeed    - avgRef.touchSequenceSpeed)    / avgRef.touchSequenceSpeed;
  const timeTDiff = Math.abs(current.totalLoginTime        - avgRef.totalLoginTime)        / avgRef.totalLoginTime;

  if (timeDiff > 0.5)  details.push(`Velocidad entre toques inusual (${timeDiff > 0 ? 'más lento' : 'más rápido'} de lo normal)`);
  if (speedDiff > 0.5) details.push(`Ritmo de selección diferente al habitual`);
  if (timeTDiff > 0.6) details.push(`Tiempo total de ingreso atípico`);
  if (details.length === 0) details.push('Comportamiento consistente con tu perfil habitual');

  details.push(`Distancia conductual: ${(dist * 100).toFixed(1)}% de desviación`);
  details.push(`Basado en ${reference.length} ingresos anteriores`);

  if (rawScore <= 30) {
    level = 'safe';
    label = 'Comportamiento habitual detectado';
  } else if (rawScore <= 70) {
    level = 'warning';
    label = 'Comportamiento ligeramente inusual';
  } else {
    level = 'danger';
    label = 'Comportamiento muy diferente al habitual';
  }

  const confidence = Math.min(99, Math.round(50 + (reference.length / MAX_PROFILES) * 49));

  return { score: rawScore, level, label, confidence, details };
}

// ── Estadísticas para el Panel ───────────────────────────────────────────────
export interface BehaviorStats {
  totalLogins:     number;
  avgRiskScore:    number;
  lastAnomaly:     string | null;
  suspiciousCount: number;
  confidenceLevel: number;
  isLearning:      boolean;
}

export function getBehaviorStats(): BehaviorStats {
  const profiles = loadProfiles();
  const history: Array<{score:number; date:string}> =
    JSON.parse(localStorage.getItem('nv_risk_history') || '[]');

  const suspicious = history.filter(h => h.score > 70).length;
  const lastAnomaly = history.filter(h => h.score > 30).slice(-1)[0]?.date || null;
  const avgRisk = history.length > 0
    ? Math.round(history.reduce((s,h) => s+h.score, 0) / history.length)
    : 0;

  return {
    totalLogins:     profiles.length,
    avgRiskScore:    avgRisk,
    lastAnomaly,
    suspiciousCount: suspicious,
    confidenceLevel: Math.min(99, Math.round((profiles.length / MAX_PROFILES) * 99)),
    isLearning:      profiles.length < 3,
  };
}

export function saveRiskResult(score: number) {
  const history = JSON.parse(localStorage.getItem('nv_risk_history') || '[]');
  history.push({
    score,
    date: new Date().toLocaleDateString('es-CO')
  });
  localStorage.setItem('nv_risk_history', JSON.stringify(history.slice(-50)));
}
