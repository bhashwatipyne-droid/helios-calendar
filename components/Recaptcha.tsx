'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (el: HTMLElement, opts: Record<string, unknown>) => number;
      reset: (id?: number) => void;
    };
    __heliosRecaptchaLoaded?: () => void;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

type Props = { onChange: (token: string | null) => void; resetSignal?: number };

/**
 * Google reCAPTCHA v2 checkbox. When NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set,
 * shows a placeholder checkbox instead so the flow can be tested locally.
 */
export default function Recaptcha({ onChange, resetSignal = 0 }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    const render = () => {
      if (!box.current || widget.current !== null || !window.grecaptcha) return;
      widget.current = window.grecaptcha.render(box.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => cb.current(t),
        'expired-callback': () => cb.current(null),
        'error-callback': () => cb.current(null),
      });
    };
    if (window.grecaptcha?.render) {
      window.grecaptcha.ready(render);
      return;
    }
    window.__heliosRecaptchaLoaded = render;
    if (!document.getElementById('recaptcha-script')) {
      const s = document.createElement('script');
      s.id = 'recaptcha-script';
      s.src = 'https://www.google.com/recaptcha/api.js?onload=__heliosRecaptchaLoaded&render=explicit';
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (resetSignal && widget.current !== null) {
      window.grecaptcha?.reset(widget.current);
      cb.current(null);
    }
  }, [resetSignal]);

  if (SITE_KEY) return <div ref={box} style={{ minHeight: 78 }} />;

  return (
    <div className="cap-fallback">
      <label>
        <input type="checkbox" onChange={(e) => onChange(e.target.checked ? 'dev-placeholder' : null)} />
        <span>I&apos;m not a robot</span>
      </label>
      <small>reCAPTCHA</small>
    </div>
  );
}
