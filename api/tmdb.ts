import { type ShowDetails } from '@/types/tmdb.types';
import { getApiKeyFromDb } from '@/db/db';

const BASE_URL = 'https://api.themoviedb.org/3';

const getValidApiKey = async (): Promise<string | null> => {
  try {
    const apikey = await getApiKeyFromDb();
    if (!apikey) {
      return null
    }
    return await getApiKeyFromDb();
  } catch (error) {
    console.error('Error getting API key:', error);
    return null
  }
};

export const searchShows = async (query: string) => {
  const API_KEY = await getValidApiKey();
  if (!API_KEY) {
    return Promise.reject({ type: 'API', message: 'No API key found' });
  }
  const response = await fetch(
    `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  return data.results;
};

export const getShowDetails = async (showId: number): Promise<ShowDetails> => {
  const API_KEY = await getValidApiKey();
  if (!API_KEY) {
    return Promise.reject({ type: 'API', message: 'No API key found' });
  }
  const response = await fetch(
    `${BASE_URL}/tv/${showId}?api_key=${API_KEY}`
  );
  return await response.json();
};

export const getShowSeasons = async (showId: number, seasonNumber: number) => {
  const API_KEY = await getValidApiKey();
  if (!API_KEY) {
    return Promise.reject({ type: 'API', message: 'No API key found' });
  }
  const response = await fetch(
    `${BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${API_KEY}`
  );
  return await response.json();
};