import * as SQLite from 'expo-sqlite';

export interface Show {
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    first_air_date: string;
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

let db: SQLite.SQLiteDatabase;

export const initDatabase = async (): Promise<void> => {
    try {
        // Open the database
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
        // Create the shows table
        db.execSync(`
      CREATE TABLE IF NOT EXISTS shows (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        overview TEXT,
        poster_path TEXT,
        first_air_date TEXT
      );
    `);

        // Create the episodes table
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

        return Promise.resolve();
    } catch (error) {
        console.error("Error creating tables:", error);
        return Promise.reject(error);
    }
};

export const followShow = async (show: Show): Promise<void> => {
    if (!db) {
        await initDatabase();
    }

    try {
        // Using prepareSync and executeSync correctly
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

        // Properly release resources
        statement.finalizeSync();

        console.log(`Show ${show.name} (ID: ${show.id}) saved successfully`);
        return Promise.resolve();
    } catch (error) {
        console.error("SQL Error in followShow:", error);
        return Promise.reject(error);
    }
};

export const unfollowShow = async (showId: number): Promise<void> => {
    if (!db) {
        await initDatabase();
    }

    try {
        // Delete episodes first
        const deleteEpisodesStmt = db.prepareSync('DELETE FROM episodes WHERE show_id = ?');
        deleteEpisodesStmt.executeSync([showId]);
        deleteEpisodesStmt.finalizeSync();

        // Then delete the show
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

export const getFollowedShows = async (): Promise<Show[]> => {
    if (!db) {
        await initDatabase();
    }

    try {
        // Use a prepared statement approach
        const statement = db.prepareSync('SELECT * FROM shows ORDER BY name');
        const result = statement.executeSync();

        const shows: Show[] = [];

        try {
            // Get all rows using the getAllSync method on the result object
            const rows = result.getAllSync() as Show[];
            console.log("Raw rows data:", rows);

            // Process rows if they exist
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
        } catch (getAllError) {
            console.error("Error getting rows:", getAllError);
        }

        // Always finalize the statement
        statement.finalizeSync();

        console.log(`Retrieved ${shows.length} shows`);
        return Promise.resolve(shows);
    } catch (error) {
        console.error("SQL Error in getFollowedShows:", error);
        return Promise.reject(error);
    }
};



export const markEpisodeAsWatched = async (episodeId: number, watched: boolean): Promise<void> => {
    if (!db) {
        await initDatabase();
    }

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
    if (!db) {
        await initDatabase();
    }

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
    if (!db) {
        await initDatabase();
    }

    try {
        // Use a prepared statement with parameters
        const statement = db.prepareSync(`
      SELECT * FROM episodes 
      WHERE show_id = ? 
      ORDER BY season_number, episode_number
    `);

        const result = statement.executeSync([showId]);
        statement.finalizeSync();

        // Process results
        const episodes: Episode[] = [];

        if (result && Array.isArray(result)) {
            for (let i = 0; i < result.length; i++) {
                const row = result[i];
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

        console.log(`Retrieved ${episodes.length} episodes for show ID ${showId}`);
        return Promise.resolve(episodes);
    } catch (error) {
        console.error("SQL Error in getShowEpisodes:", error);
        return Promise.reject(error);
    }
};

// Utility function to help with debugging
export const testDatabase = async (): Promise<string> => {
    try {
        await initDatabase();

        console.log("Running database test...");

        // Test show
        const testShow: Show = {
            id: 999999,
            name: "Test Show",
            overview: "This is a test",
            poster_path: "/test.jpg",
            first_air_date: "2025-01-01"
        };

        // Save the test show
        await followShow(testShow);
        console.log("Successfully saved test show");

        // Get shows to verify it saved
        const shows = await getFollowedShows();
        console.log("Test - Retrieved shows:", shows);

        const testShowFound = shows.some(s => s.id === 999999);

        // Clean up by removing the test show
        await unfollowShow(999999);
        console.log("Successfully removed test show");

        return testShowFound
            ? "Database test passed: Show was successfully saved and retrieved"
            : "Database test failed: Show was not found after saving";
    } catch (error) {
        console.error("Database test failed:", error);
        return "Database test failed: " + error;
    }
};