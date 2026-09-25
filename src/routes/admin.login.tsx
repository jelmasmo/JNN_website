import { useState, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { adminLogin } from "~/server/functions";
import { setAdminToken } from "~/lib/adminSession";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await adminLogin({ data: { username, password } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAdminToken(res.token);
      router.navigate({ to: "/admin/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="admin-page">
        <div className="wrap">
          <div className="admin-card">
            <h2 style={{ fontSize: 22, marginBottom: 6 }}>Espace professionnel</h2>
            <p style={{ color: "var(--cream-dim)", fontSize: 13.5 }}>Réservé au propriétaire du site.</p>
            <form onSubmit={submit}>
              <label>Identifiant</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
              <label>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {error && <div className="form-error">{error}</div>}
              <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 18, width: "100%", justifyContent: "center" }}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
