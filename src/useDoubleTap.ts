import { useRef } from "react";

/**
 * Двойной тап для iOS: onDoubleClick в Safari на тач-экране ненадёжен,
 * поэтому считаем два касания в пределах 350 мс.
 */
export function useDoubleTap(onDouble: () => void, delay = 350) {
  const last = useRef(0);
  return {
    onClick: () => {
      const now = Date.now();
      if (now - last.current < delay) {
        last.current = 0;
        onDouble();
      } else {
        last.current = now;
      }
    },
  };
}
