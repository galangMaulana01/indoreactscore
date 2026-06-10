import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';

const API = 'https://sportmonks-tawny.vercel.app';

function SkeletonBox({ w, h, r = 8, style }) {
  return <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#2a2a2a' }, style]} />;
}

export default function StandingsScreen({ onOpenTeam, activeSeasonId, setActiveSeasonId }) {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);
  const [leagueName, setLeagueName] = useState('');
  const [empty, setEmpty] = useState(false);

  useEffect(() => { fetchStandings(); }, []);

  async function fetchStandings() {
    setLoading(true);
    try {
      const lgRes = await fetch(`${API}/leagues/501`).then(r => r.json());
      const league = lgRes?.data;
      if (!league) { setEmpty(true); setLoading(false); return; }
      const seasonId = league.currentseason?.id;
      if (!seasonId) { setEmpty(true); setLoading(false); return; }
      setActiveSeasonId && setActiveSeasonId(seasonId);
      setLeagueName(league.name || '');

      const stRes = await fetch(`${API}/standings/seasons/${seasonId}`).then(r => r.json());
      const data = stRes?.data || [];
      if (!data.length) { setEmpty(true); setLoading(false); return; }

      // group by round/group
      const grouped = {};
      data.forEach(row => {
        const key = row.group_name || row.stage_name || 'Liga';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
      });
      setTables(Object.entries(grouped));
    } catch (e) { setEmpty(true); }
    setLoading(false);
  }

  const getDetail = (row, typeId) => row.details?.find(d => d.type_id === typeId)?.value ?? '-';

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>KLASEMEN</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={{ gap: 12 }}>
              <SkeletonBox w="100%" h={32} style={{ marginBottom: 8 }} />
              <SkeletonBox w="100%" h={256} />
            </View>
          )}

          {!loading && empty && (
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyText}>Klasemen belum tersedia.</Text>
            </View>
          )}

          {!loading && !empty && tables.map(([groupName, rows], gi) => (
            <View key={gi} style={s.tableWrap}>
              {/* Table header */}
              <View style={s.tableHeader}>
                <Text style={[s.th, { width: 28, textAlign: 'left' }]}>#</Text>
                <Text style={[s.th, { flex: 1, textAlign: 'left' }]}>Tim</Text>
                <Text style={s.th}>M</Text>
                <Text style={s.th}>M</Text>
                <Text style={s.th}>S</Text>
                <Text style={s.th}>K</Text>
                <Text style={s.th}>GM</Text>
                <Text style={s.th}>GK</Text>
                <Text style={[s.th, { color: '#FC0B12', fontWeight: '900' }]}>Pts</Text>
              </View>

              {rows.map((row, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.row, i % 2 === 0 && s.rowAlt]}
                  onPress={() => onOpenTeam && onOpenTeam(row.participant_id)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.td, { width: 28, textAlign: 'left', color: i < 3 ? '#FC0B12' : '#9ca3af', fontWeight: '700' }]}>{row.position}</Text>
                  <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
                    {row.participant?.image_path
                      ? <Image source={{ uri: row.participant.image_path }} style={s.teamImg} resizeMode="contain" />
                      : null}
                    <Text style={s.teamNameTd} numberOfLines={1}>{row.participant?.name || '-'}</Text>
                  </View>
                  <Text style={s.td}>{getDetail(row, 129)}</Text>
                  <Text style={s.td}>{getDetail(row, 130)}</Text>
                  <Text style={s.td}>{getDetail(row, 131)}</Text>
                  <Text style={s.td}>{getDetail(row, 132)}</Text>
                  <Text style={s.td}>{getDetail(row, 133)}</Text>
                  <Text style={s.td}>{getDetail(row, 134)}</Text>
                  <Text style={[s.td, { color: '#FC0B12', fontWeight: '900' }]}>{row.points ?? '-'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {!loading && leagueName ? (
            <Text style={s.footer}>{leagueName} • Update terbaru</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  header: {
    backgroundColor: 'rgba(25,25,25,0.95)', borderBottomWidth: 1, borderBottomColor: '#1f2937',
    paddingVertical: 16, alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  tableWrap: { backgroundColor: '#191919', borderRadius: 8, borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden', marginBottom: 16 },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  th: { fontSize: 10, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', width: 28, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  td: { fontSize: 11, color: '#d1d5db', width: 28, textAlign: 'center' },
  teamImg: { width: 20, height: 20, marginRight: 6 },
  teamNameTd: { fontSize: 12, fontWeight: '600', color: '#e5e5e5', flex: 1 },
  emptyBox: { alignItems: 'center', paddingTop: 64 },
  emptyIcon: { fontSize: 48, opacity: 0.3, marginBottom: 12 },
  emptyText: { color: '#6b7280', fontWeight: '500' },
  footer: { fontSize: 10, color: '#6b7280', textAlign: 'center', paddingVertical: 8 },
});
