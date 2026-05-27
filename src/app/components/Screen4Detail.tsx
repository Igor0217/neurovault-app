import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { C, BottomNav, Badge, Account, loadAccounts, saveAccounts } from './shared';

export default function Screen4Detail() {
  const nav = useNavigate();
  const { state } = useLocation();
  const acc = state as Account;
  const [showPass, setShowPass]   = useState(false);
  const [copied, setCopied]       = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing]     = useState(false);
  const [editName, setEditName]   = useState(acc?.name || '');
  const [editUser, setEditUser]   = useState(acc?.user || '');
  const [editPass, setEditPass]   = useState(acc?.password || '');
  const [saved, setSaved]         = useState(false);

  const [currentAcc, setCurrentAcc] = useState<Account>(acc);

  const saveEdit = () => {
    const all = loadAccounts();
    const updatedAcc = { ...currentAcc, name: editName, user: editUser, password: editPass };
    const updated = all.map(a => a.id === currentAcc.id ? updatedAcc : a);
    saveAccounts(updated);
    setCurrentAcc(updatedAcc);
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(false); }, 1000);
  };

  if (!acc) { nav('/vault'); return null; }

  const copy = (what: 'user' | 'pass') => {
    const text = what === 'user' ? currentAcc.user : currentAcc.password;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(what);
    setTimeout(() => setCopied(''), 2000);
  };

  const deleteAccount = () => {
    const all = loadAccounts().filter(a => a.id !== currentAcc.id);
    saveAccounts(all);
    nav('/vault');
  };

  return (
    <div style={{ width: '100%', height: '100%', background: C.white, display: 'flex',
      flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 18px 16px' }}>
        <span onClick={() => nav('/vault')} style={{ fontSize: 13, color: C.indigo, fontWeight: 700, cursor: 'pointer' }}>← Mis Claves</span>
        <span onClick={() => setEditing(!editing)} style={{ fontSize: 18, color: C.indigo, cursor: 'pointer' }}>✏️</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: currentAcc.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 8 }}>
          {currentAcc.icon}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.dark, marginBottom: 6 }}>{currentAcc.name}</div>
        <Badge level={currentAcc.level} />
      </div>

      <div style={{ flex: 1, padding: '0 18px', overflowY: 'auto', paddingBottom: 80 }}>
        {/* Usuario */}
        <div style={{ background: C.grayBg2, borderRadius: 10, padding: '12px 14px',
          marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: C.grayLight, marginBottom: 3,
              textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Usuario / email</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{currentAcc.user}</div>
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
              {showPass ? currentAcc.password : '••••••••••••'}
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
            color: currentAcc.level === 'NS' ? C.green : currentAcc.level === 'AD' ? C.orange : C.red }}>
            {currentAcc.level === 'NS' ? '+100 años' : currentAcc.level === 'AD' ? '~10 años' : 'Menos de 1 año ⚠️'}
          </div>
        </div>

        <div style={{ height: 6, borderRadius: 3, background: '#E5E7EB', marginBottom: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, transition: 'width 0.4s',
            width: currentAcc.level === 'NS' ? '90%' : currentAcc.level === 'AD' ? '60%' : '25%',
            background: currentAcc.level === 'NS' ? C.green : currentAcc.level === 'AD' ? C.orange : C.red }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 18,
          color: currentAcc.level === 'NS' ? C.green : currentAcc.level === 'AD' ? C.orange : C.red }}>
          {currentAcc.level === 'NS' ? 'NeuroSecure · Protección máxima' : currentAcc.level === 'AD' ? 'Adaptativa · Buena protección' : 'Predictiva · Actualiza tu clave'}
        </div>

        {editing && (
          <div style={{ background: C.indigoBg, borderRadius: 12, padding: '14px',
            marginBottom: 12, border: '1.5px solid ' + C.indigo }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, marginBottom: 10 }}>
              ✏️ Editando cuenta
            </div>
            {[
              { label: 'Nombre del servicio', val: editName, set: setEditName },
              { label: 'Usuario / email',     val: editUser, set: setEditUser },
              { label: 'Contraseña',          val: editPass, set: setEditPass },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.indigo, fontWeight: 600,
                  textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                <input value={f.val} onChange={e => f.set(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1.5px solid ' + C.indigo, fontSize: 13, outline: 'none',
                    color: C.dark, boxSizing: 'border-box' as const, background: C.white }}/>
              </div>
            ))}
            <div onClick={saveEdit}
              style={{ padding: '11px 0', borderRadius: 10, background: saved ? C.green : C.indigo,
                color: C.white, fontWeight: 700, fontSize: 13, textAlign: 'center', cursor: 'pointer',
                transition: 'background 0.3s' }}>
              {saved ? '✅ Guardado!' : 'Guardar cambios'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div onClick={() => copy('pass')}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10,
              background: copied === 'pass' ? C.green : C.indigo,
              color: C.white, fontWeight: 700, fontSize: 13, textAlign: 'center', cursor: 'pointer' }}>
            {copied === 'pass' ? '✅ Copiado' : 'Copiar contraseña'}
          </div>
          <div onClick={() => setEditing(!editing)}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: editing ? C.indigoBg : C.grayBg,
              color: editing ? C.indigo : C.gray, fontWeight: 700, fontSize: 13, textAlign: 'center', cursor: 'pointer' }}>
            {editing ? 'Cancelar' : 'Editar'}
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
