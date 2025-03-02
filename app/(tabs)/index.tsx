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
import { AntDesign } from '@expo/vector-icons';
import { searchShows } from '@/api/tmdb';
import { followShow, initDatabase } from '@/db/db';
import { type TMDBShow } from '@/types/tmdb.types';
import { type Show } from '@/types/db.types';
import { useTheme } from '@/styles/ThemeContext';

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
  const { colors } = useTheme();

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
    } catch (error: any) {
      console.error('Search error:', error);
      if ('type' in error && error.type === 'API') {
        Alert.alert('API Error', 'TMDB API key missing', [
          {
            text: 'Go to settings',
            onPress: () => router.navigate('/settings'),
          },
        ]);
      } else {
        Alert.alert(
          'Search Error',
          'An error occurred while searching for shows. Please try again.'
        );
      }
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Search TV shows..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={[
              styles.clearButton,
              { backgroundColor: colors.textSecondary },
            ]}
            onPress={() => setQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.showCard,
                {
                  backgroundColor: colors.surface,
                  shadowColor: colors.text,
                },
              ]}
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
                  First aired: {item.first_air_date}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.overview, { color: colors.text }]}
                >
                  {item.overview}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleFollow(item)}
                >
                  <AntDesign
                    name="pluscircleo"
                    size={20}
                    color={colors.buttonText}
                  />
                  <Text
                    style={[
                      styles.followButtonText,
                      { color: colors.buttonText },
                    ]}
                  >
                    Follow Show
                  </Text>
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
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingRight: 40,
  },
  clearButton: {
    position: 'absolute',
    right: 26,
    height: 20,
    width: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
    marginBottom: 8,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
