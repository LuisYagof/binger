import * as SQLite from 'expo-sqlite';
import { Episode, Show } from '@/types/db.types';

let db: SQLite.SQLiteDatabase;

export const initDatabase = async (): Promise<void> => {
    try {
        db = SQLite.openDatabaseSync('tvshows.db');
        await createTablesIfNeeded();
        console.log("Database initialized successfully");
    } catch (error) {
        console.error('Failed to initialize SQLite:', error);
        throw new Error('Failed to initialize database');
    }
};

const createTablesIfNeeded = async (): Promise<void> => {
    try {
        db.execSync(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);

        db.execSync(`
      CREATE TABLE IF NOT EXISTS shows (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        overview TEXT,
        poster_path TEXT,
        first_air_date TEXT
      );
    `);

        db.execSync(`
      CREATE TABLE IF NOT EXISTS episodes (
        id INTEGER PRIMARY KEY NOT NULL,
        show_id INTEGER NOT NULL,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        name TEXT NOT NULL,
        overview TEXT,
        air_date TEXT,
        watched INTEGER DEFAULT 0,
        FOREIGN KEY (show_id) REFERENCES shows (id)
      );
    `);

        db.execSync(`
        CREATE TABLE IF NOT EXISTS show_status (
          show_id INTEGER PRIMARY KEY,
          last_check_date TEXT,
          has_pending_episodes INTEGER DEFAULT 0,
          last_aired_episode_date TEXT
        )
      `);

        return Promise.resolve();
    } catch (error) {
        console.error("Error creating tables:", error);
        return Promise.reject(error);
    }
};

export const saveApiKeyToDb = async (key: string): Promise<void> => {
    if (!db) await initDatabase();
    const statement = db.prepareSync(`INSERT OR REPLACE INTO settings (key, value) VALUES ('api_key', '${key}')`);
    try {
        statement.executeSync();
        return Promise.resolve();
    } catch (error) {
        console.error("Error saving API key:", error);
        return Promise.reject(error);
    } finally {
        if (statement) statement.finalizeSync();
    }
};

export const getApiKeyFromDb = async (): Promise<string | null> => {
    if (!db) await initDatabase();
    const statement = db.prepareSync(`SELECT value FROM settings WHERE key = 'api_key'`);
    try {
        const result = statement.executeSync();
        const rows = result.getAllSync() as { value: string }[];
        if (rows.length > 0 && 'value' in rows[0]) {
            return rows[0].value;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting API key:", error);
        return null;
    } finally {
        if (statement) statement.finalizeSync();
    }
};

export const followShow = async (show: Show): Promise<void> => {
    if (!db) await initDatabase();

    try {
        const statement = db.prepareSync(
            'INSERT OR REPLACE INTO shows (id, name, overview, poster_path, first_air_date) VALUES (?, ?, ?, ?, ?)'
        );

        statement.executeSync([
            show.id,
            show.name,
            show.overview || '',
            show.poster_path || '',
            show.first_air_date || ''
        ]);

        statement.finalizeSync();

        console.log(`Show ${show.name} (ID: ${show.id}) saved successfully`);
        return Promise.resolve();
    } catch (error) {
        console.error("SQL Error in followShow:", error);
        return Promise.reject(error);
    }
};

export const unfollowShow = async (showId: number): Promise<void> => {
    if (!db) await initDatabase();

    try {
        const deleteEpisodesStmt = db.prepareSync('DELETE FROM episodes WHERE show_id = ?');
        deleteEpisodesStmt.executeSync([showId]);
        deleteEpisodesStmt.finalizeSync();

        const deleteShowStmt = db.prepareSync('DELETE FROM shows WHERE id = ?');
        deleteShowStmt.executeSync([showId]);
        deleteShowStmt.finalizeSync();

        console.log(`Deleted show ID ${showId}`);
        return Promise.resolve();
    } catch (error) {
        console.error("SQL Error in unfollowShow:", error);
        return Promise.reject(error);
    }
};

// TODO: Now replaced by getFollowedShowsWithStatus
export const getFollowedShows = async (): Promise<Show[]> => {
    if (!db) await initDatabase();
    const statement = db.prepareSync('SELECT * FROM shows ORDER BY name');

    try {
        const result = statement.executeSync();
        const shows: Show[] = [];
        const rows = result.getAllSync() as Show[];

        if (rows && Array.isArray(rows)) {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                shows.push({
                    id: Number(row.id),
                    name: String(row.name || ''),
                    overview: String(row.overview || ''),
                    poster_path: String(row.poster_path || ''),
                    first_air_date: String(row.first_air_date || '')
                });
            }
        }
        console.log(`Retrieved ${shows.length} shows`);
        return Promise.resolve(shows);
    } catch (error) {
        console.error("SQL Error in getFollowedShows:", error);
        return Promise.reject(error);
    }
    finally {
        if (statement) statement.finalizeSync();
    }
};

