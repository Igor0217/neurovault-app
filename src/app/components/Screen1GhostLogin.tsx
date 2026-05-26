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

type Step = 'login'|'setup_create'|'setup_confirm'|'setup_save'|'camera'|'risk_warning';

export default function Screen1GhostLogin() {
  const nav = useNavigate();
  const savedPattern = loadSavedPattern();
  const hasPattern   = savedPattern.length > 0;

  const [grid1, setGrid1]         = useState<string[]>(()=>shuffle(ALL_ICONS).slice(0,9));
  const [grid2, setGrid2]         = useState<string[]>([]);
  const [selected, setSelected]   = useState<number[]>([]);
  const [step, setStep]           = useState<Step>(hasPattern?'login':'setup_create');
  const [tempPattern, setTempPattern] = useState<string[]>([]);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [attempts, setAttempts]   = useState(0);
  const [blocked, setBlocked]     = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Biometría conductual
  const touchEvents = useRef<TouchEvent_NV[]>([]);
  const [riskResult, setRiskResult] = useState<ReturnType<typeof evaluateRisk>|null>(null);
  const [pendingProfile, setPendingProfile] = useState<BehaviorProfile|null>(null);

  // Cámara
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning]   = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [ocrError, setOcrError]   = useState('');
  const [camStream, setCamStream] = useState<MediaStream|null>(null);

  const icons = step==='setup_confirm' ? grid2 : grid1;

  useEffect(()=>{
    return ()=>{ camStream?.getTracks().forEach(t=>t.stop()); };
  },[camStream]);

  useEffect(()=>{
    if (!blocked) return;
    setCountdown(30);
    const iv = setInterval(()=>{
      setCountdown(c=>{
        if (c<=1){
          clearInterval(iv);
          setBlocked(false); setAttempts(0); setError('');
          setGrid1(shuffle(ALL_ICONS).slice(0,9)); setSelected([]);
          return 0;
        }
        return c-1;
      });
    },1000);
    return ()=>clearInterval(iv);
  },[blocked]);

  // ── Captura biométrica ────────────────────────────────────────────────────
  const recordTouch = (e: React.TouchEvent|React.MouseEvent, iconIndex: number) => {
    let x=0, y=0, area=100;
    if ('touches' in e && e.touches.length>0) {
      const t = e.touches[0];
      x=t.clientX; y=t.clientY;
      area = (t as any).radiusX && (t as any).radiusY
        ? (t as any).radiusX * (t as any).radiusY * Math.PI
        : 100;
    } else if ('clientX' in e) {
      x=e.clientX; y=e.clientY; area=80;
    }
    touchEvents.current.push({ iconIndex, timestamp:Date.now(), x, y, touchArea:area });
  };

  const toggle = (i: number, e: React.TouchEvent|React.MouseEvent) => {
    if (blocked) return;
    recordTouch(e, i);
    setError('');
    setSelected(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i]);
  };

  const reshuffleLogin = ()=>{
    setGrid1(shuffle(ALL_ICONS).slice(0,9));
    setSelected([]); setError('');
    touchEvents.current=[];
  };

  // ── Cámara OCR ────────────────────────────────────────────────────────────
  const startCamera = async ()=>{
    setOcrError(''); setOcrResult(''); setScanning(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
      setCamStream(stream);
      if (videoRef.current){ videoRef.current.srcObject=stream; videoRef.current.play(); }
    } catch { setOcrError('No se pudo acceder a la cámara. Verifica los permisos.'); }
  };

  const stopCamera = ()=>{ camStream?.getTracks().forEach(t=>t.stop()); setCamStream(null); };

  const captureAndScan = async ()=>{
    if (!videoRef.current||!canvasRef.current) return;
    setScanning(true); setOcrError(''); setOcrResult('');
    const video=videoRef.current; const canvas=canvasRef.current;
    canvas.width=video.videoWidth; canvas.height=video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video,0,0);
    
    try {
      // Usar Tesseract.js — OCR local sin API
      const { data: { text: rawText } } = await Tesseract.recognize(
        canvas,
        'spa', // español
        { logger: m => { if (m.status === 'recognizing text') setOcrResult(`Leyendo... ${Math.round(m.progress*100)}%`); } }
      );
      
      const text = rawText.toLowerCase().trim();
      console.log('Tesseract result:', text);
      setOcrResult(text);
      
      if (!text || text.length < 2) {
        setOcrError('No se detectó texto. Asegúrate de tener buena iluminación y el texto bien visible.');
        return;
      }
      const saved=loadSavedPattern();
      // Normalizar texto: acepta comas, saltos de línea o espacios como separadores
      const normalizedText = text.replace(/[\n\r]+/g, ',').replace(/\s{2,}/g, ',');
      const words = normalizedText.split(',').map((w:string)=>w.trim().toLowerCase()).filter(Boolean);
      const patternNames=saved.map(ic=>ICON_NAMES[ic]||'');
      // Normalizar tildes para comparación flexible
      const normalize = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
      const normWords = words.map(normalize);
      const normPattern = patternNames.map(normalize);
      
      // Para 'llave antigua' aceptar solo 'llave' también
      const match = normPattern.length > 0 && normPattern.length === normWords.length &&
        normPattern.every((name, i) => {
          const w = normWords[i];
          // Coincidencia exacta o parcial (ej: 'llave antigua' contiene 'llave')
          return w === name || name.startsWith(w) || w.startsWith(name) ||
                 name.includes(w) || w.includes(name);
        });
      if (match){
        setSuccess('¡Acceso concedido por libreta! 📖✅');
        stopCamera();
        setTimeout(()=>nav('/vault'),900);
      } else {
        setOcrError(`Leí: "${text}" — No coincide con tu patrón.`);
      }
    } catch { setOcrError('Error al leer la imagen. Intenta de nuevo.'); }
    finally { setScanning(false); }
  };

  // ── Acción principal ──────────────────────────────────────────────────────
  const handleAction = ()=>{
    if (blocked||selected.length===0) return;

    if (step==='setup_create'){
      if (selected.length<3){setError('Selecciona al menos 3 íconos');return;}
      const chosen=selected.map(i=>grid1[i]);
      setTempPattern(chosen);
      setGrid2(shuffle([...grid1]));
      setSelected([]); touchEvents.current=[];
      setStep('setup_confirm');
      setSuccess(`Selecciona los mismos ${chosen.length} íconos en el mismo orden`);
      setError('');

    } else if (step==='setup_confirm'){
      const confirm=selected.map(i=>grid2[i]);
      const match=tempPattern.length===confirm.length&&
        tempPattern.every((ic,idx)=>ic===confirm[idx]);
      if (!match){
        setError('El patrón no coincide. Empieza de nuevo.');
        setGrid1(shuffle(ALL_ICONS).slice(0,9));
        setGrid2([]); setTempPattern([]);
        setStep('setup_create'); setSelected([]); setSuccess('');
        touchEvents.current=[];
        return;
      }
      localStorage.setItem(PATTERN_KEY,JSON.stringify(tempPattern));
      setStep('setup_save'); setError('');

    } else if (step==='login'){
      const saved=loadSavedPattern();
      const chosen=selected.map(i=>grid1[i]);
      const match=saved.length>0&&saved.length===chosen.length&&
        saved.every((ic,idx)=>ic===chosen[idx]);

      if (match){
        // Evaluar biometría
        const profile=buildProfile(touchEvents.current);
        touchEvents.current=[];

        if (profile){
          const risk=evaluateRisk(profile);
          saveRiskResult(risk.score);

          if (risk.level==='danger'){
            // Bloquear y pedir verificación extra
            setPendingProfile(profile);
            setRiskResult(risk);
            setStep('risk_warning');
            return;
          }
          // Guardar perfil para aprendizaje continuo
          saveProfile(profile);
        }
        setSuccess('¡Acceso concedido! 🎉');
        setTimeout(()=>nav('/vault'),700);
      } else {
        const next=attempts+1; setAttempts(next);
        setGrid1(shuffle(ALL_ICONS).slice(0,9));
        setSelected([]); touchEvents.current=[];
        if (next>=5){
          setBlocked(true); setError('Demasiados intentos. Bloqueado 30 segundos.');
        } else {
          setError(`Patrón incorrecto — intento ${next} de 5`);
        }
      }
    }
  };

  const resetPattern=()=>{
    if (window.confirm('¿Seguro? El patrón actual se borrará.')){
      localStorage.removeItem(PATTERN_KEY);
      setStep('setup_create');
      setGrid1(shuffle(ALL_ICONS).slice(0,9));
      setGrid2([]); setTempPattern([]);
      setSelected([]); setError(''); setSuccess('');
      touchEvents.current=[];
    }
  };

  // ── PANTALLA: Recomendación libreta ───────────────────────────────────────
  if (step==='setup_save'){
    return (
      <div style={{width:'100%',height:'100%',background:C.white,display:'flex',
        flexDirection:'column',alignItems:'center',justifyContent:'center',
        padding:'0 28px',boxSizing:'border-box'}}>
        <div style={{fontSize:52,marginBottom:12}}>📖</div>
        <div style={{fontSize:20,fontWeight:800,color:C.dark,marginBottom:8,textAlign:'center'}}>
          ¡Patrón creado exitosamente!
        </div>
        <div style={{fontSize:13,color:C.gray,marginBottom:20,textAlign:'center',lineHeight:1.6}}>
          Anota en una libreta los nombres de tus íconos en este orden para no olvidarlos:
        </div>
        <div style={{width:'100%',background:C.indigoBg,borderRadius:16,
          padding:'20px',marginBottom:16,border:`2px dashed ${C.indigo}`}}>
          <div style={{fontSize:11,color:C.indigo,fontWeight:700,
            textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:14,textAlign:'center'}}>
            📝 Anota esto en tu libreta
          </div>
          {tempPattern.map((icon,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,
              padding:'10px 14px',background:C.white,borderRadius:10,
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
        <div style={{background:C.orangeBg,borderRadius:12,padding:'12px 16px',
          marginBottom:20,width:'100%'}}>
          <div style={{fontSize:12,color:C.orange,fontWeight:700,marginBottom:4}}>
            🧠 NeuroBehavior activado
          </div>
          <div style={{fontSize:11,color:C.gray,lineHeight:1.5}}>
            La app aprenderá tu forma de ingresar el patrón. Después de 3 ingresos, detectará comportamientos inusuales automáticamente.
          </div>
        </div>
        <div onClick={()=>nav('/vault')}
          style={{width:'100%',padding:'14px 0',borderRadius:12,
            background:C.indigo,color:C.white,fontWeight:800,
            fontSize:16,textAlign:'center',cursor:'pointer',
            boxShadow:`0 4px 16px ${C.indigo}44`}}>
          Entrar a NeuroVault →
        </div>
      </div>
    );
  }

  // ── PANTALLA: Alerta de riesgo — SIN opción de entrar ───────────────────
  if (step==='risk_warning'){
    return (
      <div style={{width:'100%',height:'100%',background:C.white,display:'flex',
        flexDirection:'column',alignItems:'center',justifyContent:'center',
        padding:'0 28px',boxSizing:'border-box'}}>
        <div style={{fontSize:52,marginBottom:12}}>🔒</div>
        <div style={{fontSize:20,fontWeight:800,color:C.red,marginBottom:8,textAlign:'center'}}>
          Acceso denegado
        </div>
        <div style={{background:C.redBg,borderRadius:14,padding:'16px',
          marginBottom:16,width:'100%',borderLeft:`4px solid ${C.red}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.red,marginBottom:6}}>
            Patrón no reconocido
          </div>
          <div style={{fontSize:12,color:C.gray,lineHeight:1.5}}>
            El patrón ingresado no coincide con el registrado o fue ingresado de forma inusual. Por seguridad el acceso ha sido bloqueado temporalmente.
          </div>
        </div>
        <div style={{background:C.orangeBg,borderRadius:12,padding:'12px 14px',
          marginBottom:20,width:'100%'}}>
          <div style={{fontSize:12,color:C.orange,fontWeight:700,marginBottom:4}}>
            💡 ¿Qué hacer?
          </div>
          <div style={{fontSize:11,color:C.gray,lineHeight:1.5}}>
            Intenta ingresar tu patrón nuevamente de forma natural, al mismo ritmo de siempre. Si continúas sin acceso, usa la opción de libreta o crea un nuevo patrón.
          </div>
        </div>
        <div onClick={()=>{
            // NO guardar este perfil sospechoso
            setPendingProfile(null); setRiskResult(null);
            setStep('login'); setSelected([]);
            setGrid1(shuffle(ALL_ICONS).slice(0,9));
            touchEvents.current=[];
          }}
          style={{width:'100%',padding:'14px 0',borderRadius:12,
            background:C.indigo,color:C.white,fontWeight:800,
            fontSize:15,textAlign:'center',cursor:'pointer',marginBottom:10}}>
          🔄 Intentar de nuevo
        </div>
        <div onClick={()=>{setStep('camera');startCamera();}}
          style={{width:'100%',padding:'12px 0',borderRadius:12,
            background:C.grayBg,color:C.gray,fontWeight:700,
            fontSize:13,textAlign:'center',cursor:'pointer',marginBottom:10}}>
          📖 Acceder con mi libreta
        </div>
        <div onClick={resetPattern}
          style={{fontSize:11,color:C.indigo,cursor:'pointer',textDecoration:'underline'}}>
          Crear un patrón nuevo
        </div>
      </div>
    );
  }

  // ── PANTALLA: Cámara OCR ──────────────────────────────────────────────────
  if (step==='camera'){
    return (
      <div style={{width:'100%',height:'100%',background:'#0F172A',
        display:'flex',flexDirection:'column',boxSizing:'border-box'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'52px 18px 14px'}}>
          <span onClick={()=>{stopCamera();setStep('login');}}
            style={{fontSize:16,color:C.indigo,cursor:'pointer'}}>◀</span>
          <span style={{fontSize:16,fontWeight:800,color:C.white}}>Acceso por libreta 📖</span>
        </div>
        <div style={{padding:'0 18px',marginBottom:12}}>
          <div style={{fontSize:12,color:'#94A3B8',textAlign:'center',lineHeight:1.5}}>
            Apunta la cámara a tu libreta donde anotaste los nombres de tus íconos
          </div>
        </div>
        <div style={{flex:1,margin:'0 18px',borderRadius:16,overflow:'hidden',
          background:'#1E293B',position:'relative',minHeight:200}}>
          <video ref={videoRef} autoPlay playsInline muted
            style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          <div style={{position:'absolute',inset:20,border:'2px dashed rgba(99,102,241,0.7)',
            borderRadius:12,pointerEvents:'none'}}/>
          {!camStream&&(
            <div style={{position:'absolute',inset:0,display:'flex',
              alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8}}>
              <span style={{fontSize:40}}>📷</span>
              <span style={{fontSize:13,color:'#94A3B8'}}>Cámara no iniciada</span>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{display:'none'}}/>
        {ocrResult&&(
          <div style={{margin:'12px 18px 0',background:'#1E293B',borderRadius:10,padding:'10px 14px'}}>
            <div style={{fontSize:11,color:'#94A3B8',marginBottom:4}}>Texto detectado:</div>
            <div style={{fontSize:13,color:C.white,fontWeight:700}}>{ocrResult}</div>
          </div>
        )}
        {success&&(
          <div style={{margin:'12px 18px 0',background:C.greenBg,borderRadius:10,
            padding:'10px 14px',textAlign:'center'}}>
            <div style={{fontSize:13,color:C.green,fontWeight:700}}>{success}</div>
          </div>
        )}
        {ocrError&&(
          <div style={{margin:'12px 18px 0',background:C.redBg,borderRadius:10,padding:'10px 14px'}}>
            <div style={{fontSize:12,color:C.red,fontWeight:700}}>{ocrError}</div>
          </div>
        )}
        <div style={{padding:'14px 18px 32px',display:'flex',flexDirection:'column',gap:10}}>
          {!camStream
            ?<div onClick={startCamera}
                style={{padding:'14px 0',borderRadius:12,background:C.indigo,
                  color:C.white,fontWeight:800,fontSize:15,textAlign:'center',cursor:'pointer'}}>
                📷 Activar cámara
              </div>
            :<div onClick={captureAndScan}
                style={{padding:'14px 0',borderRadius:12,
                  background:scanning?'#9CA3AF':C.indigo,
                  color:C.white,fontWeight:800,fontSize:15,textAlign:'center',cursor:'pointer'}}>
                {scanning?'🔍 Analizando...':'📸 Leer libreta'}
              </div>
          }
          <div onClick={()=>{stopCamera();setStep('login');}}
            style={{padding:'12px 0',borderRadius:12,background:'#1E293B',
              color:'#94A3B8',fontWeight:600,fontSize:14,textAlign:'center',cursor:'pointer'}}>
            Volver al patrón visual
          </div>
        </div>
      </div>
    );
  }

  // ── PANTALLA: Login / Setup ───────────────────────────────────────────────
  const isSetup=step==='setup_create'||step==='setup_confirm';
  const title=step==='setup_create'?'Crea tu patrón visual'
    :step==='setup_confirm'?'Confirma tu patrón'
    :'Selecciona tu patrón visual';
  const hint=step==='setup_create'?'Selecciona 3 o más íconos en el orden que quieras recordar'
    :step==='setup_confirm'?`Mismos íconos reorganizados — selecciona los ${tempPattern.length} en el mismo orden`
    :'¿No ves tus íconos? Toca 🔄 para reorganizar';

  const profiles=loadProfiles();
  const bioStatus=profiles.length<3
    ?{icon:'🧠',text:`Aprendiendo (${profiles.length}/3 ingresos)`,color:C.orange,bg:C.orangeBg}
    :{icon:'✅',text:'NeuroBehavior activo',color:C.green,bg:C.greenBg};

  return (
    <div style={{width:'100%',height:'100%',background:C.white,display:'flex',
      flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:'0 28px',boxSizing:'border-box'}}>

      <div style={{fontSize:48,marginBottom:6}}>🔐</div>
      <div style={{fontSize:24,fontWeight:800,color:C.indigo,marginBottom:4}}>NeuroVault</div>
      <div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:3,textAlign:'center'}}>{title}</div>
      <div style={{fontSize:11,color:C.grayLight,marginBottom:10,textAlign:'center',lineHeight:1.4}}>{hint}</div>

      {/* Badge NeuroBehavior */}
      {step==='login'&&(
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',
          borderRadius:20,background:bioStatus.bg,marginBottom:10}}>
          <span style={{fontSize:13}}>{bioStatus.icon}</span>
          <span style={{fontSize:11,fontWeight:700,color:bioStatus.color}}>{bioStatus.text}</span>
        </div>
      )}

      {success&&(
        <div style={{fontSize:12,color:C.green,fontWeight:700,marginBottom:8,
          background:C.greenBg,padding:'8px 14px',borderRadius:8,
          width:'100%',textAlign:'center'}}>{success}</div>
      )}
      {error&&(
        <div style={{fontSize:12,color:C.red,fontWeight:700,marginBottom:8,
          background:C.redBg,padding:'8px 14px',borderRadius:8,
          width:'100%',textAlign:'center'}}>{error}</div>
      )}

      {isSetup&&(
        <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center'}}>
          <div style={{width:26,height:26,borderRadius:'50%',
            background:step==='setup_create'?C.indigo:C.greenBg,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:11,fontWeight:800,
            color:step==='setup_create'?C.white:C.green}}>
            {step==='setup_confirm'?'✓':'1'}
          </div>
          <div style={{width:22,height:2,background:step==='setup_confirm'?C.indigo:'#E5E7EB'}}/>
          <div style={{width:26,height:26,borderRadius:'50%',
            background:step==='setup_confirm'?C.indigo:'#E5E7EB',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:11,fontWeight:800,
            color:step==='setup_confirm'?C.white:C.grayLight}}>2</div>
        </div>
      )}

      {/* Grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',
        gap:8,marginBottom:8,width:'100%'}}>
        {icons.map((icon,i)=>{
          const order=selected.indexOf(i);
          return (
            <div key={`${icon}-${i}`}
              onTouchStart={e=>toggle(i,e)}
              onClick={e=>{ if (!('touches' in e)) toggle(i,e); }}
              style={{aspectRatio:'1',borderRadius:12,display:'flex',
                flexDirection:'column',alignItems:'center',justifyContent:'center',
                gap:2,cursor:blocked?'not-allowed':'pointer',
                border:order>=0?`2.5px solid ${C.indigo}`:'1.5px solid #E5E7EB',
                background:order>=0?C.indigoBg:'#FAFAFA',
                transition:'all 0.15s',position:'relative',
                opacity:blocked?0.4:1}}>
              <span style={{fontSize:22}}>{icon}</span>
              <span style={{fontSize:9,color:order>=0?C.indigo:C.grayLight,
                fontWeight:order>=0?700:400,textAlign:'center',lineHeight:1.2,padding:'0 3px'}}>
                {ICON_NAMES[icon]||''}
              </span>
              {order>=0&&(
                <div style={{position:'absolute',top:3,right:5,
                  fontSize:9,fontWeight:800,color:C.indigo}}>{order+1}</div>
              )}
            </div>
          );
        })}
      </div>

      {step==='login'&&!blocked&&(
        <div onClick={reshuffleLogin}
          style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',
            borderRadius:20,border:`1.5px solid ${C.indigo}`,
            cursor:'pointer',marginBottom:8,background:C.indigoBg}}>
          <span style={{fontSize:13}}>🔄</span>
          <span style={{fontSize:11,fontWeight:700,color:C.indigo}}>Reorganizar íconos</span>
        </div>
      )}

      <div style={{display:'flex',gap:4,marginBottom:10,alignItems:'center',minHeight:18}}>
        {selected.length>0
          ?selected.map((_,i)=>(
              <div key={i} style={{width:7,height:7,borderRadius:'50%',background:C.indigo}}/>
            ))
          :<span style={{fontSize:11,color:C.grayLight}}>
              {blocked?`⏳ ${countdown}s`:'Toca los íconos de tu patrón'}
            </span>
        }
      </div>

      <div onClick={handleAction}
        style={{width:'100%',padding:'13px 0',borderRadius:12,
          background:blocked?'#9CA3AF':C.indigo,
          color:C.white,fontWeight:800,fontSize:15,textAlign:'center',
          cursor:blocked||selected.length===0?'not-allowed':'pointer',
          opacity:selected.length===0&&!blocked?0.6:1,
          boxShadow:blocked?'none':`0 4px 16px ${C.indigo}44`,
          transition:'all 0.2s',marginBottom:8}}>
        {blocked?`🔒 Bloqueado (${countdown}s)`
          :step==='setup_create'?'Continuar →'
          :step==='setup_confirm'?'Confirmar patrón ✓'
          :'Entrar'}
      </div>

      {step==='login'&&!blocked&&(
        <div onClick={()=>{setStep('camera');startCamera();}}
          style={{width:'100%',padding:'11px 0',borderRadius:12,
            background:C.grayBg,color:C.gray,fontWeight:700,
            fontSize:13,textAlign:'center',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:8}}>
          <span>📖</span> Acceder con mi libreta
        </div>
      )}

      {step==='login'&&!blocked&&(
        <div onClick={resetPattern}
          style={{fontSize:11,color:C.indigo,cursor:'pointer',textDecoration:'underline'}}>
          ¿Olvidaste tu patrón? Crear uno nuevo
        </div>
      )}
    </div>
  );
}
