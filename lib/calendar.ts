// All layout numbers are in points (pt), measured from Helios_Calender_Digital_V2.ai.
// Page = 526.68 x 670.68 pt (7 x 9 in trim + 0.1575 in bleed on each side).

export const YEAR = 2026;
export const PAGE_W = 526.68;
export const PAGE_H = 670.68;
export const EXPORT_DPI = 300; // -> 2195 x 2795 px

export const COLORS = {
  orange: '#E57313',
  red: '#E2231A',
  ink: '#231F20',
  cream: '#FCFBF1',
  slot: '#F1F1F1',
};

export const ASSETS = {
  logo: '/logo.png',
  frame: '/frame.png',
  doodles: '/doodles.png',
};

// Photo slot (5:4) and artwork placement
export const HOLE = { x: 62.32, y: 80.17, w: 238.24, h: 190.83 };
export const FRAME = { x: 12.75, y: 36.25, w: 324.32, h: 269.6 };
export const LOGO = { x: 396, y: 58.75, w: 86.6 };

// Month grid
export const COL_X = [44.25, 157.5, 271.0, 384.25];
export const ROW_Y = [294.5, 392.5, 490.25];
export const MONTH_W = 97.25;
export const MONTH_BOX_H = 95;
export const BAR_H = 13.25;
export const CELL_W = 14.88;
export const CELL_H = 10.72;
export const FIRST_COL_CX = 4.45;
export const WEEKDAY_CY = 21.5;
export const FIRST_ROW_CY = 35;

export const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "2026" outline: Poppins Bold digits (75 pt tall), placed to match the AI file's "2025".
export const YEAR_PATH =
  'M347.84 159.53Q357.74 151.34 363.45 146.09Q369.16 140.83 373.11 135.07Q377.05 129.31 377.05 123.85Q377.05 119.7 375.13 117.38Q373.21 115.06 369.37 115.06Q365.52 115.06 363.35 117.94Q361.18 120.82 361.18 126.07H344.5Q344.7 117.48 348.19 111.72Q351.68 105.96 357.39 103.23Q363.1 100.5 370.07 100.5Q382.1 100.5 388.22 106.67Q394.33 112.83 394.33 122.74Q394.33 133.55 386.95 142.8Q379.57 152.05 368.15 160.84H395.44V174.89H344.7V162.06Q348.14 159.33 347.84 159.53Z M420.1 135Q435.06 135 441.78 145.01Q448.5 155.01 448.5 172.4Q448.5 189.99 441.78 199.99Q435.06 210 420.1 210Q405.14 210 398.42 199.99Q391.69 189.99 391.69 172.4Q391.69 155.01 398.42 145.01Q405.14 135 420.1 135ZM420.1 151.17Q413.12 151.17 410.9 156.68Q408.68 162.19 408.68 172.4Q408.68 179.27 409.48 183.77Q410.29 188.27 412.77 191.05Q415.25 193.83 420.1 193.83Q424.95 193.83 427.43 191.05Q429.9 188.27 430.71 183.77Q431.52 179.27 431.52 172.4Q431.52 162.19 429.3 156.68Q427.07 151.17 420.1 151.17Z M347.84 234.03Q357.74 225.84 363.45 220.59Q369.16 215.33 373.11 209.57Q377.05 203.81 377.05 198.35Q377.05 194.2 375.13 191.88Q373.21 189.56 369.37 189.56Q365.52 189.56 363.35 192.44Q361.18 195.32 361.18 200.57H344.5Q344.7 191.98 348.19 186.22Q351.68 180.46 357.39 177.73Q363.1 175 370.07 175Q382.1 175 388.22 181.17Q394.33 187.33 394.33 197.24Q394.33 208.05 386.95 217.3Q379.57 226.55 368.15 235.34H395.44V249.39H344.7V236.56Q348.14 233.83 347.84 234.03Z M421.32 226.45Q415.55 226.45 413.03 231.45Q410.5 236.46 410.4 247.27Q412.62 243.73 416.82 241.71Q421.01 239.69 426.07 239.69Q435.97 239.69 441.99 245.96Q448 252.22 448 263.44Q448 270.82 445.02 276.38Q442.04 281.94 436.33 285.07Q430.61 288.21 422.83 288.21Q407.27 288.21 401.2 278.45Q395.14 268.7 395.14 250.4Q395.14 231.2 401.55 221.85Q407.97 212.5 422.12 212.5Q429.7 212.5 434.91 215.48Q440.12 218.46 442.79 223.32Q445.47 228.17 445.98 233.93H429.91Q429.1 230.19 427.08 228.32Q425.06 226.45 421.32 226.45ZM411.81 263.24Q411.81 268.09 414.49 270.82Q417.17 273.55 422.12 273.55Q426.57 273.55 429.15 270.87Q431.73 268.19 431.73 263.54Q431.73 258.79 429.2 256.06Q426.67 253.34 421.92 253.34Q417.58 253.34 414.69 255.91Q411.81 258.49 411.81 263.24Z';
export const YEAR_STROKE = 1.9;

export type Day = { label: string; col: number; row: number; sunday: boolean };
export type Month = { name: string; x: number; y: number; days: Day[] };