export const getFollowedShowsWithStatus = async (): Promise<(Show & { hasPending: boolean })[]> => {
    if (!db) await initDatabase();

    try {
        const statement = db.prepareSync(`
        SELECT s.*, COALESCE(ss.has_pending_episodes, 0) as has_pending 
        FROM shows s 
        LEFT JOIN show_status ss ON s.id = ss.show_id
        ORDER BY s.name
      `);
        const result = statement.executeSync();
        const rows = result.getAllSync() as any[];
        statement.finalizeSync();

        return rows.map(row => ({
            id: Number(row.id),
            name: String(row.name || ''),
            overview: String(row.overview || ''),
            poster_path: String(row.poster_path || ''),
            first_air_date: String(row.first_air_date || ''),
            hasPending: Boolean(row.has_pending)
        }));
    } catch (error) {
        console.error("Error getting shows with status:", error);
        return [];
    }
};

export const markEpisodeAsWatched = async (episodeId: number, watched: boolean): Promise<void> => {
    if (!db) await initDatabase();

    try {
        const statement = db.prepareSync('UPDATE episodes SET watched = ? WHERE id = ?');
        statement.executeSync([watched ? 1 : 0, episodeId]);
        statement.finalizeSync();

        console.log(`Marked episode ${episodeId} as ${watched ? 'watched' : 'unwatched'}`);
        return Promise.resolve();
    } catch (error) {
        console.error("SQL Error in markEpisodeAsWatched:", error);
        return Promise.reject(error);
    }
};

export const addEpisode = async (episode: Episode): Promise<void> => {
    if (!db) await initDatabase();

    try {
        const statement = db.prepareSync(`
      INSERT OR REPLACE INTO episodes 
      (id, show_id, season_number, episode_number, name, overview, air_date, watched)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        statement.executeSync([
            episode.id,
            episode.show_id,
            episode.season_number,
            episode.episode_number,
            episode.name,
            episode.overview || '',
            episode.air_date || '',
            episode.watched ? 1 : 0
        ]);

        statement.finalizeSync();

        console.log(`Added/updated episode (ID: ${episode.id}) successfully`);
        return Promise.resolve();
    } catch (error) {
        console.error("SQL Error in addEpisode:", error);
        return Promise.reject(error);
    }
};

export const getShowEpisodes = async (showId: number): Promise<Episode[]> => {
    if (!db) await initDatabase();

    try {
        const statement = db.prepareSync(`SELECT * FROM episodes WHERE show_id = ${showId} ORDER BY season_number, episode_number`);
        const result = statement.executeSync();

        const episodes: Episode[] = [];
        const rows = result.getAllSync() as Episode[];

        if (rows && Array.isArray(rows) && rows.length > 0) {
            for (const row of rows) {
                episodes.push({
                    id: Number(row.id),
                    show_id: Number(row.show_id),
                    season_number: Number(row.season_number),
                    episode_number: Number(row.episode_number),
                    name: String(row.name || ''),
                    overview: String(row.overview || ''),
                    air_date: String(row.air_date || ''),
                    watched: Boolean(row.watched)
                });
            }
        }

        statement.finalizeSync();
        console.log(`Retrieved ${episodes.length} episodes for show ID ${showId}`);
        return Promise.resolve(episodes);
    } catch (error) {
        console.error("SQL Error in getShowEpisodes:", error);
        return Promise.reject(error);
    }
};

export const updateShowStatus = async (showId: number, lastAiredDate: string): Promise<void> => {
    if (!db) await initDatabase();

    try {
        const statement = db.prepareSync(`SELECT * FROM episodes WHERE show_id = ? ORDER BY air_date DESC`);
        const result = statement.executeSync([showId]);
        const episodes = result.getAllSync() as any[];
        statement.finalizeSync();

        let hasPendingEpisodes = 0;
        if (episodes.length > 0) {
            const unwatchedAired = episodes.some(ep =>
                !ep.watched &&
                ep.air_date &&
                new Date(ep.air_date) <= new Date()
            );
            hasPendingEpisodes = unwatchedAired ? 1 : 0;
        }

        const today = new Date().toISOString().split('T')[0];
        const stmt = db.prepareSync(`
        INSERT OR REPLACE INTO show_status 
        (show_id, last_check_date, has_pending_episodes, last_aired_episode_date) 
        VALUES (?, ?, ?, ?)
      `);
        stmt.executeSync([showId, today, hasPendingEpisodes, lastAiredDate]);
        stmt.finalizeSync();
    } catch (error) {
        console.error("Error updating show status:", error);
    }
};