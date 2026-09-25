import { createFileRoute, Link } from "@tanstack/react-router";
import { getVehiclesList, getFeaturedReviews } from "~/server/functions";
import { powerLabel } from "~/lib/power";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [vehicles, reviews] = await Promise.all([
      getVehiclesList(),
      getFeaturedReviews(),
    ]);
    return { vehicles, reviews };
  },
  component: HomePage,
});

function HomePage() {
  const { vehicles, reviews } = Route.useLoaderData();

  return (
    <main>
      <section className="hero">
        <span className="eyebrow">
          Vendeur professionnel — Grote Baan 361/1, 1620 Drogenbos
        </span>
        <h1>
          Des occasions choisies.
          <br />
          Pas <em>improvisées</em>.
        </h1>
        <p>
          Chaque véhicule qui entre chez JNN est vérifié, préparé et vendu
          avec la même exigence — celle qui nous vaut 73 avis clients et 100%
          de recommandations sur AutoScout24.
        </p>
      </section>

      <section id="stock">
        <h2>Le stock actuel</h2>
        <div className="car-grid">
          {vehicles.map((v) => (
            <Link key={v.id} to="/vehicules/$vehicleId" params={{ vehicleId: v.id }} className="car-card">
              <h3>{v.title}</h3>
              <p>{v.sub}</p>
              <p>
                {v.first_reg} · {v.km.toLocaleString("fr-BE")} km · {v.fuel} ·{" "}
                {powerLabel(v.kw)}
              </p>
              <p className="price">{v.price.toLocaleString("fr-BE")} €</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="avis">
        <h2>Ce que disent nos clients</h2>
        <div className="reviews-strip">
          {reviews.map((r) => (
            <blockquote key={r.id}>
              <p>{r.body}</p>
              <footer>
                {r.author} — {r.review_date}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </main>
  );
}
