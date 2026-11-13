'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Recaptcha from './Recaptcha';

export default function LoginForm() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, captcha }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setResetSignal((n) => n + 1);
        return;
      }
      router.replace('/calendar');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please check your connection.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="lp-card" onSubmit={submit} noValidate>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lp-logo" src="/logo.png" alt="Helios Mutual Fund — Har term ke liye" />
      <h1 className="lp-title">Log in</h1>
      <div className="lp-fields">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="arn" className="sr-only">ARN or mobile number</label>
          <input
            id="arn"
            className={error ? 'field bad' : 'field'}
            type="text"
            autoComplete="username"
            placeholder="ARN/Mobile number"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setError('');
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
          />
          {error && (
            <p id="login-error" role="alert" className="lp-err">
              {error}
            </p>
          )}
        </div>
        <Recaptcha onChange={setCaptcha} resetSignal={resetSignal} />
        <button className="lbtn" type="submit" disabled={!id.trim() || !captcha || busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </div>
    </form>
  );
}
