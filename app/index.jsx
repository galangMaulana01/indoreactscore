import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Linking,
  Animated,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Video } from "expo-av";

// ==================== KONFIGURASI ====================
const API_BASE_URL = "https://sportmonks-tawny.vercel.app";
const TARGET_LEAGUE_IDS = [501];

// ==================== COLORS ====================
const C = {
  merah: "#FC0B12",
  kuning: "#F7CC0C",
  latar: "#121212",
  kartu: "#191919",
  bg: "#000000",
  gray200: "#e5e5e5",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray700: "#374151",
  gray800: "#1f2937",
  white: "#ffffff",
};

// ==================== SKELETON COMPONENT ====================
function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 750, useNativeDriver: false }),
      ])
    ).start();
  }, []);
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: ["#2a2a2a", "#3a3a3a"] });
  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: bg }, style]} />
  );
}

// ==================== SKELETON MATCHES ====================
function MatchesSkeleton() {
  return (
    <View style={{ gap: 20 }}>
      {[...Array(5)].map((_, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
            <SkeletonBox width={20} height={20} borderRadius={10} />
            <SkeletonBox width={128} height={14} />
          </View>
          <View style={{ gap: 8 }}>
            {[0, 1].map((j) => (
              <View key={j} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, backgroundColor: C.kartu, borderRadius: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, width: "35%" }}>
                  <SkeletonBox width={32} height={32} borderRadius={16} />
                  <SkeletonBox width={80} height={12} />
                </View>
                <View style={{ alignItems: "center", width: "30%", gap: 6 }}>
                  <SkeletonBox width={48} height={24} />
                  <SkeletonBox width={56} height={12} />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12, width: "35%" }}>
                  <SkeletonBox width={80} height={12} />
                  <SkeletonBox width={32} height={32} borderRadius={16} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ==================== SKELETON SCOREBOARD ====================
function ScoreboardSkeleton() {
  return (
    <View style={{ paddingVertical: 32, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 }}>
      <View style={{ alignItems: "center", width: "35%", gap: 8 }}>
        <SkeletonBox width={48} height={48} borderRadius={24} />
        <SkeletonBox width={96} height={14} />
      </View>
      <View style={{ alignItems: "center", width: "30%", gap: 8 }}>
        <SkeletonBox width={64} height={32} />
        <SkeletonBox width={80} height={24} borderRadius={12} />
      </View>
      <View style={{ alignItems: "center", width: "35%", gap: 8 }}>
        <SkeletonBox width={48} height={48} borderRadius={24} />
        <SkeletonBox width={96} height={14} />
      </View>
    </View>
  );
}

// ==================== GLOBAL LOADING ====================
function GlobalLoading({ visible }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(progress, { toValue: 1, duration: 2000, useNativeDriver: false })
      ).start();
    }
  }, [visible]);
  if (!visible) return null;
  const width = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["0%", "70%", "100%"] });
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000", zIndex: 9999, alignItems: "center", justifyContent: "center" }}>
      <View style={{ alignItems: "center", width: 200, paddingHorizontal: 8 }}>
        <Image source={require("../assets/images/icon.png")} style={{ width: 176, height: 60, objectFit: "contain", marginBottom: 20 }} resizeMode="contain" />
        <View style={{ width: "100%", height: 6, backgroundColor: "#333", borderRadius: 99, overflow: "hidden", borderWidth: 1, borderColor: "rgba(156,163,175,0.3)" }}>
          <Animated.View style={{ height: "100%", backgroundColor: C.merah, borderRadius: 99, width }} />
        </View>
      </View>
    </View>
  );
}

// ==================== VIDEO SPLASH ====================
function VideoSplash({ onFinish }) {
  const videoRef = useRef(null);
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
      <Video
        ref={videoRef}
        source={require("./assets/splash.mp4")}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
        shouldPlay
        isMuted
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) onFinish();
        }}
        onError={onFinish}
      />
    </View>
  );
}

// ==================== BANNER ====================
function Banner({ data }) {
  if (!data) return null;
  return (
    <View style={{ position: "relative", overflow: "hidden", borderRadius: 16, backgroundColor: C.latar, height: 128, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginHorizontal: 16, marginVertical: 8 }}>
      <Image source={{ uri: data.image_benner }} style={{ position: "absolute", left: 0, bottom: 0, height: 144, width: 112 }} resizeMode="contain" />
      <View style={{ marginLeft: 112, flex: 1 }}>
        <Image source={{ uri: data.image_logo }} style={{ width: 96, height: 36 }} resizeMode="contain" />
        <Text style={{ color: C.gray400, fontSize: 12, marginTop: 8, maxWidth: 180, lineHeight: 18 }}>{data.desc}</Text>
      </View>
      <TouchableOpacity onPress={() => Linking.openURL(data.link)} style={{ backgroundColor: C.kartu, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16 }}>
        <Text style={{ color: C.white, fontWeight: "700", fontSize: 18 }}>Join</Text>
      </TouchableOpacity>
    </View>
  );
}

