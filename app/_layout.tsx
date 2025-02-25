import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '../lib/db';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  useEffect(() => {
    const init = async () => {
      await initDatabase();
      window.frameworkReady?.();
    };
    init();
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="show/[id]"
          options={{
            title: 'Show Details',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}