import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Lock, AlertCircle } from 'lucide-react-native';
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
  const insets = useSafeAreaInsets();
  const [fired, setFired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setFired(false);
      setError(null);
      setLoading(true);
    }
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

  const handleShouldLoad = (request: { url: string }) => {
    const { url } = request;
    
    // Allow http/https URLs to load in WebView
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }

    // Custom schemes (opay://, btravel://, bank apps) → open natively
    let targetUrl = url;
    if (url.includes('?action=')) {
      try {
        const parsed = new URL(url);
        const action = parsed.searchParams.get('action');
        if (action && (action.startsWith('opay://') || action.startsWith('btravel://'))) {
          targetUrl = action;
        }
      } catch {}
    }

    Linking.openURL(targetUrl).catch(() => {
      Alert.alert(
        'Bank app not installed',
        'Complete this payment in your browser instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open browser', 
            onPress: () => {
              Linking.openURL(authorizationUrl || '');
            }
          }
        ]
      );
    });

    return false;
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    setError(`Failed to load checkout: ${nativeEvent.description}`);
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView HTTP error: ', nativeEvent);
    setError(`HTTP error ${nativeEvent.statusCode}`);
    setLoading(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  return (
    <Modal visible={visible && !!authorizationUrl} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={[styles.bar, { paddingTop: insets.top + sp.x2 }]}>
          <View style={styles.barLeft}>
            <Lock size={14} color={colors.state.success} />
            <Text style={styles.barTitle} numberOfLines={1}>{title ?? 'Secure checkout'}</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close checkout">
            <X size={18} color={colors.text.primary} />
          </Pressable>
        </View>
        
        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={32} color={colors.state.danger} />
            <Text style={styles.errorTitle}>Unable to load checkout</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Pressable
              style={styles.retryBtn}
              onPress={() => {
                setError(null);
                setLoading(true);
              }}
            >
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
            <Pressable
              style={styles.browserBtn}
              onPress={() => authorizationUrl && Linking.openURL(authorizationUrl)}
            >
              <Text style={styles.browserLabel}>Open in browser instead</Text>
            </Pressable>
          </View>
        ) : authorizationUrl ? (
          <>
            {loading && (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.brand[500]} />
                <Text style={styles.loadingLabel}>Connecting to Paystack…</Text>
              </View>
            )}
            <WebView
              source={{ uri: authorizationUrl }}
              onNavigationStateChange={handleNav}
              onShouldStartLoadWithRequest={handleShouldLoad}
              onError={handleError}
              onHttpError={handleHttpError}
              onLoadEnd={handleLoadEnd}
              startInLoadingState={false}
              javaScriptEnabled
              javaScriptCanOpenWindowsAutomatically
              domStorageEnabled
              thirdPartyCookiesEnabled
              mixedContentMode="compatibility"
              setSupportMultipleWindows={false}
              allowsInlineMediaPlayback
              scalesPageToFit
              userAgent="Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              style={styles.webview}
              
            />
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: sp.x4, paddingBottom: sp.x3,
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
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: sp.x2, backgroundColor: colors.bg, zIndex: 10 },
  loadingLabel: { ...text.bodyS, color: colors.text.muted },
  webview: { flex: 1 },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: sp.x6,
    gap: sp.x3,
  },
  errorTitle: { ...text.titleM, color: colors.text.primary, textAlign: 'center' },
  errorBody: { ...text.bodyM, color: colors.text.muted, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.xl,
    paddingHorizontal: sp.x6,
    paddingVertical: sp.x3,
    marginTop: sp.x3,
  },
  retryLabel: { ...text.button, color: colors.text.inverse },
  browserBtn: {
    paddingVertical: sp.x3,
    paddingHorizontal: sp.x6,
  },
  browserLabel: { ...text.semibold, fontSize: 13, color: colors.text.secondary },
});