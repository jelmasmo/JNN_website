import { useState } from "react";
import { OWNER } from "~/lib/config";
import { showToast } from "~/lib/toast";

function vcfContent(): string {
  return `BEGIN:VCARD\nVERSION:3.0\nFN:${OWNER.name} - JNN\nORG:JNN\nTITLE:${OWNER.role}\nTEL;TYPE=CELL:${OWNER.phone}\nEMAIL:${OWNER.email}\nADR:;;${OWNER.address};;;;\nURL:${OWNER.website}\nEND:VCARD`;
}

export function BizCardSection() {
  const [open, setOpen] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [email, setEmail] = useState("");

  function sendWhatsApp() {
    const num = waNumber.replace(/[^0-9+]/g, "");
    if (!num) return showToast("Entrez le numéro WhatsApp du client.", true);
    const text = encodeURIComponent(
      `Bonjour, voici mes coordonnées :\n${OWNER.name} — ${OWNER.role}\nJNN, ${OWNER.address}\nTél : ${OWNER.phone}\nE-mail : ${OWNER.email}\n${OWNER.website}`
    );
    window.open(`https://wa.me/${num.replace("+", "")}?text=${text}`, "_blank");
  }

  function sendMail() {
    if (!email.trim()) return showToast("Entrez l'e-mail du client.", true);
    const subject = encodeURIComponent("Coordonnées JNN — véhicules d'occasion");
    const body = encodeURIComponent(
      `Bonjour,\n\nVoici mes coordonnées :\n${OWNER.name} — ${OWNER.role}\nJNN, ${OWNER.address}\nTél : ${OWNER.phone}\nE-mail : ${OWNER.email}\n${OWNER.website}\n\nÀ bientôt !`
    );
    window.location.href = `mailto:${email.trim()}?subject=${subject}&body=${body}`;
  }

  function downloadVcf() {
    const blob = new Blob([vcfContent()], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JNN-${OWNER.name}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section id="carte">
      <div className="wrap carte-grid">
        <div className="carte-frame">
          <div className="biz-card">
            <div>
              <div className="bc-eyebrow">Carte professionnelle</div>
              <div className="bc-logo">
                JNN <span style={{ fontWeight: 500, color: "var(--cream-dim)", fontSize: "0.62em" }}>Drogenbos</span>
              </div>
              <div className="bc-tag">Véhicules d'occasion</div>
            </div>
            <div>
              <div className="bc-divider" />
              <div className="bc-name">{OWNER.name}</div>
              <div className="bc-role">{OWNER.role}</div>
              <div className="bc-line">
                <b>ADR</b> {OWNER.address}
              </div>
              <div className="bc-line">
                <b>TEL</b> {OWNER.phone}
              </div>
              <div className="bc-line">
                <b>MAIL</b> {OWNER.email}
              </div>
              <div className="bc-line">
                <b>WEB</b> {OWNER.website}
              </div>
            </div>
            <div className="bc-car-icon">
              <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 26 L10 14 Q13 9 20 9 H44 Q51 9 54 14 L60 26" stroke="#8a712e" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
                <rect x="2" y="26" width="60" height="8" rx="4" stroke="#8a712e" strokeWidth="2.2" fill="none" />
                <circle cx="16" cy="34" r="4.5" fill="none" stroke="#8a712e" strokeWidth="2" />
                <circle cx="48" cy="34" r="4.5" fill="none" stroke="#8a712e" strokeWidth="2" />
                <line x1="22" y1="14" x2="22" y2="26" stroke="#8a712e" strokeWidth="1.6" />
                <line x1="42" y1="14" x2="42" y2="26" stroke="#8a712e" strokeWidth="1.6" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <h2 style={{ fontSize: "clamp(28px,4vw,40px)" }}>Ma carte de visite</h2>
          <p style={{ color: "var(--cream-dim)", fontSize: 15, maxWidth: 460 }}>
            Partagez directement mes coordonnées à un client, par WhatsApp ou par e-mail — il suffit
            d'entrer son numéro ou son adresse.
          </p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setOpen((o) => !o)}>
            📇 Partager cette carte
          </button>
          <div className={`share-panel${open ? " open" : ""}`}>
            <label>Numéro WhatsApp du client (ex: 0032470000000)</label>
            <div className="share-row">
              <input
                type="text"
                placeholder="+32 4XX XX XX XX"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
              />
              <button className="btn-whatsapp" onClick={sendWhatsApp}>
                Envoyer par WhatsApp
              </button>
            </div>
            <label>E-mail du client</label>
            <div className="share-row">
              <input type="email" placeholder="client@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn-mail" onClick={sendMail}>
                Envoyer par e-mail
              </button>
            </div>
            <div className="share-row">
              <button className="btn-small" onClick={downloadVcf}>
                ⬇ Télécharger la carte (.vcf)
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
