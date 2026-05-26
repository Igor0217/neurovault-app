import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, BottomNav, Account, loadAccounts } from './shared';
import { getBehaviorStats } from './NeuroBehavior';

export default function Screen7Alerts() {
  const nav = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bioStats, setBioStats] = useState(getBehaviorStats());

  useEffect(() => {
    setAccounts(loadAccounts());
    setBioStats(getBehaviorStats());
  }, []);

  const weak = accounts.filter(a => a.level === 'PR');
  const good = accounts.filter(a => a.level === 'NS');
  const mid  = accounts.filter(a => a.level === 'AD');

  return (
    <div style={{ width:'100%', height:'100%', background:C.white, display:'flex',
      flexDirection:'column', boxSizing:'border-box', position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'52px 18px 16px' }}>
        <span onClick={() => nav('/panel')}
          style={{ fontSize:16, color:C.indigo, cursor:'pointer' }}>◀</span>
        <span style={{ fontSize:18, fontWeight:800, color:C.dark }}>Alertas</span>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 18px', paddingBottom:80,
        display:'flex', flexDirection:'column', gap:12 }}>

        {/* Alertas NeuroBehavior */}
        {bioStats.suspiciousCount > 0 && (
          <>
            <div style={{ fontSize:11, color:C.grayLight, fontWeight:700,
              textTransform:'uppercase', letterSpacing:'0.8px' }}>
              🧠 NeuroBehavior
            </div>
            <div style={{ background:C.redBg, borderRadius:10, padding:'14px',
              borderLeft:`4px solid ${C.red}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:4 }}>
                🔴 Comportamiento inusual detectado
              </div>
              <div style={{ fontSize:11, color:C.gray, marginBottom:6 }}>
                Se detectaron {bioStats.suspiciousCount} ingreso{bioStats.suspiciousCount>1?'s':''} con comportamiento diferente al habitual.
              </div>
              {bioStats.lastAnomaly && (
                <div style={{ fontSize:11, color:C.gray }}>
                  Última anomalía: <strong>{bioStats.lastAnomaly}</strong>
                </div>
              )}
            </div>
          </>
        )}

        {bioStats.isLearning && (
          <>
            <div style={{ fontSize:11, color:C.grayLight, fontWeight:700,
              textTransform:'uppercase', letterSpacing:'0.8px' }}>
              🧠 NeuroBehavior
            </div>
            <div style={{ background:C.orangeBg, borderRadius:10, padding:'14px',
              borderLeft:`4px solid ${C.orange}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.orange, marginBottom:4 }}>
                🟡 Sistema aprendiendo tu comportamiento
              </div>
              <div style={{ fontSize:11, color:C.gray }}>
                Necesita {3 - bioStats.totalLogins} ingreso{3-bioStats.totalLogins!==1?'s':''} más para activarse. Ingresa normalmente.
              </div>
            </div>
          </>
        )}

        {/* Claves críticas */}
        {weak.length > 0 && <>
          <div style={{ fontSize:11, color:C.grayLight, fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.8px' }}>Crítico</div>
          {weak.map(a => (
            <div key={a.id} onClick={() => nav('/detail', { state:a })}
              style={{ background:C.redBg, borderRadius:10, padding:'14px',
                borderLeft:`4px solid ${C.red}`, cursor:'pointer' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:4 }}>
                🔴 {a.name} — contraseña débil
              </div>
              <div style={{ fontSize:11, color:C.gray }}>
                Esta clave puede ser vulnerada pronto. Actualízala con NeuroPass AI.
              </div>
            </div>
          ))}
        </>}

        {/* Recomendaciones */}
        {good.length > 0 && <>
          <div style={{ fontSize:11, color:C.grayLight, fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.8px' }}>Recomendaciones</div>
          {good.map(a => (
            <div key={a.id} style={{ background:C.greenBg, borderRadius:10, padding:'14px',
              borderLeft:`4px solid ${C.green}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.green, marginBottom:4 }}>
                ✅ {a.name} — NeuroSecure
              </div>
              <div style={{ fontSize:11, color:C.gray }}>
                Tu contraseña tiene más de 100 años de resistencia. ¡Excelente!
              </div>
            </div>
          ))}
        </>}

        {/* Advertencias */}
        {mid.length > 0 && <>
          <div style={{ fontSize:11, color:C.grayLight, fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.8px' }}>Advertencias</div>
          {mid.map(a => (
            <div key={a.id} onClick={() => nav('/detail', { state:a })}
              style={{ background:C.orangeBg, borderRadius:10, padding:'14px',
                borderLeft:`4px solid ${C.orange}`, cursor:'pointer' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.orange, marginBottom:4 }}>
                🟡 {a.name} — Moderada
              </div>
              <div style={{ fontSize:11, color:C.gray }}>
                Considera actualizarla pronto para mejor protección.
              </div>
            </div>
          ))}
        </>}

        {accounts.length === 0 && bioStats.suspiciousCount === 0 && !bioStats.isLearning && (
          <div style={{ textAlign:'center', color:C.grayLight, marginTop:40 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🔔</div>
            <div style={{ fontSize:13 }}>Sin alertas activas — todo está en orden</div>
          </div>
        )}

        {/* Mejores prácticas */}
        <div style={{ fontSize:11, color:C.grayLight, fontWeight:700,
          textTransform:'uppercase', letterSpacing:'0.8px' }}>Mejores prácticas</div>
        <div style={{ background:C.grayBg, borderRadius:10, padding:'14px',
          display:'flex', flexDirection:'column', gap:8 }}>
          {[
            'Usa contraseñas únicas para cada cuenta.',
            'Actualiza tus claves cada 6 meses.',
            'Habilita autenticación de dos factores cuando sea posible.',
            'Ingresa siempre tu patrón al mismo ritmo para mantener tu perfil conductual.',
          ].map((t,i) => (
            <div key={i} style={{ fontSize:11, color:C.gray, display:'flex', gap:8 }}>
              <span style={{ color:C.orange }}>💡</span>{t}
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="panel" />
    </div>
  );
}
