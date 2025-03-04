import { apiRequest, Result } from "@/api/http.utils";
import { SeasonDetails, TMDBSearchResult, TMDBShow, TMDBShowDetailsResult } from "@/types/tmdb.types";

const BASE_URL = 'https://api.themoviedb.org/3';

export const searchShows = async (query: string): Promise<Result<TMDBShow[]>> => {
  const result = await apiRequest<TMDBSearchResult>(
    `${BASE_URL}/search/tv?query=${encodeURIComponent(query)}`, true
  );

  if (result.error) return { data: null, error: result.error };
  if (!result.data?.results) {
    return {
      data: null,
      error: {
        type: 'UNKNOWN',
        message: 'Invalid response format from TMDB'
      }
    };
  }

  return { data: result.data.results, error: null };
};

export const getShowDetails = async (showId: number): Promise<Result<TMDBShowDetailsResult>> => {
  return await apiRequest<TMDBShowDetailsResult>(`${BASE_URL}/tv/${showId}`);
};

export const getShowSeasons = async (showId: number, seasonNumber: number): Promise<Result<SeasonDetails>> => {
  return await apiRequest<SeasonDetails>(`${BASE_URL}/tv/${showId}/season/${seasonNumber}`);
};