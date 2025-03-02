import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiKeyFromDb, saveApiKeyToDb } from '@/db/db';
import { useTheme } from '@/styles/ThemeContext';
import { settingsStyles } from '@/styles/settings.styles';
import ApiInstructions from '@/components/settings/api-instructions';

export default function ApiKeySection() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInstructions, setShowApiKeyInstructions] = useState(false);

  const { colors } = useTheme();

  useEffect(() => {
    const loadApiKey = async () => {
      const key = await getApiKeyFromDb();
      setApiKey(key || '');
    };

    loadApiKey();
  }, []);

  async function saveApiKey() {
    await saveApiKeyToDb(apiKey);
    Alert.alert('Success', 'API key saved');
  }

  return (
    <View style={[settingsStyles.section, { backgroundColor: colors.surface }]}>
      <Text
        style={[settingsStyles.sectionTitle, { color: colors.textSecondary }]}
      >
        TMDB API key
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Enter API key"
          placeholderTextColor={colors.textSecondary}
        />

        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.primary }]}
          onPress={saveApiKey}
        >
          <Text style={[styles.searchButtonText, { color: colors.buttonText }]}>
            Save
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowApiKeyInstructions(!showApiKeyInstructions)}
        >
          <Text style={{ color: colors.primary }}>
            {showApiKeyInstructions
              ? 'Hide Instructions'
              : 'How to get an API key'}
          </Text>
        </TouchableOpacity>

        {showApiKeyInstructions && <ApiInstructions />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    marginVertical: 8,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  searchButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  helpButton: {
    marginTop: 8,
    marginBottom: 8,
  },
});
