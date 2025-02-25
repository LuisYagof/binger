import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { searchShows } from '@/lib/tmdb';
import { followShow, initDatabase } from '@/lib/db';
import { Plus } from 'lucide-react-native';
import { type TMDBShow } from '@/types/tmdb.types';
import { type Show } from '@/types/db.types';

const convertToDbShow = (tmdbShow: TMDBShow): Show => {
  return {
    id: tmdbShow.id,
    name: tmdbShow.name,
    overview: tmdbShow.overview || '',
    poster_path: tmdbShow.poster_path || '',
    first_air_date: tmdbShow.first_air_date || '',
  };
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([] as TMDBShow[]);
  const [loading, setLoading] = useState(false);
  const [isDbInit, setIsDbInit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const setupDb = async () => {
      try {
        await initDatabase();
        console.log('Database initialized successfully');
        setIsDbInit(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        Alert.alert(
          'Database Error',
          'Failed to initialize the database. Please restart the app.'
        );
      }
    };

    setupDb();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const shows = await searchShows(query);
      setResults(shows);
      console.log(`Found ${shows.length} shows for query: ${query}`);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert(
        'Search Error',
        'Failed to search for shows. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (show: TMDBShow) => {
    if (!isDbInit) {
      Alert.alert(
        'Not Ready',
        'Database is still initializing. Please try again in a moment.'
      );
      return;
    }

    try {
      const dbShow = convertToDbShow(show);
      console.log('Following show:', dbShow.name, `(ID: ${dbShow.id})`);
      await followShow(dbShow);
      Alert.alert('Success', `You are now following "${show.name}"`, [
        { text: 'View My Shows', onPress: () => router.push('/my-shows') },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert(
        'Error',
        `Failed to follow "${show.name}". Please try again.`
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search TV shows..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.showCard}>
              <Image
                source={{
                  uri: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
                }}
                style={styles.poster}
              />
              <View style={styles.showInfo}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.date}>
                  First aired: {item.first_air_date}
                </Text>
                <Text numberOfLines={2} style={styles.overview}>
                  {item.overview}
                </Text>
                <TouchableOpacity
                  style={styles.followButton}
                  onPress={() => handleFollow(item)}
                >
                  <Plus size={20} color="white" />
                  <Text style={styles.followButtonText}>Follow Show</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
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
    marginBottom: 8,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  followButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
});
