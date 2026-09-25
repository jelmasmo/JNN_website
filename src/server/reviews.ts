import { Effect } from "effect";
import { query } from "./db";

export interface Review {
  id: number;
  author: string;
  review_date: string | null;
  stars: number;
  body: string;
  is_featured: number;
  position: number;
}

/** Les 73 avis clients, dans l'ordre du plus récent au plus ancien. */
export const listReviews = query<Review>(
  "SELECT * FROM reviews ORDER BY position ASC"
);

/** Le sous-ensemble mis en avant dans le carrousel de la page d'accueil. */
export const listFeaturedReviews = query<Review>(
  "SELECT * FROM reviews WHERE is_featured = 1 ORDER BY position ASC"
);