export function buildMonths(year = YEAR): Month[] {
  return MONTH_NAMES.map((name, mi) => {
    const offset = (new Date(year, mi, 1).getDay() + 6) % 7; // Monday-first
    const count = new Date(year, mi + 1, 0).getDate();
    const days: Day[] = [];
    for (let d = 1; d <= count; d++) {
      const idx = offset + d - 1;
      const col = idx % 7;
      days.push({ label: String(d), col, row: Math.floor(idx / 7), sunday: col === 6 });
    }
    return { name, x: COL_X[mi % 4], y: ROW_Y[Math.floor(mi / 4)], days };
  });
}

// Percent helpers for the on-screen (HTML) version
export const pctX = (pt: number) => `${((pt / PAGE_W) * 100).toFixed(3)}%`;
export const pctY = (pt: number) => `${((pt / PAGE_H) * 100).toFixed(3)}%`;
export const cellLeft = (col: number) => `${(((FIRST_COL_CX - CELL_W / 2 + col * CELL_W) / MONTH_W) * 100).toFixed(3)}%`;
export const cellTop = (cy: number) => `${(((cy - CELL_H / 2) / MONTH_BOX_H) * 100).toFixed(3)}%`;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export { loadImage };

/** Draws the full calendar at EXPORT_DPI and returns the canvas. */
export async function drawCalendar(photo: HTMLImageElement | null, opts: { sample?: boolean } = {}): Promise<HTMLCanvasElement> {
  const u = EXPORT_DPI / 72;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(PAGE_W * u);
  canvas.height = Math.round(PAGE_H * u);
  const x = canvas.getContext('2d');
  if (!x) throw new Error('Canvas not supported');

  try {
    await Promise.all(['400 20px Poppins', '500 20px Poppins'].map((f) => document.fonts.load(f)));
  } catch {
    /* fonts fall back */
  }
  const [doodles, frame, logo] = await Promise.all([loadImage(ASSETS.doodles), loadImage(ASSETS.frame), loadImage(ASSETS.logo)]);

  x.scale(u, u);
  x.fillStyle = COLORS.cream;
  x.fillRect(0, 0, PAGE_W, PAGE_H);
  if (doodles) {
    x.globalAlpha = 0.08;
    x.drawImage(doodles, 0, 0, PAGE_W, PAGE_H);
    x.globalAlpha = 1;
  }

  // Photo (cover-fit into the 5:4 slot)
  x.fillStyle = COLORS.slot;
  x.fillRect(HOLE.x, HOLE.y, HOLE.w, HOLE.h);
  x.save();
  x.beginPath();
  x.rect(HOLE.x, HOLE.y, HOLE.w, HOLE.h);
  x.clip();
  if (photo) {
    const s = Math.max(HOLE.w / photo.naturalWidth, HOLE.h / photo.naturalHeight);
    const dw = photo.naturalWidth * s;
    const dh = photo.naturalHeight * s;
    x.imageSmoothingQuality = 'high';
    x.drawImage(photo, HOLE.x + (HOLE.w - dw) / 2, HOLE.y + (HOLE.h - dh) / 2, dw, dh);
  } else if (opts.sample) {
    x.fillStyle = '#F6D6C4';
    x.fillRect(HOLE.x, HOLE.y, HOLE.w, HOLE.h);
    x.fillStyle = '#C9A592';
    x.beginPath();
    x.arc(HOLE.x + HOLE.w / 2, HOLE.y + 72, 32, 0, Math.PI * 2);
    x.fill();
    x.beginPath();
    x.ellipse(HOLE.x + HOLE.w / 2, HOLE.y + HOLE.h + 20, 78, 80, 0, Math.PI, 0);
    x.fill();
  }
  x.restore();

  if (frame) x.drawImage(frame, FRAME.x, FRAME.y, FRAME.w, FRAME.h);
  if (logo) {
    x.imageSmoothingQuality = 'high';
    x.drawImage(logo, LOGO.x, LOGO.y, LOGO.w, (LOGO.w * logo.naturalHeight) / logo.naturalWidth);
  }

  // Year: stroke the union outline, then fill with the page colour so only the outer line shows
  const yp = new Path2D(YEAR_PATH);
  x.strokeStyle = COLORS.orange;
  x.lineWidth = YEAR_STROKE;
  x.lineJoin = 'round';
  x.stroke(yp);
  x.fillStyle = COLORS.cream;
  x.fill(yp);

  // Months
  x.textBaseline = 'middle';
  for (const m of buildMonths()) {
    x.save();
    x.translate(m.x, m.y);
    x.fillStyle = COLORS.orange;
    x.fillRect(0, 0, MONTH_W, BAR_H);
    x.textAlign = 'left';
    x.fillStyle = '#FFFFFF';
    x.font = '500 11px Poppins';
    x.fillText(m.name, 3.4, BAR_H / 2 + 0.6);
    x.textAlign = 'center';
    x.font = '500 8px Poppins';
    WEEKDAYS.forEach((w, k) => {
      x.fillStyle = k === 6 ? COLORS.red : COLORS.ink;
      x.fillText(w, FIRST_COL_CX + k * CELL_W, WEEKDAY_CY + 0.5);
    });
    x.font = '500 8.6px Poppins';
    for (const d of m.days) {
      x.fillStyle = d.sunday ? COLORS.red : COLORS.ink;
      x.fillText(d.label, FIRST_COL_CX + d.col * CELL_W, FIRST_ROW_CY + d.row * CELL_H + 0.5);
    }
    x.restore();
  }
  return canvas;
}
