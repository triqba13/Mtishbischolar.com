"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  end: number;
  suffix?: string;
  prefix?: string;
  delay?: number;
  duration?: number;
}

export default function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  delay = 0.2,
  duration = 1.6,
}: Props) {
  // Initialize with final value so SSR and initial browser paint have zero layout shift and instant text
  const [count, setCount] = useState(end);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Reset to 0 and count up smoothly without blocking the critical rendering path
    setCount(0);
    let startTime: number;
    let raf: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp + delay * 1000;
      const elapsed = Math.max(0, timestamp - startTime);
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    const timer = setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [end, delay, duration]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

