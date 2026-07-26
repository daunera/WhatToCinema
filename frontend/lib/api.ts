const API_BASE = '/backend';

interface Favorite {
  movie_title: string;
}

interface Status {
  last_scrape_time: string | null;
}

interface Showtime {
  id: number;
  cinema_name: string;
  movie_title: string;
  start_time: string;
  date_str: string;
  ticket_url: string | null;
  movie_url: string | null;
  poster_url: string | null;
  genre: string | null;
  age_restriction: string | null;
  age_restriction_url: string | null;
  details_type: string | null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: customHeaders, ...rest } = options || {};
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    ...rest,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const getFavorites = () => request<Favorite[]>('/favorites');

export const addFavorite = (movieTitle: string) =>
  request<void>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ movie_title: movieTitle }),
  });

export const removeFavorite = (movieTitle: string) =>
  request<void>(`/favorites/${encodeURIComponent(movieTitle)}`, {
    method: 'DELETE',
  });

export const getStatus = () => request<Status>('/status');

export const getMovies = () => request<Showtime[]>('/movies');

export const triggerScrape = () =>
  request<void>('/scrape', { method: 'POST' });
