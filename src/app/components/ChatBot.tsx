import { useState, useRef, useEffect } from 'react';
import { C, loadAccounts, ICON_NAMES } from './shared';

interface Msg { role: 'user' | 'assistant'; text: string; }

// Base de conocimiento local de seguridad
async function getSmartReply(question: string, vaultCtx: string): Promise<string> {
  const q = question.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');

  // Intentar primero con Gemini
  try {
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: `Eres NuroBot, asistente de seguridad de NeuroVault app de contrasenas. 
Responde en espanol, breve y amigable (max 3 oraciones). Contexto: ${vaultCtx}`,
        messages: [{ role: 'user', content: question }]
      })
    });
    const data = await res.json();
    if (data.text && data.text.length > 10) return data.text;
  } catch { /* usar respuestas locales */ }

  // Respuestas locales inteligentes por palabras clave
  if (q.includes('cambiar') && (q.includes('contrasena') || q.includes('clave')))
    return 'Lo recomendable es cambiar tus contraseñas cada 3 a 6 meses, o inmediatamente si sospechas que fueron comprometidas. En el Panel de seguridad puedes ver cuáles necesitan actualizarse.';

  if (q.includes('segura') || q.includes('seguridad') || q.includes('fuerte'))
    return 'Una contraseña segura tiene más de 12 caracteres, combina mayúsculas, minúsculas, números y símbolos. Con NeuroPass AI puedes crear una escribiendo una frase memorable y la app la transforma automáticamente.';

  if (q.includes('ghostlogin') || q.includes('patron') || q.includes('iconos'))
    return 'GhostLogin es tu sistema de acceso visual. En vez de una contraseña de texto, seleccionas una secuencia de íconos en orden. Los íconos cambian de posición en cada intento para mayor seguridad.';

  if (q.includes('neurobehavior') || q.includes('comportamiento') || q.includes('biometria'))
    return 'NeuroBehavior analiza cómo tocas la pantalla al ingresar: velocidad, ritmo y presión. Si detecta un comportamiento muy diferente al tuyo habitual, bloquea el acceso aunque el patrón sea correcto.';

  if (q.includes('neuropass') || q.includes('frase') || q.includes('generar'))
    return 'NeuroPass AI transforma frases personales en contraseñas seguras. Por ejemplo "Mi perro Max nació en 2020" se convierte en "M!P3rr0_Mx#2020". La frase nunca se guarda, solo la clave resultante.';

  if (q.includes('imagen') || q.includes('libreta') || q.includes('olvide') || q.includes('olvi'))
    return 'Si olvidaste tu patrón puedes acceder con la imagen PNG que descargaste al crearlo. Ve a la pantalla de inicio y toca "Acceder con imagen guardada", selecciona la imagen de tu galería y entras automáticamente.';

  if (q.includes('vault') || q.includes('boveda') || q.includes('guardar') || q.includes('contrasenas'))
    return 'Tu vault guarda todas tus contraseñas localmente en tu celular, sin subirlas a ningún servidor. Solo tú puedes acceder con tu patrón GhostLogin. Puedes exportar un backup desde Perfil → Exportar bóveda.';

  if (q.includes('hola') || q.includes('buenas') || q.includes('saludos'))
    return 'Hola! Soy NuroBot, tu asistente de seguridad de NeuroVault. Puedo ayudarte con consejos de seguridad, explicarte cómo funciona la app o responder dudas sobre tus contraseñas. ¿En qué te ayudo?';

  if (q.includes('que puedes') || q.includes('que sabes') || q.includes('ayuda') || q.includes('funciones'))
    return 'Puedo ayudarte con: consejos para crear contraseñas seguras, explicar GhostLogin y NeuroBehavior, orientarte sobre cuándo cambiar claves, explicar cómo funciona NeuroPass AI, y responder dudas de seguridad digital.';

  if (q.includes('hack') || q.includes('robar') || q.includes('vulnerar') || q.includes('ataque'))
    return 'Los ataques más comunes son fuerza bruta (probar millones de combinaciones) y phishing (engañarte para que entregues tu clave). NeuroVault te protege con claves de alta entropía y acceso local sin servidores externos.';

  if (q.includes('dos factores') || q.includes('2fa') || q.includes('autenticacion'))
    return 'La autenticación de dos factores (2FA) agrega una capa extra de seguridad. NeuroVault ya tiene su propio 2FA interno: tu patrón visual GhostLogin más NeuroBehavior que valida tu comportamiento biométrico.';

  if (q.includes('exportar') || q.includes('backup') || q.includes('respaldo'))
    return 'Puedes exportar tu vault desde Perfil → Exportar bóveda. Se descarga un archivo JSON con tus contraseñas que puedes guardar como respaldo. Guárdalo en un lugar seguro, preferiblemente cifrado.';

  if (q.includes('cuantas') || q.includes('cuantos') || q.includes('mis cuentas'))
    return vaultCtx.includes('0 cuentas')
      ? 'Aún no tienes cuentas guardadas. Ve a la pestaña Nuevo para agregar tu primera contraseña con NeuroPass AI.'
      : 'Puedes ver el estado de todas tus cuentas en el Panel de Seguridad. Ahí verás cuántas son NeuroSecure y cuáles necesitan actualización.';

  // Respuesta genérica de seguridad
  return 'Buena pregunta sobre seguridad digital. Mi recomendación general: usa contraseñas únicas para cada cuenta, actívalas con NeuroPass AI para que sean fuertes, y revisa el Panel de seguridad regularmente para detectar claves débiles. ¿Tienes alguna duda más específica?';
}

