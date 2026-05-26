import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, BottomNav, Account, loadAccounts, saveAccounts,
         neuroTransform, passwordStrength, strengthLabel, getCategoryColor } from './shared';

const ICONS_MAP: Record<string, string> = {
  netflix: '📺', instagram: '📸', tiktok: '🎵', facebook: '👤', twitter: '🐦',
  gmail: '✉️', outlook: '📧', yahoo: '📬',
  campus: '🎓', universidad: '🎓', areandina: '🎓', escuela: '🏫',
  banco: '🏦', nequi: '💳', bancolombia: '🏦',
};

function getIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const key of Object.keys(ICONS_MAP)) {
    if (lower.includes(key)) return ICONS_MAP[key];
  }
  return '🔑';
}

function getCat(name: string): Account['cat'] {
  const lower = name.toLowerCase();
  if (['instagram','tiktok','facebook','twitter','netflix','spotify','youtube'].some(k => lower.includes(k))) return 'redes';
  if (['gmail','outlook','yahoo','correo','email'].some(k => lower.includes(k))) return 'email';
  if (['campus','universidad','areandina','escuela','colegio','univ'].some(k => lower.includes(k))) return 'univ';
  return 'otro';
}

export default function Screen5CreatePassword() {
  const nav = useNavigate();
  const [service, setService] = useState('');
  const [email, setEmail]     = useState('');
  const [phrase, setPhrase]   = useState('');
  const [saved, setSaved]     = useState(false);

  const generated = neuroTransform(phrase);
  const str = passwordStrength(generated);
  const { label: strLabel, color: strColor, level } = strengthLabel(str);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #E5E7EB', fontSize: 13, color: C.dark,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, Arial, sans-serif',
    background: C.white,
  };

  const handleSave = () => {
    if (!service.trim() || !email.trim() || !generated) return;
    const cat = getCat(service);
    const newAcc: Account = {
      id: Date.now().toString(),
      icon: getIcon(service),
      name: service.trim(),
      user: email.trim(),
      password: generated,
      level,
      color: getCategoryColor(cat),
      cat,
    };
    const all = loadAccounts();
    saveAccounts([...all, newAcc]);
    setSaved(true);
    setTimeout(() => nav('/vault'), 900);
  };

  return (
    <div style={{ width: '100%', height: '100%', background: C.white, display: 'flex',
      flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '52px 18px 14px' }}>
        <span onClick={() => nav('/vault')} style={{ fontSize: 13, color: C.indigo, fontWeight: 700, cursor: 'pointer', marginRight: 10 }}>← Mis Claves</span>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 800, color: C.dark, textAlign: 'center' }}>Nueva clave</span>
        <span style={{ width: 70 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px', paddingBottom: 80,
        display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 11, padding: '3px 12px', borderRadius: 20,
          background: C.redBg, color: C.red, fontWeight: 700, alignSelf: 'flex-start' }}>NeuroPass AI</span>

        <div>
          <div style={{ fontSize: 10, color: C.grayLight, marginBottom: 4, fontWeight: 600 }}>Nombre del servicio *</div>
          <input value={service} onChange={e => setService(e.target.value)}
            placeholder="ej., Netflix, Gmail, Campus Virtual" style={inputStyle} />
        </div>

        <div>
          <div style={{ fontSize: 10, color: C.grayLight, marginBottom: 4, fontWeight: 600 }}>Usuario / email *</div>
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="ej., alex@gmail.com" style={inputStyle} />
        </div>

        <div style={{ background: C.grayBg, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 9, color: C.grayLight, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            Escribe una frase memorable
          </div>
          <input value={phrase} onChange={e => setPhrase(e.target.value)}
            placeholder='ej. "Mi perro Max nació en 2020"'
            style={{ ...inputStyle, border: 'none', background: 'transparent',
              padding: 0, fontStyle: 'italic', color: C.gray }} />
        </div>

        {generated && (
          <>
            <div style={{ textAlign: 'center', fontSize: 20, color: C.indigo }}>↓</div>
            <div style={{ background: C.indigoBg, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, color: C.indigo, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Contraseña generada</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#3730A3',
                fontFamily: 'monospace', wordBreak: 'break-all' }}>{generated}</div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${str}%`, background: strColor,
                borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontSize: 11, color: strColor, fontWeight: 700 }}>{strLabel}</div>
            <div style={{ background: C.grayBg2, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 8 }}>¿Por qué es segura?</div>
              {['Mayúsculas y minúsculas', 'Símbolos especiales (!_#@$)',
                'Números intercalados', 'Sin palabras de diccionario'].map((t, i) => (
                <div key={i} style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>✓ {t}</div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <div onClick={handleSave}
            style={{ flex: 2, padding: '13px 0', borderRadius: 10,
              background: saved ? C.green : (!service || !email || !generated) ? '#9CA3AF' : C.indigo,
              color: C.white, fontWeight: 700, fontSize: 13, textAlign: 'center', cursor: 'pointer',
              transition: 'background 0.3s' }}>
            {saved ? '✅ Guardado' : 'Guardar en bóveda'}
          </div>
          <div onClick={() => setPhrase(p => p.trimEnd() + ' ')}
            style={{ flex: 1, padding: '13px 0', borderRadius: 10, background: C.grayBg,
              color: C.gray, fontWeight: 700, fontSize: 13, textAlign: 'center', cursor: 'pointer' }}>
            Regenerar
          </div>
        </div>
        {(!service || !email || !generated) && (
          <div style={{ fontSize: 11, color: C.grayLight, textAlign: 'center' }}>
            * Completa todos los campos para guardar
          </div>
        )}
      </div>
      <BottomNav active="new" />
    </div>
  );
}
