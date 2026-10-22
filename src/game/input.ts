import { useEffect, useRef } from "react";

/** Shared touch-input flags, mutated by on-screen buttons and read in useFrame. */
export const touchInput = {
  left: false,
  right: false,
  accel: false,
  brake: false,
};

/**
 * Tracks held keys (by physical code) in a ref for per-frame reading.
 * Arrows and Space are prevented from scrolling the page while playing.
 */
export function useKeyboard() {
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    const onBlur = () => keys.current.clear();

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return keys;
}

export type HeldKeys = React.RefObject<Set<string>>;
