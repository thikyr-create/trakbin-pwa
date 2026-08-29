import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { radius } from '../../theme/spacing';

export function Skeleton({ style, round = radius.md }: { style?: ViewStyle; round?: number }) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[styles.base, { borderRadius: round, opacity }, style]} />;
}

const styles = StyleSheet.create({ base: { backgroundColor: 'rgba(255,255,255,0.10)' } });