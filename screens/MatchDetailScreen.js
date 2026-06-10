import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';

const API = 'https://sportmonks-tawny.vercel.app';

function SkeletonBox({ w, h, r = 8, style }) {
  return <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#2a2a2a' }, style]} />;
}

const TABS = ['overview','events','stats','lineup'];
const TAB_LABELS = { overview:'Overview', events:'Events', stats:'Stats', lineup:'Line-up' };

export default function MatchDetailScreen({ fixtureId, league, onBack }) {
  const [loading, setLoading] = useState(true);
  const [fixture, setFixture] = useState(null);
  const [homeId, setHomeId] = useState(null);
  const [awayId, setAwayId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { if (fixtureId) fetchDetail(); }, [fixtureId]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/fixtures/${fixtureId}?include=participants,scores,events,statistics,lineups,venue,formations`).then(r => r.json());
      const d = res?.data;
      if (!d) { setLoading(false); return; }
      const home = d.participants?.find(p => p.meta?.location === 'home');
      const away = d.participants?.find(p => p.meta?.location === 'away');
      setHomeId(home?.id);
      setAwayId(away?.id);
      setFixture(d);
    } catch (e) {}
    setLoading(false);
  }

  const home = fixture?.participants?.find(p => p.id === homeId) || {};
  const away = fixture?.participants?.find(p => p.id === awayId) || {};
  const hs = fixture?.scores?.find(s => s.description === 'CURRENT' && s.score?.participant === 'home')?.score.goals ?? '-';
  const as_ = fixture?.scores?.find(s => s.description === 'CURRENT' && s.score?.participant === 'away')?.score.goals ?? '-';
  const stRaw = fixture?.state?.short_name || 'NS';
  const status = stRaw === 'FT' ? 'FT' : stRaw === 'NS' ? 'Belum mulai' : stRaw;

  return (
    <View style={s.root}>
      {/* Header gradient merah */}
      <SafeAreaView style={{ backgroundColor: 'rgba(252,11,18,0.1)' }}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backIcon}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={s.leagueLabel}>{league?.name || 'Match Detail'}</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={s.skeletonRow}>
            <View style={{ alignItems: 'center', width: '35%', gap: 8 }}>
              <SkeletonBox w={48} h={48} r={999} />
              <SkeletonBox w={80} h={13} />
            </View>
            <View style={{ alignItems: 'center', width: '30%', gap: 8 }}>
              <SkeletonBox w={64} h={36} />
              <SkeletonBox w={80} h={24} r={999} />
            </View>
            <View style={{ alignItems: 'center', width: '35%', gap: 8 }}>
              <SkeletonBox w={48} h={48} r={999} />
              <SkeletonBox w={80} h={13} />
            </View>
          </View>
        ) : (
          <View style={s.scoreboard}>
            <View style={s.teamCol}>
              <Image source={{ uri: home.image_path || 'https://placehold.co/60' }} style={s.teamLogo} resizeMode="contain" />
              <Text style={s.teamName} numberOfLines={2}>{home.name || 'Home'}</Text>
            </View>
            <View style={s.scoreCol}>
              <Text style={s.score}>{hs} - {as_}</Text>
              <View style={s.statusPill}>
                <Text style={s.statusTxt}>{status}</Text>
              </View>
            </View>
            <View style={s.teamCol}>
              <Image source={{ uri: away.image_path || 'https://placehold.co/60' }} style={s.teamLogo} resizeMode="contain" />
              <Text style={s.teamName} numberOfLines={2}>{away.name || 'Away'}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Tab bar */}
      <View style={s.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}>
          {TABS.map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[s.tabBtn, activeTab === t && s.tabActive]} activeOpacity={0.7}>
              <Text style={[s.tabLabel, activeTab === t && s.tabLabelActive]}>{TAB_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {loading && <SkeletonBox w="100%" h={200} />}
        {!loading && fixture && (
          <>
            {activeTab === 'overview' && <OverviewTab fixture={fixture} homeId={homeId} awayId={awayId} />}
            {activeTab === 'events'   && <EventsTab fixture={fixture} homeId={homeId} />}
            {activeTab === 'stats'    && <StatsTab fixture={fixture} homeId={homeId} awayId={awayId} />}
            {activeTab === 'lineup'   && <LineupTab fixture={fixture} homeId={homeId} awayId={awayId} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function OverviewTab({ fixture, homeId, awayId }) {
  const events = fixture.events || [];
  const goalEvents = events.filter(e => [14,16,17].includes(e.type_id));
  const homeGoals = goalEvents.filter(e => e.participant_id === homeId);
  const awayGoals = goalEvents.filter(e => e.participant_id === awayId);
  const stats = fixture.statistics || [];
  const getStat = (tid) => ({
    home: stats.find(s => s.type_id===tid && s.participant_id===homeId)?.data?.value ?? 0,
    away: stats.find(s => s.type_id===tid && s.participant_id===awayId)?.data?.value ?? 0,
  });
  const corners = getStat(34);
  const venue = fixture.venue || {};
  const formations = fixture.formations || [];
  const homeForm = formations.find(f => f.participant_id===homeId)?.formation || '-';
  const awayForm = formations.find(f => f.participant_id===awayId)?.formation || '-';

  return (
    <View style={{ gap: 12 }}>
      {/* Scorers */}
      {(homeGoals.length > 0 || awayGoals.length > 0) && (
        <View style={dt.card}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#1f2937', paddingRight: 8 }}>
              {homeGoals.map((g,i) => (
                <Text key={i} style={dt.goalTxt}>⚽ {g.minute}' - {g.player_name}{g.type_id===16?' (P)':g.type_id===17?' (OG)':''}</Text>
              ))}
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end', paddingLeft: 8 }}>
              {awayGoals.map((g,i) => (
                <Text key={i} style={[dt.goalTxt, { textAlign: 'right' }]}>⚽ {g.minute}' - {g.player_name}{g.type_id===16?' (P)':g.type_id===17?' (OG)':''}</Text>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Info Match */}
      <View style={dt.card}>
        <Text style={dt.cardTitle}>Info Pertandingan</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {[
            { label: 'Stadion', val: venue.name || '-' },
            { label: 'Kota', val: venue.city_name || '-' },
            { label: 'Kapasitas', val: venue.capacity ? Number(venue.capacity).toLocaleString('id-ID') : '-' },
            { label: 'Lapangan', val: venue.surface || '-' },
          ].map((item, i) => (
            <View key={i} style={{ width: '48%', marginBottom: 12 }}>
              <Text style={dt.infoLabel}>{item.label}</Text>
              <Text style={dt.infoVal} numberOfLines={1}>{item.val}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 12 }}>
          <View>
            <Text style={dt.infoLabel}>Formasi Home</Text>
            <Text style={[dt.infoVal, { color: '#FC0B12', fontSize: 14, fontWeight: '900' }]}>{homeForm}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={dt.infoLabel}>Formasi Away</Text>
            <Text style={[dt.infoVal, { color: '#9ca3af', fontSize: 14, fontWeight: '900' }]}>{awayForm}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function EventsTab({ fixture, homeId }) {
  const events = [...(fixture.events || [])].filter(e => e.type_id !== 10).sort((a,b) => a.minute - b.minute);
  if (!events.length) return (
    <View style={dt.card}><Text style={dt.empty}>Belum ada kejadian tercatat.</Text></View>
  );
  const iconMap = { 14:'⚽', 16:'⚽', 17:'❌', 18:'🔄', 19:'🟨', 20:'🟥' };
  const detailMap = (e) => {
    if (e.type_id===14) return `Gol! ${e.info||''}`;
    if (e.type_id===16) return 'Gol Penalti';
    if (e.type_id===17) return 'Gol Bunuh Diri';
    if (e.type_id===18) return `Keluar: ${e.related_player_name||'-'}`;
    if (e.type_id===19) return 'Kartu Kuning';
    if (e.type_id===20) return 'Kartu Merah';
    return e.info || '';
  };

  return (
    <View style={{ borderLeftWidth: 2, borderLeftColor: '#1f2937', marginLeft: 16, gap: 20, paddingVertical: 8 }}>
      {events.map((e, i) => {
        const isHome = e.participant_id === homeId;
        return (
          <View key={i} style={[{ flexDirection: 'row', alignItems: 'center' }, !isHome && { justifyContent: 'flex-end' }]}>
            <View style={dt.timelineDot} />
            <View style={[dt.eventCard, !isHome && { alignItems: 'flex-end', marginLeft: 0, marginRight: 20 }]}>
              <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }, !isHome && { flexDirection: 'row-reverse' }]}>
                <View style={dt.minutePill}><Text style={dt.minuteTxt}>{e.minute}'</Text></View>
                <Text style={{ fontSize: 14 }}>{iconMap[e.type_id] || '⏱️'}</Text>
                <Text style={dt.playerName} numberOfLines={1}>{e.player_name || 'Pemain'}</Text>
              </View>
              <Text style={dt.detailTxt} numberOfLines={1}>{detailMap(e)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StatsTab({ fixture, homeId, awayId }) {
  const stats = fixture.statistics || [];
  if (!stats.length) return <View style={dt.card}><Text style={dt.empty}>Statistik belum tersedia.</Text></View>;
  const unique = [];
  stats.forEach(s => { if (!unique.some(t => t.id === s.type_id)) unique.push(s.type); });

  return (
    <View style={dt.card}>
      {unique.map((type, i) => {
        const hv = stats.find(s => s.type_id===type.id && s.participant_id===homeId)?.data?.value ?? 0;
        const av = stats.find(s => s.type_id===type.id && s.participant_id===awayId)?.data?.value ?? 0;
        const total = parseFloat(hv) + parseFloat(av);
        let hp = 50, ap = 50;
        if (total > 0) {
          const isPercent = type.name?.includes('%') || type.code?.includes('percentage');
          hp = isPercent ? parseFloat(hv) : (parseFloat(hv)/total)*100;
          ap = isPercent ? parseFloat(av) : (parseFloat(av)/total)*100;
        }
        return (
          <View key={i} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={dt.statVal}><Text style={dt.statValTxt}>{hv}</Text></View>
              <Text style={dt.statName} numberOfLines={1}>{type.name}</Text>
              <View style={dt.statVal}><Text style={dt.statValTxt}>{av}</Text></View>
            </View>
            <View style={dt.barBg}>
              <View style={[dt.barRed, { width: `${hp}%` }]} />
              <View style={[dt.barGray, { width: `${ap}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function LineupTab({ fixture, homeId, awayId }) {
  const lineups = fixture.lineups || [];
  if (!lineups.length) return <View style={dt.card}><Text style={dt.empty}>Susunan pemain belum dirilis.</Text></View>;
  const homeStart = lineups.filter(l => l.team_id===homeId && l.type_id===11);
  const awayStart = lineups.filter(l => l.team_id===awayId && l.type_id===11);
  const homeSubs  = lineups.filter(l => l.team_id===homeId && l.type_id===12);
  const awaySubs  = lineups.filter(l => l.team_id===awayId && l.type_id===12);

  function GenRows({ home, away }) {
    const max = Math.max(home.length, away.length);
    return [...Array(max)].map((_, i) => {
      const h = home[i], a = away[i];
      return (
        <View key={i} style={dt.lineupRow}>
          <View style={dt.lineupCell}>
            {h && <>
              <View style={dt.jersey}><Text style={dt.jerseyNum}>{h.jersey_number||'-'}</Text></View>
              <Text style={dt.playerNameLu} numberOfLines={1}>{h.player_name}</Text>
            </>}
          </View>
          <View style={[dt.lineupCell, { justifyContent: 'flex-end' }]}>
            {a && <>
              <Text style={[dt.playerNameLu, { textAlign: 'right' }]} numberOfLines={1}>{a.player_name}</Text>
              <View style={[dt.jersey, { backgroundColor: '#1f2937' }]}><Text style={[dt.jerseyNum, { color: '#9ca3af' }]}>{a.jersey_number||'-'}</Text></View>
            </>}
          </View>
        </View>
      );
    });
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={dt.card}>
        <Text style={[dt.cardTitle, { textAlign: 'center' }]}>Starting Eleven</Text>
        <GenRows home={homeStart} away={awayStart} />
      </View>
      <View style={dt.card}>
        <Text style={[dt.cardTitle, { color: '#6b7280', textAlign: 'center' }]}>Cadangan</Text>
        <GenRows home={homeSubs} away={awaySubs} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16,
    backgroundColor: 'rgba(252,11,18,0.08)',
  },
  backBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 999 },
  backIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
  leagueLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 2 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 24 },
  scoreboard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 32 },
  teamCol: { alignItems: 'center', width: '35%' },
  teamLogo: { width: 48, height: 48 },
  teamName: { fontSize: 13, fontWeight: '700', color: '#fff', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  scoreCol: { alignItems: 'center', width: '30%' },
  score: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  statusPill: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 },
  statusTxt: { fontSize: 10, fontWeight: '700', color: '#FC0B12', textTransform: 'uppercase', letterSpacing: 1 },
  tabBar: { backgroundColor: 'rgba(25,25,25,0.95)', borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1f2937' },
  tabActive: { backgroundColor: '#FC0B12' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#d1d5db' },
  tabLabelActive: { color: '#fff' },
});

