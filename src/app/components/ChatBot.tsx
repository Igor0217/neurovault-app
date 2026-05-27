import { useState, useRef, useEffect } from 'react';
import { C, loadAccounts } from './shared';

interface Msg { role: 'user' | 'assistant'; text: string; }

function getReply(question: string, accountCount: number): string {
  const q = question.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (q.includes('hola') || q.includes('buenas') || q.includes('saludos'))
    return 'Hola! Soy NuroBot, tu asistente de seguridad. Puedo ayudarte con consejos de seguridad, explicarte como funciona la app o responder dudas. En que te ayudo?';

  if (q.includes('cambiar') || (q.includes('cada') && q.includes('cuanto')))
    return 'Debes cambiar tus contrasenas cada 3 a 6 meses, o de inmediato si sospechas que fueron comprometidas. En el Panel de Seguridad puedes ver cuales necesitan actualizarse con prioridad.';

  if (q.includes('segura') || q.includes('fuerte') || q.includes('buena contrasena'))
    return 'Una contrasena segura tiene mas de 12 caracteres, combina mayusculas, minusculas, numeros y simbolos especiales. Con NeuroPass AI escribe una frase memorable y la app la transforma en una clave imposible de adivinar.';

  if (q.includes('neuropass') || q.includes('frase') || q.includes('generar') || q.includes('crear clave'))
    return 'NeuroPass AI transforma frases personales en contrasenas seguras. Por ejemplo "Mi perro Max nacio en 2020" se convierte en "M!P3rr0_Mx#2020". La frase nunca se guarda, solo la clave resultante.';

  if (q.includes('ghostlogin') || q.includes('patron') || q.includes('iconos') || q.includes('visual'))
    return 'GhostLogin es tu sistema de acceso visual. Seleccionas una secuencia de iconos en orden en vez de escribir una contrasena. Los iconos cambian de posicion en cada intento para evitar que alguien te espie.';

  if (q.includes('neurobehavior') || q.includes('comportamiento') || q.includes('biometria'))
    return 'NeuroBehavior analiza como tocas la pantalla al ingresar: velocidad, ritmo y presion. Si detecta un comportamiento muy diferente al tuyo habitual, bloquea el acceso aunque el patron sea correcto.';

  if (q.includes('imagen') || q.includes('olvide') || q.includes('olvid') || q.includes('recuperar'))
    return 'Si olvidaste tu patron puedes acceder con la imagen PNG que descargaste al crearlo. En la pantalla de inicio toca "Acceder con imagen guardada" y seleccionala de tu galeria.';

  if (q.includes('vault') || q.includes('boveda') || q.includes('guardar') || q.includes('donde'))
    return 'Tus contrasenas se guardan localmente en tu celular, sin subirlas a ningun servidor externo. Solo tu puedes acceder con tu patron GhostLogin. Puedes hacer backup desde Perfil -> Exportar boveda.';

  if (q.includes('hack') || q.includes('robar') || q.includes('vulnerar') || q.includes('ataque'))
    return 'Los ataques mas comunes son fuerza bruta y phishing. NeuroVault te protege con claves de alta complejidad generadas por IA y acceso local sin servidores externos que puedan ser hackeados.';

  if (q.includes('2fa') || q.includes('dos factores') || q.includes('autenticacion doble'))
    return 'NeuroVault tiene su propio sistema de doble factor: tu patron visual GhostLogin mas NeuroBehavior que valida tu comportamiento biometrico. Es mas seguro que un SMS porque funciona localmente.';

  if (q.includes('exportar') || q.includes('backup') || q.includes('respaldo') || q.includes('copia'))
    return 'Ve a Perfil -> Exportar boveda. Se descarga un archivo JSON con tus contrasenas. Guardalo en un lugar seguro como un USB cifrado o en la nube personal.';

  if (q.includes('cuantas') || q.includes('cuantos') || q.includes('mis cuentas') || q.includes('tengo'))
    return accountCount === 0
      ? 'Aun no tienes cuentas guardadas. Ve a la pestana Nuevo y agrega tu primera contrasena con NeuroPass AI.'
      : 'Tienes ' + accountCount + ' cuenta' + (accountCount > 1 ? 's' : '') + ' guardada' + (accountCount > 1 ? 's' : '') + '. Revisa el Panel de Seguridad para ver el nivel de cada una.';

  if (q.includes('panel') || q.includes('estadistica') || q.includes('nivel'))
    return 'El Panel de Seguridad muestra el estado de todas tus contrasenas: cuantas son NeuroSecure, cuantas son debiles y el promedio de resistencia de tu vault. Tambien alerta sobre claves que debes cambiar.';

  if (q.includes('que puedes') || q.includes('que sabes') || q.includes('ayuda') || q.includes('funciones'))
    return 'Puedo ayudarte con: crear contrasenas seguras, explicar GhostLogin y NeuroBehavior, orientarte sobre cuando cambiar claves, explicar NeuroPass AI, consejos de seguridad digital y resolver dudas de la app.';

  if (q.includes('pwa') || q.includes('instalar') || q.includes('descargar app'))
    return 'NeuroVault se puede instalar directamente desde Chrome en Android: abre el link, toca el menu de 3 puntos y selecciona "Agregar a pantalla de inicio". En iPhone usa Safari y el boton de compartir.';

  if (q.includes('uno mas uno') || q.includes('1+1') || q.includes('cuanto es') || q.includes('matematica'))
    return 'Jajaja! Soy un asistente de seguridad, no una calculadora! Pero si me preguntas sobre contrasenas seguras, ahi si me las sé todas. En que te puedo ayudar con la seguridad de tu vault?';

  return 'Buena pregunta! Mi consejo general: usa contrasenas unicas para cada cuenta, crealas con NeuroPass AI para que sean fuertes, y revisa el Panel de Seguridad regularmente. Tienes alguna duda mas especifica sobre seguridad digital?';
}

