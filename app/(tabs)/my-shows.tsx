import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import { getFollowedShows, unfollowShow } from '@/db/db';
import { type Show } from '@/types/db.types';
import { useTheme } from '@/styles/ThemeContext';

export default function MyShowsScreen() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadShows();
    }, [])
  );

  const loadShows = async () => {
    try {
      console.log('Loading shows...');
      const followedShows = await getFollowedShows();
      console.log(`Loaded ${followedShows.length} shows`);
      setShows(followedShows);
    } catch (error) {
      console.error('Error loading shows:', error);
      Alert.alert(
        'Error',
        'Failed to load shows. Pull down to refresh and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShows();
    setRefreshing(false);
  };

  const handleUnfollow = async (showId: number, showName: string) => {
    Alert.alert(
      'Unfollow Show',
      `Are you sure you want to unfollow "${showName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: async () => {
            try {
              await unfollowShow(showId);
              setShows((currentShows) =>
                currentShows.filter((show) => show.id !== showId)
              );
              Alert.alert('Success', `Unfollowed "${showName}"`);
            } catch (error) {
              console.error('Error unfollowing show:', error);
              Alert.alert(
                'Error',
                `Failed to unfollow "${showName}". Please try again.`
              );
            }
          },
        },
      ]
    );
  };

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
          Loading your shows...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {shows.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You haven't followed any shows yet.
          </Text>
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/')}
          >
            <Text
              style={[styles.searchButtonText, { color: colors.buttonText }]}
            >
              Search for Shows
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              handleRefresh();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome6
              name="recycle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shows}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.showCard,
                {
                  backgroundColor: colors.surface,
                  shadowColor: colors.text,
                },
              ]}
              onPress={() => router.push(`/show/${item.id}`)}
              activeOpacity={0.7}
            >
              <Image
                source={
                  item.poster_path
                    ? {
                        uri: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
                      }
                    : require('@/assets/images/fallback.png')
                }
                style={styles.poster}
                resizeMode="cover"
              />
              <View style={styles.showInfo}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                  First aired: {item.first_air_date || 'Unknown'}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.overview, { color: colors.text }]}
                >
                  {item.overview || 'No overview available'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.unfollowButton}
                onPress={() => handleUnfollow(item.id, item.name)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome name="trash-o" size={20} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
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
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  searchButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  showCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 160,
  },
  poster: {
    width: '30%',
    height: '100%',
  },
  showInfo: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    marginBottom: 4,
  },
  overview: {
    fontSize: 14,
  },
  unfollowButton: {
    padding: 12,
    justifyContent: 'flex-end',
  },
  refreshButton: {
    padding: 12,
    justifyContent: 'center',
    right: 0,
    top: 0,
    position: 'absolute',
  },
});
