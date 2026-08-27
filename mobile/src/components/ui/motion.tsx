import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import { motion } from '../../theme/motion';

interface RiseProps {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/** Fade + lift entrance, spring-settled. The RN answer to framer's initial/animate. */
export function Rise({ children, delay = 0, distance = 14, style }: RiseProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, ...motion.spring }).start();
    }, delay);
    return () => clearTimeout(t);
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Simple timed fade for secondary content. */
export function Fade({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 1, duration: motion.durations.base, easing: motion.easeOut, useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(t);
  }, [anim, delay]);
  return <Animated.View style={{ opacity: anim }}>{children}</Animated.View>;
}

/** The "Online" ping — looping ring, like the PWA's animate-ping dot. */
export function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1400, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}