export default function ChatBot() {
  const [open, setOpen]     = useState(false);
  const [msgs, setMsgs]     = useState<Msg[]>([
    { role:'assistant', text:'Hola! Soy NuroBot, tu asistente de seguridad de NeuroVault. En que te puedo ayudar hoy?' }
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs, open]);

  const send = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMsgs: Msg[] = [...msgs, { role:'user', text }];
    setMsgs(newMsgs);
    setLoading(true);
    // Simular tiempo de respuesta
    setTimeout(() => {
      const accountCount = loadAccounts().length;
      const reply = getReply(text, accountCount);
      setMsgs(p => [...p, { role:'assistant', text: reply }]);
      setLoading(false);
    }, 600);
  };

  const suggestions = [
    'Como creo una clave segura?',
    'Que es GhostLogin?',
    'Cada cuanto cambiar claves?',
    'Que es NeuroBehavior?',
  ];

  return (
    <>
      {!open && (
        <div onClick={() => setOpen(true)}
          style={{ position:'fixed', bottom:80, right:18, zIndex:1000,
            width:52, height:52, borderRadius:'50%', background:C.indigo,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, cursor:'pointer', boxShadow:'0 4px 16px ' + C.indigo + '66' }}>
          💬
        </div>
      )}

      {open && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:1000,
          height:'75vh', background:C.white, borderRadius:'20px 20px 0 0',
          boxShadow:'0 -4px 32px rgba(0,0,0,0.15)',
          display:'flex', flexDirection:'column', maxWidth:480, margin:'0 auto' }}>

          <div style={{ padding:'16px 18px 12px', borderBottom:'1px solid #F0F0F0',
            display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:C.indigoBg,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
              🤖
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color:C.dark }}>NuroBot</div>
              <div style={{ fontSize:11, color:C.green }}>● Asistente de seguridad IA</div>
            </div>
            <span onClick={() => setOpen(false)}
              style={{ fontSize:20, color:C.grayLight, cursor:'pointer', padding:'4px 8px' }}>✕</span>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'14px 18px',
            display:'flex', flexDirection:'column', gap:10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex',
                justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                {m.role==='assistant' && (
                  <div style={{ width:28, height:28, borderRadius:'50%', background:C.indigoBg,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14, marginRight:8, flexShrink:0, alignSelf:'flex-end' }}>🤖</div>
                )}
                <div style={{ maxWidth:'78%', padding:'10px 14px',
                  borderRadius: m.role==='user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role==='user' ? C.indigo : C.grayBg,
                  color: m.role==='user' ? C.white : C.dark,
                  fontSize:13, lineHeight:1.5 }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:C.indigoBg,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤖</div>
                <div style={{ padding:'10px 14px', background:C.grayBg,
                  borderRadius:'14px 14px 14px 4px', display:'flex', gap:4, alignItems:'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:6, height:6, borderRadius:'50%',
                      background:C.indigo, opacity:0.4,
                      animation:'bounce 1s ' + (i*0.2) + 's infinite' }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {msgs.length <= 1 && (
            <div style={{ padding:'0 18px 8px', display:'flex', gap:6,
              overflowX:'auto', flexWrap:'nowrap' }}>
              {suggestions.map((s, i) => (
                <div key={i} onClick={() => setInput(s)}
                  style={{ padding:'6px 12px', borderRadius:20, background:C.indigoBg,
                    color:C.indigo, fontSize:11, fontWeight:600, whiteSpace:'nowrap',
                    cursor:'pointer', border:'1px solid ' + C.indigo + '33', flexShrink:0 }}>
                  {s}
                </div>
              ))}
            </div>
          )}

          <div style={{ padding:'10px 18px 24px', borderTop:'1px solid #F0F0F0',
            display:'flex', gap:10, alignItems:'center' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && send()}
              placeholder="Escribe tu pregunta..."
              style={{ flex:1, padding:'11px 14px', borderRadius:24,
                border:'1.5px solid #E5E7EB', outline:'none', fontSize:13,
                color:C.dark, background:C.grayBg, fontFamily:'Inter, Arial, sans-serif' }}/>
            <div onClick={send}
              style={{ width:42, height:42, borderRadius:'50%',
                background: !input.trim() ? '#E5E7EB' : C.indigo,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor: !input.trim() ? 'default' : 'pointer',
                fontSize:18, transition:'background 0.2s', flexShrink:0 }}>
              ➤
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
