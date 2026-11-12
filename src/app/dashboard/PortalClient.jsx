'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/*
  Browser / OS notes
  - Vendor prefixes (-webkit-) are written by hand because this CSS lives in a <style> string
    and is not processed by Autoprefixer.
  - No flexbox "gap", no "inset", no "dvh-only" sizing: each has an older-browser fallback
    so iOS 10+, Safari 10+, Chrome 49+, Firefox 52+, Edge 79+ and Android 5+ WebView all render it.
  - :focus-visible has a :focus fallback; backdrop-filter is optional polish only.

  Entrance animation
  - Each card is "broken" into 4 jagged shards (clip-path polygons that tile the card exactly).
  - The shards fly in from the 4 corners of the screen and snap together.
  - At the moment they join, the real (clickable) card is revealed in their place.
*/
const portalCss = `
.portal-root{min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden;color:#183B4E;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-text-size-adjust:100%;text-size-adjust:100%;
  background:#EAF3F5;
  background:radial-gradient(900px 480px at 50% 35%, rgba(13,148,136,.16), transparent 65%),linear-gradient(180deg,#E6F1F4 0%,#F0F7F8 55%,#DCE8EC 100%)}
@supports (min-height:100dvh){.portal-root{min-height:100dvh}}
.portal-root *,.portal-root *::before,.portal-root *::after{box-sizing:border-box}
/* while the shards are flying, nothing may spill out and create scrollbars */
.portal-root-intro{overflow:hidden}

/* Navbar */
.portal-nav{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;padding:14px 28px;background:#102A43;color:#fff;box-shadow:0 2px 10px rgba(16,42,67,.25);-ms-flex-negative:0;flex-shrink:0;position:relative;z-index:5}
.portal-nav-brand{display:flex;align-items:center}
.portal-nav-mark{width:36px;height:36px;margin-right:12px;border-radius:10px;background:#0D9488;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px}
.portal-nav-brand-text{display:flex;flex-direction:column;line-height:1.2}
.portal-nav-brand-text strong{font-size:16px;font-weight:700}
.portal-nav-brand-text span{font-size:11.5px;color:#9FB3C8}
.portal-nav-right{display:flex;align-items:center}
.portal-nav-welcome{margin-right:16px;font-size:13.5px;color:#D9E2EC}
.portal-nav-welcome strong{color:#fff;font-weight:600}
.portal-logout-btn{display:inline-flex;align-items:center;padding:8px 16px;border:1px solid rgba(255,255,255,.25);border-radius:8px;background:transparent;color:#fff;font-family:inherit;font-size:13px;font-weight:600;line-height:1.2;cursor:pointer;-webkit-appearance:none;appearance:none;transition:background .15s,border-color .15s}
.portal-logout-btn svg{margin-right:6px}
.portal-logout-btn:hover{background:#dc2626;border-color:#dc2626}
.portal-logout-btn:focus{outline:2px solid #5EEAD4;outline-offset:2px}
.portal-logout-btn:focus:not(:focus-visible){outline:none}
.portal-logout-btn:disabled{opacity:.6;cursor:not-allowed}

/* Body */
.portal-body{-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px 40px;width:100%}
.portal-header{text-align:center;margin-bottom:48px;max-width:520px;padding:0 8px}
.portal-header h1{margin:0 0 8px;font-size:30px;font-weight:700;letter-spacing:-.3px;color:#102A43}
.portal-header p{margin:0;font-size:14.5px;color:#486581;line-height:1.5}

/* 3D stage: cards side by side */
.portal-cards{display:flex;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:stretch;width:100%;
  -webkit-perspective:1500px;perspective:1500px;-webkit-perspective-origin:50% 40%;perspective-origin:50% 40%}

.portal-slot{position:relative;width:320px;max-width:100%;margin:0 32px 56px;
  -webkit-transform-style:preserve-3d;transform-style:preserve-3d}
.portal-slot:nth-child(1){--base:0deg}
.portal-slot:nth-child(2){--base:0deg}

/* Soft floor shadow: appears when the pieces join */
.portal-slot::after{content:'';position:absolute;left:8%;right:8%;bottom:-36px;height:26px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(16,42,67,.28),transparent 70%);-webkit-filter:blur(5px);filter:blur(5px);pointer-events:none;
  -webkit-animation:portalReveal .01s linear 1.6s backwards;animation:portalReveal .01s linear 1.6s backwards}

/* The real card is hidden (and not clickable) until the shards have joined */
@-webkit-keyframes portalReveal{from{opacity:0;visibility:hidden}to{opacity:1;visibility:visible}}
@keyframes portalReveal{from{opacity:0;visibility:hidden}to{opacity:1;visibility:visible}}

/* The card: rests flat in 3D, tilts with the mouse */
.portal-card{--rx:0deg;--ry:0deg;--lift:0px;--mx:50%;--my:30%;
  position:relative;height:100%;border-radius:20px;padding:36px 28px 30px;background:#F7FBFC;background:linear-gradient(160deg,#FFFFFF 0%,#F4FAFB 100%);border:1px solid #D9E2EC;text-align:center;outline:none;
  -webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;
  -webkit-transform-style:preserve-3d;transform-style:preserve-3d;
  -webkit-transform:rotateX(var(--rx)) rotateY(calc(var(--base) + var(--ry))) translateZ(var(--lift));
  transform:rotateX(var(--rx)) rotateY(calc(var(--base) + var(--ry))) translateZ(var(--lift));
  transition:-webkit-transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease,border-color .2s ease;
  transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease,border-color .2s ease;
  box-shadow:0 2px 4px rgba(16,42,67,.06),0 24px 48px rgba(16,42,67,.16);
  -webkit-animation:portalReveal .01s linear 1.6s backwards;animation:portalReveal .01s linear 1.6s backwards}
.portal-card-resign{--accent:#0284C7;--accent-dark:#075985}
.portal-card-esi{--accent:#0D9488;--accent-dark:#115E59}
.portal-card-locked{--accent:#CBD5E1;--accent-dark:#94A3B8}

/* Card thickness: a darker slab behind the face */
.portal-card::before{content:'';position:absolute;top:0;right:0;bottom:0;left:0;border-radius:20px;background:#075985;background:var(--accent-dark);-webkit-transform:translateZ(-18px);transform:translateZ(-18px);box-shadow:0 18px 36px rgba(16,42,67,.22);pointer-events:none}
/* Accent edge on the face */
.portal-card::after{content:'';position:absolute;left:0;right:0;top:0;height:5px;border-radius:20px 20px 0 0;background:#0D9488;background:var(--accent);pointer-events:none}

/* Light reflection that follows the cursor */
.portal-card-shine{position:absolute;top:0;right:0;bottom:0;left:0;border-radius:20px;pointer-events:none;opacity:0;transition:opacity .25s ease;
  background:radial-gradient(circle at var(--mx) var(--my),rgba(255,255,255,.75),rgba(255,255,255,0) 55%)}

.portal-card-allowed{cursor:pointer}
.portal-card-allowed:hover{--lift:40px;border-color:var(--accent);box-shadow:0 4px 8px rgba(16,42,67,.08),0 40px 70px rgba(16,42,67,.26)}
.portal-card-allowed:hover .portal-card-shine{opacity:1}
.portal-card-allowed:focus{--lift:40px;box-shadow:0 0 0 3px #fff,0 0 0 5px var(--accent),0 30px 60px rgba(16,42,67,.22)}
.portal-card-allowed:focus:not(:focus-visible){box-shadow:0 2px 4px rgba(16,42,67,.06),0 24px 48px rgba(16,42,67,.16)}
.portal-card-selected{--lift:40px;border-color:var(--accent) !important}
.portal-card-locked{cursor:not-allowed;background:#F1F5F9}
.portal-card-locked .portal-card-icon,.portal-card-locked h2,.portal-card-locked p{opacity:.65}

/* Content floats above the card face */
.portal-card-icon{width:76px;height:76px;border-radius:22px;display:flex;align-items:center;justify-content:center;margin:0 auto 22px;-webkit-transform:translateZ(55px);transform:translateZ(55px);box-shadow:0 14px 24px rgba(16,42,67,.18)}
.portal-card-icon svg{width:36px;height:36px}
.portal-card-resign .portal-card-icon{background:#E0F2FE;color:#0369A1}
.portal-card-esi .portal-card-icon{background:#CCFBF1;color:#0F766E}
.portal-card-locked .portal-card-icon{background:#E2E8F0;color:#64748B;box-shadow:none}
.portal-card h2{margin:0 0 8px;font-size:18px;font-weight:700;color:#102A43;line-height:1.3;-webkit-transform:translateZ(35px);transform:translateZ(35px)}
.portal-card p{margin:0;font-size:13.5px;color:#486581;line-height:1.55;-webkit-transform:translateZ(22px);transform:translateZ(22px)}
.portal-card-badge{display:inline-flex;align-items:center;margin-top:22px;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;-webkit-transform:translateZ(42px);transform:translateZ(42px);box-shadow:0 8px 16px rgba(16,42,67,.14)}
.portal-card-badge svg{width:13px;height:13px;margin-right:6px}
.portal-badge-ok{background:#CCFBF1;color:#115E59}
.portal-badge-locked{background:#FEE2E2;color:#B91C1C;box-shadow:none}

/* ---------- Broken pieces (entrance only) ---------- */
/* Each shard is a full-size copy of the card cut to one jagged piece. The four pieces
   tile the card exactly, so when they meet it looks whole. */
.portal-shard{position:absolute;top:0;right:0;bottom:0;left:0;z-index:3;pointer-events:none;
  -webkit-filter:drop-shadow(0 8px 10px rgba(16,42,67,.28));filter:drop-shadow(0 8px 10px rgba(16,42,67,.28))}
.portal-shard-cut{position:absolute;top:0;right:0;bottom:0;left:0}

/* jagged outlines, shared vertices so the pieces fit together with no gaps */
.portal-shard-tl .portal-shard-cut{-webkit-clip-path:polygon(0 0,52% 0,44% 20%,55% 36%,46% 52%,32% 63%,18% 56%,0 64%);clip-path:polygon(0 0,52% 0,44% 20%,55% 36%,46% 52%,32% 63%,18% 56%,0 64%)}
.portal-shard-tr .portal-shard-cut{-webkit-clip-path:polygon(52% 0,100% 0,100% 40%,80% 46%,66% 40%,46% 52%,55% 36%,44% 20%);clip-path:polygon(52% 0,100% 0,100% 40%,80% 46%,66% 40%,46% 52%,55% 36%,44% 20%)}
.portal-shard-br .portal-shard-cut{-webkit-clip-path:polygon(100% 40%,100% 100%,42% 100%,50% 82%,38% 70%,46% 52%,66% 40%,80% 46%);clip-path:polygon(100% 40%,100% 100%,42% 100%,50% 82%,38% 70%,46% 52%,66% 40%,80% 46%)}
.portal-shard-bl .portal-shard-cut{-webkit-clip-path:polygon(0 64%,18% 56%,32% 63%,46% 52%,38% 70%,50% 82%,42% 100%,0 100%);clip-path:polygon(0 64%,18% 56%,32% 63%,46% 52%,38% 70%,50% 82%,42% 100%,0 100%)}

/* flat, non-interactive copy of the card used inside a shard */
.portal-card-ghost{position:absolute;top:0;right:0;bottom:0;left:0;height:auto;pointer-events:none;
  -webkit-animation:none;animation:none;transition:none;
  -webkit-transform-style:flat;transform-style:flat;
  -webkit-transform:none;transform:none;box-shadow:none}
.portal-card-ghost::before{display:none}
.portal-card-ghost .portal-card-icon,.portal-card-ghost h2,.portal-card-ghost p,.portal-card-ghost .portal-card-badge{-webkit-transform:none;transform:none}

/* each piece starts far off in its own corner, spinning, and slides into place */
.portal-shard-tl{-webkit-animation:shardTL 1.3s cubic-bezier(.22,1,.36,1) 0s backwards,shardHide .01s linear 1.6s forwards;animation:shardTL 1.3s cubic-bezier(.22,1,.36,1) 0s backwards,shardHide .01s linear 1.6s forwards}
.portal-shard-tr{-webkit-animation:shardTR 1.3s cubic-bezier(.22,1,.36,1) .1s backwards,shardHide .01s linear 1.6s forwards;animation:shardTR 1.3s cubic-bezier(.22,1,.36,1) .1s backwards,shardHide .01s linear 1.6s forwards}
.portal-shard-br{-webkit-animation:shardBR 1.3s cubic-bezier(.22,1,.36,1) .2s backwards,shardHide .01s linear 1.6s forwards;animation:shardBR 1.3s cubic-bezier(.22,1,.36,1) .2s backwards,shardHide .01s linear 1.6s forwards}
.portal-shard-bl{-webkit-animation:shardBL 1.3s cubic-bezier(.22,1,.36,1) .3s backwards,shardHide .01s linear 1.6s forwards;animation:shardBL 1.3s cubic-bezier(.22,1,.36,1) .3s backwards,shardHide .01s linear 1.6s forwards}

@-webkit-keyframes shardTL{0%{opacity:0;-webkit-transform:translate(-85vw,-75vh) rotate(-45deg) scale(.5)}12%{opacity:1}100%{opacity:1;-webkit-transform:translate(0,0) rotate(0) scale(1)}}
@keyframes shardTL{0%{opacity:0;transform:translate(-85vw,-75vh) rotate(-45deg) scale(.5)}12%{opacity:1}100%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}}
@-webkit-keyframes shardTR{0%{opacity:0;-webkit-transform:translate(85vw,-75vh) rotate(45deg) scale(.5)}12%{opacity:1}100%{opacity:1;-webkit-transform:translate(0,0) rotate(0) scale(1)}}
@keyframes shardTR{0%{opacity:0;transform:translate(85vw,-75vh) rotate(45deg) scale(.5)}12%{opacity:1}100%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}}
@-webkit-keyframes shardBR{0%{opacity:0;-webkit-transform:translate(85vw,75vh) rotate(-40deg) scale(.5)}12%{opacity:1}100%{opacity:1;-webkit-transform:translate(0,0) rotate(0) scale(1)}}
@keyframes shardBR{0%{opacity:0;transform:translate(85vw,75vh) rotate(-40deg) scale(.5)}12%{opacity:1}100%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}}
@-webkit-keyframes shardBL{0%{opacity:0;-webkit-transform:translate(-85vw,75vh) rotate(40deg) scale(.5)}12%{opacity:1}100%{opacity:1;-webkit-transform:translate(0,0) rotate(0) scale(1)}}
@keyframes shardBL{0%{opacity:0;transform:translate(-85vw,75vh) rotate(40deg) scale(.5)}12%{opacity:1}100%{opacity:1;transform:translate(0,0) rotate(0) scale(1)}}
@-webkit-keyframes shardHide{to{opacity:0;visibility:hidden}}
@keyframes shardHide{to{opacity:0;visibility:hidden}}

/* Footer */
.portal-footer{width:100%;padding:12px 20px;background:#102A43;color:#D9E2EC;text-align:center;font-size:13px;font-weight:500;letter-spacing:.3px;-ms-flex-negative:0;flex-shrink:0}

/* Unauthorized modal */
.unauth-overlay{position:fixed;top:0;right:0;bottom:0;left:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,20,30,.55);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
.unauth-dialog{position:relative;width:100%;max-width:400px;border-radius:18px;background:#fff;padding:36px 28px 28px;text-align:center;box-shadow:0 20px 56px rgba(0,0,0,.25);border-top:5px solid #dc2626;animation:unauthIn .3s cubic-bezier(.2,.85,.25,1)}
@keyframes unauthIn{from{opacity:0;-webkit-transform:translateY(20px) scale(.95);transform:translateY(20px) scale(.95)}to{opacity:1;-webkit-transform:none;transform:none}}
.unauth-icon{width:60px;height:60px;border-radius:50%;background:#fee2e2;color:#dc2626;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.unauth-icon svg{width:30px;height:30px}
.unauth-dialog h2{margin:0 0 10px;font-size:19px;font-weight:700;color:#102A43}
.unauth-dialog p{margin:0 0 24px;font-size:13.5px;color:#486581;line-height:1.6}
.unauth-close{width:100%;padding:12px;border:0;border-radius:10px;background:#102A43;color:#fff;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;-webkit-appearance:none;appearance:none;transition:background .15s}
.unauth-close:hover{background:#1F4A6E}
.unauth-close:focus{outline:2px solid #0D9488;outline-offset:2px}
.unauth-close:focus:not(:focus-visible){outline:none}

/* Phones and small tablets: stack the cards */
@media (max-width:760px){
  .portal-nav{padding:12px 16px}
  .portal-nav-welcome{display:none}
  .portal-header h1{font-size:25px}
  .portal-header{margin-bottom:32px}
  .portal-cards{flex-direction:column;align-items:center}
  .portal-slot{margin:0 0 52px;width:100%;max-width:340px}
  .portal-slot:nth-child(1),.portal-slot:nth-child(2){--base:0deg}
}

/* Very old engines without 3D transforms or clip-path: flat, no broken-piece intro */
@supports not ((transform-style:preserve-3d) or (-webkit-transform-style:preserve-3d)){
  .portal-card,.portal-card-icon,.portal-card h2,.portal-card p,.portal-card-badge{-webkit-transform:none;transform:none}
  .portal-card::before{display:none}
}
@supports not ((clip-path:polygon(0 0)) or (-webkit-clip-path:polygon(0 0))){
  .portal-shard{display:none}
  .portal-card,.portal-slot::after{-webkit-animation:none;animation:none}
}

/* Respect reduced motion: no flying pieces, card is simply there */
@media (prefers-reduced-motion:reduce){
  .portal-shard{display:none}
  .portal-card,.portal-slot::after{-webkit-animation:none;animation:none}
  .portal-card{transition:none}
  .unauth-dialog{animation:none}
}
`;

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" />
    <path d="M8 6H6.5A1.5 1.5 0 0 0 5 7.5v12A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 17.5 6H16" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3 5 6v5.5c0 4.2 2.9 8 7 9.5 4.1-1.5 7-5.3 7-9.5V6l-7-3Z" />
    <path d="M12 9v6M9 12h6" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const BlockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m5.7 5.7 12.6 12.6" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

const CrossIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const SHARDS = ['tl', 'tr', 'br', 'bl']; // the four corners the pieces come from

export default function PortalClient({ empName, resignLog, esiLog }) {
  const router = useRouter();
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unauth, setUnauth] = useState(false);
  const [intro, setIntro] = useState(true);

  // Stop clipping overflow once the pieces have joined
  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const canResign = resignLog === 'Y';
  const canEsi = esiLog === 'Y';

  const handleSelect = (portal) => {
    setSelectedPortal(portal);
    if (portal === 'resign') {
      if (canResign) router.push('/dashboard/resign');
      else setUnauth(true);
    } else {
      if (canEsi) router.push('/dashboard/esi-applications');
      else setUnauth(true);
    }
  };

  const closeUnauth = () => {
    setUnauth(false);
    setSelectedPortal(null);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) { router.push('/login'); router.refresh(); }
    } catch { /* ignore */ }
    finally { setLoggingOut(false); }
  };

  // Mouse-follow 3D tilt (mouse events work in every browser; touch screens simply skip it)
  const handleTilt = (e, allowed) => {
    if (!allowed) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', ((px - 0.5) * 16).toFixed(2) + 'deg');
    el.style.setProperty('--rx', ((0.5 - py) * 14).toFixed(2) + 'deg');
    el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  };

  const resetTilt = (e) => {
    const el = e.currentTarget;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
  };

  const cards = [
    {
      key: 'resign',
      allowed: canResign,
      cls: 'portal-card-resign',
      icon: <ClipboardIcon />,
      title: 'Resign Forms Management System',
      desc: 'Manage and review employee resignation forms',
    },
    {
      key: 'esi',
      allowed: canEsi,
      cls: 'portal-card-esi',
      icon: <ShieldIcon />,
      title: 'ESI Applications Management System',
      desc: 'View and manage ESI employee applications',
    },
  ];

  // Inside of a card (used by the real card and by every flying piece)
  const cardFace = (c) => (
    <>
      <div className="portal-card-shine" />
      <div className="portal-card-icon">{c.allowed ? c.icon : <LockIcon />}</div>
      <h2>{c.title}</h2>
      <p>{c.desc}</p>
      <div className={`portal-card-badge ${c.allowed ? 'portal-badge-ok' : 'portal-badge-locked'}`}>
        {c.allowed ? <CheckIcon /> : <CrossIcon />}
        {c.allowed ? 'Access granted' : 'No access'}
      </div>
    </>
  );

  return (
    <div className={`portal-root${intro ? ' portal-root-intro' : ''}`}>
      <style>{portalCss}</style>

      <nav className="portal-nav">
        <div className="portal-nav-brand">
          <div className="portal-nav-mark" aria-hidden="true">GTI</div>
          <div className="portal-nav-brand-text">
            <strong>GREENTECH INDUSTRIES</strong>
            <span>Portal Selection</span>
          </div>
        </div>
        <div className="portal-nav-right">
          <span className="portal-nav-welcome">
            Welcome, <strong>{empName}</strong>
          </span>
          <button type="button" className="portal-logout-btn" onClick={handleLogout} disabled={loggingOut}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="15" height="15" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </nav>

      <main className="portal-body">
        <div className="portal-header">
          <h1>Select a portal</h1>
          <p>Your access is based on the permissions assigned by the IT Team.</p>
        </div>

        <div className="portal-cards">
          {cards.map((c) => {
            const stateCls = c.allowed ? 'portal-card-allowed' : 'portal-card-locked';
            return (
              <div className="portal-slot" key={c.key}>
                {/* the real card: appears the moment the pieces join */}
                <div
                  className={`portal-card ${c.cls} ${stateCls} ${selectedPortal === c.key ? 'portal-card-selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(c.key)}
                  onMouseMove={(e) => handleTilt(e, c.allowed)}
                  onMouseLeave={resetTilt}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(c.key);
                    }
                  }}
                  aria-label={`${c.title} – ${c.allowed ? 'Access granted' : 'Access denied'}`}
                >
                  {cardFace(c)}
                </div>

                {/* the broken pieces: decorative, fly in from the 4 corners, then disappear */}
                {SHARDS.map((s) => (
                  <div className={`portal-shard portal-shard-${s}`} key={s} aria-hidden="true">
                    <div className="portal-shard-cut">
                      <div className={`portal-card portal-card-ghost ${c.cls} ${stateCls}`}>
                        {cardFace(c)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </main>

      <footer className="portal-footer">Greentech Industries (India) Pvt. Ltd.</footer>

      {unauth && (
        <div className="unauth-overlay" role="presentation" onClick={closeUnauth}>
          <div
            className="unauth-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unauth-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="unauth-icon"><BlockIcon /></div>
            <h2 id="unauth-title">Access denied</h2>
            <p>
              You are not authorized to access this portal.<br />
              Please contact the IT Team to request access.
            </p>
            <button type="button" className="unauth-close" onClick={closeUnauth} autoFocus>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}