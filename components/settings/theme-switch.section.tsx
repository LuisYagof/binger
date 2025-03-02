import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '@/styles/ThemeContext';
import { settingsStyles } from '@/styles/settings.styles';

export default function ThemeSwitchSection() {
  const { theme, setTheme, colors } = useTheme();
  const isDarkMode = theme === 'dark';

  function toggleTheme() {
    setTheme(isDarkMode ? 'light' : 'dark');
  }

  return (
    <View style={[settingsStyles.section, { backgroundColor: colors.surface }]}>
      <Text
        style={[settingsStyles.sectionTitle, { color: colors.textSecondary }]}
      >
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
  );
}

const styles = StyleSheet.create({
  optionText: {
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
