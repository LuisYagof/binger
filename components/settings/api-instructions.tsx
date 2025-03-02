import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/styles/ThemeContext';

export default function ApiInstructions() {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.instructionsContainer, { backgroundColor: colors.border }]}
    >
      <Text style={{ color: colors.text, marginBottom: 8 }}>
        To get a TMDB API key:
      </Text>
      <Text style={{ color: colors.text }}>
        1. Create an account at themoviedb.org
      </Text>
      <Text style={{ color: colors.text }}>2. Go to your account settings</Text>
      <Text style={{ color: colors.text }}>
        3. Select "API" from the left sidebar
      </Text>
      <Text style={{ color: colors.text }}>
        4. Request an API key for a personal project
      </Text>
      <Text style={{ color: colors.text }}>5. Copy the API key (v3 auth)</Text>

      <TouchableOpacity
        style={[styles.linkButton, { backgroundColor: colors.primary }]}
        onPress={() => Linking.openURL('https://www.themoviedb.org')}
      >
        <Text style={{ color: colors.buttonText }}>Open TMDB Website</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  instructionsContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  linkButton: {
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
});
