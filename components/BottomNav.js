import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function HomeIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 28 28" fill="none">
      <Path
        fillRule="evenodd" clipRule="evenodd"
        d="M24.5 11.842V20.9613C24.5 23.56 22.4107 25.6666 19.8333 25.6666H8.16667C5.58934 25.6666 3.5 23.56 3.5 20.9613V11.842C3.5 10.4292 4.12959 9.09123 5.21484 8.19759L11.0482 3.39422C12.766 1.97968 15.234 1.97968 16.9518 3.39422L22.7852 8.19759C23.8704 9.09123 24.5 10.4292 24.5 11.842ZM11.6667 20.125C11.1834 20.125 10.7917 20.5167 10.7917 21C10.7917 21.4832 11.1834 21.875 11.6667 21.875H16.3333C16.8166 21.875 17.2083 21.4832 17.2083 21C17.2083 20.5167 16.8166 20.125 16.3333 20.125H11.6667Z"
        fill={color}
      />
    </Svg>
  );
}

function StandingsIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20H20M6 17L6 13M12 17L12 9M18 17L18 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x={4} y={3} width={4} height={4} rx={1} fill={color} />
      <Rect x={10} y={3} width={4} height={4} rx={1} fill={color} />
      <Rect x={16} y={3} width={4} height={4} rx={1} fill={color} />
    </Svg>
  );
}

export default function BottomNav({ activeTab, onSwitch }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.nav, { paddingBottom: insets.bottom || 8 }]}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onSwitch('matches')}
        activeOpacity={0.7}
      >
        <HomeIcon color={activeTab === 'matches' ? '#FC0B12' : '#6b7280'} />
        <Text style={[styles.label, activeTab === 'matches' && styles.active]}>Jadwal</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onSwitch('standings')}
        activeOpacity={0.7}
      >
        <StandingsIcon color={activeTab === 'standings' ? '#FC0B12' : '#6b7280'} />
        <Text style={[styles.label, activeTab === 'standings' && styles.active]}>Klasemen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(25,25,25,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btn: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
  },
  active: { color: '#FC0B12' },
});
