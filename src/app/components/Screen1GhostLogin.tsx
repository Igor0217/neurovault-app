import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, ICON_NAMES } from './shared';
import Tesseract from 'tesseract.js';
import {
  TouchEvent_NV, BehaviorProfile,
  buildProfile, saveProfile, evaluateRisk, saveRiskResult, loadProfiles
} from './NeuroBehavior';

const ALL_ICONS = ['⭐','📘','🎧','🔒','📱','💻','🎯','🌙','🔑','🛡️','🗝️','🔐'];
const PATTERN_KEY = 'nv_pattern_icons';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function loadSavedPattern(): string[] {
  try { return JSON.parse(localStorage.getItem(PATTERN_KEY)||'[]'); }
  catch { return []; }
}

function downloadPatternImage(pattern: string[]) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 80 + pattern.length * 60;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#4338CA';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, canvas.width-20, canvas.height-20);
  ctx.fillStyle = '#4338CA';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('NeuroVault - Mi Patron', canvas.width/2, 50);
  ctx.fillStyle = '#1E3A5F';
  ctx.font = 'bold 32px Arial';
  pattern.forEach((icon, i) => {
    const name = ICON_NAMES[icon] || icon;
    ctx.fillText((i+1) + '. ' + name, canvas.width/2, 100 + i*60);
  });
  const link = document.createElement('a');
  link.download = 'neurovault-patron.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

type Step = 'login'|'setup_create'|'setup_confirm'|'setup_save'|'upload'|'risk_warning';

