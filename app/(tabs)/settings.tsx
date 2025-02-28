import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { exportData, importData } from '@/lib/db-backup';
import { useTheme } from '@/styles/ThemeContext';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const { theme, setTheme, colors } = useTheme();
  const isDarkMode = theme === 'dark';

  function toggleTheme() {
    setTheme(isDarkMode ? 'light' : 'dark');
  }

  async function handleImportData() {
    setLoading(true);
    await importData();
    setLoading(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.spinner}
        />
      ) : (
        <>
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              About
            </Text>
            <TouchableOpacity
              style={styles.link}
              onPress={() => Linking.openURL('https://www.themoviedb.org/')}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
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

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Backup
            </Text>
            <TouchableOpacity style={styles.link} onPress={() => exportData()}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Export data
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => handleImportData()}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Import data
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Appearance
        </Text>

        <View style={styles.optionRow}>
          <Text style={[styles.optionText, { color: colors.text }]}>
            Dark Mode
          </Text>
          <Switch
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor="#f4f3f4"
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleTheme}
            value={isDarkMode}
          />
        </View>
      </View>
    </View>
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
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 16,
    marginRight: 8,
  },
  optionText: {
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
