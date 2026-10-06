import { useEffect, useRef, useState, type PointerEvent, type CSSProperties } from 'react';
import { body } from '../content/body';
import { site } from '../content/site';
import images from '../content/images.json';
import { type ArtKind } from '../ascii/body-art';
import { playSound } from '../lib/sound';
import '../body.css';
import { AnimatedPortrait } from './AnimatedPortrait';
import { PersonalBento } from './PersonalBento';

function AsciiArtwork({ kind }: { kind: ArtKind }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    const near = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      near.disconnect();
      void document.fonts.ready.then(async () => {
        const [{ subscribeScene }, { createBodyArt }] = await Promise.all([import('../lib/scroll'), import('../ascii/body-art')]);
        if (cancelled || !canvas.current) return;
        const art = createBodyArt(canvas.current, kind, note => playSound('hover', note));
        const unsubscribe = subscribeScene(art.draw);
        dispose = () => { unsubscribe(); art.dispose(); };
      });
    }, { rootMargin: '160px' });
    near.observe(canvas.current!);
    return () => { cancelled = true; near.disconnect(); dispose?.(); };
  }, [kind]);
  return <button className="body-art" aria-label={`${body.artLabel}: ${kind}`} onClick={() => playSound('art', kind.length)}><canvas ref={canvas} aria-hidden="true" /><span className="body-art-hint">{kind === 'flock' ? body.flockHint : body.artHint}</span></button>;
}

function CompanyMarquee() {
  return <section className="body-brands" aria-label={body.logosTitle}>
    <div className="body-marquee-window" tabIndex={0} aria-label={body.logosTitle}><div className="body-marquee-track">{[0, 1].map(copy => <div className="body-logo-group" aria-hidden={copy === 1} key={copy}>{body.logos.map(([name, file]) => <img src={`/logos/${file}`} key={file} alt={copy ? '' : name} width="600" height="200" loading="lazy" />)}</div>)}</div></div>
  </section>;
}

function WorkGallery() {
  const root = useRef<HTMLElement>(null);
  const scrollToImage = useRef<((fraction: number) => void) | null>(null);
  const [scrollDriven, setScrollDriven] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ first: 0, last: 2, atEnd: false });
  useEffect(() => {
    const element = rail.current!;
    function update() {
      const bounds = element.getBoundingClientRect();
      const visible = [...element.children].flatMap((child, index) => {
        const rect = child.getBoundingClientRect();
        return rect.left < bounds.right - 30 && rect.right > bounds.left + 30 ? [index] : [];
      });
      const next = { first: visible[0] ?? 0, last: visible.at(-1) ?? 0, atEnd: element.scrollLeft >= element.scrollWidth - element.clientWidth - 2 };
      setPosition(previous => previous.first === next.first && previous.last === next.last && previous.atEnd === next.atEnd ? previous : next);
    }
    element.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(element);
    update();
    return () => { element.removeEventListener('scroll', update); resize.disconnect(); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void document.fonts.ready.then(async () => {
      const { gsap, ScrollTrigger } = await import('../lib/scroll');
      if (cancelled || !root.current || !rail.current) return;
      const section = root.current;
      const element = rail.current;
      const stage = section.querySelector<HTMLElement>('.body-work-stage')!;
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference) and (min-height: 560px)', () => {
        section.dataset.scrollDriven = 'true';
        setScrollDriven(true);
        function measure() {
          const distance = element.scrollWidth - element.clientWidth;
          section.style.height = `${stage.offsetHeight + Math.max(innerHeight * 1.5, distance / 2.4)}px`;
        }
        measure();
        const trigger = ScrollTrigger.create({
          id: 'work-gallery', trigger: section, start: 'top top', end: 'bottom bottom',
          onRefreshInit: measure,
          onUpdate: self => { element.scrollLeft = self.progress * (element.scrollWidth - element.clientWidth); },
          onRefresh: self => { element.scrollLeft = self.progress * (element.scrollWidth - element.clientWidth); },
        });
        scrollToImage.current = fraction => window.scrollTo({ top: trigger.start + fraction * (trigger.end - trigger.start), behavior: 'instant' });
        ScrollTrigger.refresh();
        return () => {
          trigger.kill();
          scrollToImage.current = null;
          delete section.dataset.scrollDriven;
          section.style.height = '';
          setScrollDriven(false);
        };
      });
      dispose = () => media.revert();
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);
  function goTo(index: number) {
    const element = rail.current!;
    const target = element.children[Math.max(0, Math.min(images.length - 1, index))] as HTMLElement;
    if (scrollToImage.current) scrollToImage.current(Math.min(1, target.offsetLeft / (element.scrollWidth - element.clientWidth)));
    else element.scrollTo({ left: target.offsetLeft, behavior: 'instant' });
    playSound();
  }
  function step(direction: number) {
    const count = matchMedia('(min-width: 900px)').matches ? 3 : matchMedia('(min-width: 600px)').matches ? 2 : 1;
    goTo(position.first + direction * count);
  }
  return <section id="work" ref={root} className="body-work" aria-labelledby="work-title"><div className="body-work-stage">
    <div className="body-work-heading"><h2 id="work-title">{body.workTitle}</h2><p>{body.workIntro}</p></div>
    <div className="body-work-toolbar">
      <p>Selected work <span> / {images.length} designs</span></p>
      <div className="body-work-controls">
        <span className="body-work-count" aria-live={scrollDriven ? "off" : "polite"} aria-atomic="true">{String(position.first + 1).padStart(2, '0')}–{String(position.last + 1).padStart(2, '0')} <span>/ {images.length}</span></span>
        <button onClick={() => step(-1)} disabled={position.first === 0} aria-label="Previous designs" aria-controls="work-reel">←</button>
        <button onClick={() => step(1)} disabled={position.atEnd} aria-label="Next designs" aria-controls="work-reel">→</button>
      </div>
    </div>
    <div id="work-reel" className="body-work-reel" ref={rail} tabIndex={0} role="region" aria-label={scrollDriven ? "Selected design gallery. Scroll down to explore, or use arrow keys." : "Selected design gallery. Swipe or use arrow keys to browse."} onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); }
      if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); goTo(event.key === 'Home' ? 0 : images.length - 1); }
    }}>
      {images.map((image) => <figure className="body-work-image" key={image.src}>
        <picture><source srcSet={`${image.src}-small.avif 640w, ${image.src}.avif ${image.width}w`} sizes="(max-width: 599px) 80vw, (max-width: 899px) 45vw, 30vw" type="image/avif" /><img src={`${image.src}.webp`} width={image.width} height={image.height} alt={image.alt} loading="lazy" decoding="async" /></picture>
      </figure>)}
    </div>
    <div className="body-work-hint"><span>{scrollDriven ? "Scroll to explore" : "Swipe through. Stay curious."}</span><a href="#services">Continue to services ↓</a></div>
    </div>
  </section>;
}

