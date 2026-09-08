"use client";

import { useEffect, useRef, useState } from "react";

/** A dashboard stat with a smooth count-up when the value changes. */
export function Stat({
  label,
  value,
  hint,
  format = (n: number) => n.toLocaleString("en-US"),
  accent = "ink",
}: {
  label: string;
  value: number;
  hint?: string;
  format?: (n: number) => string;
  accent?: "ink" | "rose" | "cobalt" | "gold" | "verdant";
}) {
  const display = useCountUp(value);
  const color = { ink: "text-ink", rose: "text-rose", cobalt: "text-cobalt", gold: "text-[#8a6508]", verdant: "text-verdant" }[accent];
  return (
    <div className="card px-5 py-4">
      <div className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted">{label}</div>
      <div className={`mt-1.5 font-display text-[34px] leading-none tabular-nums ${color}`}>{format(display)}</div>
      {hint && <div className="mt-2 text-[12.5px] text-muted">{hint}</div>}
    </div>
  );
}

export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      setValue(v);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      fromRef.current = target;
    };
  }, [target, duration]);
  return value;
}
