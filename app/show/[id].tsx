import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Check, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import { getShowDetails, getShowSeasons } from '@/lib/tmdb';
import { getShowEpisodes, markEpisodeAsWatched, addEpisode } from '@/lib/db';
import { Episode } from '@/types/shows.types';

export default function ShowDetailScreen() {
  const { id } = useLocalSearchParams();
  const [show, setShow] = useState(null);
  const [episodes, setEpisodes] = useState([] as Episode[]);
  const [loading, setLoading] = useState(true);

  const loadShowData = async () => {
    try {
      const showDetails = await getShowDetails(Number(id));
      setShow(showDetails);

      // Load all seasons
      const seasonsData = await Promise.all(
        Array.from({ length: showDetails.number_of_seasons }, (_, i) =>
          getShowSeasons(Number(id), i + 1)
        )
      );

      // Get local episodes data
      const localEpisodes = await getShowEpisodes(Number(id));
      const localEpisodesMap = new Map(
        localEpisodes.map((episode) => [episode.id, episode])
      );

      // Combine and format episodes data
      const allEpisodes = seasonsData.flatMap((season) =>
        season.episodes.map((episode) => ({
          ...episode,
          show_id: Number(id),
          watched: localEpisodesMap.has(episode.id)
            ? localEpisodesMap.get(episode.id).watched
            : false,
        }))
      );

      // Save episodes to local database
      await Promise.all(allEpisodes.map((episode) => addEpisode(episode)));

      setEpisodes(allEpisodes);
    } catch (error) {
      console.error('Error loading show data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatched = async (episodeId: number, watched: boolean) => {
    try {
      await markEpisodeAsWatched(episodeId, !watched);
      setEpisodes(
        episodes.map((episode) =>
          episode.id === episodeId ? { ...episode, watched: !watched } : episode
        )
      );
    } catch (error) {
      console.error('Error toggling watched status:', error);
    }
  };

  useEffect(() => {
    loadShowData();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={episodes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.episodeCard}
            onPress={() => toggleWatched(item.id, item.watched)}
          >
            <View style={styles.episodeInfo}>
              <Text style={styles.episodeTitle}>
                S{item.season_number} E{item.episode_number}: {item.name}
              </Text>
              <Text style={styles.airDate}>Aired: {item.air_date}</Text>
              <Text numberOfLines={2} style={styles.overview}>
                {item.overview}
              </Text>
            </View>
            <View style={styles.watchedIndicator}>
              {item.watched ? (
                <CheckCircle2 size={24} color="#34C759" />
              ) : (
                <Check size={24} color="#8E8E93" />
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  episodeInfo: {
    flex: 1,
    marginRight: 16,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  airDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  overview: {
    fontSize: 14,
    color: '#444',
  },
  watchedIndicator: {
    justifyContent: 'center',
  },
});
