import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, BottomNav, loadAccounts } from './shared';
import { useTheme } from '../ThemeContext';

export default function Screen8Profile() {
  const nav = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [count, setCount]     = useState(0);
  const [name, setName]       = useState(() => localStorage.getItem('nv_name') || '');
  const [editing, setEditing] = useState(false);
  const [tmpName, setTmpName] = useState('');
  const [notifs, setNotifs]   = useState(() => localStorage.getItem('nv_notifs') !== 'off');
  const [showExportOk, setShowExportOk]     = useState(false);
  const [showHelp, setShowHelp]             = useState(false);
  const [showApariencia, setShowApariencia] = useState(false);
  const [showNotifs, setShowNotifs]         = useState(false);

  const bg    = isDark ? '#0F172A' : C.white;
  const bg2   = isDark ? '#1E293B' : C.grayBg2;
  const txt   = isDark ? '#F1F5F9' : C.dark;
  const txt2  = isDark ? '#94A3B8' : C.grayLight;
  const bdr   = isDark ? '#334155' : '#F5F5F5';

  useEffect(() => { setCount(loadAccounts().length); }, []);

  const saveName = () => {
    localStorage.setItem('nv_name', tmpName.trim() || name);
    setName(tmpName.trim() || name);
    setEditing(false);
  };

  const handleCambiarPatron = () => {
    if (window.confirm('¿Seguro que quieres cambiar tu patrón visual? El anterior se borrará.')) {
      localStorage.removeItem('nv_pattern_icons');
      nav('/');
    }
  };

  const handleExportar = () => {
    try {
      const accounts = JSON.parse(localStorage.getItem('nv_accounts') || '[]');
      if (accounts.length === 0) { alert('No tienes cuentas guardadas para exportar.'); return; }
      const blob = new Blob([JSON.stringify(accounts, null, 2)], { type:'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `neurovault_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      setShowExportOk(true); setTimeout(() => setShowExportOk(false), 3000);
    } catch { alert('Error al exportar.'); }
  };

  const toggleNotifs = () => {
    const next = !notifs; setNotifs(next);
    localStorage.setItem('nv_notifs', next ? 'on' : 'off');
  };

  const ns    = loadAccounts().filter(a => a.level === 'NS').length;
  const nivel = count === 0 ? 'Sin cuentas aún'
    : ns === count ? 'NeuroSecure 🏆'
    : ns > count/2 ? 'Adaptativo ⚡' : 'En progreso 📈';

  const Toggle = ({ value, onChange }: { value:boolean; onChange:()=>void }) => (
    <div onClick={onChange}
      style={{ width:44, height:24, borderRadius:12, cursor:'pointer',
        transition:'background 0.2s', background:value ? C.indigo : '#D1D5DB',
        position:'relative', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, transition:'left 0.2s',
        left: value ? 22 : 2, width:20, height:20,
        background:C.white, borderRadius:'50%',
        boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
    </div>
  );

  const OptionRow = ({ icon, label, right, onClick }: {
    icon:string; label:string; right?:React.ReactNode; onClick?:()=>void;
  }) => (
    <div onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0',
        borderBottom:`1px solid ${bdr}`, cursor:onClick?'pointer':'default' }}>
      <span style={{ fontSize:19 }}>{icon}</span>
      <span style={{ flex:1, fontSize:13, fontWeight:500, color:txt2 }}>{label}</span>
      {right ?? <span style={{ fontSize:16, color:txt2 }}>›</span>}
    </div>
  );

  return (
    <div style={{ width:'100%', height:'100%', background:bg, display:'flex',
      flexDirection:'column', boxSizing:'border-box', position:'relative' }}>

      <div style={{ padding:'52px 18px 16px', fontSize:18, fontWeight:800, color:txt }}>
        Mi perfil
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 18px', paddingBottom:80 }}>

        {/* Avatar */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:24 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:C.indigoBg,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:30, marginBottom:10 }}>👤</div>
          {editing
            ? <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input value={tmpName} onChange={e=>setTmpName(e.target.value)}
                  autoFocus onKeyDown={e=>e.key==='Enter'&&saveName()}
                  style={{ fontSize:14, fontWeight:700, border:`1.5px solid ${C.indigo}`,
                    borderRadius:8, padding:'5px 12px', outline:'none',
                    color:C.dark, width:160, background:C.white }}/>
                <span onClick={saveName}
                  style={{ color:C.green, cursor:'pointer', fontWeight:800, fontSize:18 }}>✓</span>
                <span onClick={()=>setEditing(false)}
                  style={{ color:txt2, cursor:'pointer', fontSize:16 }}>✕</span>
              </div>
            : <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ fontSize:17, fontWeight:800, color:txt }}>
                  {name || 'Tu nombre'}
                </div>
                <span onClick={()=>{setTmpName(name);setEditing(true);}}
                  style={{ fontSize:15, cursor:'pointer' }}>✏️</span>
              </div>
          }
          <div style={{ fontSize:12, color:txt2, marginTop:5 }}>
            {count} cuentas · {nivel}
          </div>
        </div>

        {showExportOk && (
          <div style={{ background:C.greenBg, borderRadius:10, padding:'10px 14px',
            marginBottom:12, fontSize:12, color:C.green, fontWeight:700, textAlign:'center' }}>
            ✅ Backup exportado correctamente
          </div>
        )}

        <OptionRow icon="🔒" label="Cambiar patrón visual" onClick={handleCambiarPatron}/>

        {/* Apariencia */}
        <OptionRow icon="🎨" label="Apariencia"
          right={<span style={{ fontSize:14, color:txt2 }}>{showApariencia?'▲':'▼'}</span>}
          onClick={()=>setShowApariencia(!showApariencia)}/>
        {showApariencia && (
          <div style={{ background:bg2, borderRadius:10, padding:'14px 16px',
            marginBottom:4, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:13, color:txt, fontWeight:600, marginBottom:2 }}>
                {isDark ? '🌙 Tema oscuro' : '☀️ Tema claro'}
              </div>
              <div style={{ fontSize:11, color:txt2 }}>
                {isDark ? 'Activo — fondo oscuro' : 'Activo — fondo claro'}
              </div>
            </div>
            <Toggle value={isDark} onChange={toggleTheme}/>
          </div>
        )}

        {/* Notificaciones */}
        <OptionRow icon="🔔" label="Notificaciones de seguridad"
          right={<span style={{ fontSize:14, color:txt2 }}>{showNotifs?'▲':'▼'}</span>}
          onClick={()=>setShowNotifs(!showNotifs)}/>
        {showNotifs && (
          <div style={{ background:bg2, borderRadius:10, padding:'14px 16px',
            marginBottom:4, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:13, color:txt, fontWeight:600, marginBottom:2 }}>
                {notifs ? '🔔 Activadas' : '🔕 Desactivadas'}
              </div>
              <div style={{ fontSize:11, color:txt2 }}>Alertas de seguridad del vault</div>
            </div>
            <Toggle value={notifs} onChange={toggleNotifs}/>
          </div>
        )}

        <OptionRow icon="📤" label="Exportar bóveda (encriptada)" onClick={handleExportar}/>

        {/* Ayuda */}
        <OptionRow icon="❓" label="Ayuda y tutorial"
          right={<span style={{ fontSize:14, color:txt2 }}>{showHelp?'▲':'▼'}</span>}
          onClick={()=>setShowHelp(!showHelp)}/>
        {showHelp && (
          <div style={{ background:bg2, borderRadius:10, padding:'14px 16px', marginBottom:4 }}>
            {[
              {icon:'🔐', text:'GhostLogin: selecciona tus íconos en orden para entrar'},
              {icon:'🧠', text:'NeuroPass AI: escribe una frase y genera una clave segura'},
              {icon:'🔍', text:'Buscador: encuentra cualquier cuenta por nombre o usuario'},
              {icon:'📊', text:'Panel: revisa el nivel de seguridad de todas tus claves'},
              {icon:'🤖', text:'NeuroBehavior: detecta comportamientos inusuales al ingresar'},
              {icon:'📖', text:'Libreta: anota los nombres de tus íconos para acceso alternativo'},
            ].map((t,i) => (
              <div key={i} style={{ display:'flex', gap:10, marginBottom:i<5?10:0 }}>
                <span>{t.icon}</span>
                <span style={{ fontSize:12, color:txt2, lineHeight:1.4 }}>{t.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cerrar sesión */}
        <div onClick={() => nav('/')}
          style={{ marginTop:20, padding:'14px 0', borderRadius:12, background:C.redBg,
            color:C.red, fontWeight:700, fontSize:14, textAlign:'center', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          🚪 Cerrar sesión
        </div>
        <div style={{ fontSize:11, color:txt2, textAlign:'center', marginTop:8, lineHeight:1.5 }}>
          Al cerrar sesión tu patrón y contraseñas se mantienen guardados.
        </div>
      </div>

      <BottomNav active="profile"/>
    </div>
  );
}
