import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function PortraitOnly({ children }: Props) {
  return (
    <>
      <div className="landscape-warning">
        <p className="text-lg font-semibold">Ruota in verticale</p>
        <p className="text-sm opacity-80 mt-2">L'app supporta solo l'orientamento portrait.</p>
      </div>
      <div className="portrait-content">{children}</div>
    </>
  );
}
