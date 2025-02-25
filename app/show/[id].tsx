import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Check } from 'lucide-react-native';
import { getShowDetails, getShowSeasons } from '@/lib/tmdb';
import { getShowEpisodes, addEpisode, markEpisodeAsWatched } from '@/lib/db';
import { type Episode, type ShowDetails } from '@/types/tmdb.types';

export default function ShowDetailScreen() {
  const { id } = useLocalSearchParams();
  const [show, setShow] = useState(null as ShowDetails | null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShowData = async () => {
    try {
      const showDetails = await getShowDetails(Number(id));
      setShow(showDetails);

      const localEpisodes = await getShowEpisodes(Number(id));
      console.log(
        `Retrieved ${localEpisodes.length} local episodes for show ${id}`
      );

      const localEpisodesMap = new Map(
        localEpisodes.map((episode) => [episode.id, episode])
      );

      if (localEpisodes.length === 0 || showDetails.number_of_seasons > 0) {
        console.log(
          `Fetching ${showDetails.number_of_seasons} seasons from TMDB API`
        );

        const seasonsData = await Promise.all(
          Array.from({ length: showDetails.number_of_seasons }, (_, i) =>
            getShowSeasons(Number(id), i + 1)
          )
        );

        const remoteEpisodes = seasonsData.flatMap((season) =>
          season.episodes.map((episode: Episode) => {
            const localEpisode = localEpisodesMap.get(episode.id);
            return {
              id: episode.id,
              show_id: Number(id),
              season_number: episode.season_number,
              episode_number: episode.episode_number,
              name: episode.name,
              overview: episode.overview || '',
              air_date: episode.air_date || '',
              watched: localEpisode ? localEpisode.watched : false,
            };
          })
        );

        console.log(`Saving ${remoteEpisodes.length} episodes to database`);

        for (const episode of remoteEpisodes) {
          await addEpisode(episode);
        }

        setEpisodes(remoteEpisodes);
      } else {
        setEpisodes(localEpisodes);
      }
    } catch (error) {
      console.error('Error loading show data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatched = async (episodeId: number, watched: boolean) => {
    try {
      console.log(
        `Toggling episode ${episodeId} to ${!watched ? 'watched' : 'unwatched'}`
      );
      await markEpisodeAsWatched(episodeId, !watched);

      setEpisodes((prevEpisodes) =>
        prevEpisodes.map((episode) =>
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
        <Text style={styles.loadingText}>Loading episodes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={episodes}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          show && (
            <View style={styles.headerContainer}>
              <Text style={styles.showTitle}>{show.name}</Text>
              <Text style={styles.showInfo}>
                {show.number_of_seasons} Season
                {show.number_of_seasons !== 1 ? 's' : ''} •
                {show.number_of_episodes} Episode
                {show.number_of_episodes !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.showOverview}>{show.overview}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.episodeCard}
            onPress={() => toggleWatched(item.id, item.watched)}
            activeOpacity={0.7}
          >
            <View style={styles.episodeInfo}>
              <Text style={styles.episodeTitle}>
                S{item.season_number} E{item.episode_number}: {item.name}
              </Text>
              <Text style={styles.airDate}>
                Aired: {item.air_date || 'Unknown'}
              </Text>
              <Text numberOfLines={2} style={styles.overview}>
                {item.overview || 'No description available'}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No episodes found</Text>
          </View>
        }
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  showTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  showInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  showOverview: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
