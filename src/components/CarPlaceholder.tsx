// Visuel générique affiché tant qu'un véhicule n'a pas de vraie photo.
export function CarPlaceholder() {
  return (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "38%", margin: "auto", opacity: 0.85 }}>
      <path d="M4 26 L10 14 Q13 9 20 9 H44 Q51 9 54 14 L60 26" stroke="#f2ede2" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      <rect x="2" y="26" width="60" height="8" rx="4" stroke="#f2ede2" strokeWidth="2.2" fill="none" />
      <circle cx="16" cy="34" r="4.5" fill="#12151a" stroke="#f2ede2" strokeWidth="2" />
      <circle cx="48" cy="34" r="4.5" fill="#12151a" stroke="#f2ede2" strokeWidth="2" />
      <line x1="22" y1="14" x2="22" y2="26" stroke="#f2ede2" strokeWidth="1.6" />
      <line x1="42" y1="14" x2="42" y2="26" stroke="#f2ede2" strokeWidth="1.6" />
    </svg>
  );
}

export function VehiclePhoto({ src }: { src: string | undefined }) {
  if (src && src !== "placeholder") {
    return <img src={src} alt="" />;
  }
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CarPlaceholder />
    </div>
  );
}
