import { API_KEY } from '@/lib/tmdb-key';
import { type ShowDetails } from '@/types/tmdb.types';
const BASE_URL = 'https://api.themoviedb.org/3';

export const searchShows = async (query: string) => {
  const response = await fetch(
    `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  return data.results;
};

export const getShowDetails = async (showId: number): Promise<ShowDetails> => {
  const response = await fetch(
    `${BASE_URL}/tv/${showId}?api_key=${API_KEY}`
  );
  return await response.json();
};

export const getShowSeasons = async (showId: number, seasonNumber: number) => {
  const response = await fetch(
    `${BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${API_KEY}`
  );
  return await response.json();
};