function Capabilities() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void import('../lib/scroll').then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !root.current) return;
      const cards = [...root.current.querySelectorAll<HTMLElement>('.body-service-card')];
      const media = gsap.matchMedia();
      media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const triggers = cards.slice(0, -1).map((card, i) => {
          return ScrollTrigger.create({ trigger: cards[i + 1], start: 'top 85%', end: 'top 145px',
            onUpdate: self => {
              card.style.transform = `scale(${1 - self.progress * .055})`;
              card.style.setProperty('--stack-shade', String(self.progress * .25));
              card.dataset.artCovered = String(self.progress > .08);
            },
            onRefresh: self => {
              card.dataset.artCovered = String(self.progress > .08);
            },
            onEnter: () => playSound('step', i),
          });
        });
        return () => { triggers.forEach(t => t.kill()); cards.forEach(card => { card.style.transform = ''; card.style.removeProperty('--stack-shade'); delete card.dataset.artCovered; }); };
      });
      dispose = () => media.revert();
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);
  return <section id="services" ref={root} className="body-capabilities body-section" aria-labelledby="capabilities-title">
    <div className="body-section-heading"><h2 id="capabilities-title">{body.servicesTitle}</h2><p>{body.servicesIntro}</p></div>
    <div className="body-service-stack">{body.services.map((service, i) => <article className={`body-service-card body-service-${service.art}`} style={{ '--card-index': i } as CSSProperties} key={service.title}>
      <div className="body-service-copy"><h3>{service.title}</h3><p>{service.description}</p><ul className="body-skill-pills">{service.details.map(detail => <li key={detail}>{detail}</li>)}</ul><p className="body-service-example">{service.example}</p></div>
      <AsciiArtwork kind={service.art} />
    </article>)}</div>
  </section>;
}

function SkillPills() {
  function move(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const button = event.currentTarget;
    const rect = button.parentElement!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    button.style.setProperty('--pill-x', `${x * 8}px`);
    button.style.setProperty('--pill-y', `${y * 8}px`);
    button.style.setProperty('--pill-tilt', `${x * 5}deg`);
  }
  function reset(event: PointerEvent<HTMLButtonElement>) {
    for (const variable of ['--pill-x', '--pill-y', '--pill-tilt']) event.currentTarget.style.removeProperty(variable);
  }
  return <ul className="body-skill-pills body-tools">{body.skills.map((skill, i) => <li key={skill}>
    <button className="skill-pill" onPointerMove={move} onPointerLeave={reset}
      onPointerEnter={() => playSound('hover', i)} onClick={event => {
        playSound('art', i);
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const label = event.currentTarget.querySelector('span')!;
        label.getAnimations().forEach(animation => animation.cancel());
        label.animate([
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(2px) scale(.94)', offset: .15 },
          { transform: 'translateY(-5px) scale(1.07)', offset: .45 },
          { transform: 'translateY(1px) scale(.99)', offset: .75 },
          { transform: 'translateY(0) scale(1)' },
        ], { duration: 520, easing: 'ease-out' });
      }}><span>{skill}</span></button>
  </li>)}</ul>;
}

