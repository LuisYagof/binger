import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getFollowedShows, unfollowShow, Show } from '../../lib/db';
import { Trash2 } from 'lucide-react-native';

export default function MyShowsScreen() {
  const [shows, setShows] = useState<Show[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadShows = async () => {
    try {
      const followedShows = await getFollowedShows();
      setShows(followedShows);
    } catch (error) {
      console.error('Error loading shows:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShows();
    setRefreshing(false);
  };

  const handleUnfollow = async (showId: number) => {
    try {
      await unfollowShow(showId);
      await loadShows();
    } catch (error) {
      console.error('Error unfollowing show:', error);
    }
  };

  useEffect(() => {
    loadShows();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={shows}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.showCard}
            onPress={() => router.push(`/show/${item.id}`)}>
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
              }}
              style={styles.poster}
            />
            <View style={styles.showInfo}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.date}>First aired: {item.first_air_date}</Text>
              <Text numberOfLines={2} style={styles.overview}>
                {item.overview}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.unfollowButton}
              onPress={() => handleUnfollow(item.id)}>
              <Trash2 size={20} color="#FF3B30" />
            </TouchableOpacity>
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
});