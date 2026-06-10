import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';

const API = 'https://sportmonks-tawny.vercel.app';
const TARGET_LEAGUE_IDS = [501];

function SkeletonBox({ w, h, r = 8, style }) {
  return <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#2a2a2a' }, style]} />;
}

function MatchCardSkeleton() {
  return (
    <View style={sk.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '35%' }}>
        <SkeletonBox w={32} h={32} r={999} />
        <SkeletonBox w={70} h={12} style={{ marginLeft: 8 }} />
      </View>
      <View style={{ alignItems: 'center', width: '30%', gap: 6 }}>
        <SkeletonBox w={48} h={22} />
        <SkeletonBox w={56} h={12} r={999} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', width: '35%' }}>
        <SkeletonBox w={70} h={12} style={{ marginRight: 8 }} />
        <SkeletonBox w={32} h={32} r={999} />
      </View>
    </View>
  );
}

export default function MatchesScreen({ onOpenDetail }) {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [empty, setEmpty] = useState(false);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setEmpty(false);
    try {
      const result = [];
      for (const lid of TARGET_LEAGUE_IDS) {
        const lgRes = await fetch(`${API}/leagues/${lid}`).then(r => r.json());
        const league = lgRes?.data;
        if (!league) continue;
        const seasonId = league.currentseason?.id;
        if (!seasonId) continue;

        const stRes = await fetch(`${API}/standings/seasons/${seasonId}`).then(r => r.json());
        const standings = stRes?.data || [];
        if (!standings.length) continue;
        const roundId = standings[0].round_id;

        const rdRes = await fetch(`${API}/rounds/${roundId}`).then(r => r.json());
        const summaries = rdRes?.data?.fixtures || [];

        const fixtures = [];
        for (const s of summaries) {
          const fxRes = await fetch(`${API}/fixtures/${s.id}?include=participants,scores`).then(r => r.json());
          const d = fxRes?.data;
          if (!d) continue;
          const home = d.participants?.find(p => p.meta?.location === 'home') || {};
          const away = d.participants?.find(p => p.meta?.location === 'away') || {};
          const hs = d.scores?.find(s => s.description === 'CURRENT' && s.score?.participant === 'home')?.score.goals ?? 0;
          const as_ = d.scores?.find(s => s.description === 'CURRENT' && s.score?.participant === 'away')?.score.goals ?? 0;
          const stRaw = d.state?.short_name || 'NS';
          const status = stRaw === 'FT' ? 'FT' : stRaw === 'NS' ? 'Belum mulai' : stRaw;
          fixtures.push({ id: d.id, home, away, hs, as: as_, status });
        }
        if (fixtures.length) result.push({ league, fixtures });
      }
      setGroups(result);
      setEmpty(result.length === 0);
    } catch (e) {
      setEmpty(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMatches(); }, []);

  return (
    <View style={s.root}>
      {/* Background glow */}
      <View style={s.glowRed} pointerEvents="none" />
      <View style={s.glowYellow} pointerEvents="none" />
      <View style={s.glowGradient} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <Image source={require('../assets/icontol.png')} style={s.logo} resizeMode="contain" />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={{ marginTop: 8 }}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                    <SkeletonBox w={20} h={20} r={999} />
                    <SkeletonBox w={120} h={13} style={{ marginLeft: 8 }} />
                  </View>
                  <MatchCardSkeleton />
                  <MatchCardSkeleton />
                </View>
              ))}
            </View>
          )}

          {!loading && empty && (
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>⚽</Text>
              <Text style={s.emptyText}>Tidak ada jadwal yang tersedia untuk liga ini.</Text>
            </View>
          )}

          {!loading && groups.map((g, i) => (
            <View key={i} style={{ marginBottom: 20, marginTop: 8 }}>
              {/* League header */}
              <View style={s.leagueRow}>
                <Image source={{ uri: g.league.image_path }} style={s.leagueLogo} resizeMode="contain" />
                <Text style={s.leagueName}>{g.league.name}</Text>
              </View>

              {g.fixtures.map((fx) => (
                <TouchableOpacity key={fx.id} style={s.card} onPress={() => onOpenDetail(fx.id, g.league)} activeOpacity={0.75}>
                  {/* Home */}
                  <View style={s.teamLeft}>
                    <Image source={{ uri: fx.home.image_path || 'https://placehold.co/40' }} style={s.teamLogo} resizeMode="contain" />
                    <Text style={s.teamName} numberOfLines={1}>{fx.home.name || 'TBA'}</Text>
                  </View>
                  {/* Score */}
                  <View style={s.scoreBox}>
                    <Text style={s.score}>{fx.hs} - {fx.as}</Text>
                    <View style={s.statusPill}>
                      <Text style={s.statusText}>{fx.status}</Text>
                    </View>
                  </View>
                  {/* Away */}
                  <View style={s.teamRight}>
                    <Text style={[s.teamName, { textAlign: 'right' }]} numberOfLines={1}>{fx.away.name || 'TBA'}</Text>
                    <Image source={{ uri: fx.away.image_path || 'https://placehold.co/40' }} style={s.teamLogo} resizeMode="contain" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  glowRed: { position: 'absolute', top: -160, left: -128, width: 500, height: 400, backgroundColor: 'rgba(252,11,18,0.3)', borderRadius: 999 },
  glowYellow: { position: 'absolute', top: -128, right: -96, width: 400, height: 300, backgroundColor: 'rgba(247,204,12,0.3)', borderRadius: 999 },
  glowGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  header: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  logo: { width: 192, height: 48 },
  leagueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
  leagueLogo: { width: 40, height: 40 },
  leagueName: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: '#fff' },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: '#191919', borderRadius: 12, marginBottom: 12,
  },
  teamLeft: { flexDirection: 'row', alignItems: 'center', width: '35%' },
  teamRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', width: '35%' },
  teamLogo: { width: 32, height: 32 },
  teamName: { fontSize: 13, fontWeight: '600', color: '#e5e5e5', flex: 1, marginHorizontal: 6 },
  scoreBox: { alignItems: 'center', width: '30%' },
  score: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  statusPill: { backgroundColor: '#1f2937', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#FC0B12' },
  emptyBox: { alignItems: 'center', paddingTop: 64 },
  emptyIcon: { fontSize: 48, opacity: 0.3, marginBottom: 12 },
  emptyText: { color: '#6b7280', fontWeight: '500', textAlign: 'center' },
});

const sk = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, backgroundColor: '#191919', borderRadius: 12, marginBottom: 10,
  },
});
