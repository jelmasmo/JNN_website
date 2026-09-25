import { createFileRoute } from "@tanstack/react-router";
import { getAllReviews } from "~/server/functions";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export const Route = createFileRoute("/avis")({
  loader: async () => ({ reviews: await getAllReviews() }),
  component: AllReviewsPage,
});

function AllReviewsPage() {
  const { reviews } = Route.useLoaderData();
  return (
    <>
      <Header />
      <main className="admin-page">
        <div className="wrap">
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Les {reviews.length} avis clients</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "20px 0 30px", flexWrap: "wrap" }}>
            <div className="score-num" style={{ fontSize: 40 }}>
              4.8<span style={{ fontSize: 20, color: "var(--cream-dim)" }}>/5</span>
            </div>
            <div className="score-stars" style={{ fontSize: 16, margin: 0 }}>
              ★★★★★
            </div>
            <div className="score-sub" style={{ fontSize: 12 }}>
              {reviews.length} évaluations — 100% de recommandations — AutoScout24
            </div>
          </div>
          <div className="all-reviews-list">
            {reviews.map((r) => (
              <div className="review-row" key={r.id}>
                <div className="stars">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</div>
                <p>&quot;{r.body}&quot;</p>
                <footer>
                  <span className="name">{r.author}</span>
                  <span>{r.review_date}</span>
                </footer>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
