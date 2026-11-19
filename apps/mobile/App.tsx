import { StatusBar, StyleSheet, View } from 'react-native';
import { MIDNIGHT_BLACK } from '@mira/design-tokens';
import { BrandHome } from '@mira/ui';

export default function App() {
  return (
    <View style={styles.app}>
      <StatusBar barStyle="light-content" />
      <BrandHome />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: MIDNIGHT_BLACK,
    flex: 1,
  },
});
