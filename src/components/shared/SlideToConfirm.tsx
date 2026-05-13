import { type PointerEvent, useCallback, useRef, useState } from 'react';

interface Props {
  label: string;
  onConfirm: () => void;
  variant?: 'primary' | 'danger' | 'subtle';
  className?: string;
}

const VARIANT_STYLES: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-emerald-600 text-white',
  danger: 'bg-red-600 text-white',
  subtle: 'bg-slate-700 text-slate-100',
};

const THUMB_STYLES: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-emerald-400',
  danger: 'bg-red-400',
  subtle: 'bg-slate-500',
};

const THRESHOLD = 0.9;

export function SlideToConfirm({ label, onConfirm, variant = 'primary', className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0..1
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const widthRef = useRef(0);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    widthRef.current = track.clientWidth - 56; // 56 = thumb size
    track.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    const w = widthRef.current || 1;
    const ratio = Math.max(0, Math.min(1, dx / w));
    setProgress(ratio);
  };

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      if (track?.hasPointerCapture(e.pointerId)) {
        track.releasePointerCapture(e.pointerId);
      }
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (progress >= THRESHOLD) {
        setProgress(1);
        onConfirm();
        // reset after a tick per riusabilità del componente
        setTimeout(() => setProgress(0), 200);
      } else {
        setProgress(0);
      }
    },
    [progress, onConfirm],
  );

  const trackBg = VARIANT_STYLES[variant];
  const thumbBg = THUMB_STYLES[variant];

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full h-14 rounded-full overflow-hidden select-none touch-none ${trackBg} ${className ?? ''}`}
      style={{ touchAction: 'none' }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm font-semibold tracking-wider uppercase opacity-80">{label}</span>
      </div>
      <div
        className={`absolute top-1 left-1 h-12 w-12 rounded-full ${thumbBg} shadow-md flex items-center justify-center text-slate-900 font-bold`}
        style={{
          transform: `translateX(${progress * (widthRef.current || 0)}px)`,
          transition: draggingRef.current ? 'none' : 'transform 150ms ease-out',
        }}
      >
        ›
      </div>
    </div>
  );
}
