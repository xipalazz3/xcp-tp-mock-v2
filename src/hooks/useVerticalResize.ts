import { useCallback, useRef } from 'react';

interface Opts {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}

export function useVerticalResize({ value, onChange, min, max }: Opts) {
  const startY = useRef(0);
  const startVal = useRef(0);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const delta = startY.current - e.clientY;
      onChange(Math.max(min, Math.min(max, startVal.current + delta)));
    },
    [onChange, min, max],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    },
    [onPointerMove],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      startY.current = e.clientY;
      startVal.current = value;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    },
    [value, onPointerMove, onPointerUp],
  );

  return { onPointerDown };
}
