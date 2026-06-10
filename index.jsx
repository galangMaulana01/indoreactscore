import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, Animated, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Svg, { Path, Rect } from 'react-native-svg';

// ==================== KONFIGURASI ====================
const API_BASE_URL = "https://sportmonks-tawny.vercel.app";
const TARGET_LEAGUE_IDS = [501];

export default function App() {
  // ==================== STATES ====================
  const [globalLoading, setGlobalLoading] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);
  
  const [activeView, setActiveView] = useState('matches'); // matches, detail, standings, team
  const [previousViewName, setPreviousViewName] = useState('matches');
  const [activeSeasonId, setActiveSeasonId] = useState(null);
  
  // Data States
  const [bannerData, setBannerData] = useState(null);
  
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesData, setMatchesData] = useState([]); // Format: [{ league, fixtures: [] }]
  
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsData, setStandingsData] = useState([]); // Format: [{ groupName, standings: [] }]
  const [leagueNameStandings, setLeagueNameStandings] = useState("Klasemen Liga");
  
  const [squadLoading, setSquadLoading] = useState(true);
  const [squadData, setSquadData] = useState([]); // Format: [{ position: '', players: [] }]
  const [currentTeamInfo, setCurrentTeamInfo] = useState({ name: '', logo: '' });
  
  const [detailLoading, setDetailLoading] = useState(true);
  const [matchDetailData, setMatchDetailData] = useState(null);
  const [detailActiveTab, setDetailActiveTab] = useState('overview'); // overview, events, stats, lineup

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ==================== EFFECTS ====================
  useEffect(() => {
    // Simulasi loading progress bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(progressAnim, { toValue: 0, duration: 1000, useNativeDriver: false })
      ])
    ).start();

    // Init Data
    loadBanner();
    fetchAndRenderMatches();

    // Sembunyikan global loading setelah beberapa saat
    setTimeout(() => setGlobalLoading(false), 2000);
  }, []);

  // ==================== UTILITIES ====================
  const escapeHtml = (str) => {
    if (!str) return '';
    return str; // Di React tidak perlu escape string manual untuk render, tapi fungsi tetap dipertahankan
  };

  // ==================== ROUTING & NAVIGASI ====================
  const switchMainView = (viewName) => {
    setPreviousViewName(activeView);
    setActiveView(viewName);
    if (viewName === 'matches' && matchesData.length === 0) {
      fetchAndRenderMatches();
    } else if (viewName === 'standings') {
      fetchAndRenderStandings();
    }
  };

  const openMatchDetail = (matchId) => {
    setPreviousViewName(activeView);
    setActiveView('detail');
    setDetailActiveTab('overview');
    loadMatchDetailData(matchId);
  };

  const goBackFromDetail = () => {
    switchMainView(previousViewName === 'detail' ? 'matches' : previousViewName);
  };

  const goBackFromTeam = () => {
    if (previousViewName === 'standings') switchMainView('standings');
    else switchMainView('matches');
  };

  const openTeamSquad = (teamId) => {
    if (!activeSeasonId) return;
    setPreviousViewName(activeView);
    setActiveView('team');
    loadSquadData(teamId, activeSeasonId);
  };

  // ==================== FETCH LOGIC (PERSIS SAMA) ====================
  const loadBanner = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/benner`);
      const data = await response.json();
      setBannerData(data);
    } catch (e) { console.error(e); }
  };

  const fetchAndRenderMatches = async () => {
    setMatchesLoading(true);
    let allMatches = [];
    let seasonIdFound = activeSeasonId;

    try {
      for (const leagueId of TARGET_LEAGUE_IDS) {
        const leagueRes = await fetch(`${API_BASE_URL}/leagues/${leagueId}`);
        const leagueJson = await leagueRes.json();
        const league = leagueJson?.data;
        if (!league) continue;
        
        let seasonId = league.currentseason?.id;
        if (!seasonId) continue;
        if (!seasonIdFound) {
          seasonIdFound = seasonId;
          setActiveSeasonId(seasonId);
        }
        
        const standingsRes = await fetch(`${API_BASE_URL}/standings/seasons/${seasonId}`);
        const standingsJson = await standingsRes.json();
        const standings = standingsJson?.data || [];
        if (standings.length === 0) continue;
        
        const roundId = standings[0].round_id;
        const roundRes = await fetch(`${API_BASE_URL}/rounds/${roundId}`);
        const roundJson = await roundRes.json();
        const fixtureSummaries = roundJson?.data?.fixtures || [];
        if (fixtureSummaries.length === 0) continue;
        
        let fixturesData = [];
        for (const summary of fixtureSummaries) {
          const fixtureRes = await fetch(`${API_BASE_URL}/fixtures/${summary.id}?include=participants,scores`);
          const fixtureJson = await fixtureRes.json();
          const fixtureData = fixtureJson.data;
          if (!fixtureData) continue;
          
          fixturesData.push(fixtureData);
        }
        
        if (fixturesData.length > 0) {
          allMatches.push({ league, fixtures: fixturesData });
        }
      }
    } catch (error) {
      console.error(error);
    }
    
    setMatchesData(allMatches);
    setMatchesLoading(false);
  };

  const fetchAndRenderStandings = async () => {
    setStandingsLoading(true);
    try {
      let seasonId = activeSeasonId;
      if (!seasonId) {
        const leagueRes = await fetch(`${API_BASE_URL}/leagues/${TARGET_LEAGUE_IDS[0]}`);
        const leagueJson = await leagueRes.json();
        seasonId = leagueJson?.data?.currentseason?.id;
        if (!seasonId) throw new Error("No season ID");
        setActiveSeasonId(seasonId);
      }
      
      const standingsRes = await fetch(`${API_BASE_URL}/standings/seasons/${seasonId}`);
      const standingsJson = await standingsRes.json();
      let allStandings = standingsJson?.data || [];
      if (allStandings.length === 0) throw new Error("Standings kosong");
      
      let finalStandings = allStandings.filter(s => s.group_id !== null);
      if (finalStandings.length === 0) {
        const maxStageId = Math.max(...allStandings.map(s => s.stage_id));
        finalStandings = allStandings.filter(s => s.stage_id === maxStageId);
      }
      
      const groupsMap = new Map();
      for (const standing of finalStandings) {
        const groupId = standing.group_id;
        if (!groupId) continue;
        if (!groupsMap.has(groupId)) {
          groupsMap.set(groupId, {
            groupId: groupId,
            groupName: standing.group?.name || `Grup ${groupId}`,
            standings: []
          });
        }
        groupsMap.get(groupId).standings.push(standing);
      }
      if (groupsMap.size === 0) throw new Error("Tidak ada grup ditemukan");
      
      const leagueRes = await fetch(`${API_BASE_URL}/leagues/${TARGET_LEAGUE_IDS[0]}`);
      const leagueJson = await leagueRes.json();
      setLeagueNameStandings(leagueJson?.data?.name || "Klasemen Liga");
      
      const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
        if (a.groupName.includes('Championship')) return -1;
        if (b.groupName.includes('Championship')) return 1;
        return a.groupName.localeCompare(b.groupName);
      });

      sortedGroups.forEach(g => g.standings.sort((a, b) => a.position - b.position));
      setStandingsData(sortedGroups);
    } catch (err) {
      console.error(err);
      setStandingsData([]);
    }
    setStandingsLoading(false);
  };

  const loadSquadData = async (teamId, seasonId) => {
    setSquadLoading(true);
    try {
      const squadRes = await fetch(`${API_BASE_URL}/squads/seasons/${seasonId}/teams/${teamId}`);
      const squadJson = await squadRes.json();
      let playersData = squadJson?.data || [];
      if (playersData.length === 0) throw new Error("Tidak ada pemain");
      
      const teamInfo = playersData[0]?.team || {};
      setCurrentTeamInfo({ name: teamInfo.name || "Tim", logo: teamInfo.image_path || "" });
      
      const positionMap = new Map();
      playersData.forEach(item => {
        const player = item.player;
        if (!player) return;
        const posName = player.position?.name || "Lainnya";
        if (!positionMap.has(posName)) positionMap.set(posName, []);
        positionMap.get(posName).push(item);
      });
      
      const posOrder = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];
      const sortedPositions = Array.from(positionMap.keys()).sort((a, b) => {
        let idxA = posOrder.indexOf(a), idxB = posOrder.indexOf(b);
        if (idxA === -1) idxA = 999; if (idxB === -1) idxB = 999;
        return idxA - idxB;
      });
      
      const finalSquad = sortedPositions.map(posName => ({
        position: posName,
        players: positionMap.get(posName)
      }));
      setSquadData(finalSquad);
    } catch(e) {
      console.error(e);
      setSquadData([]);
    }
    setSquadLoading(false);
  };

  const loadMatchDetailData = async (matchId) => {
    setDetailLoading(true);
    try {
      const fixtureRes = await fetch(`${API_BASE_URL}/fixtures/${matchId}?include=participants,scores,events,statistics,lineups,venue,formations`);
      const fixtureJson = await fixtureRes.json();
      setMatchDetailData(fixtureJson.data);
    } catch(err) {
      console.error(err);
      setMatchDetailData(null);
    }
    setDetailLoading(false);
  };

  // ==================== RENDER COMPONENTS ====================

  // Skeleton Loader Component
  const Skeleton = ({ className }) => (
    <View className={`bg-[#2a2a2a] animate-pulse rounded-md ${className}`} />
  );

  return (
    <View className="flex-1 bg-black">
      {/* Background Blurs */}
      <View className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <View className="absolute -top-40 -left-32 w-[500px] h-[400px] bg-merah/30 rounded-full opacity-50" style={{ transform: [{ scale: 1.5 }] }} />
        <View className="absolute -top-32 -right-24 w-[400px] h-[300px] bg-kuning/30 rounded-full opacity-50" style={{ transform: [{ scale: 1.5 }] }} />
      </View>

      {/* Video Splash */}
      {splashVisible && (
        <View className="absolute z-[10000] top-0 left-0 right-0 bottom-0 bg-black flex-1 items-center justify-center">
          <Video
            source={require('./assets/splash.mp4')} // Pastikan splash.mp4 ada di folder assets
            style={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isMuted
            onPlaybackStatusUpdate={status => {
              if (status.didJustFinish) setSplashVisible(false);
            }}
            onError={() => setSplashVisible(false)} // Fallback
          />
        </View>
      )}

      {/* Global Loading */}
      {globalLoading && !splashVisible && (
        <View className="absolute z-[9999] top-0 left-0 right-0 bottom-0 bg-black flex-1 items-center justify-center">
          <View className="flex-col items-center w-full max-w-[200px] px-2">
            <Image source={require('./assets/logo.png')} className="w-44 h-16 mb-5" resizeMode="contain" />
            <View className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden border border-gray-700/50">
              <Animated.View 
                className="h-full bg-merah rounded-full" 
                style={{ 
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) 
                }} 
              />
            </View>
          </View>
        </View>
      )}

      {/* ==================== VIEW MATCHES ==================== */}
      {activeView === 'matches' && (
        <ScrollView className="flex-1 z-10" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="pt-10 pb-4">
            <Image source={require('./assets/logo.png')} className="w-48 h-12 ml-4" resizeMode="contain" />
          </View>
          
          {/* Banner */}
          {bannerData && (
            <View className="max-w-2xl mx-auto px-4 mb-4 w-full">
              <View className="relative overflow-hidden rounded-2xl bg-[#121212] h-32 flex-row items-center px-5">
                <Image source={{ uri: bannerData.image_benner }} className="absolute left-0 bottom-0 h-36 w-32" resizeMode="contain" />
                <View className="ml-28 flex-1">
                  <Image source={{ uri: bannerData.image_logo }} className="w-24 h-8" resizeMode="contain" />
                  <Text className="text-gray-400 text-xs mt-2 leading-tight">{bannerData.desc}</Text>
                </View>
                <TouchableOpacity onPress={() => {/* Handle Link here if needed */}} className="bg-[#191919] px-6 py-3 rounded-2xl">
                  <Text className="text-white font-bold text-lg">Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View className="max-w-2xl mx-auto px-4 w-full">
            {matchesLoading ? (
              <View className="space-y-5">
                {[1,2,3].map(i => (
                  <View key={i} className="mb-6">
                    <View className="flex-row items-center gap-2 mb-3 px-1">
                      <Skeleton className="w-5 h-5 rounded-full" />
                      <Skeleton className="w-32 h-4" />
                    </View>
                    <View className="flex-row items-center justify-between p-3 bg-[#191919] rounded-xl mb-3">
                      <Skeleton className="w-[30%] h-6" />
                      <Skeleton className="w-[20%] h-8" />
                      <Skeleton className="w-[30%] h-6" />
                    </View>
                  </View>
                ))}
              </View>
            ) : matchesData.length > 0 ? (
              matchesData.map((leagueItem, idx) => (
                <View key={idx} className="mb-6">
                  <View className="mb-3 flex-row items-center gap-2 px-1">
                    <Image source={{ uri: leagueItem.league.image_path }} className="w-8 h-8" resizeMode="contain" />
                    <Text className="font-bold text-base text-white tracking-wider">{escapeHtml(leagueItem.league.name)}</Text>
                  </View>
                  {leagueItem.fixtures.map((fixtureData) => {
                    const participants = fixtureData.participants || [];
                    const homeTeam = participants.find(p => p.meta?.location === 'home') || {};
                    const awayTeam = participants.find(p => p.meta?.location === 'away') || {};
                    const homeScore = fixtureData.scores?.find(s => s.description === "CURRENT" && s.score?.participant === "home")?.score.goals ?? "0";
                    const awayScore = fixtureData.scores?.find(s => s.description === "CURRENT" && s.score?.participant === "away")?.score.goals ?? "0";
                    const statusRaw = fixtureData.state?.short_name || "NS";
                    const statusLabel = statusRaw === "FT" ? "FT" : (statusRaw === "NS" ? "Belum mulai" : statusRaw);
                    
                    return (
                      <TouchableOpacity key={fixtureData.id} onPress={() => openMatchDetail(fixtureData.id)} className="flex-row items-center justify-between py-3 px-3 bg-[#191919] rounded-xl mb-3">
                        <View className="flex-row items-center gap-3 w-[35%]">
                          <Image source={{ uri: homeTeam.image_path || 'https://placehold.co/40' }} className="w-8 h-8" resizeMode="contain" />
                          <Text className="text-xs font-semibold text-gray-200" numberOfLines={1}>{escapeHtml(homeTeam.name) || 'TBA'}</Text>
                        </View>
                        <View className="flex-col items-center w-[30%]">
                          <Text className="text-xl font-black text-white">{homeScore} - {awayScore}</Text>
                          <View className="bg-gray-800 px-2 py-0.5 rounded-full mt-1">
                            <Text className="text-[9px] font-bold text-merah">{statusLabel}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center justify-end gap-3 w-[35%]">
                          <Text className="text-xs font-semibold text-gray-200 text-right" numberOfLines={1}>{escapeHtml(awayTeam.name) || 'TBA'}</Text>
                          <Image source={{ uri: awayTeam.image_path || 'https://placehold.co/40' }} className="w-8 h-8" resizeMode="contain" />
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ))
            ) : (
              <View className="items-center py-16">
                <Text className="text-5xl mb-3 opacity-30">⚽</Text>
                <Text className="font-medium text-gray-500">Tidak ada jadwal yang tersedia untuk liga ini.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ==================== VIEW DETAIL ==================== */}
      {activeView === 'detail' && (
        <View className="flex-1 z-10 bg-black">
          {/* Header Detail */}
          <View className="pt-10 pb-6 bg-[#1A1010]">
            <View className="px-4 flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={goBackFromDetail} className="p-2 bg-black/30 rounded-full">
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </Svg>
              </TouchableOpacity>
              <Text className="text-xs font-bold tracking-widest text-white/80 uppercase">Match Detail</Text>
              <View className="w-9" />
            </View>

            {detailLoading || !matchDetailData ? (
              <View className="flex-row items-center justify-between px-6 py-4">
                <View className="items-center w-[35%]"><Skeleton className="w-12 h-12 rounded-full mb-2" /><Skeleton className="w-16 h-3" /></View>
                <View className="items-center w-[30%]"><Skeleton className="w-16 h-8 mb-2" /><Skeleton className="w-12 h-4" /></View>
                <View className="items-center w-[35%]"><Skeleton className="w-12 h-12 rounded-full mb-2" /><Skeleton className="w-16 h-3" /></View>
              </View>
            ) : (
              (() => {
                const participants = matchDetailData.participants || [];
                const homeTeam = participants.find(p => p.meta?.location === 'home') || {};
                const awayTeam = participants.find(p => p.meta?.location === 'away') || {};
                const homeScore = matchDetailData.scores?.find(s => s.description === "CURRENT" && s.score?.participant === "home")?.score.goals ?? "0";
                const awayScore = matchDetailData.scores?.find(s => s.description === "CURRENT" && s.score?.participant === "away")?.score.goals ?? "0";
                const statusRaw = matchDetailData.state?.short_name || "NS";
                const statusLabel = statusRaw === "FT" ? "FT" : (statusRaw === "NS" ? "Belum mulai" : statusRaw);

                return (
                  <View className="flex-row items-center justify-between px-4 py-2">
                    <View className="flex-col items-center w-[35%]">
                      <Image source={{ uri: homeTeam.image_path }} className="w-12 h-12 mb-1" resizeMode="contain" />
                      <Text className="text-[12px] text-center font-bold text-white" numberOfLines={2}>{homeTeam.name}</Text>
                    </View>
                    <View className="flex-col items-center w-[30%]">
                      <Text className="text-4xl font-black tracking-wider text-white mb-1">{homeScore} - {awayScore}</Text>
                      <View className="bg-white px-3 py-1 rounded-full"><Text className="text-[10px] font-bold text-merah uppercase">{statusLabel}</Text></View>
                    </View>
                    <View className="flex-col items-center w-[35%]">
                      <Image source={{ uri: awayTeam.image_path }} className="w-12 h-12 mb-1" resizeMode="contain" />
                      <Text className="text-[12px] text-center font-bold text-white" numberOfLines={2}>{awayTeam.name}</Text>
                    </View>
                  </View>
                );
              })()
            )}
          </View>

          {/* Tabs Nav */}
          <View className="bg-[#191919] border-b border-gray-800">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-3 px-4 flex-row">
              {['overview', 'events', 'stats', 'lineup'].map(tab => (
                <TouchableOpacity 
                  key={tab} 
                  onPress={() => setDetailActiveTab(tab)} 
                  className={`px-5 py-2 mr-2 rounded-full ${detailActiveTab === tab ? 'bg-merah' : 'bg-gray-800'}`}
                >
                  <Text className={`text-xs font-bold capitalize ${detailActiveTab === tab ? 'text-white' : 'text-gray-300'}`}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Logic Tabs Data Rendering */}
            {!detailLoading && matchDetailData && (() => {
              const participants = matchDetailData.participants || [];
              const homeId = participants.find(p => p.meta?.location === 'home')?.id;
              const awayId = participants.find(p => p.meta?.location === 'away')?.id;

              // OVERVIEW TAB
              if (detailActiveTab === 'overview') {
                const events = matchDetailData.events || [];
                const goalEvents = events.filter(e => [14,16,17].includes(e.type_id));
                const venue = matchDetailData.venue || {};
                const formations = matchDetailData.formations || [];
                const homeForm = formations.find(f=>f.participant_id===homeId)?.formation||'-';
                const awayForm = formations.find(f=>f.participant_id===awayId)?.formation||'-';

                return (
                  <View className="space-y-4">
                    {goalEvents.length > 0 && (
                      <View className="bg-[#191919] border border-gray-800 rounded p-4 flex-row">
                        <View className="flex-1 border-r border-gray-800 pr-2">
                          {goalEvents.filter(e => e.participant_id === homeId).map((e, i) => (
                            <Text key={i} className="text-xs text-gray-400 font-medium mb-1">⚽ {e.minute}' - {e.player_name} {e.type_id===16?'(P)':e.type_id===17?'(OG)':''}</Text>
                          ))}
                        </View>
                        <View className="flex-1 pl-2 items-end">
                          {goalEvents.filter(e => e.participant_id === awayId).map((e, i) => (
                            <Text key={i} className="text-xs text-gray-400 font-medium mb-1">⚽ {e.minute}' - {e.player_name} {e.type_id===16?'(P)':e.type_id===17?'(OG)':''}</Text>
                          ))}
                        </View>
                      </View>
                    )}
                    <View className="bg-[#191919] border border-gray-800 rounded p-5">
                      <Text className="text-xs font-black text-merah uppercase border-b border-gray-800 pb-2 mb-4">Info Pertandingan</Text>
                      <View className="flex-row flex-wrap">
                        <View className="w-1/2 mb-4"><Text className="text-gray-500 text-[11px] mb-0.5">Stadion</Text><Text className="font-bold text-gray-200 text-xs">{venue.name||'-'}</Text></View>
                        <View className="w-1/2 mb-4"><Text className="text-gray-500 text-[11px] mb-0.5">Kota</Text><Text className="font-bold text-gray-200 text-xs">{venue.city_name||'-'}</Text></View>
                        <View className="w-1/2 mb-4"><Text className="text-gray-500 text-[11px] mb-0.5">Kapasitas</Text><Text className="font-bold text-gray-200 text-xs">{venue.capacity?Number(venue.capacity).toLocaleString('id-ID'):'-'}</Text></View>
                        <View className="w-1/2 mb-4"><Text className="text-gray-500 text-[11px] mb-0.5">Lapangan</Text><Text className="font-bold text-gray-200 text-xs capitalize">{venue.surface||'-'}</Text></View>
                      </View>
                      <View className="pt-3 border-t border-gray-800 flex-row justify-between mt-2">
                        <View><Text className="text-gray-500 text-[11px] mb-0.5">Formasi Home</Text><Text className="font-black text-sm text-merah">{homeForm}</Text></View>
                        <View className="items-end"><Text className="text-gray-500 text-[11px] mb-0.5">Formasi Away</Text><Text className="font-black text-sm text-gray-400">{awayForm}</Text></View>
                      </View>
                    </View>
                  </View>
                );
              }

              // EVENTS TAB
              if (detailActiveTab === 'events') {
                const events = (matchDetailData.events || []).sort((a,b)=>a.minute-b.minute).filter(e => e.type_id !== 10);
                if (!events.length) return <View className="bg-[#191919] border border-gray-800 rounded p-8 items-center"><Text className="text-sm font-medium text-gray-500">Belum ada kejadian tercatat.</Text></View>;
                return (
                  <View className="pl-4 border-l-2 border-gray-800 ml-2 py-2">
                    {events.map((e, idx) => {
                      const isHome = e.participant_id === homeId;
                      let icon="⏱️", detail=e.info||"";
                      if(e.type_id===14){ icon="⚽"; detail=`Gol! ${e.info||''}`; }
                      else if(e.type_id===16){ icon="⚽"; detail="Gol Penalti"; }
                      else if(e.type_id===17){ icon="❌"; detail="Gol Bunuh Diri"; }
                      else if(e.type_id===18){ icon="🔄"; detail=`Keluar: ${e.related_player_name||'-'}`; }
                      else if(e.type_id===19){ icon="🟨"; detail="Kartu Kuning"; }
                      else if(e.type_id===20){ icon="🟥"; detail="Kartu Merah"; }

                      return (
                        <View key={idx} className={`flex-row mb-5 items-center ${isHome ? 'justify-start' : 'justify-end pr-4'}`}>
                          <View className="absolute -left-[27px] w-4 h-4 rounded-full bg-[#191919] border-4 border-merah" />
                          <View className={`bg-[#191919] border border-gray-800 rounded p-3 w-[85%] ${isHome ? '' : 'items-end'}`}>
                            <View className="flex-row items-center gap-2 mb-1">
                              <Text className="text-[10px] font-black text-merah bg-gray-800 px-1.5 py-0.5 rounded">{e.minute}'</Text>
                              <Text className="text-xs">{icon}</Text>
                              <Text className="text-xs font-bold text-gray-300">{e.player_name||'Pemain'}</Text>
                            </View>
                            <Text className="text-[11px] text-gray-500 font-medium">{detail}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              }

              // STATS TAB
              if (detailActiveTab === 'stats') {
                const stats = matchDetailData.statistics || [];
                if(!stats.length) return <View className="bg-[#191919] border border-gray-800 rounded p-8 items-center"><Text className="text-sm font-medium text-gray-500">Statistik belum tersedia.</Text></View>;
                let unique = [];
                stats.forEach(s=>{ if(!unique.some(t=>t.id===s.type_id)) unique.push(s.type); });

                return (
                  <View className="bg-[#191919] border border-gray-800 rounded p-5 space-y-4">
                    {unique.map((type, idx) => {
                      const homeVal = stats.find(s=>s.type_id===type.id && s.participant_id===homeId)?.data?.value??0;
                      const awayVal = stats.find(s=>s.type_id===type.id && s.participant_id===awayId)?.data?.value??0;
                      let total = parseFloat(homeVal)+parseFloat(awayVal);
                      let homePct=50, awayPct=50;
                      if(total>0){
                        if(type.name.includes('%')||type.code.includes('percentage')){ homePct=parseFloat(homeVal); awayPct=parseFloat(awayVal); }
                        else{ homePct=(parseFloat(homeVal)/total)*100; awayPct=(parseFloat(awayVal)/total)*100; }
                      }
                      return (
                        <View key={idx} className="py-1 mb-2">
                          <View className="flex-row justify-between items-center mb-1">
                            <Text className="w-10 bg-gray-800 py-0.5 rounded text-center text-xs font-bold text-gray-300">{homeVal}</Text>
                            <Text className="text-gray-500 font-semibold text-[9px] uppercase text-center flex-1">{type.name}</Text>
                            <Text className="w-10 bg-gray-800 py-0.5 rounded text-center text-xs font-bold text-gray-300">{awayVal}</Text>
                          </View>
                          <View className="w-full bg-gray-800 h-1.5 rounded-full flex-row overflow-hidden">
                            <View className="bg-merah h-full" style={{ width: `${homePct}%` }} />
                            <View className="bg-gray-600 h-full" style={{ width: `${awayPct}%` }} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              }

              // LINEUP TAB
              if (detailActiveTab === 'lineup') {
                const lineups = matchDetailData.lineups || [];
                if(!lineups.length) return <View className="bg-[#191919] border border-gray-800 rounded p-8 items-center"><Text className="text-sm font-medium text-gray-500">Susunan pemain belum dirilis.</Text></View>;
                const homeStart = lineups.filter(l=>l.team_id===homeId && l.type_id===11);
                const awayStart = lineups.filter(l=>l.team_id===awayId && l.type_id===11);
                const homeSubs = lineups.filter(l=>l.team_id===homeId && l.type_id===12);
                const awaySubs = lineups.filter(l=>l.team_id===awayId && l.type_id===12);

                const renderRows = (homeArr, awayArr) => {
                  const maxLen = Math.max(homeArr.length, awayArr.length);
                  let rows = [];
                  for(let i=0; i<maxLen; i++){
                    const h=homeArr[i], a=awayArr[i];
                    rows.push(
                      <View key={i} className="flex-row justify-between py-2 border-b border-gray-800">
                        <View className="flex-row items-center gap-2 flex-1">
                          {h && <><Text className="w-5 h-5 bg-merah/20 text-merah text-center rounded-md font-bold text-[10px] leading-5">{h.jersey_number||'-'}</Text><Text className="font-semibold text-gray-300 text-xs flex-1" numberOfLines={1}>{h.player_name}</Text></>}
                        </View>
                        <View className="flex-row items-center gap-2 flex-1 justify-end">
                          {a && <><Text className="font-semibold text-gray-300 text-xs text-right flex-1" numberOfLines={1}>{a.player_name}</Text><Text className="w-5 h-5 bg-gray-800 text-gray-400 text-center rounded-md font-bold text-[10px] leading-5">{a.jersey_number||'-'}</Text></>}
                        </View>
                      </View>
                    );
                  }
                  return rows;
                };

                return (
                  <View className="space-y-4">
                    <View className="bg-[#191919] border border-gray-800 rounded p-4 mb-4">
                      <Text className="text-xs font-black text-merah uppercase text-center border-b border-gray-800 pb-2 mb-2">Starting Eleven</Text>
                      {renderRows(homeStart, awayStart)}
                    </View>
                    <View className="bg-[#191919] border border-gray-800 rounded p-4">
                      <Text className="text-xs font-bold text-gray-500 uppercase text-center border-b border-gray-800 pb-2 mb-2">Cadangan</Text>
                      {renderRows(homeSubs, awaySubs)}
                    </View>
                  </View>
                );
              }
            })()}
          </ScrollView>
        </View>
      )}

      {/* ==================== VIEW STANDINGS ==================== */}
      {activeView === 'standings' && (
        <View className="flex-1 z-10">
          <View className="pt-12 pb-4 bg-[#191919]/95 border-b border-gray-800 items-center">
            <Text className="text-xl font-black text-white tracking-tight">KLASEMEN</Text>
          </View>
          <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
            {standingsLoading ? (
              <View className="space-y-4">
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-64 w-full" />
              </View>
            ) : standingsData.length > 0 ? (
              <>
                {standingsData.map((group, gIdx) => (
                  <View key={gIdx} className="mb-8 bg-[#191919] rounded shadow-sm border border-gray-800 overflow-hidden">
                    <View className="bg-gradient-to-r bg-merah px-4 py-2">
                      <Text className="text-sm font-black text-white tracking-wide">{group.groupName}</Text>
                    </View>
                    <View>
                      {/* Table Header */}
                      <View className="flex-row bg-gray-800 border-b border-gray-700 py-2">
                        <Text className="w-10 text-center text-[10px] font-bold text-gray-400">Pos</Text>
                        <Text className="flex-1 text-left text-[10px] font-bold text-gray-400">Tim</Text>
                        <Text className="w-7 text-center text-[10px] font-bold text-gray-400">P</Text>
                        <Text className="w-7 text-center text-[10px] font-bold text-gray-400">M</Text>
                        <Text className="w-7 text-center text-[10px] font-bold text-gray-400">S</Text>
                        <Text className="w-7 text-center text-[10px] font-bold text-gray-400">K</Text>
                        <Text className="w-8 text-center text-[10px] font-bold text-gray-400">GM</Text>
                        <Text className="w-8 text-center text-[10px] font-bold text-gray-400">GK</Text>
                        <Text className="w-10 text-center text-[10px] font-black text-merah">Poin</Text>
                      </View>
                      {/* Table Rows */}
                      {group.standings.map((standing, sIdx) => {
                        let played = 0, wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
                        if (standing.details && Array.isArray(standing.details)) {
                          standing.details.forEach(det => {
                            switch (det.type_id) {
                              case 129: played = det.value; break; case 130: wins = det.value; break; case 131: draws = det.value; break;
                              case 132: losses = det.value; break; case 133: goalsFor = det.value; break; case 134: goalsAgainst = det.value; break;
                            }
                          });
                        }
                        return (
                          <View key={sIdx} className="flex-row border-b border-gray-800 py-2.5 items-center">
                            <Text className="w-10 text-center font-bold text-gray-300 text-xs">{standing.position}</Text>
                            <TouchableOpacity className="flex-1 flex-row items-center gap-2" onPress={() => openTeamSquad(standing.participant_id)}>
                              <Image source={{ uri: standing.participant?.image_path || 'https://placehold.co/20' }} className="w-4 h-4" resizeMode="contain" />
                              <Text className="font-semibold text-gray-200 text-[11px]" numberOfLines={1}>{standing.participant?.name || "Tim"}</Text>
                            </TouchableOpacity>
                            <Text className="w-7 text-center font-medium text-gray-300 text-[11px]">{played}</Text>
                            <Text className="w-7 text-center text-gray-300 text-[11px]">{wins}</Text>
                            <Text className="w-7 text-center text-gray-300 text-[11px]">{draws}</Text>
                            <Text className="w-7 text-center text-gray-300 text-[11px]">{losses}</Text>
                            <Text className="w-8 text-center text-gray-300 text-[11px]">{goalsFor}</Text>
                            <Text className="w-8 text-center text-gray-300 text-[11px]">{goalsAgainst}</Text>
                            <Text className="w-10 text-center font-black text-merah text-[11px]">{standing.points || 0}</Text>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                ))}
                <Text className="text-center text-[10px] text-gray-500 py-2">{leagueNameStandings} • Update terbaru</Text>
              </>
            ) : (
              <View className="items-center py-16">
                <Text className="text-5xl mb-3 opacity-30">📋</Text>
                <Text className="font-medium text-gray-500">Klasemen belum tersedia.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* ==================== VIEW TEAM (SQUAD) ==================== */}
      {activeView === 'team' && (
        <View className="flex-1 z-10 bg-black">
          <View className="pt-10 pb-4 bg-merah rounded-b-2xl shadow-lg">
            <View className="px-4 flex-row items-center">
              <TouchableOpacity onPress={goBackFromTeam} className="p-2 bg-black/20 rounded-full">
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </Svg>
              </TouchableOpacity>
              <View className="flex-1 flex-row items-center justify-center gap-3 pr-8">
                {currentTeamInfo.logo ? <Image source={{ uri: currentTeamInfo.logo }} className="w-10 h-10 bg-black rounded-full" resizeMode="contain" /> : null}
                <Text className="text-base font-bold text-white">{currentTeamInfo.name}</Text>
              </View>
            </View>
          </View>
          
          <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
            {squadLoading ? (
              <View className="space-y-4">
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-48 w-full" />
              </View>
            ) : squadData.length > 0 ? (
              squadData.map((posGroup, idx) => (
                <View key={idx} className="bg-[#191919] rounded-xl shadow-sm border border-gray-800 overflow-hidden mb-4">
                  <View className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                    <Text className="text-xs font-black text-merah uppercase tracking-wider">{posGroup.position}</Text>
                  </View>
                  <View>
                    {posGroup.players.map((item, pIdx) => {
                      const player = item.player;
                      let age = "-";
                      if(player.date_of_birth){
                        const birthDate = new Date(player.date_of_birth);
                        const today = new Date();
                        let ageNum = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if(monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) ageNum--;
                        age = ageNum;
                      }
                      return (
                        <View key={pIdx} className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
                          <View className="flex-row items-center gap-3">
                            <Image source={{ uri: player.image_path || 'https://placehold.co/40' }} className="w-10 h-10 rounded-full bg-gray-700" resizeMode="cover" />
                            <View>
                              <Text className="text-sm font-semibold text-gray-200">{player.name}</Text>
                              <View className="flex-row items-center gap-x-3 mt-1">
                                <Text className="text-[10px] text-gray-500"><Text className="font-bold text-gray-400">No.</Text> {item.jersey_number || "-"}</Text>
                                <Text className="text-[10px] text-gray-500"><Text className="font-bold text-gray-400">Umur</Text> {age}</Text>
                                {player.nationality?.name && <Text className="text-[10px] text-gray-500 ml-1">{player.nationality.name}</Text>}
                              </View>
                            </View>
                          </View>
                          <Text className="text-[10px] text-gray-500 italic">{posGroup.position}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-12">
                <Text className="text-5xl mb-3 opacity-30">👕</Text>
                <Text className="font-medium text-gray-500">Belum ada data pemain untuk tim ini.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* ==================== BOTTOM NAV ==================== */}
      {(activeView === 'matches' || activeView === 'standings') && (
        <View className="absolute bottom-0 left-0 right-0 z-50 bg-[#191919]/95 border-t border-gray-800 pb-6 pt-1">
          <View className="flex-row justify-center max-w-2xl mx-auto">
            <TouchableOpacity onPress={() => switchMainView('matches')} className="flex-1 py-2 items-center">
              <Svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <Path fillRule="evenodd" clipRule="evenodd" d="M24.5 11.842V20.9613C24.5 23.56 22.4107 25.6666 19.8333 25.6666H8.16667C5.58934 25.6666 3.5 23.56 3.5 20.9613V11.842C3.5 10.4292 4.12959 9.09123 5.21484 8.19759L11.0482 3.39422C12.766 1.97968 15.234 1.97968 16.9518 3.39422L22.7852 8.19759C23.8704 9.09123 24.5 10.4292 24.5 11.842ZM11.6667 20.125C11.1834 20.125 10.7917 20.5167 10.7917 21C10.7917 21.4832 11.1834 21.875 11.6667 21.875H16.3333C16.8166 21.875 17.2083 21.4832 17.2083 21C17.2083 20.5167 16.8166 20.125 16.3333 20.125H11.6667Z" fill={activeView === 'matches' ? "#FC0B12" : "#6B7280"} />
              </Svg>
              <Text className={`text-[11px] font-bold mt-1 ${activeView === 'matches' ? 'text-merah' : 'text-gray-500'}`}>Jadwal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => switchMainView('standings')} className="flex-1 py-2 items-center">
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M4 20H20M6 17L6 13M12 17L12 9M18 17L18 5" stroke={activeView === 'standings' ? "#FC0B12" : "#6B7280"} strokeWidth="2" strokeLinecap="round" />
                <Rect x="4" y="3" width="4" height="4" rx="1" fill={activeView === 'standings' ? "#FC0B12" : "#6B7280"} />
                <Rect x="10" y="3" width="4" height="4" rx="1" fill={activeView === 'standings' ? "#FC0B12" : "#6B7280"} />
                <Rect x="16" y="3" width="4" height="4" rx="1" fill={activeView === 'standings' ? "#FC0B12" : "#6B7280"} />
              </Svg>
              <Text className={`text-[11px] font-bold mt-1 ${activeView === 'standings' ? 'text-merah' : 'text-gray-500'}`}>Klasemen</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}
