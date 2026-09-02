import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { API_BASE } from './caretaker';
import { colors } from '../theme/colors';
import { sp } from '../theme/spacing';
import { text } from '../theme/typography';

const OnlineCtx = createContext<boolean>(true);
export const useOnline = () => useContext(OnlineCtx);
const getNetInfo = () => { try { return require('@react-native-community/netinfo'); } catch { return null; } };

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const NetInfo = getNetInfo();
    if (NetInfo) {
      const sub = NetInfo.addEventListener((s: any) => setOnline(!!s.isConnected));
      return () => { try { sub(); } catch {} };
    }
    // JS-only fallback: probe backend every 15s (no native module needed)
    let alive = true;
    const probe = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/banks?country=NG`);
        if (alive) setOnline(res.status < 500);
      } catch { if (alive) setOnline(false); }
    };
    probe();
    const t = setInterval(probe, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <OnlineCtx.Provider value={online}>
      {!online ? (
        <View style={styles.banner}>
          <WifiOff size={14} color={colors.text.inverse} />
          <Text style={styles.bannerLabel}>Offline — showing last synced data</Text>
        </View>
      ) : null}
      {children}
    </OnlineCtx.Provider>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: sp.x2, backgroundColor: colors.card.slate, paddingHorizontal: sp.x4, paddingVertical: sp.x2 },
  bannerLabel: { ...text.bodyS, color: colors.text.inverse },
});