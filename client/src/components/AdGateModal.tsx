import { useEffect, useRef, useState } from 'react';

const AD_BLOCK_ID = 'R-A-19685341-1';
const COUNTDOWN_SECONDS = 5;

declare global {
  interface Window {
    yaContextCb?: Array<() => void>;
    Ya?: {
      Context: {
        AdvManager: {
          render: (opts: { blockId: string; renderTo: string }) => void;
        };
      };
    };
  }
}

interface Props {
  onContinue: () => void;
  onCancel: () => void;
}

export default function AdGateModal({ onContinue, onCancel }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  // Әр ашылғанда бөлек ID — Яндекс блогын әр жолы қайта дұрыс рендерлеу үшін
  const containerId = useRef(`yandex_rtb_${AD_BLOCK_ID}_${Date.now()}`).current;
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;
    rendered.current = true;
    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      window.Ya?.Context.AdvManager.render({
        blockId: AD_BLOCK_ID,
        renderTo: containerId,
      });
    });
  }, [containerId]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const canContinue = secondsLeft <= 0;

  return (
    <div className="ad-gate-backdrop" role="dialog" aria-modal="true" aria-label="Жарнама">
      <div className="ad-gate-modal">
        <p className="ad-gate-title">ҚМЖ дайындалмас бұрын қысқа жарнама</p>

        <div id={containerId} className="ad-gate-slot" />

        <button className="btn-primary ad-gate-continue" onClick={onContinue} disabled={!canContinue}>
          {canContinue ? 'Жалғастыру' : `Жалғастыру (${secondsLeft}с)`}
        </button>

        <button className="ad-gate-cancel" onClick={onCancel}>
          Бас тарту
        </button>
      </div>
    </div>
  );
}
