import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { addEpisode, followShow, getApiKeyFromDb, getFollowedShowsWithStatus, getShowEpisodes, saveApiKeyToDb } from '@/db/db';

export const exportData = async () => {
    try {
        const shows = await getFollowedShowsWithStatus();
        const episodesPromises = shows.map(show => getShowEpisodes(show.id));
        const allEpisodes = await Promise.all(episodesPromises);
        const apiKey = await getApiKeyFromDb();

        const exportData = {
            shows,
            episodes: allEpisodes.flat(),
            version: 1,
            exportDate: new Date().toISOString(),
            apiKey
        };

        const jsonString = JSON.stringify(exportData);
        const filePath = `${FileSystem.documentDirectory}binger_backup.json`;
        await FileSystem.writeAsStringAsync(filePath, jsonString);

        await Sharing.shareAsync(filePath);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        return false;
    }
};

export const importData = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
        });

        if (result.canceled) return false;

        const jsonString = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const importData = JSON.parse(jsonString);

        if (!importData.shows || !importData.episodes) {
            throw new Error('Invalid backup file');
        }

        for (const show of importData.shows) {
            await followShow(show);
        }

        for (const episode of importData.episodes) {
            await addEpisode(episode);
        }

        if (importData.apiKey) {
            await saveApiKeyToDb(importData.apiKey);
        }

        return true;
    } catch (error) {
        console.error('Import failed:', error);
        return false;
    }
};