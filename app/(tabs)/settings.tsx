import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { exportData, importData } from '@/lib/db-backup';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity
          style={styles.link}
          onPress={() => Linking.openURL('https://www.themoviedb.org/')}
        >
          <Text style={styles.linkText}>Powered by TMDB</Text>
          <Feather
            name="external-link"
            size={20}
            color="#007AFF"
            paddingBottom={2}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup</Text>
        <TouchableOpacity style={styles.link} onPress={() => exportData()}>
          <Text style={styles.linkText}>Export data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => importData()}>
          <Text style={styles.linkText}>Import data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
  },
});
