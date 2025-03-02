import { Text, TouchableOpacity, View } from 'react-native';
import { exportData, importData } from '@/db/db-backup';
import { useTheme } from '@/styles/ThemeContext';
import { settingsStyles } from '@/styles/settings.styles';

export default function DataBackupSection(props: {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}) {
  const { colors } = useTheme();

  async function handleImportData() {
    props.setLoading(true);
    await importData();
    props.setLoading(false);
  }

  return (
    <View style={[settingsStyles.section, { backgroundColor: colors.surface }]}>
      <Text
        style={[settingsStyles.sectionTitle, { color: colors.textSecondary }]}
      >
        Backup
      </Text>
      <TouchableOpacity
        style={settingsStyles.link}
        onPress={() => exportData()}
      >
        <Text style={[settingsStyles.linkText, { color: colors.primary }]}>
          Export data
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={settingsStyles.link}
        onPress={() => handleImportData()}
      >
        <Text style={[settingsStyles.linkText, { color: colors.primary }]}>
          Import data
        </Text>
      </TouchableOpacity>
    </View>
  );
}
