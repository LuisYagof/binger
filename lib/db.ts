import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

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

interface TVShowsDB extends DBSchema {
  shows: {
    key: number;
    value: Show;
  };
  episodes: {
    key: number;
    value: Episode;
    indexes: { 'by-show': number };
  };
}

let db: SQLite.SQLiteDatabase | IDBPDatabase<TVShowsDB>;

export const initDatabase = async () => {
  if (Platform.OS === 'web') {
    try {
      db = await openDB<TVShowsDB>('tvshows', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('shows')) {
            db.createObjectStore('shows', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('episodes')) {
            const episodesStore = db.createObjectStore('episodes', { keyPath: 'id' });
            episodesStore.createIndex('by-show', 'show_id');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw new Error('Failed to initialize database');
    }
  } else {
    try {
      db = SQLite.openDatabase('tvshows.db');
      await new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS shows (
              id INTEGER PRIMARY KEY NOT NULL,
              name TEXT NOT NULL,
              overview TEXT,
              poster_path TEXT,
              first_air_date TEXT
            );`
          );
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS episodes (
              id INTEGER PRIMARY KEY NOT NULL,
              show_id INTEGER NOT NULL,
              season_number INTEGER NOT NULL,
              episode_number INTEGER NOT NULL,
              name TEXT NOT NULL,
              overview TEXT,
              air_date TEXT,
              watched INTEGER DEFAULT 0,
              FOREIGN KEY (show_id) REFERENCES shows (id)
            );`
          );
        }, reject, resolve);
      });
    } catch (error) {
      console.error('Failed to initialize SQLite:', error);
      throw new Error('Failed to initialize database');
    }
  }
};

export const followShow = async (show: Show) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  if (Platform.OS === 'web') {
    const tx = (db as IDBPDatabase<TVShowsDB>).transaction('shows', 'readwrite');
    await tx.store.put(show);
  } else {
    await new Promise<void>((resolve, reject) => {
      (db as SQLite.SQLiteDatabase).transaction(tx => {
        tx.executeSql(
          'INSERT OR REPLACE INTO shows (id, name, overview, poster_path, first_air_date) VALUES (?, ?, ?, ?, ?)',
          [show.id, show.name, show.overview, show.poster_path, show.first_air_date],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
};

export const unfollowShow = async (showId: number) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  if (Platform.OS === 'web') {
    const tx = (db as IDBPDatabase<TVShowsDB>).transaction(['shows', 'episodes'], 'readwrite');
    await tx.objectStore('shows').delete(showId);
    
    const episodeStore = tx.objectStore('episodes');
    const episodeIndex = episodeStore.index('by-show');
    const episodes = await episodeIndex.getAllKeys(showId);
    await Promise.all(episodes.map(id => episodeStore.delete(id)));
  } else {
    await new Promise<void>((resolve, reject) => {
      (db as SQLite.SQLiteDatabase).transaction(tx => {
        tx.executeSql('DELETE FROM episodes WHERE show_id = ?', [showId]);
        tx.executeSql(
          'DELETE FROM shows WHERE id = ?',
          [showId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
};

export const getFollowedShows = async (): Promise<Show[]> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  if (Platform.OS === 'web') {
    return (db as IDBPDatabase<TVShowsDB>).getAll('shows');
  } else {
    return new Promise((resolve, reject) => {
      (db as SQLite.SQLiteDatabase).transaction(tx => {
        tx.executeSql(
          'SELECT * FROM shows ORDER BY name',
          [],
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
};

export const markEpisodeAsWatched = async (episodeId: number, watched: boolean) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  if (Platform.OS === 'web') {
    const tx = (db as IDBPDatabase<TVShowsDB>).transaction('episodes', 'readwrite');
    const episode = await tx.store.get(episodeId);
    if (episode) {
      episode.watched = watched;
      await tx.store.put(episode);
    }
  } else {
    await new Promise<void>((resolve, reject) => {
      (db as SQLite.SQLiteDatabase).transaction(tx => {
        tx.executeSql(
          'UPDATE episodes SET watched = ? WHERE id = ?',
          [watched ? 1 : 0, episodeId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
};

export const addEpisode = async (episode: Episode) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  if (Platform.OS === 'web') {
    const tx = (db as IDBPDatabase<TVShowsDB>).transaction('episodes', 'readwrite');
    await tx.store.put(episode);
  } else {
    await new Promise<void>((resolve, reject) => {
      (db as SQLite.SQLiteDatabase).transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO episodes 
          (id, show_id, season_number, episode_number, name, overview, air_date, watched)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            episode.id,
            episode.show_id,
            episode.season_number,
            episode.episode_number,
            episode.name,
            episode.overview,
            episode.air_date,
            episode.watched ? 1 : 0
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
};

export const getShowEpisodes = async (showId: number): Promise<Episode[]> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  if (Platform.OS === 'web') {
    const tx = (db as IDBPDatabase<TVShowsDB>).transaction('episodes', 'readonly');
    return tx.store.index('by-show').getAll(showId);
  } else {
    return new Promise((resolve, reject) => {
      (db as SQLite.SQLiteDatabase).transaction(tx => {
        tx.executeSql(
          `SELECT * FROM episodes 
          WHERE show_id = ? 
          ORDER BY season_number, episode_number`,
          [showId],
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
};