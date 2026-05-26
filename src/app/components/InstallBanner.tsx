import { useState, useEffect } from 'react';
import { C } from './shared';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
  const [show, setShow]         = useState(false);
  const [isIOS, setIsIOS]       = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Ya instalada como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // En iOS siempre mostrar instrucciones (Safari no soporta beforeinstallprompt)
      const dismissed = localStorage.getItem('nv_install_dismissed');
      if (!dismissed) setShow(true);
    } else {
      // Android/Chrome: esperar el evento
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        const dismissed = localStorage.getItem('nv_install_dismissed');
        if (!dismissed) setShow(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setTimeout(() => setShow(false), 2000);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem('nv_install_dismissed', '1');
    setShow(false);
  };

  if (isInstalled || !show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: C.white, borderTop: `3px solid ${C.indigo}`,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
      borderRadius: '20px 20px 0 0',
      padding: '20px 20px 32px',
      animation: 'slideUp 0.3s ease-out',
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Handle */}
      <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 2,
        margin: '0 auto 16px' }} />

      {installed ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>¡NeuroVault instalado!</div>
          <div style={{ fontSize: 13, color: C.grayLight, marginTop: 4 }}>Ya puedes abrirla desde tu pantalla de inicio</div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden',
              background: C.indigo, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
              🔐
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>Instalar NeuroVault</div>
              <div style={{ fontSize: 12, color: C.grayLight }}>
                Añade la app a tu pantalla de inicio
              </div>
            </div>
            <span onClick={dismiss} style={{ marginLeft: 'auto', fontSize: 20,
              color: C.grayLight, cursor: 'pointer', padding: '4px 8px' }}>✕</span>
          </div>

          {/* Beneficios */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {['⚡ Acceso rápido', '📵 Funciona offline', '🔒 100% local'].map((b, i) => (
              <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: C.indigoBg, color: C.indigo, fontWeight: 600 }}>{b}</span>
            ))}
          </div>

          {!isIOS ? (
            // Android
            <div onClick={handleInstallAndroid}
              style={{ width: '100%', padding: '15px 0', borderRadius: 14,
                background: C.indigo, color: C.white, fontWeight: 800,
                fontSize: 16, textAlign: 'center', cursor: 'pointer',
                boxShadow: `0 4px 18px ${C.indigo}55` }}>
              📲 Instalar ahora
            </div>
          ) : (
            // iOS
            <>
              <div onClick={() => setShowIOSSteps(!showIOSSteps)}
                style={{ width: '100%', padding: '15px 0', borderRadius: 14,
                  background: C.indigo, color: C.white, fontWeight: 800,
                  fontSize: 16, textAlign: 'center', cursor: 'pointer',
                  boxShadow: `0 4px 18px ${C.indigo}55`, marginBottom: 14 }}>
                📲 Ver cómo instalar en iPhone
              </div>

              {showIOSSteps && (
                <div style={{ background: C.grayBg, borderRadius: 12, padding: '14px 16px' }}>
                  {[
                    { icon: '1️⃣', text: 'Abre esta página en Safari (no en Chrome)' },
                    { icon: '2️⃣', text: 'Toca el ícono ⬆️ de compartir en la barra inferior de Safari' },
                    { icon: '3️⃣', text: 'Desliza hacia abajo y toca "Añadir a pantalla de inicio"' },
                    { icon: '4️⃣', text: 'Escribe "NeuroVault" y toca Añadir' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
                      marginBottom: i < 3 ? 12 : 0 }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ fontSize: 13, color: C.gray, lineHeight: 1.4 }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div onClick={dismiss} style={{ textAlign: 'center', marginTop: 14,
            fontSize: 12, color: C.grayLight, cursor: 'pointer' }}>
            Ahora no
          </div>
        </>
      )}
    </div>
  );
}
