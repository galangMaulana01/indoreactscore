import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const API = 'https://sportmonks-tawny.vercel.app';

function SkeletonBox({ w, h, r = 8, style }) {
  return <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#2a2a2a' }, style]} />;
}

const POS_ORDER = ['Goalkeeper','Defender','Midfielder','Attacker'];

export default function TeamScreen({ teamId, seasonId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [grouped, setGrouped] = useState([]);
  const [empty, setEmpty] = useState(false);

  useEffect(() => { if (teamId && seasonId) fetchSquad(); }, [teamId, seasonId]);

  async function fetchSquad() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/squads/seasons/${seasonId}/teams/${teamId}`).then(r => r.json());
      const players = res?.data || [];
      if (!players.length) { setEmpty(true); setLoading(false); return; }

      const teamInfo = players[0]?.team || {};
      setTeamName(teamInfo.name || 'Tim');
      setTeamLogo(teamInfo.image_path || '');

      const posMap = new Map();
      players.forEach(item => {
        const player = item.player;
        if (!player) return;
        const pos = player.position?.name || 'Lainnya';
        if (!posMap.has(pos)) posMap.set(pos, []);
        posMap.get(pos).push(item);
      });

      const sorted = Array.from(posMap.keys()).sort((a,b) => {
        let ia = POS_ORDER.indexOf(a), ib = POS_ORDER.indexOf(b);
        if (ia===-1) ia=999; if (ib===-1) ib=999;
        return ia - ib;
      });
      setGrouped(sorted.map(pos => ({ pos, players: posMap.get(pos) })));
    } catch (e) { setEmpty(true); }
    setLoading(false);
  }

  function getAge(dob) {
    if (!dob) return '-';
    const birth = new Date(dob), now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth()===birth.getMonth() && now.getDate()<birth.getDate())) age--;
    return age;
  }

  return (
    <View style={s.root}>
      {/* Header merah */}
      <SafeAreaView style={{ backgroundColor: '#FC0B12', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backIcon}>{'<'}</Text>
          </TouchableOpacity>
          <View style={s.teamInfo}>
            {teamLogo ? <Image source={{ uri: teamLogo }} style={s.teamLogo} resizeMode="contain" /> : null}
            <Text style={s.teamName} numberOfLines={1}>{teamName}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {loading && (
          <>
            <SkeletonBox w="100%" h={48} style={{ marginBottom: 16 }} />
            <SkeletonBox w="100%" h={192} />
          </>
        )}
        {!loading && empty && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>👕</Text>
            <Text style={s.emptyText}>Belum ada data pemain untuk tim ini.</Text>
          </View>
        )}
        {!loading && !empty && grouped.map(({ pos, players }) => (
          <View key={pos} style={s.posGroup}>
            <View style={s.posHeader}>
              <Text style={s.posTitle}>{pos}</Text>
            </View>
            <View style={s.posBody}>
              {players.map((item, i) => {
                const player = item.player;
                const nationality = player?.nationality?.name || '';
                const flagUrl = player?.nationality?.image_path || '';
                return (
                  <View key={i} style={s.playerRow}>
                    <View style={s.avatarWrap}>
                      <Image
                        source={{ uri: player?.image_path || 'https://placehold.co/40' }}
                        style={s.avatar}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.playerName} numberOfLines={1}>{player?.name || '-'}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                        <Text style={s.playerMeta}><Text style={s.playerMetaBold}>No.</Text> {item.jersey_number || '-'}</Text>
                        <Text style={s.playerMeta}><Text style={s.playerMetaBold}>Umur</Text> {getAge(player?.date_of_birth)}</Text>
                        {nationality ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {flagUrl ? <Image source={{ uri: flagUrl }} style={{ width: 16, height: 16 }} resizeMode="contain" /> : null}
                            <Text style={s.playerMeta}>{nationality}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <Text style={s.posLabel}>{pos}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  backBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 999 },
  backIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
  teamInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  teamLogo: { width: 40, height: 40, backgroundColor: '#000', borderRadius: 999, padding: 4 },
  teamName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  posGroup: { backgroundColor: '#191919', borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden', marginBottom: 16 },
  posHeader: { backgroundColor: '#2a2a2a', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#374151' },
  posTitle: { fontSize: 11, fontWeight: '900', color: '#FC0B12', textTransform: 'uppercase', letterSpacing: 1 },
  posBody: {},
  playerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  avatarWrap: { width: 40, height: 40, borderRadius: 999, backgroundColor: '#374151', overflow: 'hidden', marginRight: 12 },
  avatar: { width: 40, height: 40 },
  playerName: { fontSize: 14, fontWeight: '600', color: '#e5e5e5' },
  playerMeta: { fontSize: 10, color: '#6b7280' },
  playerMetaBold: { fontWeight: '700', color: '#9ca3af' },
  posLabel: { fontSize: 10, color: '#6b7280', fontStyle: 'italic' },
  emptyBox: { alignItems: 'center', paddingTop: 48 },
  emptyIcon: { fontSize: 48, opacity: 0.3, marginBottom: 12 },
  emptyText: { color: '#6b7280', fontWeight: '500', textAlign: 'center' },
});
