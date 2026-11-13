'use client';

import { useMemo, type ChangeEvent } from 'react';
import {
  ASSETS, COLORS, FIRST_ROW_CY, FRAME, HOLE, LOGO, PAGE_H, PAGE_W, WEEKDAYS, WEEKDAY_CY, YEAR_PATH, YEAR_STROKE,
  buildMonths, cellLeft, cellTop, pctX, pctY, CELL_H,
} from '@/lib/calendar';

type Props = {
  photo: string | null;
  processing: boolean;
  onFile: (file: File | undefined) => void;
};

/* eslint-disable @next/next/no-img-element */
export default function CalendarArt({ photo, processing, onFile }: Props) {
  const months = useMemo(() => buildMonths(), []);
  const showEmpty = !photo && !processing;

  return (
    <div className="calwrap">
      <div className="cal">
        <img className="layer" src={ASSETS.doodles} alt="" style={{ inset: 0, width: '100%', height: '100%', opacity: 0.08 }} />

        <div className="hole" style={{ left: pctX(HOLE.x), top: pctY(HOLE.y), width: pctX(HOLE.w), height: pctY(HOLE.h) }}>
          {showEmpty && (
            <label className="empty">
              <span className="up">Upload your photo here</span>
              <span className="note">
                Photo of 5:4 (landscape) aspect ratio is
                <br />
                recommended for best results
              </span>
              <span className="note2">
                Please note: Photo once uploaded, cannot
                <br />
                be changed.
              </span>
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  onFile(f);
                }}
              />
            </label>
          )}
          {photo && <img src={photo} alt="Your uploaded photo" />}
          {processing && (
            <div className="proc" role="status">
              <div className="spin" />
              <span>Processing.. please wait</span>
            </div>
          )}
        </div>

        <img className="layer" src={ASSETS.frame} alt="" style={{ left: pctX(FRAME.x), top: pctY(FRAME.y), width: pctX(FRAME.w), height: pctY(FRAME.h) }} />
        <img className="layer" src={ASSETS.logo} alt="Helios Mutual Fund — Har term ke liye" style={{ left: pctX(LOGO.x), top: pctY(LOGO.y), width: pctX(LOGO.w), height: 'auto' }} />

        <svg className="layer" style={{ inset: 0, width: '100%', height: '100%' }} viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} aria-hidden="true">
          <path d={YEAR_PATH} fill="none" stroke={COLORS.orange} strokeWidth={YEAR_STROKE} strokeLinejoin="round" />
          <path d={YEAR_PATH} fill={COLORS.cream} />
        </svg>

        {months.map((m) => (
          <div key={m.name} className="mon" style={{ left: pctX(m.x), top: pctY(m.y) }}>
            <div className="mbar">{m.name}</div>
            {WEEKDAYS.map((w, k) => (
              <div key={k} className={k === 6 ? 'cell wd sun' : 'cell wd'} style={{ left: cellLeft(k), top: cellTop(WEEKDAY_CY) }}>
                {w}
              </div>
            ))}
            {m.days.map((d) => (
              <div key={d.label} className={d.sunday ? 'cell sun' : 'cell'} style={{ left: cellLeft(d.col), top: cellTop(FIRST_ROW_CY + d.row * CELL_H) }}>
                {d.label}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
