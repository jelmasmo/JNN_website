import { useEffect, useState } from "react";

// Petit système de notification global (coin bas de l'écran), sans
// dépendance externe — même comportement que la maquette d'origine.
type ToastState = { msg: string; error: boolean; key: number } | null;
let current: ToastState = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<(s: ToastState) => void>();

export function showToast(msg: string, error = false) {
  current = { msg, error, key: Date.now() };
  for (const l of listeners) l(current);
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    for (const l of listeners) l(null);
  }, error ? 5000 : 2800);
}

export function ToastHost() {
  const [state, setState] = useState<ToastState>(null);
  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return (
    <div className={`toast${state ? " show" : ""}${state?.error ? " error" : ""}`}>
      {state?.msg}
    </div>
  );
}
