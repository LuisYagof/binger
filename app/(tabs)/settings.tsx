import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/styles/ThemeContext';
import { settingsStyles } from '@/styles/settings.styles';
import ApiKeySection from '@/components/settings/api-key.section';
import ThemeSwitchSection from '@/components/settings/theme-switch.section';
import DataBackupSection from '@/components/settings/data-backup.section';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.spinner}
        />
      ) : (
        <>
          <View
            style={[
              settingsStyles.section,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                settingsStyles.sectionTitle,
                { color: colors.textSecondary },
              ]}
            >
              About
            </Text>
            <TouchableOpacity
              style={settingsStyles.link}
              onPress={() => Linking.openURL('https://www.themoviedb.org/')}
            >
              <Text
                style={[settingsStyles.linkText, { color: colors.primary }]}
              >
                Powered by TMDB
              </Text>
              <Feather
                name="external-link"
                size={20}
                color={colors.primary}
                paddingBottom={2}
              />
            </TouchableOpacity>
          </View>

          <DataBackupSection loading={loading} setLoading={setLoading} />

          <ThemeSwitchSection />

          <ApiKeySection />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spinner: {
    paddingTop: 40,
    paddingBottom: 40,
  },
});
