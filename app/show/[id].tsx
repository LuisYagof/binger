import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { getShowDetails, getShowSeasons } from '@/api/tmdb';
import {
  getShowEpisodes,
  addEpisode,
  markEpisodeAsWatched,
  updateShowStatus,
} from '@/db/db';
import { Episode, Season } from '@/types/db.types';
import { EpisodeDetails, TMDBShowDetailsResult } from '@/types/tmdb.types';
import { useTheme } from '@/styles/ThemeContext';

export default function ShowDetailScreen() {
  const { id } = useLocalSearchParams();
  const [show, setShow] = useState<TMDBShowDetailsResult | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  const getLocalEpisodes = async (showId: number) => {
    const episodes = await getShowEpisodes(showId);
    console.log(
      `Retrieved ${episodes.length} local episodes for show ${showId}`
    );
    return episodes;
  };

  const createEpisodesMap = (episodes: Episode[]) => {
    return new Map(episodes.map((episode) => [episode.id, episode]));
  };

  const convertApiEpisodeToDbFormat = (
    episode: EpisodeDetails,
    showId: number,
    isWatched: boolean
  ): Episode => {
    return {
      id: episode.id,
      show_id: showId,
      season_number: episode.season_number,
      episode_number: episode.episode_number,
      name: episode.name,
      overview: episode.overview || '',
      air_date: episode.air_date || '',
      watched: isWatched,
    };
  };

  const organizeEpisodesBySeason = (episodes: Episode[]): Season[] => {
    const seasonMap = new Map<number, Episode[]>();

    episodes.forEach((episode) => {
      if (!seasonMap.has(episode.season_number)) {
        seasonMap.set(episode.season_number, []);
      }
      seasonMap.get(episode.season_number)?.push(episode);
    });

    const seasons: Season[] = [];
    seasonMap.forEach((episodes, seasonNumber) => {
      seasons.push({
        season_number: seasonNumber,
        name: `Season ${seasonNumber}`,
        expanded: false,
        episodes: episodes.sort((a, b) => a.episode_number - b.episode_number),
      });
    });

    return seasons.sort((a, b) => a.season_number - b.season_number);
  };

  const loadShowData = async () => {
    setLoading(true);

    try {
      // 1. Get show details
      const result = await getShowDetails(Number(id));
      if (result.error) {
        Alert.alert('Error', result.error.message);
        setShow(null);
        return;
      }

      const showDetails = result.data;
      if (!showDetails) return;

      setShow(showDetails);
      await updateShowStatus(
        Number(id),
        showDetails.last_episode_to_air?.air_date || showDetails.last_air_date
      );

      // 2. Get local episodes
      const localEpisodes = await getLocalEpisodes(Number(id));
      const localEpisodesMap = createEpisodesMap(localEpisodes);

      // 3. Determine if we need to fetch remote data
      if (localEpisodes.length === 0 || showDetails.number_of_seasons > 0) {
        console.log(
          `Fetching ${showDetails.number_of_seasons} seasons from TMDB API`
        );

        // 4. Fetch remote seasons data
        const seasonPromises = Array.from(
          { length: showDetails.number_of_seasons },
          (_, i) => getShowSeasons(Number(id), i + 1)
        );

        const seasonsResults = await Promise.all(seasonPromises);

        // 5. Process episodes from all seasons
        const remoteEpisodes: Episode[] = [];
        seasonsResults.forEach((seasonResult) => {
          if (seasonResult.data?.episodes) {
            seasonResult.data.episodes.forEach((apiEpisode) => {
              const localEpisode = localEpisodesMap.get(apiEpisode.id);
              const episode = convertApiEpisodeToDbFormat(
                apiEpisode,
                Number(id),
                !!localEpisode?.watched
              );
              remoteEpisodes.push(episode);
            });
          }
        });

        // 6. Save episodes to database
        console.log(`Saving ${remoteEpisodes.length} episodes to database`);
        for (const episode of remoteEpisodes) {
          await addEpisode(episode);
        }

        // 7. Organize episodes by season
        setSeasons(organizeEpisodesBySeason(remoteEpisodes));
      } else {
        // 8. Just use local episodes if we already have them
        setSeasons(organizeEpisodesBySeason(localEpisodes));
      }
    } catch (error: any) {
      console.error('Error loading show data:', error);
      Alert.alert(
        'Error loading show data',
        'An error occurred while fetching show data. Check your API key in settings and try again.'
      );
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
      await markEpisodeAsWatched(episodeId, !watched);
      if (show)
        await updateShowStatus(
          Number(id),
          show.last_episode_to_air?.air_date || show.last_air_date
        );

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
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading episodes...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {show && (
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: colors.surface,
              shadowColor: colors.text,
            },
          ]}
        >
          <Text style={[styles.showTitle, { color: colors.text }]}>
            {show.name}
          </Text>
          <Text style={[styles.showInfo, { color: colors.textSecondary }]}>
            {show.number_of_seasons} Season
            {show.number_of_seasons !== 1 ? 's' : ''} •{show.number_of_episodes}{' '}
            Episode{show.number_of_episodes !== 1 ? 's' : ''}
          </Text>
          <Text style={[styles.showOverview, { color: colors.text }]}>
            {show.overview}
          </Text>
        </View>
      )}

      <FlatList
        data={seasons}
        keyExtractor={(item) => `season-${item.season_number}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: season }) => (
          <View
            style={[
              styles.seasonContainer,
              {
                backgroundColor: colors.surface,
                shadowColor: colors.text,
              },
            ]}
          >
            {/* Season header with toggle */}
            <TouchableOpacity
              style={[
                styles.seasonHeader,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => toggleSeasonExpanded(season.season_number)}
            >
              {season.expanded ? (
                <Entypo name="chevron-down" size={20} color={colors.primary} />
              ) : (
                <Entypo name="chevron-right" size={20} color={colors.primary} />
              )}
              <Text style={[styles.seasonTitle, { color: colors.text }]}>
                {season.name}
              </Text>

              {/* Mark all episodes button */}
              <TouchableOpacity
                style={[
                  styles.markAllButton,
                  { backgroundColor: colors.border },
                ]}
                onPress={() =>
                  toggleAllEpisodesInSeason(
                    season.season_number,
                    !allEpisodesWatched(season.season_number)
                  )
                }
              >
                <Text style={[styles.markAllText, { color: colors.primary }]}>
                  {allEpisodesWatched(season.season_number)
                    ? 'Mark All Unwatched'
                    : 'Mark All Watched'}
                </Text>
                {allEpisodesWatched(season.season_number) ? (
                  <AntDesign
                    name="checkcircle"
                    size={18}
                    color={colors.tertiary}
                  />
                ) : anyEpisodesWatched(season.season_number) ? (
                  <AntDesign
                    name="checkcircleo"
                    size={18}
                    color={colors.textSecondary}
                  />
                ) : (
                  <AntDesign
                    name="checkcircleo"
                    size={18}
                    color={colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Episodes list (only shown when expanded) */}
            {season.expanded && (
              <View style={styles.episodesContainer}>
                {season.episodes.map((episode) => (
                  <TouchableOpacity
                    key={`episode-${episode.id}`}
                    style={[
                      styles.episodeCard,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() =>
                      toggleEpisodeWatched(episode.id, episode.watched)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.episodeInfo}>
                      <Text
                        style={[styles.episodeTitle, { color: colors.text }]}
                      >
                        E{episode.episode_number}: {episode.name}
                      </Text>
                      <Text
                        style={[
                          styles.airDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Aired: {episode.air_date || 'Unknown'}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[styles.overview, { color: colors.text }]}
                      >
                        {episode.overview || 'No description available'}
                      </Text>
                    </View>
                    <View style={styles.watchedIndicator}>
                      {episode.watched ? (
                        <AntDesign
                          name="checkcircle"
                          size={24}
                          color={colors.tertiary}
                        />
                      ) : (
                        <AntDesign
                          name="checkcircleo"
                          size={24}
                          color={colors.textSecondary}
                        />
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
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No episodes found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  headerContainer: {
    padding: 16,
    margin: 16,
    marginBottom: 6,
    borderRadius: 12,
    elevation: 2,
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
    marginBottom: 8,
  },
  showOverview: {
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  seasonContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 12,
    marginRight: 4,
  },
  episodesContainer: {
    padding: 8,
  },
  episodeCard: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
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
    marginBottom: 4,
  },
  overview: {
    fontSize: 14,
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
    textAlign: 'center',
  },
});
