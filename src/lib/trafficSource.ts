// D'où vient un visiteur : Google, un site d'annonces, un réseau social, un
// lien étiqueté (?src=whatsapp), ou un accès direct. Sert au rapport de
// provenance du tableau de bord. Logique pure, testée dans
// tests/trafficSource.test.ts.

/** Sites d'origine reconnus : morceau du nom de domaine → provenance. */
const KNOWN_HOSTS: [RegExp, string][] = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)autoscout24\./, "autoscout24"],
  [/(^|\.)(2ememain|2dehands)\.be$/, "2ememain"],
  [/(^|\.)gocar\.be$/, "gocar"],
  [/(^|\.)leboncoin\.fr$/, "leboncoin"],
  [/(^|\.)lacentrale\.fr$/, "lacentrale"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
];

/** Autres écritures acceptées pour une étiquette de lien. */
const SRC_ALIASES: Record<string, string> = { "2dehands": "2ememain", fb: "facebook", wa: "whatsapp", ig: "instagram" };

const LABELS: Record<string, string> = {
  google: "Google",
  bing: "Bing",
  autoscout24: "AutoScout24",
  "2ememain": "2ememain / 2dehands",
  gocar: "Gocar",
  leboncoin: "Leboncoin",
  lacentrale: "La Centrale",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  qr: "QR code",
  carte: "Carte de visite",
  direct: "Accès direct (adresse tapée, favori, lien sans étiquette)",
};

/** Étiquette de lien valide : lettres, chiffres, tirets, 30 caractères au plus. */
function cleanSrc(src: string | null | undefined): string | null {
  const s = (src ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,29}$/.test(s)) return null;
  return SRC_ALIASES[s] ?? s;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Provenance d'une arrivée sur le site : l'étiquette du lien (?src=…) si
 * elle existe, sinon le site d'origine ; « direct » sans site d'origine,
 * « interne » pour la navigation à l'intérieur du site.
 */
export function classifySource({
  referrer,
  src,
  siteHost,
}: {
  referrer?: string | null;
  src?: string | null;
  siteHost: string;
}): string {
  const labelled = cleanSrc(src);
  if (labelled) return labelled;
  const host = referrer ? hostOf(referrer) : null;
  if (!host) return "direct";
  if (host === siteHost.toLowerCase().replace(/^www\./, "")) return "interne";
  for (const [pattern, source] of KNOWN_HOSTS) if (pattern.test(host)) return source;
  return host.slice(0, 60);
}

/** Nom d'une provenance tel qu'affiché dans le tableau de bord. */
export function sourceLabel(source: string): string {
  return LABELS[source] ?? source;
}
