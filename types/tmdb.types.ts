export interface TMDBShow {
    adult: boolean;
    backdrop_path: string | null;
    first_air_date: string;
    genre_ids: number[];
    id: number;
    name: string;
    origin_country: string[];
    original_language: string;
    original_name: string;
    overview: string;
    popularity: number;
    poster_path: string | null;
    vote_average: number;
    vote_count: number;
}

export interface Episode {
    id: number;
    show_id: number;
    season_number: number;
    episode_number: number;
    name: string;
    overview: string;
    air_date: string;
    watched: boolean;
}

export interface ShowDetails {
    name: string
    number_of_episodes: number
    number_of_seasons: number
    overview: string
}

export interface Season {
    season_number: number;
    name: string;
    expanded: boolean;
    episodes: Episode[];
}