import { useNavigate } from 'react-router-dom';

export const C = {
  indigo: '#4338CA', indigoBg: '#EDE9FE',
  dark: '#1E3A5F', gray: '#374151', grayLight: '#9CA3AF',
  grayBg: '#F3F4F6', grayBg2: '#F9FAFB',
  green: '#10B981', greenBg: '#D1FAE5',
  orange: '#F59E0B', orangeBg: '#FEF3C7',
  red: '#EF4444', redBg: '#FFE4E6',
  white: '#FFFFFF',
};

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface Account {
  id: string;
  icon: string;
  name: string;
  user: string;
  password: string;
  level: 'NS' | 'AD' | 'PR';
  color: string;
  cat: 'redes' | 'email' | 'univ' | 'otro';
}

// ── Storage ──────────────────────────────────────────────────────────────────
const ACCOUNTS_KEY = 'nv_accounts';
const PATTERN_KEY  = 'nv_pattern';

export function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveAccounts(accounts: Account[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadPattern(): number[] {
  try {
    const raw = localStorage.getItem(PATTERN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function savePattern(pattern: number[]) {
  localStorage.setItem(PATTERN_KEY, JSON.stringify(pattern));
}

// ── NeuroPass AI ─────────────────────────────────────────────────────────────
export function neuroTransform(phrase: string): string {
  if (!phrase.trim()) return '';
  const subs: Record<string, string> = {
    a:'@', e:'3', i:'1', o:'0', s:'$',
    A:'@', E:'3', I:'1', O:'0', S:'$',
    u:'v', U:'V',
  };
  const words = phrase.trim().split(/\s+/);
  const parts = words.map((w, i) => {
    if (/^\d+$/.test(w)) return w;
    const first = w.charAt(0).toUpperCase();
    const rest = w.slice(1).split('').map(c => subs[c] || c).join('');
    return first + rest;
  });
  const joined = parts.join('_');
  // Mover números al final con #
  const withHash = joined.replace(/_(\d+)(?=(_|$))/g, '#$1');
  return withHash + '!';
}

export function passwordStrength(pass: string): number {
  if (!pass) return 0;
  let s = 0;
  if (pass.length >= 8)  s += 20;
  if (pass.length >= 12) s += 10;
  if (/[A-Z]/.test(pass)) s += 20;
  if (/[a-z]/.test(pass)) s += 10;
  if (/[0-9]/.test(pass)) s += 20;
  if (/[^A-Za-z0-9]/.test(pass)) s += 20;
  return Math.min(s, 100);
}

export function strengthLabel(s: number): { label: string; color: string; level: Account['level'] } {
  if (s >= 80) return { label: `NeuroSecure · ${Math.floor(s * 3)} años estimados`, color: '#10B981', level: 'NS' };
  if (s >= 50) return { label: 'Adaptativa · Seguridad media', color: '#F59E0B', level: 'AD' };
  return { label: 'Débil · Necesita mejora', color: '#EF4444', level: 'PR' };
}

export function getCategoryColor(cat: string): string {
  const map: Record<string, string> = {
    redes: '#FFE4E6', email: '#EDE9FE', univ: '#D1FAE5', otro: '#FEF3C7'
  };
  return map[cat] || '#F3F4F6';
}

// ── Componentes compartidos ──────────────────────────────────────────────────
export function BottomNav({ active }: { active: 'vault' | 'new' | 'panel' | 'profile' }) {
  const nav = useNavigate();
  const tabs = [
    { id: 'vault',   icon: '🔒', label: 'Mis Claves', route: '/vault'   },
    { id: 'new',     icon: '➕', label: 'Nuevo',      route: '/new'     },
    { id: 'panel',   icon: '📊', label: 'Panel',      route: '/panel'   },
    { id: 'profile', icon: '👤', label: 'Perfil',     route: '/profile' },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64,
      background: '#fff', borderTop: '1px solid #F0F0F0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 50 }}>
      {tabs.map(t => (
        <div key={t.id} onClick={() => nav(t.route)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, cursor: 'pointer', padding: '4px 8px' }}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontSize: 10, fontWeight: active === t.id ? 700 : 400,
            color: active === t.id ? C.indigo : C.grayLight }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Badge({ level }: { level: 'NS' | 'AD' | 'PR' }) {
  const map = {
    NS: { bg: C.greenBg,  tx: C.green  },
    AD: { bg: C.indigoBg, tx: C.indigo },
    PR: { bg: C.orangeBg, tx: C.orange },
  };
  const s = map[level];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px',
      borderRadius: 5, background: s.bg, color: s.tx }}>{level}</span>
  );
}

// Nombres de íconos para el OCR y la libreta
export const ICON_NAMES: Record<string, string> = {
  '⭐': 'estrella',
  '📘': 'libro',
  '🎧': 'audifono',
  '🔒': 'candado',
  '📱': 'celular',
  '💻': 'computador',
  '🎯': 'diana',
  '🌙': 'luna',
  '🔑': 'llave',
  '🛡️': 'escudo',
  '🗝️': 'llave antigua',
  '🔐': 'candado llave',
};