export default function Screen1GhostLogin() {
  const nav = useNavigate();
  const savedPattern = loadSavedPattern();
  const hasPattern = savedPattern.length > 0;

  const [grid1, setGrid1]             = useState<string[]>(()=>shuffle(ALL_ICONS).slice(0,9));
  const [grid2, setGrid2]             = useState<string[]>([]);
  const [selected, setSelected]       = useState<number[]>([]);
  const [step, setStep]               = useState<Step>(hasPattern?'login':'setup_create');
  const [tempPattern, setTempPattern] = useState<string[]>([]);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [attempts, setAttempts]       = useState(0);
  const [blocked, setBlocked]         = useState(false);
  const [countdown, setCountdown]     = useState(0);

  const touchEvents = useRef<TouchEvent_NV[]>([]);
  const [riskResult, setRiskResult]   = useState<ReturnType<typeof evaluateRisk>|null>(null);
  const [pendingProfile, setPendingProfile] = useState<BehaviorProfile|null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning]   = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [ocrError, setOcrError]   = useState('');

  const icons = step==='setup_confirm' ? grid2 : grid1;

  useEffect(() => {
    const blockBack = () => { window.history.pushState(null, '', window.location.href); };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, []);

  useEffect(() => {
    if (!blocked) return;
    setCountdown(30);
    const iv = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(iv);
          setBlocked(false); setAttempts(0); setError('');
          setGrid1(shuffle(ALL_ICONS).slice(0,9)); setSelected([]);
          return 0;
        }
        return c-1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [blocked]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true); setOcrError(''); setOcrResult('');
    try {
      const { data: { text: rawText } } = await Tesseract.recognize(
        file, 'spa',
        { logger: (m: any) => {
          if (m.status === 'recognizing text')
            setOcrResult('Leyendo... ' + Math.round(m.progress*100) + '%');
        }}
      );
      const text = rawText.toLowerCase().trim();
      setOcrResult(text);
      if (!text || text.length < 2) {
        setOcrError('No se detecto texto. Sube la imagen correcta.');
        return;
      }
      // Extraer solo palabras que coincidan con nombres válidos de iconos
      const validNames = Object.values(ICON_NAMES).map((n:string) =>
        n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
      );
      const norm = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
      
      // Dividir el texto en tokens (por espacios, comas, puntos, saltos de línea)
      const tokens = text.split(/[,\s.\n\r]+/).map(norm).filter(Boolean);
      
      // Filtrar solo tokens que coincidan con nombres válidos
      const foundWords = tokens.filter((token:string) =>
        validNames.some((vn:string) => token === vn || vn.startsWith(token) || token.startsWith(vn))
      );
      
      const saved = loadSavedPattern();
      const patternNames = saved.map((ic:string) => norm(ICON_NAMES[ic] || ''));
      const normPattern = patternNames;
      
      // Comparar palabras encontradas contra el patrón guardado
      const match = normPattern.length > 0 && normPattern.length === foundWords.length &&
        normPattern.every((name:string, idx:number) => {
          const w = foundWords[idx];
          return w === name || name.startsWith(w) || w.startsWith(name) ||
                 name.includes(w) || w.includes(name);
        });
      if (match) {
        setSuccess('Acceso concedido por imagen!');
        setTimeout(() => nav('/vault'), 900);
      } else {
        setOcrError('Lei: "' + foundWords.join(', ') + '" - No coincide. Esperaba: ' + patternNames.join(', '));
      }
    } catch(err: any) {
      setOcrError('Error: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  const recordTouch = (e: React.TouchEvent|React.MouseEvent, iconIndex: number) => {
    let x=0, y=0, area=100;
    if ('touches' in e && e.touches.length>0) {
      const t = e.touches[0];
      x=t.clientX; y=t.clientY;
      area = (t as any).radiusX && (t as any).radiusY
        ? (t as any).radiusX * (t as any).radiusY * Math.PI : 100;
    } else if ('clientX' in e) { x=e.clientX; y=e.clientY; area=80; }
    touchEvents.current.push({ iconIndex, timestamp:Date.now(), x, y, touchArea:area });
  };

  const toggle = (i: number, e: React.TouchEvent|React.MouseEvent) => {
    if (blocked) return;
    recordTouch(e, i);
    setError('');
    setSelected(p => p.includes(i) ? p.filter(x=>x!==i) : [...p,i]);
  };

  const reshuffleLogin = () => {
    setGrid1(shuffle(ALL_ICONS).slice(0,9));
    setSelected([]); setError('');
    touchEvents.current = [];
  };

  const handleAction = () => {
    if (blocked || selected.length===0) return;

    if (step==='setup_create') {
      if (selected.length<3) { setError('Selecciona al menos 3 iconos'); return; }
      const chosen = selected.map(i=>grid1[i]);
      setTempPattern(chosen);
      setGrid2(shuffle([...grid1]));
      setSelected([]); touchEvents.current=[];
      setStep('setup_confirm');
      setSuccess('Selecciona los mismos ' + chosen.length + ' iconos en el mismo orden');
      setError('');

    } else if (step==='setup_confirm') {
      const confirm = selected.map(i=>grid2[i]);
      const match = tempPattern.length===confirm.length &&
        tempPattern.every((ic,idx)=>ic===confirm[idx]);
      if (!match) {
        setError('El patron no coincide. Empieza de nuevo.');
        setGrid1(shuffle(ALL_ICONS).slice(0,9));
        setGrid2([]); setTempPattern([]);
        setStep('setup_create'); setSelected([]); setSuccess('');
        touchEvents.current=[];
        return;
      }
      localStorage.setItem(PATTERN_KEY, JSON.stringify(tempPattern));
      setStep('setup_save'); setError('');

    } else if (step==='login') {
      const saved = loadSavedPattern();
      const chosen = selected.map(i=>grid1[i]);
      const match = saved.length>0 && saved.length===chosen.length &&
        saved.every((ic,idx)=>ic===chosen[idx]);

      if (match) {
        const profile = buildProfile(touchEvents.current);
        touchEvents.current = [];
        if (profile) {
          const risk = evaluateRisk(profile);
          saveRiskResult(risk.score);
          if (risk.level==='danger') {
            setPendingProfile(profile);
            setRiskResult(risk);
            setStep('risk_warning');
            return;
          }
          saveProfile(profile);
        }
        setSuccess('Acceso concedido!');
        setTimeout(()=>nav('/vault'), 700);
      } else {
        const next = attempts+1; setAttempts(next);
        setGrid1(shuffle(ALL_ICONS).slice(0,9));
        setSelected([]); touchEvents.current=[];
        if (next>=5) {
          setBlocked(true); setError('Demasiados intentos. Bloqueado 30 segundos.');
        } else {
          setError('Patron incorrecto - intento ' + next + ' de 5');
        }
      }
    }
  };

  const resetPattern = () => {
    if (window.confirm('Seguro que quieres crear un patron nuevo?')) {
      localStorage.removeItem(PATTERN_KEY);
      setStep('setup_create');
      setGrid1(shuffle(ALL_ICONS).slice(0,9));
      setGrid2([]); setTempPattern([]);
      setSelected([]); setError(''); setSuccess('');
      touchEvents.current=[];
    }
  };

  if (step==='setup_save') {
    return (
      <div style={{width:'100%',height:'100%',background:C.white,display:'flex',
        flexDirection:'column',alignItems:'center',justifyContent:'center',
        padding:'0 28px',boxSizing:'border-box'}}>
        <div style={{fontSize:52,marginBottom:12}}>📖</div>
        <div style={{fontSize:20,fontWeight:800,color:C.dark,marginBottom:8,textAlign:'center'}}>
          Patron creado exitosamente!
        </div>
        <div style={{fontSize:13,color:C.gray,marginBottom:16,textAlign:'center',lineHeight:1.6}}>
          Descarga la imagen con los nombres para acceder sin recordar el patron:
        </div>
        <div style={{width:'100%',background:C.indigoBg,borderRadius:16,
          padding:'16px',marginBottom:14,border:'2px dashed ' + C.indigo}}>
          {tempPattern.map((icon,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,
              padding:'8px 12px',background:C.white,borderRadius:10,
              marginBottom:i<tempPattern.length-1?8:0}}>
              <div style={{width:32,height:32,borderRadius:8,background:C.indigoBg,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                {icon}
              </div>
              <span style={{fontSize:16,fontWeight:800,color:C.dark}}>
                {i+1}. {ICON_NAMES[icon]||icon}
              </span>
            </div>
          ))}
        </div>
        <div onClick={()=>downloadPatternImage(tempPattern)}
          style={{width:'100%',padding:'12px 0',borderRadius:12,
            background:C.grayBg,color:C.indigo,fontWeight:800,
            fontSize:14,textAlign:'center',cursor:'pointer',
            marginBottom:10,border:'2px solid ' + C.indigo}}>
          Descargar imagen del patron
        </div>
        <div style={{background:C.orangeBg,borderRadius:12,padding:'10px 14px',
          marginBottom:14,width:'100%',fontSize:11,color:C.gray,lineHeight:1.5}}>
          Guarda la imagen en tu celular. Usala para acceder desde la galeria.
        </div>
        <div onClick={()=>nav('/vault')}
          style={{width:'100%',padding:'14px 0',borderRadius:12,
            background:C.indigo,color:C.white,fontWeight:800,
            fontSize:16,textAlign:'center',cursor:'pointer'}}>
          Entrar a NeuroVault
        </div>
      </div>
    );
  }

  if (step==='upload') {
    return (
      <div style={{width:'100%',height:'100%',background:C.white,display:'flex',
        flexDirection:'column',boxSizing:'border-box'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'52px 18px 14px'}}>
          <span onClick={()=>setStep('login')} style={{fontSize:16,color:C.indigo,cursor:'pointer'}}>◀</span>
          <span style={{fontSize:16,fontWeight:800,color:C.dark}}>Acceso por imagen</span>
        </div>
        <div style={{flex:1,padding:'0 18px',display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:C.indigoBg,borderRadius:12,padding:'14px 16px'}}>
            <div style={{fontSize:13,fontWeight:700,color:C.indigo,marginBottom:6}}>Como funciona</div>
            <div style={{fontSize:12,color:C.gray,lineHeight:1.6}}>
              1. Cuando creaste tu patron descargaste una imagen PNG.<br/>
              2. Toca el boton y seleccionala de tu galeria.<br/>
              3. El sistema la lee y te da acceso.
            </div>
          </div>
          <input type="file" accept="image/*" ref={fileInputRef}
            style={{display:'none'}} onChange={handleImageUpload} />
          <div onClick={()=>fileInputRef.current?.click()}
            style={{padding:'18px 0',borderRadius:14,background:C.indigo,
              color:C.white,fontWeight:800,fontSize:16,textAlign:'center',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
            {scanning ? 'Analizando...' : 'Seleccionar imagen de galeria'}
          </div>
          {ocrResult && (
            <div style={{background:C.grayBg,borderRadius:10,padding:'10px 14px'}}>
              <div style={{fontSize:11,color:C.grayLight,marginBottom:4}}>Texto detectado:</div>
              <div style={{fontSize:13,color:C.dark,fontWeight:700}}>{ocrResult}</div>
            </div>
          )}
          {success && (
            <div style={{background:C.greenBg,borderRadius:10,padding:'12px',textAlign:'center'}}>
              <div style={{fontSize:13,color:C.green,fontWeight:700}}>{success}</div>
            </div>
          )}
          {ocrError && (
            <div style={{background:C.redBg,borderRadius:10,padding:'10px'}}>
              <div style={{fontSize:12,color:C.red,fontWeight:700}}>{ocrError}</div>
            </div>
          )}
          <div onClick={()=>setStep('login')}
            style={{padding:'12px 0',borderRadius:12,background:C.grayBg,
              color:C.gray,fontWeight:600,fontSize:14,textAlign:'center',cursor:'pointer'}}>
            Volver al patron visual
          </div>
        </div>
      </div>
    );
  }

  if (step==='risk_warning') {
    return (
      <div style={{width:'100%',height:'100%',background:C.white,display:'flex',
        flexDirection:'column',alignItems:'center',justifyContent:'center',
        padding:'0 28px',boxSizing:'border-box'}}>
        <div style={{fontSize:52,marginBottom:12}}>🔒</div>
        <div style={{fontSize:20,fontWeight:800,color:C.red,marginBottom:8,textAlign:'center'}}>
          Acceso denegado
        </div>
        <div style={{background:C.redBg,borderRadius:14,padding:'16px',
          marginBottom:16,width:'100%',borderLeft:'4px solid ' + C.red}}>
          <div style={{fontSize:13,fontWeight:700,color:C.red,marginBottom:6}}>Patron no reconocido</div>
          <div style={{fontSize:12,color:C.gray,lineHeight:1.5}}>
            El patron fue ingresado de forma inusual. Por seguridad el acceso ha sido bloqueado.
          </div>
        </div>
        <div style={{background:C.orangeBg,borderRadius:12,padding:'12px 14px',
          marginBottom:20,width:'100%',fontSize:11,color:C.gray,lineHeight:1.5}}>
          Intenta de nuevo al mismo ritmo de siempre, o usa la imagen guardada.
        </div>
        <div onClick={()=>{
            setPendingProfile(null); setRiskResult(null);
            setStep('login'); setSelected([]);
            setGrid1(shuffle(ALL_ICONS).slice(0,9));
            touchEvents.current=[];
          }}
          style={{width:'100%',padding:'14px 0',borderRadius:12,
            background:C.indigo,color:C.white,fontWeight:800,
            fontSize:15,textAlign:'center',cursor:'pointer',marginBottom:10}}>
          Intentar de nuevo
        </div>
        <div onClick={()=>setStep('upload')}
          style={{width:'100%',padding:'12px 0',borderRadius:12,
            background:C.grayBg,color:C.gray,fontWeight:700,
            fontSize:13,textAlign:'center',cursor:'pointer',marginBottom:10}}>
          Acceder con imagen guardada
        </div>
        <div onClick={resetPattern}
          style={{fontSize:11,color:C.indigo,cursor:'pointer',textDecoration:'underline'}}>
          Crear un patron nuevo
        </div>
      </div>
    );
  }

  const isSetup = step==='setup_create'||step==='setup_confirm';
  const title = step==='setup_create'?'Crea tu patron visual'
    :step==='setup_confirm'?'Confirma tu patron'
    :'Selecciona tu patron visual';
  const hint = step==='setup_create'?'Selecciona 3 o mas iconos en orden'
    :step==='setup_confirm'?'Mismos iconos - selecciona los ' + tempPattern.length + ' en el mismo orden'
    :'No ves tus iconos? Toca Reorganizar';

  const profiles = loadProfiles();
  const bioStatus = profiles.length<3
    ? {icon:'🧠',text:'Aprendiendo (' + profiles.length + '/3)',color:C.orange,bg:C.orangeBg}
    : {icon:'✅',text:'NeuroBehavior activo',color:C.green,bg:C.greenBg};

  return (
    <div style={{width:'100%',height:'100%',background:C.white,display:'flex',
      flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:'0 28px',boxSizing:'border-box'}}>

      <div style={{fontSize:48,marginBottom:6}}>🔐</div>
      <div style={{fontSize:24,fontWeight:800,color:C.indigo,marginBottom:4}}>NeuroVault</div>
      <div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:3,textAlign:'center'}}>{title}</div>
      <div style={{fontSize:11,color:C.grayLight,marginBottom:10,textAlign:'center',lineHeight:1.4}}>{hint}</div>

      {step==='login' && (
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',
          borderRadius:20,background:bioStatus.bg,marginBottom:10}}>
          <span style={{fontSize:13}}>{bioStatus.icon}</span>
          <span style={{fontSize:11,fontWeight:700,color:bioStatus.color}}>{bioStatus.text}</span>
        </div>
      )}

      {success && (
        <div style={{fontSize:12,color:C.green,fontWeight:700,marginBottom:8,
          background:C.greenBg,padding:'8px 14px',borderRadius:8,width:'100%',textAlign:'center'}}>
          {success}
        </div>
      )}
      {error && (
        <div style={{fontSize:12,color:C.red,fontWeight:700,marginBottom:8,
          background:C.redBg,padding:'8px 14px',borderRadius:8,width:'100%',textAlign:'center'}}>
          {error}
        </div>
      )}

      {isSetup && (
        <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center'}}>
          <div style={{width:26,height:26,borderRadius:'50%',
            background:step==='setup_create'?C.indigo:C.greenBg,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:11,fontWeight:800,color:step==='setup_create'?C.white:C.green}}>
            {step==='setup_confirm'?'v':'1'}
          </div>
          <div style={{width:22,height:2,background:step==='setup_confirm'?C.indigo:'#E5E7EB'}}/>
          <div style={{width:26,height:26,borderRadius:'50%',
            background:step==='setup_confirm'?C.indigo:'#E5E7EB',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:11,fontWeight:800,color:step==='setup_confirm'?C.white:C.grayLight}}>2</div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:8,width:'100%'}}>
        {icons.map((icon,i) => {
          const order = selected.indexOf(i);
          return (
            <div key={icon+i}
              onTouchStart={e=>toggle(i,e)}
              onClick={e=>{ if (!('touches' in e)) toggle(i,e); }}
              style={{aspectRatio:'1',borderRadius:12,display:'flex',
                flexDirection:'column',alignItems:'center',justifyContent:'center',
                gap:2,cursor:blocked?'not-allowed':'pointer',
                border:order>=0?'2.5px solid '+C.indigo:'1.5px solid #E5E7EB',
                background:order>=0?C.indigoBg:'#FAFAFA',
                transition:'all 0.15s',position:'relative',opacity:blocked?0.4:1}}>
              <span style={{fontSize:22}}>{icon}</span>
              <span style={{fontSize:9,color:order>=0?C.indigo:C.grayLight,
                fontWeight:order>=0?700:400,textAlign:'center',lineHeight:1.2,padding:'0 3px'}}>
                {ICON_NAMES[icon]||''}
              </span>
              {order>=0 && (
                <div style={{position:'absolute',top:3,right:5,fontSize:9,fontWeight:800,color:C.indigo}}>
                  {order+1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {step==='login' && !blocked && (
        <div onClick={reshuffleLogin}
          style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',
            borderRadius:20,border:'1.5px solid '+C.indigo,
            cursor:'pointer',marginBottom:8,background:C.indigoBg}}>
          <span style={{fontSize:13}}>🔄</span>
          <span style={{fontSize:11,fontWeight:700,color:C.indigo}}>Reorganizar iconos</span>
        </div>
      )}

      <div style={{display:'flex',gap:4,marginBottom:10,alignItems:'center',minHeight:18}}>
        {selected.length>0
          ? selected.map((_,i) => <div key={i} style={{width:7,height:7,borderRadius:'50%',background:C.indigo}}/>)
          : <span style={{fontSize:11,color:C.grayLight}}>
              {blocked?'Espera '+countdown+'s':'Toca los iconos de tu patron'}
            </span>
        }
      </div>

      <div onClick={handleAction}
        style={{width:'100%',padding:'13px 0',borderRadius:12,
          background:blocked?'#9CA3AF':C.indigo,color:C.white,fontWeight:800,fontSize:15,
          textAlign:'center',cursor:blocked||selected.length===0?'not-allowed':'pointer',
          opacity:selected.length===0&&!blocked?0.6:1,
          transition:'all 0.2s',marginBottom:8}}>
        {blocked?'Bloqueado ('+countdown+'s)'
          :step==='setup_create'?'Continuar'
          :step==='setup_confirm'?'Confirmar patron'
          :'Entrar'}
      </div>

      {step==='login' && !blocked && (
        <div onClick={()=>setStep('upload')}
          style={{width:'100%',padding:'11px 0',borderRadius:12,background:C.grayBg,
            color:C.gray,fontWeight:700,fontSize:13,textAlign:'center',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:8}}>
          <span>🖼️</span> Acceder con imagen guardada
        </div>
      )}

      {step==='login' && !blocked && (
        <div onClick={resetPattern}
          style={{fontSize:11,color:C.indigo,cursor:'pointer',textDecoration:'underline'}}>
          Olvidaste tu patron? Crear uno nuevo
        </div>
      )}
    </div>
  );
}
