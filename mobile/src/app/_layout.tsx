import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts, Sora_400Regular, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { addEventListener, parse } from 'expo-linking';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { OnlineProvider } from '../services/connectivity';
import { verifyTopUp } from '../services/wallet';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold,
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Deep links: trakbin://…?reference=… → silent payment verify on return
  useEffect(() => {
    const sub = addEventListener('url', ({ url }) => {
      const { queryParams } = parse(url);
      const ref = queryParams?.reference as string | null;
      if (ref) verifyTopUp(ref).catch(() => {});
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <OnlineProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </OnlineProvider>
    </ErrorBoundary>
  );
}