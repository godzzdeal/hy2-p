import { useEffect, useRef, useState } from "react";

export function useViewportVisibility() {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setVisible] = useState(true);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}
