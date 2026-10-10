import type { ReactNode } from 'react';
import { useColors } from '@/context/useColors';

/** `icon` is accepted for compatibility; headers are intentionally text-only. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode; icon?: ReactNode }) {
  const colors = useColors();
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <div>
          <h1 className="text-[28px] font-semibold leading-tight" style={{ color: colors.text }}>{title}</h1>
          {subtitle && <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
