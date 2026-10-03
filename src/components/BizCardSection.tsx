import { useEffect, useRef, useState } from "react";
import { OWNER } from "~/lib/config";
import { useSiteSettings } from "~/lib/siteSettings";
import { buildVCard, cardShareText, shareCardWhatsAppUrl, shareCardMailUrl } from "~/lib/contactLinks";
import { showToast } from "~/lib/toast";
import { useLang, useT } from "~/lib/lang";

export function BizCardSection() {
  const settings = useSiteSettings();
  const lang = useLang();
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [email, setEmail] = useState("");
  const cardFile = useRef<File | null>(null);

  // L'image est préparée dès l'ouverture du panneau : sur iPhone, le menu de
  // partage doit s'ouvrir juste après le toucher, sans attendre le réseau.
  useEffect(() => {
    if (!open || cardFile.current) return;
    fetch("/carte-jnn.jpg")
      .then((r) => r.blob())
      .then((blob) => {
        cardFile.current = new File([blob], "Carte-JNN-Drogenbos.jpg", { type: "image/jpeg" });
      })
      .catch(() => {});
  }, [open]);

  async function shareImage() {
    const file = cardFile.current;
    const data = { files: file ? [file] : [], title: tr("biz.shareTitle"), text: cardShareText(settings, lang) };
    if (file && typeof navigator.canShare === "function" && navigator.canShare(data)) {
      try {
        await navigator.share(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          showToast(tr("biz.shareFailed"), true);
        }
      }
      return;
    }
    // Ordinateur ou navigateur sans partage de fichiers : on ouvre l'image.
    window.open("/carte-jnn.jpg", "_blank");
    showToast(tr("biz.imageOpened"));
  }

  function sendWhatsApp() {
    const url = shareCardWhatsAppUrl(waNumber, settings, lang);
    if (!url) return showToast(tr("biz.waMissing"), true);
    window.open(url, "_blank");
  }

  function sendMail() {
    const url = shareCardMailUrl(email, settings, lang);
    if (!url) return showToast(tr("biz.emailMissing"), true);
    window.location.href = url;
  }

  function downloadVcf() {
    const blob = new Blob([buildVCard(settings, lang)], { type: "text/vcard" });
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
              <div className="bc-eyebrow">{tr("biz.eyebrow")}</div>
              <div className="bc-logo">
                JNN <span style={{ fontWeight: 500, color: "var(--cream-dim)", fontSize: "0.62em" }}>Drogenbos</span>
              </div>
              <div className="bc-tag">{tr("biz.tag")}</div>
            </div>
            <div>
              <div className="bc-divider" />
              <div className="bc-name">{OWNER.name}</div>
              <div className="bc-role">{tr("biz.role")}</div>
              <div className="bc-line">
                <b>ADR</b> {settings.address}
              </div>
              <div className="bc-line">
                <b>TEL</b> {settings.phone}
              </div>
              <div className="bc-line">
                <b>MAIL</b> {settings.email}
              </div>
              <div className="bc-line">
                <b>WEB</b> {OWNER.website.replace(/^https?:\/\//, "")}
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
          <h2 style={{ fontSize: "clamp(28px,4vw,40px)" }}>{tr("biz.title")}</h2>
          <p style={{ color: "var(--cream-dim)", fontSize: 15, maxWidth: 460 }}>
            {tr("biz.lead")}
          </p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setOpen((o) => !o)}>
            {tr("biz.share")}
          </button>
          <div className={`share-panel${open ? " open" : ""}`}>
            <label>{tr("biz.waLabel")}</label>
            <div className="share-row">
              <input
                type="tel"
                inputMode="tel"
                placeholder="0470 12 34 56"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
              />
              <button className="btn-whatsapp" onClick={sendWhatsApp}>
                {tr("biz.waSend")}
              </button>
            </div>
            <label>{tr("biz.emailLabel")}</label>
            <div className="share-row">
              <input type="email" placeholder={tr("biz.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn-mail" onClick={sendMail}>
                {tr("biz.emailSend")}
              </button>
            </div>
            <label>{tr("biz.imageLabel")}</label>
            <div className="share-row">
              <button className="btn-primary" onClick={shareImage}>
                {tr("biz.imageSend")}
              </button>
            </div>
            <div className="share-row">
              <button className="btn-small" onClick={downloadVcf}>
                {tr("biz.vcf")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
