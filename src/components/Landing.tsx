import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject, type PointerEvent } from 'react';
import { site } from '../content/site';

export function Navigation({ preferences }: { preferences: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [opened, setOpened] = useState(false);
  const menu = useRef<HTMLButtonElement>(null);
  const collapsed = scrolled && !opened;
  useEffect(() => {
    history.scrollRestoration = 'manual';
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    const onScroll = () => { setScrolled(scrollY > 110); if (scrollY <= 110) setOpened(false); };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  return <header className={`floating-nav ${collapsed ? 'is-collapsed' : ''} ${scrolled ? 'has-scrolled' : ''}`} onKeyDown={e => {
    if (e.key === 'Escape' && opened) { setOpened(false); menu.current?.focus(); }
  }}>
    <div id="navigation-content" className="nav-content" inert={collapsed}>
      <a className="nav-brand" href="#main" aria-label={site.fullName}><span>S<b>.</b></span><span className="brand-short">S.</span></a>
      <nav aria-label={site.landing.navigation}>{site.nav.map(link => <a key={link.href} href={link.href} onClick={() => setOpened(false)}>{link.text}</a>)}</nav>
      <div className="nav-preferences">{preferences}</div>
    </div>
    <button ref={menu} className="nav-menu" aria-label={opened ? site.landing.closeMenu : site.landing.openMenu} aria-expanded={!collapsed} aria-controls="navigation-content" onClick={() => setOpened(!opened)} tabIndex={scrolled ? 0 : -1}>
      <span /><span />
    </button>
  </header>;
}

function InteractiveHeadline() {
  function illuminate(event: PointerEvent<HTMLHeadingElement>) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const letter of event.currentTarget.querySelectorAll<HTMLElement>('.headline-letter')) {
      const rect = letter.getBoundingClientRect();
      const distance = Math.hypot(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2);
      const energy = Math.max(0, 1 - distance / 150);
      letter.style.setProperty('--energy', String(energy));
    }
  }
  return <h1 id="landing-title" aria-label={site.headline.join(' ')} onPointerMove={illuminate} onPointerLeave={event => {
    event.currentTarget.querySelectorAll<HTMLElement>('.headline-letter').forEach(letter => letter.style.removeProperty('--energy'));
  }}>{site.headline.map((line, index) => <span key={line} className={index ? 'pixel-line' : 'headline-line'} aria-hidden="true">{line.split(' ').map((word, i) => <span className="headline-word" key={i}>{[...word].map((letter, j) => <span className="headline-letter" style={{ '--letter-order': site.headline.slice(0, index).join(' ').length + line.split(' ').slice(0, i).join(' ').length + i + j } as CSSProperties} key={j}>{letter}</span>)}{' '}</span>)}</span>)}</h1>;
}

export function Landing({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement | null> }) {
  function magnet(event: PointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.translate = `${(event.clientX - rect.left - rect.width / 2) * .1}px ${(event.clientY - rect.top - rect.height / 2) * .15}px`;
  }
  return <section className="landing" aria-labelledby="landing-title">
    <div className="hero-grid" aria-hidden="true">{[0, 1, 2, 3].map(i => <span className={`power-line power-vertical line-${i}`} key={`v${i}`} />)}{[0, 1, 2].map(i => <span className={`power-line power-horizontal line-${i}`} key={`h${i}`} />)}</div>
    <div className="landing-heading">
      <div className="identity-line"><span className="identity-mark" aria-hidden="true">✳</span><span>{site.fullName}<span className="identity-divider">/</span>{site.landing.identity}</span></div>
      <InteractiveHeadline />
      <p className="landing-description">{site.landing.description}</p>
      <div className="landing-actions"><a className="primary-cta" onPointerMove={magnet} onPointerLeave={event => { event.currentTarget.style.translate = ''; }} href={`mailto:${site.email}`}>{site.landing.contact}<span aria-hidden="true">↗</span></a><a className="secondary-cta" href="#work">{site.landing.work}<span aria-hidden="true">↓</span></a></div>
    </div>
    <div className="ribbon-composition">
      <button className="ribbon-stage" aria-label={site.landing.artLabel}><canvas ref={canvasRef} aria-hidden="true" /></button>
      <div className="art-caption"><span className="caption-line" /><span>{site.landing.interaction}</span><span className="caption-line" /></div>
    </div>
  </section>;
}
