export interface TMDBSearchResult {
    page: number;
    results: TMDBShow[];
    total_pages: number;
    total_results: number;
}

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

export interface TMDBShowDetailsResult {
    adult: boolean;
    backdrop_path: string | null;
    created_by: {
        id: number;
        credit_id: string;
        name: string;
        gender: number;
        profile_path: string | null;
    }[];
    episode_run_time: number[];
    first_air_date: string;
    genres: { id: number; name: string }[];
    homepage: string;
    id: number;
    in_production: boolean;
    languages: string[];
    last_air_date: string;
    last_episode_to_air: {
        air_date: string;
        episode_number: number;
        id: number;
        name: string;
        overview: string;
        production_code: string;
        season_number: number;
        show_id: number;
        still_path: string | null;
        vote_average: number;
        vote_count: number;
    };
    name: string;
    next_episode_to_air: string;
    networks: {
        name: string;
        id: number;
        logo_path: string | null;
        origin_country: string;
    }[];
    number_of_episodes: number;
    number_of_seasons: number;
    origin_country: string[];
    original_language: string;
    original_name: string;
    overview: string;
    popularity: number;
    poster_path: string | null;
    production_companies: {
        id: number;
        logo_path: string | null;
        name: string;
        origin_country: string;
    }[];
    production_countries: {
        iso_3166_1: string;
        name: string;
    }[];
    seasons: {
        air_date: string;
        episode_count: number;
        id: number;
        name: string;
        overview: string;
        poster_path: string | null;
        season_number: number;
        vote_average: number;
    }[];
    spoken_languages: {
        english_name: string;
        iso_639_1: string;
        name: string;
    }[];
    status: string;
    tagline: string;
    type: string;
    vote_average: number;
    vote_count: number;
}

export interface SeasonDetails {
    _id: string
    air_date: string
    episodes: EpisodeDetails[]
    id: number
    name: string
    overview: string
    poster_path: string
    season_number: number
    vote_average: number
}


export interface EpisodeDetails {
    air_date: string
    crew: CrewDetails[]
    episode_number: number
    guest_stars: GuestStars[]
    id: number
    name: string
    overview: string
    production_code: string
    runtime: number
    season_number: number
    show_id: number
    still_path: string
    vote_average: number
    vote_count: number
}

interface CrewDetails {
    adult: boolean
    credit_id: string
    department: string
    gender: number
    id: number
    job: string
    known_for_department: string
    name: string
    original_name: string
    popularity: number
    profile_path: string
}

interface GuestStars {
    adult: boolean
    character: string
    credit_id: string
    gender: number
    id: number
    known_for_department: string
    name: string
    order: number
    original_name: string
    popularity: number
    profile_path: string
}