function About() {
  return <section id="about" className="body-about body-section" aria-labelledby="about-title">
    <div className="body-section-heading"><h2 id="about-title">{body.aboutTitle}</h2></div>
    <div className="body-about-layout"><div className="body-portrait-wrap"><AnimatedPortrait /></div>
      <div className="body-biography"><p className="body-about-intro">{body.aboutIntro}</p><p>{body.aboutDetail}</p><p className="body-education">{body.education}</p><a className="body-text-button" href="/resume.pdf" target="_blank" rel="noreferrer" onClick={() => playSound()}>{site.resume}<span aria-hidden="true">↗</span></a><SkillPills /></div>
    </div>
    <div className="body-experience"><div className="body-experience-proof"><h3>{body.experienceTitle}</h3><dl className="body-proof-grid">{body.proofPoints.map(point => <div className="body-proof-card" key={point.label}><dt>{point.label}</dt><dd className="body-proof-value">{point.value}</dd></div>)}</dl></div><div>{body.experience.map(job => <details key={job.company} onToggle={() => { void import('../lib/scroll').then(({ ScrollTrigger }) => ScrollTrigger.refresh()); }}><summary onClick={() => playSound()}><span>{job.company}<small>{job.role}</small></span><span>{job.period}<i aria-hidden="true">+</i></span></summary><p>{job.detail}</p></details>)}</div></div>
  </section>;
}

export function PortfolioBody() {
  return <div className="portfolio-body"><CompanyMarquee /><WorkGallery /><Capabilities /><About /><PersonalBento /></div>;
}

function CreatorSignature() {
  const letters = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function reset() { letters.current?.querySelectorAll<HTMLElement>('.creator-letter').forEach(letter => letter.style.setProperty('--lift', '0')); }
  function move(event: PointerEvent<HTMLButtonElement>) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const letter of event.currentTarget.querySelectorAll<HTMLElement>('.creator-letter')) {
      const rect = letter.getBoundingClientRect();
      letter.style.setProperty('--lift', String(Math.max(0, 1 - Math.abs(event.clientX - rect.left - rect.width / 2) / 150)));
    }
  }
  return <button ref={letters} className="body-creator" aria-label="Play with Sohaib Elahi’s signature" onPointerMove={move} onPointerLeave={reset} onClick={() => {
    playSound('art', 2);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    letters.current?.classList.remove('is-playing');
    void letters.current?.offsetWidth;
    letters.current?.classList.add('is-playing');
    clearTimeout(timer.current); timer.current = setTimeout(() => letters.current?.classList.remove('is-playing'), 1100);
  }}><span className="creator-text" aria-hidden="true">{[...site.fullName].map((letter, i) => <span className={letter === ' ' ? 'creator-space' : 'creator-letter'} style={{ '--letter-index': i } as CSSProperties} key={i}>{letter === ' ' ? '\u00a0' : letter}</span>)}</span></button>;
}

export function PortfolioFooter({ soundEnabled, onSoundToggle }: { soundEnabled: boolean; onSoundToggle: () => void }) {
  const [copyLabel, setCopyLabel] = useState<string>(body.copyEmail);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copyEmail() {
    try { await navigator.clipboard.writeText(site.email); setCopyLabel(body.copied); playSound(); }
    catch { setCopyLabel(body.copyFailed); }
    clearTimeout(timer.current); timer.current = setTimeout(() => setCopyLabel(body.copyEmail), 2200);
  }
  return <footer id="contact" className="body-contact" aria-labelledby="contact-title">
    <div className="body-contact-art"><AsciiArtwork kind="flock" /></div>
    <div className="body-contact-copy">
      <h2 id="contact-title">{body.contactTitle}</h2>
      <a className="body-contact-email" href={`mailto:${site.email}`} onClick={() => playSound()}>{site.email}<span aria-hidden="true">↗</span></a>
      <div className="body-contact-actions">
        <button className="body-text-button" onClick={() => void copyEmail()} aria-live="polite">{copyLabel}<span aria-hidden="true">⧉</span></button>
        {site.socials.map(link => <a href={link.href} key={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a>)}
        <a href="/resume.pdf" target="_blank" rel="noreferrer">{site.resume} ↗</a>
        <button className="body-sound-button" onClick={onSoundToggle} aria-pressed={soundEnabled} title={body.soundDescription}><span className={soundEnabled ? 'body-sound-dot is-on' : 'body-sound-dot'} />{soundEnabled ? body.soundOn : body.soundOff}</button>
        <a href="#main">{body.back} ↑</a>
      </div>
    </div>
    <CreatorSignature />
  </footer>;
}
