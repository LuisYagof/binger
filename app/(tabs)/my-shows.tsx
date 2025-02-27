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
import { useRouter } from 'expo-router';
import { EvilIcons, FontAwesome6 } from '@expo/vector-icons';
import {
  getFollowedShows,
  unfollowShow,
  initDatabase,
  testDatabase,
} from '@/lib/db';
import { type Show } from '@/types/db.types';

export default function MyShowsScreen() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setup();
  }, []);

  const setup = async () => {
    try {
      await initDatabase();
      await loadShows();
    } catch (error) {
      console.error('Error setting up database:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your shows...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {shows.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            You haven't followed any shows yet.
          </Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.searchButtonText}>Search for Shows</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              handleRefresh();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome6 name="recycle" size={20} color="#bababa" />
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
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.showCard}
              onPress={() => router.push(`/show/${item.id}`)}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: item.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    : 'https://via.placeholder.com/100x150?text=No+Poster',
                }}
                style={styles.poster}
                // defaultSource={require('../assets/images/poster-placeholder.png')} // TODO: Add placeholder image
              />
              <View style={styles.showInfo}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.date}>
                  First aired: {item.first_air_date || 'Unknown'}
                </Text>
                <Text numberOfLines={2} style={styles.overview}>
                  {item.overview || 'No overview available'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.unfollowButton}
                onPress={() => handleUnfollow(item.id, item.name)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <EvilIcons name="trash" size={20} color="#FF3B30" />
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  showCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  poster: {
    width: 100,
    height: 150,
    backgroundColor: '#e1e1e1',
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
    color: '#666',
    marginBottom: 4,
  },
  overview: {
    fontSize: 14,
    color: '#444',
  },
  unfollowButton: {
    padding: 12,
    justifyContent: 'center',
  },
  refreshButton: {
    padding: 12,
    justifyContent: 'center',
    right: 0,
    top: 0,
    position: 'absolute',
  },
});