// ==================== VIEW MATCHES ====================
function ViewMatches({ onOpenDetail }) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [empty, setEmpty] = useState(false);
  const [banner, setBanner] = useState(null);

  const fetchAndRender = useCallback(async () => {
    setLoading(true);
    setEmpty(false);
    setMatches([]);
    let totalRendered = 0;
    const allGroups = [];
    try {
      for (const leagueId of TARGET_LEAGUE_IDS) {
        const leagueRes = await fetch(`${API_BASE_URL}/leagues/${leagueId}`);
        const leagueJson = await leagueRes.json();
        const league = leagueJson?.data;
        if (!league) continue;
        let seasonId = league.currentseason?.id;
        if (!seasonId) continue;

        const standingsRes = await fetch(`${API_BASE_URL}/standings/seasons/${seasonId}`);
        const standingsJson = await standingsRes.json();
        const standings = standingsJson?.data || [];
        if (standings.length === 0) continue;

        const roundId = standings[0].round_id;
        const roundRes = await fetch(`${API_BASE_URL}/rounds/${roundId}`);
        const roundJson = await roundRes.json();
        const fixtureSummaries = roundJson?.data?.fixtures || [];
        if (fixtureSummaries.length === 0) continue;

        const fixtureList = [];
        for (const summary of fixtureSummaries) {
          const fixtureRes = await fetch(`${API_BASE_URL}/fixtures/${summary.id}?include=participants,scores`);
          const fixtureJson = await fixtureRes.json();
          const fixtureData = fixtureJson.data;
          if (!fixtureData) continue;

          const participants = fixtureData.participants || [];
          const homeTeam = participants.find((p) => p.meta?.location === "home") || {};
          const awayTeam = participants.find((p) => p.meta?.location === "away") || {};
          const homeScore = fixtureData.scores?.find((s) => s.description === "CURRENT" && s.score?.participant === "home")?.score.goals ?? "0";
          const awayScore = fixtureData.scores?.find((s) => s.description === "CURRENT" && s.score?.participant === "away")?.score.goals ?? "0";
          const statusRaw = fixtureData.state?.short_name || "NS";
          const statusLabel = statusRaw === "FT" ? "FT" : statusRaw === "NS" ? "Belum mulai" : statusRaw;

          fixtureList.push({ id: fixtureData.id, homeTeam, awayTeam, homeScore, awayScore, statusLabel });
          totalRendered++;
        }
        if (fixtureList.length > 0) {
          allGroups.push({ league, fixtures: fixtureList });
        }
      }
      setLoading(false);
      if (totalRendered > 0) setMatches(allGroups);
      else setEmpty(true);
    } catch (e) {
      console.error(e);
      setLoading(false);
      setEmpty(true);
    }
  }, []);

  useEffect(() => {
    fetchAndRender();
    fetch(`${API_BASE_URL}/benner`)
      .then((r) => r.json())
      .then((d) => setBanner(d))
      .catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ backgroundColor: "transparent", paddingTop: 8 }}>
        <View style={{ maxWidth: 640, alignSelf: "center", width: "100%" }}>
          <Image source={require("../assets/images/icon.png")} style={{ width: 192, height: 48, marginLeft: 12 }} resizeMode="contain" />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
        <Banner data={banner} />
        <View style={{ maxWidth: 640, alignSelf: "center", width: "100%", paddingHorizontal: 16, paddingTop: 8 }}>
          {loading ? (
            <MatchesSkeleton />
          ) : empty ? (
            <View style={{ alignItems: "center", paddingVertical: 64 }}>
              <Text style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>⚽</Text>
              <Text style={{ color: C.gray500, fontWeight: "500" }}>Tidak ada jadwal yang tersedia untuk liga ini.</Text>
            </View>
          ) : (
            matches.map((group, gi) => (
              <View key={gi} style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
                  <Image source={{ uri: group.league.image_path }} style={{ width: 40, height: 40 }} resizeMode="contain" />
                  <Text style={{ color: C.white, fontWeight: "700", fontSize: 16, letterSpacing: 0.5 }}>{group.league.name}</Text>
                </View>
                <View style={{ gap: 8 }}>
                  {group.fixtures.map((fix) => (
                    <TouchableOpacity key={fix.id} onPress={() => onOpenDetail(fix.id)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 12, backgroundColor: C.kartu, borderRadius: 12 }} activeOpacity={0.7}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, width: "35%" }}>
                        <Image source={{ uri: fix.homeTeam.image_path || "https://placehold.co/40" }} style={{ width: 32, height: 32 }} resizeMode="contain" />
                        <Text style={{ color: C.gray200, fontWeight: "600", fontSize: 13, flexShrink: 1 }} numberOfLines={2}>{fix.homeTeam.name || "TBA"}</Text>
                      </View>
                      <View style={{ alignItems: "center", width: "30%" }}>
                        <Text style={{ color: C.white, fontWeight: "900", fontSize: 20 }}>{fix.homeScore} - {fix.awayScore}</Text>
                        <View style={{ backgroundColor: C.gray800, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
                          <Text style={{ color: C.merah, fontWeight: "700", fontSize: 10 }}>{fix.statusLabel}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12, width: "35%" }}>
                        <Text style={{ color: C.gray200, fontWeight: "600", fontSize: 13, flexShrink: 1, textAlign: "right" }} numberOfLines={2}>{fix.awayTeam.name || "TBA"}</Text>
                        <Image source={{ uri: fix.awayTeam.image_path || "https://placehold.co/40" }} style={{ width: 32, height: 32 }} resizeMode="contain" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ==================== VIEW DETAIL ====================
function ViewDetail({ matchId, onGoBack }) {
  const [loading, setLoading] = useState(true);
  const [fixture, setFixture] = useState(null);
  const [homeId, setHomeId] = useState(null);
  const [awayId, setAwayId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    setFixture(null);
    setActiveTab("overview");
    fetch(`${API_BASE_URL}/fixtures/${matchId}?include=participants,scores,events,statistics,lineups,venue,formations`)
      .then((r) => r.json())
      .then((json) => {
        const fd = json.data;
        if (!fd) throw new Error("no data");
        const participants = fd.participants || [];
        const home = participants.find((p) => p.meta?.location === "home") || {};
        const away = participants.find((p) => p.meta?.location === "away") || {};
        setHomeId(home.id);
        setAwayId(away.id);
        setFixture({ ...fd, homeTeam: home, awayTeam: away });
        setLoading(false);
      })
      .catch((e) => { console.error(e); setLoading(false); });
  }, [matchId]);

  const homeScore = fixture?.scores?.find((s) => s.description === "CURRENT" && s.score?.participant === "home")?.score.goals ?? "0";
  const awayScore = fixture?.scores?.find((s) => s.description === "CURRENT" && s.score?.participant === "away")?.score.goals ?? "0";
  const statusRaw = fixture?.state?.short_name || "NS";
  const statusLabel = statusRaw === "FT" ? "FT" : statusRaw === "NS" ? "Belum mulai" : statusRaw;

  return (
    <View style={{ flex: 1 }}>
      {/* Header gradient */}
      <View style={{ backgroundColor: "rgba(252,11,18,0.1)", paddingBottom: 32, position: "relative", zIndex: 10 }}>
        <View style={{ maxWidth: 640, alignSelf: "center", width: "100%", paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <TouchableOpacity onPress={onGoBack} style={{ padding: 8, marginLeft: -8, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 99 }} activeOpacity={0.7}>
              <Text style={{ color: C.white, fontSize: 18, fontWeight: "700" }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>Match Detail</Text>
            <View style={{ width: 36 }} />
          </View>

          {loading ? (
            <ScoreboardSkeleton />
          ) : fixture ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 }}>
              <View style={{ alignItems: "center", width: "35%" }}>
                <Image source={{ uri: fixture.homeTeam?.image_path || "https://placehold.co/60" }} style={{ width: 48, height: 48 }} resizeMode="contain" />
                <Text style={{ color: C.white, fontWeight: "700", fontSize: 13, textAlign: "center", marginTop: 4 }} numberOfLines={2}>{fixture.homeTeam?.name || "-"}</Text>
              </View>
              <View style={{ alignItems: "center", width: "30%" }}>
                <Text style={{ color: C.white, fontWeight: "900", fontSize: 36, letterSpacing: 2 }}>{homeScore} - {awayScore}</Text>
                <View style={{ backgroundColor: C.white, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 }}>
                  <Text style={{ color: C.merah, fontWeight: "700", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>{statusLabel}</Text>
                </View>
              </View>
              <View style={{ alignItems: "center", width: "35%" }}>
                <Image source={{ uri: fixture.awayTeam?.image_path || "https://placehold.co/60" }} style={{ width: 48, height: 48 }} resizeMode="contain" />
                <Text style={{ color: C.white, fontWeight: "700", fontSize: 13, textAlign: "center", marginTop: 4 }} numberOfLines={2}>{fixture.awayTeam?.name || "-"}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {/* Tab Nav */}
      <View style={{ backgroundColor: "rgba(25,25,25,0.95)", borderBottomWidth: 1, borderColor: C.gray800 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: "row" }}>
          {["overview", "events", "stats", "lineup"].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 99, backgroundColor: activeTab === tab ? C.merah : C.gray800 }} activeOpacity={0.8}>
              <Text style={{ color: activeTab === tab ? C.white : C.gray300, fontWeight: "700", fontSize: 12 }}>
                {tab === "overview" ? "Overview" : tab === "events" ? "Events" : tab === "stats" ? "Stats" : "Line-up"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        {!loading && fixture && (
          <>
            {activeTab === "overview" && <TabOverview fixture={fixture} homeId={homeId} awayId={awayId} />}
            {activeTab === "events" && <TabEvents fixture={fixture} homeId={homeId} awayId={awayId} />}
            {activeTab === "stats" && <TabStats fixture={fixture} homeId={homeId} awayId={awayId} />}
            {activeTab === "lineup" && <TabLineup fixture={fixture} homeId={homeId} awayId={awayId} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ==================== TAB OVERVIEW ====================
function TabOverview({ fixture, homeId, awayId }) {
  const events = fixture.events || [];
  const goalEvents = events.filter((e) => [14, 16, 17].includes(e.type_id));
  const homeScorers = goalEvents.filter((e) => e.participant_id === homeId);
  const awayScorers = goalEvents.filter((e) => e.participant_id === awayId);

  const stats = fixture.statistics || [];
  const getStat = (typeId) => {
    const h = stats.find((s) => s.type_id === typeId && s.participant_id === homeId)?.data?.value ?? 0;
    const a = stats.find((s) => s.type_id === typeId && s.participant_id === awayId)?.data?.value ?? 0;
    return { home: h, away: a };
  };
  const corners = getStat(34);
  const venue = fixture.venue || {};
  const formations = fixture.formations || [];
  const homeForm = formations.find((f) => f.participant_id === homeId)?.formation || "-";
  const awayForm = formations.find((f) => f.participant_id === awayId)?.formation || "-";

  const ScorerItem = ({ e }) => {
    const isPenalty = e.type_id === 16 ? " (P)" : "";
    const isOwn = e.type_id === 17 ? " (OG)" : "";
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
        <Text style={{ fontSize: 10 }}>⚽</Text>
        <Text style={{ color: C.gray400, fontSize: 11, fontWeight: "500" }}>{e.minute}' - {e.player_name}{isPenalty}{isOwn}</Text>
      </View>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      {(homeScorers.length > 0 || awayScorers.length > 0) && (
        <View style={{ backgroundColor: C.kartu, borderWidth: 1, borderColor: C.gray800, borderRadius: 8, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
            <View style={{ flex: 1, borderRightWidth: 1, borderColor: C.gray800, paddingRight: 8 }}>
              {homeScorers.length > 0 ? homeScorers.map((e, i) => <ScorerItem key={i} e={e} />) : <Text style={{ color: C.gray500, fontSize: 12, fontStyle: "italic" }}>-</Text>}
            </View>
            <View style={{ flex: 1, paddingLeft: 8, alignItems: "flex-end" }}>
              {awayScorers.length > 0 ? awayScorers.map((e, i) => <ScorerItem key={i} e={e} />) : <Text style={{ color: C.gray500, fontSize: 12, fontStyle: "italic" }}>-</Text>}
            </View>
          </View>
        </View>
      )}

      <View style={{ backgroundColor: C.kartu, borderWidth: 1, borderColor: C.gray800, borderRadius: 8, padding: 20, gap: 16 }}>
        <Text style={{ color: C.merah, fontWeight: "900", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, borderBottomWidth: 1, borderColor: C.gray800, paddingBottom: 8 }}>Info Pertandingan</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {[
            { label: "Stadion", val: venue.name || "-" },
            { label: "Kota", val: venue.city_name || "-" },
            { label: "Kapasitas", val: venue.capacity ? Number(venue.capacity).toLocaleString("id-ID") : "-" },
            { label: "Lapangan", val: venue.surface || "-" },
          ].map((item, i) => (
            <View key={i} style={{ width: "45%" }}>
              <Text style={{ color: C.gray500, fontWeight: "500", fontSize: 11, marginBottom: 2 }}>{item.label}</Text>
              <Text style={{ color: C.gray200, fontWeight: "700", fontSize: 12 }} numberOfLines={1}>{item.val}</Text>
            </View>
          ))}
          <View style={{ width: "100%", borderTopWidth: 1, borderColor: C.gray800, paddingTop: 12, flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: C.gray500, fontWeight: "500", fontSize: 11, marginBottom: 2 }}>Formasi Home</Text>
              <Text style={{ color: C.merah, fontWeight: "900", fontSize: 14 }}>{homeForm}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: C.gray500, fontWeight: "500", fontSize: 11, marginBottom: 2 }}>Formasi Away</Text>
              <Text style={{ color: C.gray400, fontWeight: "900", fontSize: 14 }}>{awayForm}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ==================== TAB EVENTS ====================
function TabEvents({ fixture, homeId, awayId }) {
  const events = (fixture.events || []).filter((e) => e.type_id !== 10).sort((a, b) => a.minute - b.minute);
  if (!events.length) {
    return (
      <View style={{ backgroundColor: C.kartu, borderWidth: 1, borderColor: C.gray800, borderRadius: 8, padding: 32, alignItems: "center" }}>
        <Text style={{ color: C.gray500, fontWeight: "500", fontSize: 14 }}>Belum ada kejadian tercatat.</Text>
      </View>
    );
  }

  const getIcon = (typeId) => {
    if (typeId === 14 || typeId === 16) return "⚽";
    if (typeId === 17) return "❌";
    if (typeId === 18) return "🔄";
    if (typeId === 19) return "🟨";
    if (typeId === 20) return "🟥";
    return "⏱️";
  };
  const getDetail = (e) => {
    if (e.type_id === 14) return `Gol! ${e.info || ""}`;
    if (e.type_id === 16) return "Gol Penalti";
    if (e.type_id === 17) return "Gol Bunuh Diri";
    if (e.type_id === 18) return `Keluar: ${e.related_player_name || "-"}`;
    if (e.type_id === 19) return "Kartu Kuning";
    if (e.type_id === 20) return "Kartu Merah";
    return e.info || "";
  };

  return (
    <View style={{ paddingLeft: 16 }}>
      <View style={{ borderLeftWidth: 2, borderColor: C.gray800, gap: 20, paddingVertical: 8 }}>
        {events.map((e, i) => {
          const isHome = e.participant_id === homeId;
          return (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: isHome ? "flex-start" : "flex-end", position: "relative" }}>
              <View style={{ position: "absolute", left: -25, width: 16, height: 16, borderRadius: 8, backgroundColor: C.kartu, borderWidth: 4, borderColor: C.merah, zIndex: 10 }} />
              <View style={{ backgroundColor: C.kartu, borderWidth: 1, borderColor: C.gray800, borderRadius: 8, padding: 12, width: "85%", marginLeft: isHome ? 20 : 0, marginRight: isHome ? 0 : 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, justifyContent: isHome ? "flex-start" : "flex-end" }}>
                  <View style={{ backgroundColor: C.gray800, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: C.merah, fontWeight: "900", fontSize: 11 }}>{e.minute}'</Text>
                  </View>
                  <Text style={{ fontSize: 14 }}>{getIcon(e.type_id)}</Text>
                  <Text style={{ color: C.gray300, fontWeight: "700", fontSize: 12 }} numberOfLines={1}>{e.player_name || "Pemain"}</Text>
                </View>
                <Text style={{ color: C.gray500, fontWeight: "500", fontSize: 11, textAlign: isHome ? "left" : "right" }} numberOfLines={1}>{getDetail(e)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ==================== TAB STATS ====================
function TabStats({ fixture, homeId, awayId }) {
  const stats = fixture.statistics || [];
  if (!stats.length) {
    return (
      <View style={{ backgroundColor: C.kartu, borderWidth: 1, borderColor: C.gray800, borderRadius: 8, padding: 32, alignItems: "center" }}>
        <Text style={{ color: C.gray500, fontWeight: "500", fontSize: 14 }}>Statistik belum tersedia.</Text>
      </View>
    );
  }

  const unique = [];
  stats.forEach((s) => { if (!unique.some((t) => t.id === s.type_id)) unique.push(s.type); });

  return (
    <View style={{ backgroundColor: C.kartu, borderWidth: 1, borderColor: C.gray800, borderRadius: 8, padding: 20, gap: 16 }}>
      {unique.map((type, i) => {
        const homeVal = stats.find((s) => s.type_id === type.id && s.participant_id === homeId)?.data?.value ?? 0;
        const awayVal = stats.find((s) => s.type_id === type.id && s.participant_id === awayId)?.data?.value ?? 0;
        const total = parseFloat(homeVal) + parseFloat(awayVal);
        let homePct = 50, awayPct = 50;
        if (total > 0) {
          if (type.name?.includes("%") || type.code?.includes("percentage")) {
            homePct = parseFloat(homeVal);
            awayPct = parseFloat(awayVal);
          } else {
            homePct = (parseFloat(homeVal) / total) * 100;
            awayPct = (parseFloat(awayVal) / total) * 100;
          }
        }
        return (
          <View key={i} style={{ gap: 6, paddingVertical: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ width: 40, backgroundColor: C.gray800, borderRadius: 4, paddingVertical: 2, alignItems: "center" }}>
                <Text style={{ color: C.gray300, fontWeight: "700", fontSize: 12 }}>{homeVal}</Text>
              </View>
              <Text style={{ color: C.gray500, fontWeight: "600", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, flex: 1, textAlign: "center" }} numberOfLines={1}>{type.name}</Text>
              <View style={{ width: 40, backgroundColor: C.gray800, borderRadius: 4, paddingVertical: 2, alignItems: "center" }}>
                <Text style={{ color: C.gray300, fontWeight: "700", fontSize: 12 }}>{awayVal}</Text>
              </View>
            </View>
            <View style={{ height: 6, backgroundColor: C.gray800, borderRadius: 99, overflow: "hidden", flexDirection: "row" }}>
              <View style={{ height: "100%", backgroundColor: C.merah, width: `${homePct}%` }} />
              <View style={{ height: "100%", backgroundColor: C.gray500, width: `${awayPct}%` }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ==================== TAB LINEUP ====================
function TabLineup({ fixture, homeId, awayId }) {
  const lineups = fixture.lineups || [];
  if (!lineups.length) {
    return (
      <View style={{ backgroundColor: C.kartu, borderWidth: 1, borderColor: C.gray800, borderRadius: 8, padding: 32, alignItems: "center" }}>
        <Text style={{ color: C.gray500, fontWeight: "500", fontSize: 14 }}>Susunan pemain belum dirilis.</Text>
      </View>
    );
  }

  const homeStart = lineups.filter((l) => l.team_id === homeId && l.type_id === 11);
  const awayStart = lineups.filter((l) => l.team_id === awayId && l.type_id === 11);
  const homeSubs = lineups.filter((l) => l.team_id === homeId && l.type_id === 12);
  const awaySubs = lineups.filter((l) => l.team_id === awayId && l.type_id === 12);

  const LineupRows = ({ homeArr, awayArr, title, isStarter }) => {
    const maxLen = Math.max(homeArr.length, awayArr.length);
    return (
      <View style={{ backgroundColor: C.kartu, borderWidth: 1, borderColor: C.gray800, borderRadius: 8, padding: 16, marginBottom: 12 }}>
        <Text style={{ color: isStarter ? C.merah : C.gray500, fontWeight: "900", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, borderBottomWidth: 1, borderColor: C.gray800, paddingBottom: 12, textAlign: "center", marginBottom: 4 }}>{title}</Text>
        {[...Array(maxLen)].map((_, i) => {
          const h = homeArr[i];
          const a = awayArr[i];
          return (
            <View key={i} style={{ flexDirection: "row", gap: 16, paddingVertical: 10, borderBottomWidth: i < maxLen - 1 ? 1 : 0, borderColor: C.gray800 }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 }}>
                {h && (
                  <>
                    <View style={{ width: 20, height: 20, backgroundColor: "rgba(252,11,18,0.2)", borderRadius: 4, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: C.merah, fontWeight: "700", fontSize: 10 }}>{h.jersey_number || "-"}</Text>
                    </View>
                    <Text style={{ color: C.gray300, fontWeight: "600", fontSize: 12, flexShrink: 1 }} numberOfLines={1}>{h.player_name}</Text>
                  </>
                )}
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingHorizontal: 8 }}>
                {a && (
                  <>
                    <Text style={{ color: C.gray300, fontWeight: "600", fontSize: 12, flexShrink: 1, textAlign: "right" }} numberOfLines={1}>{a.player_name}</Text>
                    <View style={{ width: 20, height: 20, backgroundColor: C.gray800, borderRadius: 4, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: C.gray400, fontWeight: "700", fontSize: 10 }}>{a.jersey_number || "-"}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View>
      <LineupRows homeArr={homeStart} awayArr={awayStart} title="Starting Eleven" isStarter={true} />
      <LineupRows homeArr={homeSubs} awayArr={awaySubs} title="Cadangan" isStarter={false} />
    </View>
  );
}

// ==================== VIEW STANDINGS ====================
function ViewStandings({ activeSeasonId, onOpenTeam }) {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [empty, setEmpty] = useState(false);
  const [leagueName, setLeagueName] = useState("Klasemen Liga");

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      setEmpty(false);
      setGroups([]);
      try {
        let seasonId = activeSeasonId;
        if (!seasonId) {
          const leagueRes = await fetch(`${API_BASE_URL}/leagues/${TARGET_LEAGUE_IDS[0]}`);
          const leagueJson = await leagueRes.json();
          seasonId = leagueJson?.data?.currentseason?.id;
          if (!seasonId) throw new Error("No season ID");
        }
        const standingsRes = await fetch(`${API_BASE_URL}/standings/seasons/${seasonId}`);
        const standingsJson = await standingsRes.json();
        let allStandings = standingsJson?.data || [];
        if (!allStandings.length) throw new Error("kosong");

        let finalStandings = allStandings.filter((s) => s.group_id !== null);
        if (!finalStandings.length) {
          const maxStageId = Math.max(...allStandings.map((s) => s.stage_id));
          finalStandings = allStandings.filter((s) => s.stage_id === maxStageId);
        }

        const groupsMap = new Map();
        for (const standing of finalStandings) {
          const groupId = standing.group_id;
          if (!groupId) continue;
          if (!groupsMap.has(groupId)) groupsMap.set(groupId, { groupId, groupName: standing.group?.name || `Grup ${groupId}`, standings: [] });
          groupsMap.get(groupId).standings.push(standing);
        }
        if (!groupsMap.size) throw new Error("no groups");

        const leagueRes2 = await fetch(`${API_BASE_URL}/leagues/${TARGET_LEAGUE_IDS[0]}`);
        const leagueJson2 = await leagueRes2.json();
        setLeagueName(leagueJson2?.data?.name || "Klasemen Liga");

        const sorted = Array.from(groupsMap.values()).sort((a, b) => {
          if (a.groupName.includes("Championship")) return -1;
          if (b.groupName.includes("Championship")) return 1;
          return a.groupName.localeCompare(b.groupName);
        });
        sorted.forEach((g) => g.standings.sort((a, b) => a.position - b.position));
        setGroups(sorted);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
        setEmpty(true);
      }
    };
    fetch_();
  }, [activeSeasonId]);

  const getDetail = (standing, typeId) => {
    if (!Array.isArray(standing.details)) return 0;
    return standing.details.find((d) => d.type_id === typeId)?.value || 0;
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: "rgba(25,25,25,0.95)", borderBottomWidth: 1, borderColor: C.gray800, paddingVertical: 16, alignItems: "center" }}>
        <Text style={{ color: C.white, fontWeight: "900", fontSize: 18, letterSpacing: 1 }}>KLASEMEN</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        {loading ? (
          <View style={{ gap: 8 }}>
            <SkeletonBox width="100%" height={32} />
            <SkeletonBox width="100%" height={256} />
          </View>
        ) : empty ? (
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <Text style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>📋</Text>
            <Text style={{ color: C.gray500, fontWeight: "500" }}>Klasemen belum tersedia.</Text>
          </View>
        ) : (
          <>
            {groups.map((group, gi) => (
              <View key={gi} style={{ marginBottom: 32, backgroundColor: C.kartu, borderWidth: 1, borderColor: C.gray800, borderRadius: 8, overflow: "hidden" }}>
                <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", backgroundColor: "transparent" }}>
                  <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: C.merah, opacity: 1 }} />
                  <Text style={{ color: C.white, fontWeight: "900", fontSize: 13, letterSpacing: 0.5, zIndex: 1 }}>{group.groupName}</Text>
                </View>
                {/* Header row */}
                <View style={{ flexDirection: "row", backgroundColor: C.gray800, borderBottomWidth: 1, borderColor: C.gray700, paddingVertical: 10 }}>
                  {["Pos", "Tim", "P", "M", "S", "K", "GM", "GK", "Poin"].map((h, i) => (
                    <Text key={i} style={{ color: C.gray400, fontWeight: "700", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, flex: i === 1 ? 3 : 1, textAlign: i === 0 ? "left" : "center", paddingHorizontal: i === 0 ? 12 : 0 }}>{h}</Text>
                  ))}
                </View>
                {group.standings.map((standing, si) => {
                  const participant = standing.participant;
                  const played = getDetail(standing, 129);
                  const wins = getDetail(standing, 130);
                  const draws = getDetail(standing, 131);
                  const losses = getDetail(standing, 132);
                  const gf = getDetail(standing, 133);
                  const ga = getDetail(standing, 134);
                  return (
                    <View key={si} style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: si < group.standings.length - 1 ? 1 : 0, borderColor: C.gray800, paddingVertical: 10 }}>
                      <Text style={{ color: C.gray300, fontWeight: "700", fontSize: 12, flex: 1, paddingLeft: 12 }}>{standing.position}</Text>
                      <View style={{ flex: 3, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 }}>
                        <Image source={{ uri: participant?.image_path || "" }} style={{ width: 20, height: 20 }} resizeMode="contain" />
                        <TouchableOpacity onPress={() => onOpenTeam(standing.participant_id)}>
                          <Text style={{ color: C.gray200, fontWeight: "600", fontSize: 12 }} numberOfLines={1}>{participant?.name || "Tim"}</Text>
                        </TouchableOpacity>
                      </View>
                      {[played, wins, draws, losses, gf, ga].map((val, vi) => (
                        <Text key={vi} style={{ color: C.gray300, fontWeight: "500", fontSize: 12, flex: 1, textAlign: "center" }}>{val}</Text>
                      ))}
                      <Text style={{ color: C.merah, fontWeight: "900", fontSize: 12, flex: 1, textAlign: "center" }}>{standing.points || 0}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
            <Text style={{ color: C.gray500, fontSize: 10, textAlign: "center", paddingBottom: 8 }}>{leagueName} • Update terbaru</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ==================== VIEW TEAM SQUAD ====================
function ViewTeam({ teamId, activeSeasonId, onGoBack }) {
  const [loading, setLoading] = useState(true);
  const [teamHeader, setTeamHeader] = useState(null);
  const [positions, setPositions] = useState([]);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    if (!teamId || !activeSeasonId) return;
    const load = async () => {
      setLoading(true);
      setEmpty(false);
      setPositions([]);
      try {
        const res = await fetch(`${API_BASE_URL}/squads/seasons/${activeSeasonId}/teams/${teamId}`);
        const json = await res.json();
        const playersData = json?.data || [];
        if (!playersData.length) throw new Error("Tidak ada pemain");

        const teamInfo = playersData[0]?.team || {};
        setTeamHeader({ name: teamInfo.name || "Tim", logo: teamInfo.image_path || "" });

        const positionMap = new Map();
        playersData.forEach((item) => {
          const player = item.player;
          if (!player) return;
          const posName = player.position?.name || "Lainnya";
          if (!positionMap.has(posName)) positionMap.set(posName, []);
          positionMap.get(posName).push(item);
        });

        const posOrder = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];
        const sorted = Array.from(positionMap.keys()).sort((a, b) => {
          let ia = posOrder.indexOf(a), ib = posOrder.indexOf(b);
          if (ia === -1) ia = 999; if (ib === -1) ib = 999;
          return ia - ib;
        });

        setPositions(sorted.map((p) => ({ pos: p, players: positionMap.get(p) })));
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
        setEmpty(true);
      }
    };
    load();
  }, [teamId, activeSeasonId]);

  const getAge = (dob) => {
    if (!dob) return "-";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: C.merah, paddingBottom: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
        <View style={{ maxWidth: 640, alignSelf: "center", width: "100%", paddingHorizontal: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }}>
            <TouchableOpacity onPress={onGoBack} style={{ padding: 8, marginLeft: -8, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 99 }} activeOpacity={0.7}>
              <Text style={{ color: C.white, fontSize: 18, fontWeight: "700" }}>‹</Text>
            </TouchableOpacity>
            {teamHeader && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, flex: 1 }}>
                <Image source={{ uri: teamHeader.logo }} style={{ width: 40, height: 40, backgroundColor: "#000", borderRadius: 99, padding: 4 }} resizeMode="contain" />
                <Text style={{ color: C.white, fontWeight: "700", fontSize: 16 }}>{teamHeader.name}</Text>
              </View>
            )}
            <View style={{ width: 36 }} />
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        {loading ? (
          <View style={{ gap: 16 }}>
            <SkeletonBox width="100%" height={48} />
            <SkeletonBox width="100%" height={192} />
          </View>
        ) : empty ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <Text style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>👕</Text>
            <Text style={{ color: C.gray500, fontWeight: "500" }}>Belum ada data pemain untuk tim ini.</Text>
          </View>
        ) : (
          positions.map(({ pos, players }, pi) => (
            <View key={pi} style={{ backgroundColor: C.kartu, borderRadius: 16, borderWidth: 1, borderColor: C.gray800, overflow: "hidden" }}>
              <View style={{ backgroundColor: C.gray800, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: C.gray700 }}>
                <Text style={{ color: C.merah, fontWeight: "900", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{pos}</Text>
              </View>
              <View>
                {players.map((item, ii) => {
                  const player = item.player;
                  const jersey = item.jersey_number || "-";
                  const playerName = player.name || "Tidak diketahui";
                  const photo = player.image_path || "https://placehold.co/40";
                  const age = getAge(player.date_of_birth);
                  const nationality = player.nationality?.name || "";
                  const flagUrl = player.nationality?.image_path || "";
                  return (
                    <View key={ii} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: ii < players.length - 1 ? 1 : 0, borderColor: C.gray800 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.gray700, overflow: "hidden" }}>
                          <Image source={{ uri: photo }} style={{ width: 40, height: 40 }} resizeMode="cover" />
                        </View>
                        <View>
                          <Text style={{ color: C.gray200, fontWeight: "600", fontSize: 13 }}>{playerName}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 }}>
                            <Text style={{ color: C.gray500, fontSize: 10 }}><Text style={{ color: C.gray400, fontWeight: "700" }}>No.</Text> {jersey}</Text>
                            <Text style={{ color: C.gray500, fontSize: 10 }}><Text style={{ color: C.gray400, fontWeight: "700" }}>Umur</Text> {age}</Text>
                            {nationality ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Image source={{ uri: flagUrl }} style={{ width: 16, height: 16 }} resizeMode="contain" />
                                <Text style={{ color: C.gray500, fontSize: 10 }}>{nationality}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>
                      <Text style={{ color: C.gray500, fontStyle: "italic", fontSize: 12 }}>{pos}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ==================== BOTTOM NAV ====================
function BottomNav({ activeView, onSwitch }) {
  return (
    <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50, backgroundColor: "rgba(25,25,25,0.95)", borderTopWidth: 1, borderColor: C.gray800, paddingBottom: 16 }}>
      <View style={{ maxWidth: 640, alignSelf: "center", width: "100%", flexDirection: "row", justifyContent: "center" }}>
        <TouchableOpacity onPress={() => onSwitch("matches")} style={{ flex: 1, paddingVertical: 12, alignItems: "center", gap: 4 }} activeOpacity={0.7}>
          <Text style={{ fontSize: 22, color: activeView === "matches" ? C.merah : C.gray500 }}>🏠</Text>
          <Text style={{ fontSize: 11, fontWeight: "700", color: activeView === "matches" ? C.merah : C.gray500 }}>Jadwal</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSwitch("standings")} style={{ flex: 1, paddingVertical: 12, alignItems: "center", gap: 4 }} activeOpacity={0.7}>
          <Text style={{ fontSize: 22, color: activeView === "standings" ? C.merah : C.gray500 }}>📊</Text>
          <Text style={{ fontSize: 11, fontWeight: "700", color: activeView === "standings" ? C.merah : C.gray500 }}>Klasemen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ==================== MAIN APP ====================
export default function HomeScreen() {
  const [splashDone, setSplashDone] = useState(false);
  const [globalLoadingDone, setGlobalLoadingDone] = useState(false);
  const [currentView, setCurrentView] = useState("matches");
  const [previousView, setPreviousView] = useState("matches");
  const [activeSeasonId, setActiveSeasonId] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const showBottomNav = currentView !== "detail" && currentView !== "team";

  const switchMainView = (viewName) => {
    setPreviousView(currentView);
    setCurrentView(viewName);
  };

  const openMatchDetail = (matchId) => {
    setPreviousView(currentView);
    setSelectedMatchId(matchId);
    setCurrentView("detail");
  };

  const goBackFromDetail = () => {
    const prev = previousView === "detail" ? "matches" : previousView;
    switchMainView(prev);
  };

  const openTeamSquad = (teamId) => {
    setPreviousView(currentView);
    setSelectedTeamId(teamId);
    setCurrentView("team");
  };

  const goBackFromTeam = () => {
    if (previousView === "standings") switchMainView("standings");
    else switchMainView("matches");
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Background glows */}
      <View style={{ position: "absolute", top: -160, left: -128, width: 500, height: 400, backgroundColor: "rgba(252,11,18,0.3)", borderRadius: 250, transform: [{ scaleX: 1 }] }} />
      <View style={{ position: "absolute", top: -128, right: -96, width: 400, height: 300, backgroundColor: "rgba(247,204,12,0.3)", borderRadius: 200 }} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Views */}
        {currentView === "matches" && (
          <ViewMatches onOpenDetail={openMatchDetail} onSeasonReady={setActiveSeasonId} />
        )}
        {currentView === "detail" && (
          <ViewDetail matchId={selectedMatchId} onGoBack={goBackFromDetail} />
        )}
        {currentView === "standings" && (
          <ViewStandings activeSeasonId={activeSeasonId} onOpenTeam={openTeamSquad} />
        )}
        {currentView === "team" && (
          <ViewTeam teamId={selectedTeamId} activeSeasonId={activeSeasonId} onGoBack={goBackFromTeam} />
        )}

        {/* Bottom Nav */}
        {showBottomNav && <BottomNav activeView={currentView} onSwitch={switchMainView} />}
      </SafeAreaView>

      {/* Global Loading */}
      <GlobalLoading visible={!globalLoadingDone} />

      {/* Video Splash */}
      {!splashDone && (
        <VideoSplash onFinish={() => { setSplashDone(true); setGlobalLoadingDone(true); }} />
      )}
    </View>
  );
}