const SYSTEM = `Eres el asistente de seguridad de NeuroVault, una app de gestión de contraseñas. 
Tu nombre es NuroBot. Ayudas a los usuarios con:
- Consejos de seguridad digital
- Cómo crear contraseñas seguras
- Explicar el nivel de seguridad de sus claves
- Responder dudas sobre la app
Responde siempre en español, de forma amigable, breve y clara (máximo 3 párrafos).
No inventes datos del usuario — si te preguntan sobre sus cuentas específicas, diles que revisen el Panel de seguridad.`;

export default function ChatBot() {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Msg[]>([
    { role:'assistant', text:'¡Hola! Soy NuroBot 🤖, tu asistente de seguridad. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMsgs: Msg[] = [...msgs, { role:'user', text }];
    setMsgs(newMsgs);
    setLoading(true);

    // Contexto del vault para respuestas personalizadas
    const accounts = loadAccounts();
    const vaultCtx = accounts.length > 0
      ? `El usuario tiene ${accounts.length} cuentas guardadas: ${accounts.map(a => `${a.name}(${a.level})`).join(', ')}.`
      : 'El usuario aún no tiene cuentas guardadas.';

    try {
      const reply = await getSmartReply(text, vaultCtx);
      setMsgs(p => [...p, { role:'assistant', text: reply }]);
    } catch {
      setMsgs(p => [...p, { role:'assistant',
        text:'Hubo un error. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    '¿Cómo creo una clave segura?',
    '¿Qué significa NeuroSecure?',
    '¿Cómo funciona el patrón visual?',
    'Dame consejos de seguridad',
  ];

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <div onClick={() => setOpen(true)}
          style={{ position:'fixed', bottom:80, right:18, zIndex:1000,
            width:52, height:52, borderRadius:'50%', background:C.indigo,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, cursor:'pointer', boxShadow:`0 4px 16px ${C.indigo}66`,
            transition:'transform 0.2s' }}>
          💬
        </div>
      )}

      {/* Ventana del chat */}
      {open && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:1000,
          height:'75vh', background:C.white, borderRadius:'20px 20px 0 0',
          boxShadow:'0 -4px 32px rgba(0,0,0,0.15)',
          display:'flex', flexDirection:'column', maxWidth:480, margin:'0 auto' }}>

          {/* Header */}
          <div style={{ padding:'16px 18px 12px', borderBottom:`1px solid #F0F0F0`,
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

          {/* Mensajes */}
          <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex',
            flexDirection:'column', gap:10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width:28, height:28, borderRadius:'50%', background:C.indigoBg,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14, marginRight:8, flexShrink:0, alignSelf:'flex-end' }}>🤖</div>
                )}
                <div style={{ maxWidth:'78%', padding:'10px 14px', borderRadius:
                    m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? C.indigo : C.grayBg,
                  color: m.role === 'user' ? C.white : C.dark,
                  fontSize:13, lineHeight:1.5 }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:C.indigoBg,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤖</div>
                <div style={{ padding:'10px 14px', background:C.grayBg, borderRadius:'14px 14px 14px 4px' }}>
                  <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:6, height:6, borderRadius:'50%',
                        background:C.indigo, opacity:0.4,
                        animation:`bounce 1s ${i*0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Sugerencias rápidas */}
          {msgs.length <= 1 && (
            <div style={{ padding:'0 18px 8px', display:'flex', gap:6,
              overflowX:'auto', flexWrap:'nowrap' }}>
              {suggestions.map((s, i) => (
                <div key={i} onClick={() => { setInput(s); }}
                  style={{ padding:'6px 12px', borderRadius:20, background:C.indigoBg,
                    color:C.indigo, fontSize:11, fontWeight:600, whiteSpace:'nowrap',
                    cursor:'pointer', border:`1px solid ${C.indigo}33`, flexShrink:0 }}>
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'10px 18px 24px', borderTop:'1px solid #F0F0F0',
            display:'flex', gap:10, alignItems:'center' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Escribe tu pregunta..."
              style={{ flex:1, padding:'11px 14px', borderRadius:24,
                border:`1.5px solid #E5E7EB`, outline:'none', fontSize:13,
                color:C.dark, background:C.grayBg, fontFamily:'Inter, Arial, sans-serif' }} />
            <div onClick={send}
              style={{ width:42, height:42, borderRadius:'50%',
                background: loading || !input.trim() ? '#E5E7EB' : C.indigo,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                fontSize:18, transition:'background 0.2s', flexShrink:0 }}>
              {loading ? '⏳' : '➤'}
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
