'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Recaptcha from './Recaptcha';

export default function LoginForm({ kind = 'mfd' }: { kind?: 'mfd' | 'employee' }) {
  const employee = kind === 'employee';
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
        body: JSON.stringify({ id, captcha, kind }),
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
      <h1 className="lp-title">Create your personalised calendar</h1>
      <div className="lp-fields">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="arn" className="sr-only">{employee ? 'Corporate email' : 'ARN number'}</label>
          {employee ? (
            <input
              id="arn"
              className={error ? 'field bad' : 'field'}
              type="email"
              autoComplete="username"
              placeholder="Corporate email address"
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setError('');
              }}
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
            />
          ) : (
            <div className={error ? 'field-prefixed bad' : 'field-prefixed'}>
              <span aria-hidden="true">ARN-</span>
              <input
                id="arn"
                type="text"
                inputMode="numeric"
                autoComplete="username"
                maxLength={6}
                placeholder="6-digit number"
                value={id}
                onChange={(e) => {
                  setId(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
          )}
          {error && (
            <p id="login-error" role="alert" className="lp-err">
              {error}
            </p>
          )}
        </div>
        <Recaptcha onChange={setCaptcha} resetSignal={resetSignal} />
        <button className="lbtn" type="submit" disabled={(employee ? !id.trim() : id.length !== 6) || !captcha || busy}>
          {busy ? 'Please wait…' : 'Get started'}
        </button>
      </div>
    </form>
  );
}
