import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { X, Lock } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

const CALLBACK_PREFIX = 'https://trakbin.vercel.app/payments/callback';

interface Props {
  visible: boolean;
  authorizationUrl: string | null;
  title?: string;
  onRedirect: (reference: string) => void;
  onClose: () => void;
}

export default function PaystackSheet({ visible, authorizationUrl, title, onRedirect, onClose }: Props) {
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (visible) setFired(false);
  }, [visible]);

  const handleNav = (nav: { url: string }) => {
    if (fired) return;
    const url = nav.url || '';
    if (url.startsWith(CALLBACK_PREFIX) || url.includes('reference=')) {
      let ref: string | null = null;
      try {
        const q = new URL(url).searchParams;
        ref = q.get('reference') || q.get('trxref');
      } catch {}
      if (ref) {
        setFired(true);
        onRedirect(ref);
      }
    }
  };

  return (
    <Modal visible={visible && !!authorizationUrl} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.bar}>
          <View style={styles.barLeft}>
            <Lock size={14} color={colors.state.success} />
            <Text style={styles.barTitle} numberOfLines={1}>{title ?? 'Secure checkout'}</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close checkout">
            <X size={18} color={colors.text.primary} />
          </Pressable>
        </View>
        {authorizationUrl ? (
          <WebView
            source={{ uri: authorizationUrl }}
            onNavigationStateChange={handleNav}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.brand[500]} />
                <Text style={styles.loadingLabel}>Connecting to Paystack…</Text>
              </View>
            )}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: sp.x6, paddingHorizontal: sp.x4, paddingBottom: sp.x3,
    backgroundColor: colors.material.surface,
    borderBottomWidth: 1, borderBottomColor: colors.material.border,
  },
  barLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: sp.x2 },
  barTitle: { ...text.semibold, fontSize: 13, color: colors.text.primary },
  closeBtn: {
    width: 34, height: 34, borderRadius: radius.md,
    backgroundColor: colors.material.surfaceStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: sp.x2, backgroundColor: colors.bg },
  loadingLabel: { ...text.bodyS, color: colors.text.muted },
});