import { useEffect } from 'react';
import { Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { getApiKeyFromDb, initDatabase } from '@/db/db';
import { ThemeProvider, useTheme } from '@/styles/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function init() {
      try {
        console.log('Initializing database...');
        await initDatabase();
        console.log('Database initialized successfully');
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        await SplashScreen.hideAsync();
      }
    }

    async function checkApiKey() {
      try {
        const apiKey = await getApiKeyFromDb();
        if (!apiKey) {
          Alert.alert(
            'Welcome to TV Show Tracker',
            'This app uses TMDB API for TV show data. Please add your own TMDB API key in Settings to use the app.',

            [
              {
                text: 'Go to settings',
                onPress: () => router.navigate('/settings'),
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error checking API key:', error);
      }
    }
    init();
    checkApiKey();
  }, []);

  return (
    <ThemeProvider>
      <ThemedStack />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function ThemedStack() {
  const { colors } = useTheme();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="show/[id]"
        options={{
          title: 'Show Details',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
        }}
      />
    </Stack>
  );
}
