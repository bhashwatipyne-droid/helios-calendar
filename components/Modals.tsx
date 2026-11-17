'use client';

import { useEffect } from 'react';

function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button className="x" type="button" aria-label="Close" onClick={onClose} autoFocus>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </svg>
    </button>
  );
}

export function SuccessModal({ onClose, format }: { onClose: () => void; format: string }) {
  useEscape(onClose);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog ok" role="dialog" aria-modal="true" aria-labelledby="ok-title" onClick={(e) => e.stopPropagation()}>
        <CloseButton onClose={onClose} />
        <h2 id="ok-title">Personalization Successful!</h2>
        <p>
          Your Calendar personalization has been done.
          <br />
          Your calendar ({format}) has been downloaded on your system.
        </p>
        <svg className="check" width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="56" fill="#22A63A" />
          <path d="M36 62l16 16 32-34" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export function ReplaceModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  useEscape(onCancel);
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog ok" role="dialog" aria-modal="true" aria-labelledby="replace-title" onClick={(e) => e.stopPropagation()}>
        <CloseButton onClose={onCancel} />
        <h2 id="replace-title">Calendar already saved</h2>
        <p>
          We have already stored your response.
          <br />
          If you create it again, your previous response will not be printed as a calendar — only the latest one will be.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12, width: '100%' }}>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Keep my saved calendar
          </button>
          <button type="button" className="btn" onClick={onConfirm}>
            Create again
          </button>
        </div>
      </div>
    </div>
  );
}

export function SampleModal({ image, onClose }: { image: string | null; onClose: () => void }) {
  useEscape(onClose);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog sample" role="dialog" aria-modal="true" aria-labelledby="sample-title" onClick={(e) => e.stopPropagation()}>
        <CloseButton onClose={onClose} />
        <h2 id="sample-title">Sample calendar</h2>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Sample personalised Helios calendar" />
        ) : (
          <div className="sample-loading">Loading sample…</div>
        )}
      </div>
    </div>
  );
}
