import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { addEpisode, followShow, getFollowedShowsWithStatus, getShowEpisodes } from '@/db/db';

export const exportData = async () => {
    try {
        const shows = await getFollowedShowsWithStatus();
        const episodesPromises = shows.map(show => getShowEpisodes(show.id));
        const allEpisodes = await Promise.all(episodesPromises);

        const exportData = {
            shows,
            episodes: allEpisodes.flat(),
            version: 1,
            exportDate: new Date().toISOString()
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

        return true;
    } catch (error) {
        console.error('Import failed:', error);
        return false;
    }
};