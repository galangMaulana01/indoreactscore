import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MatchesScreen from './MatchesScreen';
import StandingsScreen from './StandingsScreen';
import MatchDetailScreen from './MatchDetailScreen';
import TeamScreen from './TeamScreen';
import BottomNav from '../components/BottomNav';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('matches');
  const [prevTab, setPrevTab] = useState('matches');
  const [selectedFixtureId, setSelectedFixtureId] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [activeSeasonId, setActiveSeasonId] = useState(null);

  const openMatchDetail = (id, league) => {
    setPrevTab(activeTab);
    setSelectedFixtureId(id);
    setSelectedLeague(league);
    setActiveTab('detail');
  };

  const openTeam = (id) => {
    setPrevTab(activeTab);
    setSelectedTeamId(id);
    setActiveTab('team');
  };

  const goBack = () => setActiveTab(prevTab === 'detail' || prevTab === 'team' ? 'matches' : prevTab);

  const showNav = activeTab === 'matches' || activeTab === 'standings';

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {activeTab === 'matches' && <MatchesScreen onOpenDetail={openMatchDetail} />}
        {activeTab === 'standings' && <StandingsScreen onOpenTeam={openTeam} activeSeasonId={activeSeasonId} setActiveSeasonId={setActiveSeasonId} />}
        {activeTab === 'detail' && <MatchDetailScreen fixtureId={selectedFixtureId} league={selectedLeague} onBack={goBack} />}
        {activeTab === 'team' && <TeamScreen teamId={selectedTeamId} seasonId={activeSeasonId} onBack={goBack} />}
      </View>
      {showNav && <BottomNav activeTab={activeTab} onSwitch={setActiveTab} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  content: { flex: 1 },
});
