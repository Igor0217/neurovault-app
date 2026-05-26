import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, BottomNav, Badge, Account, loadAccounts } from './shared';

export default function Screen3Search() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => { setAccounts(loadAccounts()); }, []);

  const results = q.length > 0
    ? accounts.filter(a =>
        a.name.toLowerCase().includes(q.toLowerCase()) ||
        a.user.toLowerCase().includes(q.toLowerCase()))
    : [];

  const recent = accounts.slice(-3).reverse();

  const highlight = (text: string) => {
    if (!q) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return <span>{text}</span>;
    return <span>
      {text.slice(0, idx)}
      <span style={{ color: C.indigo, fontWeight: 800 }}>{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </span>;
  };

  return (
    <div style={{ width: '100%', height: '100%', background: C.white, display: 'flex',
      flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '52px 18px 14px' }}>
        <span onClick={() => nav('/vault')} style={{ fontSize: 18, color: C.indigo, cursor: 'pointer' }}>◀</span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: C.grayBg, borderRadius: 12,
          border: `1.5px solid ${q ? C.indigo : 'transparent'}` }}>
          <span style={{ fontSize: 15 }}>🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar por red o usuario..." autoFocus
            style={{ border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: C.dark, flex: 1 }} />
          {q && <span onClick={() => setQ('')} style={{ fontSize: 13, color: C.grayLight, cursor: 'pointer' }}>✕</span>}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px', paddingBottom: 70 }}>
        {q.length > 0 ? (
          <>
            <div style={{ fontSize: 11, color: C.grayLight, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
              Resultados para "{q}"
            </div>
            {results.length === 0
              ? <div style={{ fontSize: 13, color: C.grayLight, textAlign: 'center', marginTop: 30 }}>
                  No encontramos ninguna cuenta con ese nombre
                </div>
              : results.map(a => (
                <div key={a.id} onClick={() => nav('/detail', { state: a })}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                    borderRadius: 10, border: `1px solid ${C.indigoBg}`, background: '#FAFAFE',
                    cursor: 'pointer', marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: a.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{highlight(a.name)}</div>
                    <div style={{ fontSize: 11, color: C.grayLight }}>{a.user}</div>
                  </div>
                  <Badge level={a.level} />
                </div>
              ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: C.grayLight, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
              Cuentas recientes
            </div>
            {recent.length === 0
              ? <div style={{ fontSize: 13, color: C.grayLight, textAlign: 'center', marginTop: 30 }}>
                  Aún no tienes cuentas guardadas
                </div>
              : recent.map(a => (
                <div key={a.id} onClick={() => nav('/detail', { state: a })}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
                    borderBottom: '1px solid #F5F5F5', cursor: 'pointer' }}>
                  <span style={{ fontSize: 16, color: C.grayLight }}>🕐</span>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: a.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: C.grayLight }}>{a.user}</div>
                  </div>
                  <Badge level={a.level} />
                </div>
              ))}
            <div style={{ fontSize: 11, color: C.grayLight, textAlign: 'center', marginTop: 16 }}>
              Busca también por usuario: <span style={{ color: C.indigo, fontWeight: 700 }}>@tuusuario</span>
            </div>
          </>
        )}
      </div>
      <BottomNav active="vault" />
    </div>
  );
}
