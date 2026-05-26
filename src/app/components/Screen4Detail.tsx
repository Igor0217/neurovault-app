import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { C, BottomNav, Badge, Account, loadAccounts, saveAccounts } from './shared';

export default function Screen4Detail() {
  const nav = useNavigate();
  const { state } = useLocation();
  const acc = state as Account;
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  if (!acc) { nav('/vault'); return null; }

  const copy = (what: 'user' | 'pass') => {
    const text = what === 'user' ? acc.user : acc.password;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(what);
    setTimeout(() => setCopied(''), 2000);
  };

  const deleteAccount = () => {
    const all = loadAccounts().filter(a => a.id !== acc.id);
    saveAccounts(all);
    nav('/vault');
  };

  return (
    <div style={{ width: '100%', height: '100%', background: C.white, display: 'flex',
      flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 18px 16px' }}>
        <span onClick={() => nav('/vault')} style={{ fontSize: 13, color: C.indigo, fontWeight: 700, cursor: 'pointer' }}>← Mis Claves</span>
        <span onClick={() => nav('/edit', { state: acc })} style={{ fontSize: 18, color: C.indigo, cursor: 'pointer' }}>✏️</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: acc.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 8 }}>
          {acc.icon}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.dark, marginBottom: 6 }}>{acc.name}</div>
        <Badge level={acc.level} />
      </div>

      <div style={{ flex: 1, padding: '0 18px', overflowY: 'auto', paddingBottom: 80 }}>
        {/* Usuario */}
        <div style={{ background: C.grayBg2, borderRadius: 10, padding: '12px 14px',
          marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: C.grayLight, marginBottom: 3,
              textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Usuario / email</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{acc.user}</div>
          </div>
          <span onClick={() => copy('user')} style={{ fontSize: 18, cursor: 'pointer' }}>
            {copied === 'user' ? '✅' : '📋'}
          </span>
        </div>

        {/* Contraseña */}
        <div style={{ background: C.grayBg2, borderRadius: 10, padding: '12px 14px',
          marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, marginRight: 8 }}>
            <div style={{ fontSize: 10, color: C.grayLight, marginBottom: 3,
              textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Contraseña</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark,
              fontFamily: 'monospace', letterSpacing: 2, wordBreak: 'break-all' }}>
              {showPass ? acc.password : '••••••••••••'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span onClick={() => setShowPass(!showPass)} style={{ fontSize: 18, cursor: 'pointer' }}>👁️</span>
            <span onClick={() => copy('pass')} style={{ fontSize: 18, cursor: 'pointer' }}>
              {copied === 'pass' ? '✅' : '📋'}
            </span>
          </div>
        </div>

        {/* Tiempo */}
        <div style={{ background: C.grayBg2, borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.grayLight, marginBottom: 3,
            textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Tiempo de vulnerabilidad</div>
          <div style={{ fontSize: 15, fontWeight: 800,
            color: acc.level === 'NS' ? C.green : acc.level === 'AD' ? C.orange : C.red }}>
            {acc.level === 'NS' ? '+100 años' : acc.level === 'AD' ? '~10 años' : 'Menos de 1 año ⚠️'}
          </div>
        </div>

        <div style={{ height: 6, borderRadius: 3, background: '#E5E7EB', marginBottom: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, transition: 'width 0.4s',
            width: acc.level === 'NS' ? '90%' : acc.level === 'AD' ? '60%' : '25%',
            background: acc.level === 'NS' ? C.green : acc.level === 'AD' ? C.orange : C.red }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 18,
          color: acc.level === 'NS' ? C.green : acc.level === 'AD' ? C.orange : C.red }}>
          {acc.level === 'NS' ? 'NeuroSecure · Protección máxima' : acc.level === 'AD' ? 'Adaptativa · Buena protección' : 'Predictiva · Actualiza tu clave'}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div onClick={() => copy('pass')}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10,
              background: copied === 'pass' ? C.green : C.indigo,
              color: C.white, fontWeight: 700, fontSize: 13, textAlign: 'center', cursor: 'pointer' }}>
            {copied === 'pass' ? '✅ Copiado' : 'Copiar contraseña'}
          </div>
          <div onClick={() => nav('/edit', { state: acc })}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: C.grayBg,
              color: C.gray, fontWeight: 700, fontSize: 13, textAlign: 'center', cursor: 'pointer' }}>
            Editar
          </div>
        </div>

        {!showDelete
          ? <div onClick={() => setShowDelete(true)}
              style={{ padding: '12px 0', borderRadius: 10, background: C.redBg,
                color: C.red, fontWeight: 700, fontSize: 13, textAlign: 'center', cursor: 'pointer' }}>
              🗑️ Eliminar cuenta
            </div>
          : <div style={{ background: C.redBg, borderRadius: 10, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 10 }}>
                ¿Estás seguro? Esta acción no se puede deshacer.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div onClick={() => setShowDelete(false)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: C.grayBg,
                    color: C.gray, fontWeight: 700, fontSize: 13, textAlign: 'center', cursor: 'pointer' }}>
                  Cancelar
                </div>
                <div onClick={deleteAccount}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: C.red,
                    color: C.white, fontWeight: 700, fontSize: 13, textAlign: 'center', cursor: 'pointer' }}>
                  Sí, eliminar
                </div>
              </div>
            </div>}
      </div>
      <BottomNav active="vault" />
    </div>
  );
}
