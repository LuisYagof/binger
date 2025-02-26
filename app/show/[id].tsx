import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  CheckCircle2,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react-native';
import { getShowDetails, getShowSeasons } from '@/lib/tmdb';
import { getShowEpisodes, addEpisode, markEpisodeAsWatched } from '@/lib/db';
import { Episode } from '@/types/db.types';
import { Season, ShowDetails } from '@/types/tmdb.types';

export default function ShowDetailScreen() {
  const { id } = useLocalSearchParams();
  const [show, setShow] = useState<ShowDetails | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShowData = async () => {
    try {
      const showDetails = await getShowDetails(Number(id));
      setShow(showDetails);

      // First, get local episodes to ensure we have the correct watched status
      const localEpisodes = await getShowEpisodes(Number(id));
      console.log(
        `Retrieved ${localEpisodes.length} local episodes for show ${id}`
      );

      // Create a map of local episodes for quick lookup
      const localEpisodesMap = new Map(
        localEpisodes.map((episode) => [episode.id, episode])
      );

      // Only fetch remote data if we don't have episodes locally or if there are new seasons
      if (localEpisodes.length === 0 || showDetails.number_of_seasons > 0) {
        console.log(
          `Fetching ${showDetails.number_of_seasons} seasons from TMDB API`
        );

        // Load all seasons from the API
        const seasonsData = await Promise.all(
          Array.from({ length: showDetails.number_of_seasons }, (_, i) =>
            getShowSeasons(Number(id), i + 1)
          )
        );

        // Combine and format episodes data
        const remoteEpisodes = seasonsData.flatMap((season: Season) =>
          season.episodes.map((episode) => {
            // If we already have this episode locally, use its watched status
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

        // Save or update all episodes to the local database
        console.log(`Saving ${remoteEpisodes.length} episodes to database`);

        for (const episode of remoteEpisodes) {
          await addEpisode(episode);
        }

        // Organize episodes by season
        const seasonMap = new Map<number, Episode[]>();
        remoteEpisodes.forEach((episode: Episode) => {
          if (!seasonMap.has(episode.season_number)) {
            seasonMap.set(episode.season_number, []);
          }
          const episodes = seasonMap.get(episode.season_number);
          if (episodes) {
            episodes.push(episode);
          }
        });

        // Create seasons array for our UI
        const newSeasons: Season[] = [];
        seasonMap.forEach((episodes, seasonNumber) => {
          newSeasons.push({
            season_number: seasonNumber,
            name: `Season ${seasonNumber}`,
            expanded: false, // All seasons collapsed by default
            episodes: episodes.sort(
              (a, b) => a.episode_number - b.episode_number
            ),
          });
        });

        setSeasons(
          newSeasons.sort((a, b) => a.season_number - b.season_number)
        );
      } else {
        // Just use the local episodes if we already have them
        // Organize episodes by season
        const seasonMap = new Map<number, Episode[]>();
        localEpisodes.forEach((episode) => {
          if (!seasonMap.has(episode.season_number)) {
            seasonMap.set(episode.season_number, []);
          }
          const episodes = seasonMap.get(episode.season_number);
          if (episodes) {
            episodes.push(episode);
          }
        });

        // Create seasons array for our UI
        const newSeasons: Season[] = [];
        seasonMap.forEach((episodes, seasonNumber) => {
          newSeasons.push({
            season_number: seasonNumber,
            name: `Season ${seasonNumber}`,
            expanded: false, // All seasons collapsed by default
            episodes: episodes.sort(
              (a, b) => a.episode_number - b.episode_number
            ),
          });
        });

        setSeasons(
          newSeasons.sort((a, b) => a.season_number - b.season_number)
        );
      }
    } catch (error) {
      console.error('Error loading show data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeasonExpanded = (seasonNumber: number) => {
    setSeasons((prevSeasons) =>
      prevSeasons.map((season) =>
        season.season_number === seasonNumber
          ? { ...season, expanded: !season.expanded }
          : season
      )
    );
  };

  const toggleEpisodeWatched = async (episodeId: number, watched: boolean) => {
    try {
      // Toggle the watched status in the database
      console.log(
        `Toggling episode ${episodeId} to ${!watched ? 'watched' : 'unwatched'}`
      );
      await markEpisodeAsWatched(episodeId, !watched);

      // Update the local state to reflect the change in UI
      setSeasons((prevSeasons) =>
        prevSeasons.map((season) => ({
          ...season,
          episodes: season.episodes.map((episode) =>
            episode.id === episodeId
              ? { ...episode, watched: !watched }
              : episode
          ),
        }))
      );
    } catch (error) {
      console.error('Error toggling watched status:', error);
    }
  };

  const toggleAllEpisodesInSeason = async (
    seasonNumber: number,
    markAsWatched: boolean
  ) => {
    try {
      const season = seasons.find((s) => s.season_number === seasonNumber);
      if (!season) return;

      // Update all episodes in this season
      const updatePromises = season.episodes.map((episode) =>
        markEpisodeAsWatched(episode.id, markAsWatched)
      );

      await Promise.all(updatePromises);

      // Update the UI
      setSeasons((prevSeasons) =>
        prevSeasons.map((s) =>
          s.season_number === seasonNumber
            ? {
                ...s,
                episodes: s.episodes.map((e) => ({
                  ...e,
                  watched: markAsWatched,
                })),
              }
            : s
        )
      );

      console.log(
        `Marked all episodes in season ${seasonNumber} as ${
          markAsWatched ? 'watched' : 'unwatched'
        }`
      );
    } catch (error) {
      console.error(
        `Error toggling all episodes in season ${seasonNumber}:`,
        error
      );
    }
  };

  // Calculate if all episodes in a season are watched
  const allEpisodesWatched = (seasonNumber: number): boolean => {
    const season = seasons.find((s) => s.season_number === seasonNumber);
    if (!season) return false;
    return season.episodes.every((episode) => episode.watched);
  };

  // Calculate if any episodes in a season are watched
  const anyEpisodesWatched = (seasonNumber: number): boolean => {
    const season = seasons.find((s) => s.season_number === seasonNumber);
    if (!season) return false;
    return season.episodes.some((episode) => episode.watched);
  };

  // Load data when the component mounts or when the id changes
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
      {show && (
        <View style={styles.headerContainer}>
          <Text style={styles.showTitle}>{show.name}</Text>
          <Text style={styles.showInfo}>
            {show.number_of_seasons} Season
            {show.number_of_seasons !== 1 ? 's' : ''} •{show.number_of_episodes}{' '}
            Episode{show.number_of_episodes !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.showOverview}>{show.overview}</Text>
        </View>
      )}

      <FlatList
        data={seasons}
        keyExtractor={(item) => `season-${item.season_number}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: season }) => (
          <View style={styles.seasonContainer}>
            {/* Season header with toggle */}
            <TouchableOpacity
              style={styles.seasonHeader}
              onPress={() => toggleSeasonExpanded(season.season_number)}
            >
              {season.expanded ? (
                <ChevronDown size={20} color="#007AFF" />
              ) : (
                <ChevronRight size={20} color="#007AFF" />
              )}
              <Text style={styles.seasonTitle}>{season.name}</Text>

              {/* Mark all episodes button */}
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={() =>
                  toggleAllEpisodesInSeason(
                    season.season_number,
                    !allEpisodesWatched(season.season_number)
                  )
                }
              >
                <Text style={styles.markAllText}>
                  {allEpisodesWatched(season.season_number)
                    ? 'Mark All Unwatched'
                    : 'Mark All Watched'}
                </Text>
                {allEpisodesWatched(season.season_number) ? (
                  <CheckCircle2 size={18} color="#34C759" />
                ) : anyEpisodesWatched(season.season_number) ? (
                  <CheckCircle2 size={18} color="#8E8E93" />
                ) : (
                  <Check size={18} color="#8E8E93" />
                )}
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Episodes list (only shown when expanded) */}
            {season.expanded && (
              <View style={styles.episodesContainer}>
                {season.episodes.map((episode) => (
                  <TouchableOpacity
                    key={`episode-${episode.id}`}
                    style={styles.episodeCard}
                    onPress={() =>
                      toggleEpisodeWatched(episode.id, episode.watched)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.episodeInfo}>
                      <Text style={styles.episodeTitle}>
                        E{episode.episode_number}: {episode.name}
                      </Text>
                      <Text style={styles.airDate}>
                        Aired: {episode.air_date || 'Unknown'}
                      </Text>
                      <Text numberOfLines={2} style={styles.overview}>
                        {episode.overview || 'No description available'}
                      </Text>
                    </View>
                    <View style={styles.watchedIndicator}>
                      {episode.watched ? (
                        <CheckCircle2 size={24} color="#34C759" />
                      ) : (
                        <Check size={24} color="#8E8E93" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
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
  listContent: {
    paddingBottom: 20,
  },
  seasonContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  seasonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 12,
    marginRight: 4,
    color: '#007AFF',
  },
  episodesContainer: {
    padding: 8,
  },
  episodeCard: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
