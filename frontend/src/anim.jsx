/**
 * anim.jsx — GSAP-powered motion toolkit.
 * Cinematic reveals, count-ups, and magnetic hover for the whole app.
 */
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE = 'power3.out';

/**
 * CountUp — animates a number from 0 → value when scrolled into view.
 */
export function CountUp({ value = 0, decimals = 0, duration = 1.4, suffix = '', prefix = '', className }) {
  const ref = useRef(null);

  useGSAP(() => {
    const el = ref.current;
    const obj = { v: 0 };
    const target = Number(value) || 0;
    el.textContent = `${prefix}${(0).toFixed(decimals)}${suffix}`;
    gsap.to(obj, {
      v: target,
      duration,
      ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => {
        el.textContent = `${prefix}${obj.v.toFixed(decimals)}${suffix}`;
      },
    });
  }, { dependencies: [value], scope: ref });

  return <span ref={ref} className={className} />;
}

/**
 * Reveal — fades + lifts its children into view on scroll.
 * If `stagger` is set, animates direct children sequentially.
 */
export function Reveal({ children, y = 26, delay = 0, duration = 0.8, stagger, start = 'top 88%', immediate = false, as: Tag = 'div', ...rest }) {
  const ref = useRef(null);

  useGSAP(() => {
    const el = ref.current;
    const targets = stagger ? Array.from(el.children) : el;
    gsap.from(targets, {
      opacity: 0,
      y,
      duration,
      delay,
      ease: EASE,
      stagger: stagger || 0,
      // Always strip the inline transform once done so grid items can't be
      // left offset if the tween is interrupted by an async layout shift.
      clearProps: 'transform',
      // Above-the-fold content animates on mount; ScrollTrigger is only for
      // content that may start below the viewport.
      ...(immediate ? {} : { scrollTrigger: { trigger: el, start, once: true } }),
    });
  }, { scope: ref });

  return <Tag ref={ref} {...rest}>{children}</Tag>;
}

/**
 * useMagnetic — attach to a ref to make an element drift toward the cursor.
 */
export function useMagnetic(strength = 0.35) {
  const ref = useRef(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });

    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const reset = () => { xTo(0); yTo(0); };

    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', reset);
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', reset); };
  }, { scope: ref });

  return ref;
}

export { gsap, ScrollTrigger, useGSAP };
