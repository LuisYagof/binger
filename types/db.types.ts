export interface Show {
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    first_air_date: string;
}

export interface Season {
    season_number: number;
    name: string;
    expanded: boolean;
    episodes: Episode[];
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