import { useState, useRef, useEffect } from 'react';
import { C, loadAccounts, ICON_NAMES } from './shared';

interface Msg { role: 'user' | 'assistant'; text: string; }

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
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: SYSTEM + '\n\nContexto del vault del usuario: ' + vaultCtx,
          messages: newMsgs.map(m => ({ role: m.role, content: m.text }))
        })
      });
      const data = await res.json();
      const reply = data.text || 'Lo siento, no pude procesar tu pregunta. Intenta de nuevo.';
      setMsgs(p => [...p, { role:'assistant', text: reply }]);
    } catch {
      setMsgs(p => [...p, { role:'assistant',
        text:'Hubo un error de conexión. Verifica tu internet e intenta de nuevo.' }]);
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
