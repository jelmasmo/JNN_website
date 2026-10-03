import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { nextSlide } from "~/lib/carousel";
import type { Review } from "~/server/reviews";
import { useLang, useT } from "~/lib/lang";

const ROTATE_MS = 7000;

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/** Carte d'avis du haut de page : note AutoScout24 + un avis client qui défile. */
export function HeroReviewCard({ reviews }: { reviews: Review[] }) {
  const [index, setIndex] = useState(0);
  const lang = useLang();
  const tr = useT();

  useEffect(() => {
    if (reviews.length < 2) return;
    const t = setTimeout(() => setIndex((i) => nextSlide(i, reviews.length)), ROTATE_MS);
    return () => clearTimeout(t);
  }, [index, reviews.length]);

  const review = reviews[index];

  return (
    <article className="hero-review-card">
      <div className="hrc-top">
        <span className="hrc-source">{tr("hrc.source")}</span>
        <span className="hrc-reco">{tr("hrc.reco")}</span>
      </div>

      <div className="hrc-score">
        <div className="hrc-num">{lang === "fr" ? "4,8" : "4.8"}</div>
        <div className="hrc-score-side">
          <span className="hrc-stars" aria-label={tr("hrc.starsAria")}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={22} />
            ))}
          </span>
          <span className="hrc-count">
            {tr("hrc.outOf")} <b>{tr("hrc.count", { count: 73 })}</b>
          </span>
        </div>
      </div>

      <div className="hrc-divider" />

      {review && (
        <blockquote className="hrc-quote" key={review.id}>
          <span className="hrc-mark" aria-hidden="true">
            “
          </span>
          <p>{review.body}</p>
          <footer>
            — {review.author}
            {review.review_date ? ` · ${review.review_date}` : ""}
          </footer>
        </blockquote>
      )}

      <div className="hrc-bottom">
        <div className="hrc-dots">
          {reviews.map((r, i) => (
            <button
              key={r.id}
              type="button"
              className={i === index ? "active" : undefined}
              aria-label={tr("hrc.showReview", { n: i + 1 })}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <Link to="/avis" className="hrc-link">
          {tr("hrc.readAll", { count: 73 })}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
