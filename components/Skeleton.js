import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

export default function Skeleton({ width, height, borderRadius = 8, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#3a3a3a', opacity },
        style,
      ]}
    />
  );
}

export function MatchCardSkeleton() {
  return (
    <View style={skStyles.card}>
      <View style={skStyles.left}>
        <Skeleton width={32} height={32} borderRadius={999} />
        <Skeleton width={70} height={12} style={{ marginLeft: 8 }} />
      </View>
      <View style={skStyles.center}>
        <Skeleton width={48} height={22} />
        <Skeleton width={56} height={12} style={{ marginTop: 4 }} />
      </View>
      <View style={skStyles.right}>
        <Skeleton width={70} height={12} style={{ marginRight: 8 }} />
        <Skeleton width={32} height={32} borderRadius={999} />
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#191919',
    borderRadius: 12,
    marginBottom: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center', width: '35%' },
  center: { alignItems: 'center', width: '30%' },
  right: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', width: '35%' },
});
