import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, BottomNav, Account, loadAccounts } from './shared';
import { getBehaviorStats } from './NeuroBehavior';

export default function Screen6Panel() {
  const nav = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bioStats, setBioStats] = useState(getBehaviorStats());

  useEffect(() => {
    setAccounts(loadAccounts());
    setBioStats(getBehaviorStats());
  }, []);

  const total = accounts.length;
  const ns    = accounts.filter(a => a.level === 'NS').length;
  const weak  = accounts.filter(a => a.level === 'PR').length;
  const mid   = accounts.filter(a => a.level === 'AD').length;
  const avgYears = total === 0 ? 0
    : Math.round((ns*200 + mid*10 + weak*0.1) / total);
  const weakAccounts = accounts.filter(a => a.level === 'PR');

  const stats = [
    { num:String(total), label:'Cuentas guardadas', bg:C.grayBg,   tx:C.dark   },
    { num:String(ns),    label:'NeuroSecure',        bg:C.greenBg,  tx:C.green  },
    { num:String(weak),  label:'Débil ⚠️',           bg:C.redBg,    tx:C.red    },
    { num:String(mid),   label:'Moderado',            bg:C.indigoBg, tx:C.indigo },
  ];

  const riskColor = bioStats.avgRiskScore <= 30 ? C.green
    : bioStats.avgRiskScore <= 70 ? C.orange : C.red;
  const riskBg = bioStats.avgRiskScore <= 30 ? C.greenBg
    : bioStats.avgRiskScore <= 70 ? C.orangeBg : C.redBg;

  return (
    <div style={{ width:'100%', height:'100%', background:C.white, display:'flex',
      flexDirection:'column', boxSizing:'border-box', position:'relative' }}>
      <div style={{ padding:'52px 18px 16px', fontSize:18, fontWeight:800, color:C.dark }}>
        Panel de Seguridad
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 18px', paddingBottom:80,
        display:'flex', flexDirection:'column', gap:12 }}>

        {/* Estadísticas claves */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {stats.map((s,i) => (
            <div key={i} onClick={() => nav('/vault')}
              style={{ background:s.bg, borderRadius:12, padding:'16px 14px', cursor:'pointer' }}>
              <div style={{ fontSize:28, fontWeight:900, color:s.tx }}>{s.num}</div>
              <div style={{ fontSize:11, color:s.tx, opacity:0.85 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alertas de claves débiles */}
        {weakAccounts.length > 0
          ? weakAccounts.map(a => (
              <div key={a.id} onClick={() => nav('/detail', { state:a })}
                style={{ background:C.redBg, borderRadius:10, padding:'12px 14px',
                  borderLeft:`4px solid ${C.red}`, cursor:'pointer' }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.red, marginBottom:4 }}>
                  ⚠️ {a.name} — contraseña débil
                </div>
                <div style={{ fontSize:11, color:C.gray }}>
                  Toca para actualizar con NeuroPass AI
                </div>
              </div>
            ))
          : total > 0 && (
              <div style={{ background:C.greenBg, borderRadius:10, padding:'12px 14px',
                borderLeft:`4px solid ${C.green}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.green }}>
                  ✅ ¡Todas tus claves están seguras!
                </div>
              </div>
            )
        }

        {/* Simulador de ataques */}
        <div style={{ background:'#1E293B', borderRadius:12, padding:'14px 16px' }}>
          <div style={{ fontSize:10, color:'#94A3B8', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>
            Simulador de ataques
          </div>
          <div style={{ height:8, borderRadius:4, marginBottom:10, overflow:'hidden',
            background:'linear-gradient(90deg,#EF4444 20%,#F59E0B 45%,#10B981 100%)' }}/>
          <div style={{ fontSize:13, color:'#F1F5F9', fontWeight:700 }}>
            Promedio del vault: {avgYears > 0 ? `${avgYears} años` : '—'}
          </div>
          <div style={{ fontSize:11, color:'#94A3B8', marginTop:4 }}>
            {weak > 0
              ? `${weak} contraseña${weak>1?'s':''} por debajo del umbral seguro`
              : 'Todas sobre el umbral seguro'}
          </div>
        </div>

        {/* ── NeuroBehavior ── */}
        <div style={{ background: bioStats.isLearning ? C.orangeBg : C.indigoBg,
          borderRadius:12, padding:'14px 16px',
          border:`1.5px solid ${bioStats.isLearning ? C.orange : C.indigo}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:800,
              color: bioStats.isLearning ? C.orange : C.indigo }}>
              🧠 NeuroBehavior
            </div>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700,
              background: bioStats.isLearning ? C.orangeBg : C.indigoBg,
              color: bioStats.isLearning ? C.orange : C.indigo,
              border:`1px solid ${bioStats.isLearning ? C.orange : C.indigo}` }}>
              {bioStats.isLearning ? 'Aprendiendo' : 'Activo'}
            </span>
          </div>

          {/* Nivel de confianza */}
          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              marginBottom:4 }}>
              <span style={{ fontSize:11, color:C.gray }}>Nivel de confianza</span>
              <span style={{ fontSize:11, fontWeight:800,
                color: bioStats.isLearning ? C.orange : C.indigo }}>
                {bioStats.confidenceLevel}%
              </span>
            </div>
            <div style={{ height:6, borderRadius:3, background:'#E5E7EB', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3, transition:'width 0.4s',
                width:`${bioStats.confidenceLevel}%`,
                background: bioStats.isLearning ? C.orange : C.indigo }} />
            </div>
          </div>

          {/* Stats en grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <div style={{ background:C.white, borderRadius:8, padding:'8px',
              textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:900, color:C.dark }}>
                {bioStats.totalLogins}
              </div>
              <div style={{ fontSize:9, color:C.grayLight }}>Ingresos</div>
            </div>
            <div style={{ background: riskBg, borderRadius:8, padding:'8px',
              textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:900, color:riskColor }}>
                {bioStats.avgRiskScore}
              </div>
              <div style={{ fontSize:9, color:riskColor }}>Riesgo prom.</div>
            </div>
            <div style={{ background: bioStats.suspiciousCount > 0 ? C.redBg : C.greenBg,
              borderRadius:8, padding:'8px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:900,
                color: bioStats.suspiciousCount > 0 ? C.red : C.green }}>
                {bioStats.suspiciousCount}
              </div>
              <div style={{ fontSize:9,
                color: bioStats.suspiciousCount > 0 ? C.red : C.green }}>
                Sospechosos
              </div>
            </div>
          </div>

          {bioStats.lastAnomaly && (
            <div style={{ marginTop:10, fontSize:11, color:C.gray }}>
              Última anomalía: <strong>{bioStats.lastAnomaly}</strong>
            </div>
          )}

          {bioStats.isLearning && (
            <div style={{ marginTop:10, fontSize:11, color:C.orange, lineHeight:1.4 }}>
              El sistema necesita {3 - bioStats.totalLogins} ingreso{3-bioStats.totalLogins!==1?'s':''} más para activarse completamente.
            </div>
          )}
        </div>

        <div onClick={() => nav('/alerts')}
          style={{ padding:'12px 0', borderRadius:10, background:C.indigoBg,
            color:C.indigo, fontWeight:700, fontSize:13,
            textAlign:'center', cursor:'pointer' }}>
          Ver todas las alertas →
        </div>
      </div>

      <BottomNav active="panel" />
    </div>
  );
}
