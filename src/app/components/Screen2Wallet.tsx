import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, BottomNav, Badge, Account, loadAccounts } from './shared';

const FILTERS = ['Todos', 'Redes', 'Email', 'Univ.', 'Otro'];

export default function Screen2Wallet() {
  const nav = useNavigate();
  const [filter, setFilter] = useState('Todos');
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    setAccounts(loadAccounts());
  }, []);

  const filtered = accounts.filter(a => {
    if (filter === 'Todos') return true;
    if (filter === 'Redes') return a.cat === 'redes';
    if (filter === 'Email') return a.cat === 'email';
    if (filter === 'Univ.') return a.cat === 'univ';
    if (filter === 'Otro')  return a.cat === 'otro';
    return true;
  });

  return (
    <div style={{ width: '100%', height: '100%', background: C.white, display: 'flex',
      flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 18px 10px' }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>Mis Claves</span>
        <span onClick={() => nav('/new')} style={{ fontSize: 22, color: C.indigo, cursor: 'pointer' }}>➕</span>
      </div>

      <div onClick={() => nav('/search')}
        style={{ margin: '0 18px 12px', padding: '10px 14px', background: C.grayBg,
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <span style={{ fontSize: 15 }}>🔍</span>
        <span style={{ fontSize: 12, color: C.grayLight }}>Buscar por red o nombre de usuario...</span>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 18px 12px', overflowX: 'auto' }}>
        {FILTERS.map(f => (
          <div key={f} onClick={() => setFilter(f)}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              background: filter === f ? C.indigo : C.white,
              color: filter === f ? C.white : C.gray,
              border: filter === f ? 'none' : '1.5px solid #E5E7EB' }}>
            {f}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px', paddingBottom: 70 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60, color: C.grayLight }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 8 }}>
              {accounts.length === 0 ? 'Tu billetera está vacía' : 'Sin resultados'}
            </div>
            <div style={{ fontSize: 12, marginBottom: 20 }}>
              {accounts.length === 0 ? 'Agrega tu primera contraseña' : 'Prueba otro filtro'}
            </div>
            {accounts.length === 0 && (
              <div onClick={() => nav('/new')}
                style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10,
                  background: C.indigo, color: C.white, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                ➕ Agregar cuenta
              </div>
            )}
          </div>
        ) : (
          filtered.map((a) => (
            <div key={a.id} onClick={() => nav('/detail', { state: a })}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
                borderBottom: '1px solid #F5F5F5', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: a.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{a.name}</div>
                <div style={{ fontSize: 11, color: C.grayLight }}>{a.user}</div>
              </div>
              <Badge level={a.level} />
            </div>
          ))
        )}
      </div>
      <BottomNav active="vault" />
    </div>
  );
}
