import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '@/db/db';
import { ThemeProvider, useTheme } from '@/styles/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    init();
  }, []);

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