const dt = StyleSheet.create({
  card: { backgroundColor: '#191919', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, padding: 16, marginBottom: 4 },
  cardTitle: { fontSize: 11, fontWeight: '900', color: '#FC0B12', textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: '#1f2937', paddingBottom: 8, marginBottom: 12 },
  goalTxt: { fontSize: 11, color: '#9ca3af', fontWeight: '500', marginBottom: 6 },
  infoLabel: { fontSize: 10, color: '#6b7280', fontWeight: '500', marginBottom: 2 },
  infoVal: { fontSize: 12, fontWeight: '700', color: '#e5e5e5' },
  empty: { fontSize: 13, color: '#6b7280', textAlign: 'center', paddingVertical: 16 },
  timelineDot: { position: 'absolute', left: -25, width: 16, height: 16, borderRadius: 999, backgroundColor: '#191919', borderWidth: 4, borderColor: '#FC0B12', zIndex: 10 },
  eventCard: { backgroundColor: '#191919', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, padding: 12, width: '85%', marginLeft: 20 },
  minutePill: { backgroundColor: '#1f2937', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  minuteTxt: { fontSize: 10, fontWeight: '900', color: '#FC0B12' },
  playerName: { fontSize: 12, fontWeight: '700', color: '#d1d5db', flex: 1 },
  detailTxt: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  statVal: { backgroundColor: '#1f2937', borderRadius: 4, width: 40, alignItems: 'center', paddingVertical: 2 },
  statValTxt: { fontSize: 12, fontWeight: '700', color: '#e5e5e5' },
  statName: { fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1, textAlign: 'center', paddingHorizontal: 8 },
  barBg: { height: 6, backgroundColor: '#1f2937', borderRadius: 999, overflow: 'hidden', flexDirection: 'row' },
  barRed: { height: '100%', backgroundColor: '#FC0B12' },
  barGray: { height: '100%', backgroundColor: '#4b5563' },
  lineupRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1f2937', paddingVertical: 10 },
  lineupCell: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  jersey: { width: 20, height: 20, backgroundColor: 'rgba(252,11,18,0.2)', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  jerseyNum: { fontSize: 9, fontWeight: '700', color: '#FC0B12' },
  playerNameLu: { fontSize: 11, fontWeight: '600', color: '#d1d5db', flex: 1 },
});
