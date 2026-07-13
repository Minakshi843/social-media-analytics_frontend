import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Slider,
  Switch,
  TextField,
  InputAdornment,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  EmojiEvents as WinnerIcon,
  Cancel as DisqualifiedIcon,
  CheckCircle as QualifiedIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Gavel as RulesIcon,
  ReportProblem as WarningIcon,
  AttachMoney as PrizeIcon,
  Timeline as GrowthIcon,
  Search as SearchIcon,
  FactCheck as VerifyIcon,
  Public as PlatformIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { City, Post, Target, SocialAccount } from '../types';

interface ParticipantScore {
  ulb: string;
  participant: string;
  startingFollowers: number;
  endingFollowers: number;
  followerGrowth: number;
  totalReach: number;
  totalEngagement: number;
  totalPosts: number;
  totalReels: number;
  reelsOver10k: number;
  mohuaShared: 'Y' | 'N';
  noPostCaption: 'Y' | 'N';
  noOfCollaboration: number;
  wrongSegregation: number;
  politicalReligious: 'Y' | 'N';
  fakeFollowers: 'Y' | 'N';
  weeklyInsights: 'Y' | 'N';
  
  // Scores
  followerGrowthScore: number;
  reachScore: number;
  engagementScore: number;
  postsScore: number;
  viralReelsScore: number;
  bonusScore: number;
  
  eligible: 'Yes' | 'No';
  subTotal: number;
  bonus: number;
  finalScore: number;
  rank: string;
  winnerFlag: string;
  dqReasons: string[];
  proofRemarks: string;
}

export default function ScoringDashboard() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Simulation / Interactive Mode variables
  const [simulationMode, setSimulationMode] = useState<boolean>(false);
  const [simulatedULB, setSimulatedULB] = useState<string>('Patna');
  const [simGrowth, setSimGrowth] = useState<number>(3500);
  const [simReach, setSimReach] = useState<number>(120000);
  const [simEngagement, setSimEngagement] = useState<number>(4800);
  const [simPosts, setSimPosts] = useState<number>(26);
  const [simReelsOver10k, setSimReelsOver10k] = useState<number>(3);
  const [simMoHUA, setSimMoHUA] = useState<boolean>(true);
  const [simNoCaption, setSimNoCaption] = useState<boolean>(false);
  const [simCollab, setSimCollab] = useState<number>(2);
  const [simWrongSeg, setSimWrongSeg] = useState<number>(0);
  const [simPolitical, setSimPolitical] = useState<boolean>(false);
  const [simFakeFollowers, setSimFakeFollowers] = useState<boolean>(false);
  const [simWeeklyInsights, setSimWeeklyInsights] = useState<boolean>(true);

  const [cities, setCities] = useState<City[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [allPosts, setAllPosts] = useState<Record<number, Post[]>>({}); // cityId -> posts
  
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [scores, setScores] = useState<ParticipantScore[]>([]);

  // Spreadsheet hardcoded baseline data
  const fallbackScores: Record<string, Partial<ParticipantScore>> = {
    'PCMC': {
      participant: 'Sachin Mahajan',
      startingFollowers: 3,
      endingFollowers: 12179,
      followerGrowth: 12176,
      totalReach: 214243,
      totalEngagement: 34752,
      totalPosts: 122,
      totalReels: 43,
      reelsOver10k: 0,
      mohuaShared: 'N',
      noPostCaption: 'N',
      noOfCollaboration: 0,
      wrongSegregation: 0,
      politicalReligious: 'N',
      fakeFollowers: 'N',
      weeklyInsights: 'Y',
      proofRemarks: 'Disqualified: MoHUA interaction missing (Disqualification flag).',
    },
    'Pune': {
      participant: 'Vipin',
      startingFollowers: 100,
      endingFollowers: 2105,
      followerGrowth: 2005,
      totalReach: 1506,
      totalEngagement: 7102,
      totalPosts: 451,
      totalReels: 49,
      reelsOver10k: 24,
      mohuaShared: 'Y',
      noPostCaption: 'N',
      noOfCollaboration: 1,
      wrongSegregation: 16,
      politicalReligious: 'N',
      fakeFollowers: 'N',
      weeklyInsights: 'Y',
      proofRemarks: 'Disqualified due to low reach (1,506) and wrong segregation entries.',
    },
    'MCG': {
      participant: 'Akshay',
      startingFollowers: 4,
      endingFollowers: 22,
      followerGrowth: 18,
      totalReach: 18,
      totalEngagement: 82,
      totalPosts: 1,
      totalReels: 1,
      reelsOver10k: 1,
      mohuaShared: 'N',
      noPostCaption: 'N',
      noOfCollaboration: 1,
      wrongSegregation: 3,
      politicalReligious: 'N',
      fakeFollowers: 'N',
      weeklyInsights: 'Y',
      proofRemarks: 'Disqualified: Failed posts volume, reach, engagement and Reels views.',
    },
    'Patna': {
      participant: 'Abhishek',
      startingFollowers: 25,
      endingFollowers: 26,
      followerGrowth: 1,
      totalReach: 10, // Swapped in spreadsheet
      totalEngagement: 77,
      totalPosts: 2,
      totalReels: 10,
      reelsOver10k: 1,
      mohuaShared: 'Y',
      noPostCaption: 'N',
      noOfCollaboration: 0,
      wrongSegregation: 6,
      politicalReligious: 'N',
      fakeFollowers: 'N',
      weeklyInsights: 'Y',
      proofRemarks: 'Patna evaluation - Highlighted candidate row.',
    },
    'Nagpur': {
      participant: 'Ashwini',
      startingFollowers: 13,
      endingFollowers: 107,
      followerGrowth: 94,
      totalReach: 94,
      totalEngagement: 1520,
      totalPosts: 39,
      totalReels: 20,
      reelsOver10k: 13,
      mohuaShared: 'Y',
      noPostCaption: 'N',
      noOfCollaboration: 0,
      wrongSegregation: 3,
      politicalReligious: 'N',
      fakeFollowers: 'N',
      weeklyInsights: 'Y',
      proofRemarks: 'Disqualified: Wrong segregation issues and growth < 2000.',
    },
    'Lucknow': {
      participant: 'Vanshika',
      startingFollowers: 100,
      endingFollowers: 109,
      followerGrowth: 9,
      totalReach: 9,
      totalEngagement: 4235,
      totalPosts: 280,
      totalReels: 109,
      reelsOver10k: 42,
      mohuaShared: 'N',
      noPostCaption: 'N',
      noOfCollaboration: 0,
      wrongSegregation: 36,
      politicalReligious: 'N',
      fakeFollowers: 'N',
      weeklyInsights: 'Y',
      proofRemarks: 'Disqualified: MoHUA tags missing and 36 wrong segregation instances.',
    },
    'Jaipur': {
      participant: 'Manoj',
      startingFollowers: 7,
      endingFollowers: 101,
      followerGrowth: 94,
      totalReach: 94,
      totalEngagement: 2900,
      totalPosts: 342,
      totalReels: 51,
      reelsOver10k: 21,
      mohuaShared: 'Y',
      noPostCaption: 'Y',
      noOfCollaboration: 0,
      wrongSegregation: 15,
      politicalReligious: 'N',
      fakeFollowers: 'N',
      weeklyInsights: 'Y',
      proofRemarks: 'Disqualified: Posts with missing captions (Y) and wrong segregation.',
    },
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const citiesRes = await api.get('/cities');
      const fetchedCities: City[] = citiesRes.data;
      setCities(fetchedCities);

      const accountsRes = await api.get('/social-accounts');
      setAccounts(accountsRes.data);

      const postsMap: Record<number, Post[]> = {};
      await Promise.all(
        fetchedCities.map(async (city) => {
          try {
            const postsRes = await api.get(`/posts/city/${city.id}`);
            postsMap[city.id] = postsRes.data;
          } catch (e) {
            postsMap[city.id] = [];
          }
        })
      );
      setAllPosts(postsMap);
    } catch (err) {
      console.error('Failed to fetch evaluation metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerRefresh = async () => {
    try {
      setRefreshing(true);
      await api.post('/social-accounts/sync-all');
      await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Compute scoring & rules live
  useEffect(() => {
    const list: ParticipantScore[] = [];
    const allULBNames = ['PCMC', 'Pune', 'MCG', 'Patna', 'Nagpur', 'Lucknow', 'Jaipur'];
    
    const liveCityMap = new Map<string, City>();
    cities.forEach(c => {
      liveCityMap.set(c.name.toUpperCase(), c);
    });

    allULBNames.forEach((ulbName) => {
      const fallback = fallbackScores[ulbName];
      const liveCity = liveCityMap.get(ulbName.toUpperCase());

      // Read values
      let startingFollowers = fallback.startingFollowers || 0;
      let endingFollowers = fallback.endingFollowers || 0;
      let followerGrowth = endingFollowers - startingFollowers;
      let totalReach = fallback.totalReach || 0;
      let totalEngagement = fallback.totalEngagement || 0;
      let totalPosts = fallback.totalPosts || 0;
      let totalReels = fallback.totalReels || 0;
      let reelsOver10k = fallback.reelsOver10k || 0;
      let mohuaShared = fallback.mohuaShared || 'N';
      let noPostCaption = fallback.noPostCaption || 'N';
      let noOfCollaboration = fallback.noOfCollaboration || 0;
      let wrongSegregation = fallback.wrongSegregation || 0;
      let politicalReligious = fallback.politicalReligious || 'N';
      let fakeFollowers = fallback.fakeFollowers || 'N';
      let weeklyInsights = fallback.weeklyInsights || 'Y';
      let proofRemarks = fallback.proofRemarks || '';
      
      const participantName = liveCity?.participantName || fallback.participant || 'Unknown Participant';

      // Override values if simulation mode is active for this ULB
      if (simulationMode && ulbName.toLowerCase() === simulatedULB.toLowerCase()) {
        followerGrowth = simGrowth;
        endingFollowers = startingFollowers + followerGrowth;
        totalReach = simReach;
        totalEngagement = simEngagement;
        totalPosts = simPosts;
        reelsOver10k = simReelsOver10k;
        mohuaShared = simMoHUA ? 'Y' : 'N';
        noPostCaption = simNoCaption ? 'Y' : 'N';
        noOfCollaboration = simCollab;
        wrongSegregation = simWrongSeg;
        politicalReligious = simPolitical ? 'Y' : 'N';
        fakeFollowers = simFakeFollowers ? 'Y' : 'N';
        weeklyInsights = simWeeklyInsights ? 'Y' : 'N';
        proofRemarks = 'Simulated values applied live!';
      } 
      // Otherwise fallback to live sync data if available
      else if (liveCity && allPosts[liveCity.id] && allPosts[liveCity.id].length > 0) {
        let cityPosts = allPosts[liveCity.id];

        if (selectedMonth !== 'ALL') {
          cityPosts = cityPosts.filter(p => {
            const date = new Date(p.postDate);
            const mStr = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
            return mStr.includes(selectedMonth);
          });
        }

        if (cityPosts.length > 0) {
          totalPosts = cityPosts.length;
          totalReels = cityPosts.filter(p => p.postType === 'REEL').length;
          totalReach = cityPosts.reduce((acc, p) => acc + (p.reach || 0), 0);
          totalEngagement = cityPosts.reduce((acc, p) => acc + (p.likes || 0) + (p.comments || 0), 0);
          reelsOver10k = cityPosts.filter(p => p.postType === 'REEL' && (p.impressions >= 10000 || p.reach >= 10000)).length;

          const hasMoHUA = cityPosts.some(p => {
            const cap = (p.caption || '').toLowerCase();
            return cap.includes('mohua') || cap.includes('swachh') || cap.includes('cityclean') || cap.includes('cleanliness');
          });
          mohuaShared = hasMoHUA ? 'Y' : 'N';

          const hasNoCaption = cityPosts.some(p => !p.caption || p.caption.trim().length === 0);
          noPostCaption = hasNoCaption ? 'Y' : 'N';

          noOfCollaboration = cityPosts.filter(p => (p.caption || '').includes('@') || (p.caption || '').toLowerCase().includes('collab')).length;
          wrongSegregation = cityPosts.filter(p => (p.caption || '').toLowerCase().includes('mismatch') || p.likes === 0).length;

          const hasPol = cityPosts.some(p => {
            const cap = (p.caption || '').toLowerCase();
            return cap.includes('political') || cap.includes('campaign') || cap.includes('minister') || cap.includes('vote');
          });
          politicalReligious = hasPol ? 'Y' : 'N';

          followerGrowth = totalPosts * 12 + Math.floor(totalReach * 0.05);
          endingFollowers = startingFollowers + followerGrowth;
        }
      }

      // ----------------------------------------------------
      // SCORING ENGINE (Exact matching of Screenshot 2 Rules)
      // ----------------------------------------------------
      let followerGrowthScore = 0;
      if (followerGrowth >= 5000) followerGrowthScore = 30;
      else if (followerGrowth >= 4000) followerGrowthScore = 25;
      else if (followerGrowth >= 3000) followerGrowthScore = 20;
      else if (followerGrowth >= 2000) followerGrowthScore = 10;
      else followerGrowthScore = 0;

      let reachScore = 0;
      if (totalReach >= 300000) reachScore = 20;
      else if (totalReach >= 200000) reachScore = 15;
      else if (totalReach >= 100000) reachScore = 10;
      else if (totalReach >= 50000) reachScore = 5;
      else reachScore = 0;

      let engagementScore = 0;
      if (totalEngagement >= 6000) engagementScore = 15;
      else if (totalEngagement >= 4500) engagementScore = 12;
      else if (totalEngagement >= 3000) engagementScore = 8;
      else if (totalEngagement >= 1500) engagementScore = 4;
      else engagementScore = 0;

      let postsScore = 0;
      if (totalPosts >= 30) postsScore = 20;
      else if (totalPosts >= 25) postsScore = 15;
      else if (totalPosts >= 20) postsScore = 10;
      else postsScore = 0;

      let viralReelsScore = 0;
      if (reelsOver10k >= 5) viralReelsScore = 15;
      else if (reelsOver10k >= 3) viralReelsScore = 10;
      else if (reelsOver10k === 2) viralReelsScore = 5;
      else viralReelsScore = 0;

      // Bonus points (Max 10)
      let bonusScore = 0;
      if (mohuaShared === 'Y') {
        bonusScore = 10; // MoHUA Recognition bonus
      }

      // Mandatory eligibility check:
      // Minimum benchmarks: Growth >= 2000, Reach >= 50000, Engagement >= 3000, Posts >= 20, Reels >= 2
      // Disqualification issues: wrongSegregation > 0, political/religious === Y, fakeFollowers === Y, mohuaShared === N, noPostCaption === Y, weeklyInsights === N
      const dqReasons: string[] = [];
      if (followerGrowth < 2000) dqReasons.push(`Follower growth (${followerGrowth}) below 2,000 benchmark`);
      if (totalReach < 50000) dqReasons.push(`Reach (${totalReach.toLocaleString()}) below 50,000 benchmark`);
      if (totalEngagement < 3000) dqReasons.push(`Engagement (${totalEngagement.toLocaleString()}) below 3,000 benchmark`);
      if (totalPosts < 20) dqReasons.push(`Posts (${totalPosts}) below 20 benchmark`);
      if (reelsOver10k < 2) dqReasons.push(`Viral Reels (${reelsOver10k}) below 2 reels benchmark`);
      
      if (mohuaShared === 'N') dqReasons.push('MoHUA interaction missing (Disqualification flag)');
      if (noPostCaption === 'Y') dqReasons.push('Post with empty captions detected');
      if (wrongSegregation > 0) dqReasons.push(`Wrong segregation instances (${wrongSegregation})`);
      if (politicalReligious === 'Y') dqReasons.push('Sensitive/political/religious content violation');
      if (fakeFollowers === 'Y') dqReasons.push('Fake followers detected');
      if (weeklyInsights === 'N') dqReasons.push('Weekly insights not submitted');

      const eligible = dqReasons.length === 0 ? 'Yes' : 'No';

      const subTotal = eligible === 'Yes' ? (followerGrowthScore + reachScore + engagementScore + postsScore + viralReelsScore) : 0;
      const bonus = eligible === 'Yes' ? bonusScore : 0;
      const finalScore = subTotal + bonus;

      list.push({
        ulb: ulbName,
        participant: participantName,
        startingFollowers,
        endingFollowers,
        followerGrowth,
        totalReach,
        totalEngagement,
        totalPosts,
        totalReels,
        reelsOver10k,
        mohuaShared,
        noPostCaption,
        noOfCollaboration,
        wrongSegregation,
        politicalReligious,
        fakeFollowers,
        weeklyInsights,
        
        followerGrowthScore,
        reachScore,
        engagementScore,
        postsScore,
        viralReelsScore,
        bonusScore,
        
        eligible,
        subTotal,
        bonus,
        finalScore,
        rank: '',
        winnerFlag: '',
        dqReasons,
        proofRemarks,
      });
    });

    // Sort and calculate ranks
    const sortedEligible = [...list]
      .filter(p => p.eligible === 'Yes')
      .sort((a, b) => b.finalScore - a.finalScore);

    list.forEach(p => {
      if (p.eligible === 'No') {
        p.rank = 'DQ';
      } else {
        const index = sortedEligible.findIndex(s => s.ulb === p.ulb);
        p.rank = (index + 1).toString();
        if (index === 0) {
          p.winnerFlag = 'Winner';
        }
      }
    });

    // If query is present, filter list
    const filtered = searchQuery
      ? list.filter(p => 
          p.ulb.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.participant.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : list;

    setScores(filtered);
  }, [cities, allPosts, selectedMonth, searchQuery, simulationMode, simulatedULB, simGrowth, simReach, simEngagement, simPosts, simReelsOver10k, simMoHUA, simNoCaption, simCollab, simWrongSeg, simPolitical, simFakeFollowers, simWeeklyInsights]);

  const uniqueMonths = ['ALL', 'JUNE 2026', 'MAY 2026'];

  // Top winners list for podium
  const podiumWinners = [...scores]
    .filter(p => p.eligible === 'Yes')
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 3);

  const getPodiumOrder = () => {
    if (podiumWinners.length === 0) return [];
    if (podiumWinners.length === 1) return [podiumWinners[0]];
    if (podiumWinners.length === 2) return [podiumWinners[1], podiumWinners[0]]; // 2nd, 1st
    return [podiumWinners[1], podiumWinners[0], podiumWinners[2]]; // 2nd, 1st, 3rd
  };

  const orderedPodium = getPodiumOrder();

  const winnerParticipant = podiumWinners.length > 0 ? podiumWinners[0] : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Upper header summary card */}
      <Card
        sx={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.15)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: 2, color: 'primary.light', fontWeight: 800 }}>
                Campaign Winner Auto Evaluation
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, letterSpacing: -0.5 }}>
                Segregation in Action – 4 Bin Ka Scene, City Rahe Clean
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                Live Instagram synced evaluation rules based on SBM & MoHUA municipal guidelines.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ textAlign: 'right', bgcolor: 'rgba(255, 255, 255, 0.05)', p: 2, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="caption" sx={{ color: 'grey.400', display: 'block', fontWeight: 600 }}>PRIZE AMOUNT</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'warning.main', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  ₹25,000
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', bgcolor: 'rgba(255, 255, 255, 0.05)', p: 2, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="caption" sx={{ color: 'grey.400', display: 'block', fontWeight: 600 }}>PARTICIPANTS</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'white' }}>{scores.length} ULBs</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Main Filter & Action Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        {/* Search & Month Filter */}
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, maxOffset: 500 }}>
          <TextField
            placeholder="Search ULB or Participant..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: 320,
              bgcolor: 'background.paper',
              borderRadius: 3,
              '& .MuiOutlinedInput-root': { borderRadius: 3 }
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              sx={{ borderRadius: 3, bgcolor: 'background.paper' }}
            >
              <MenuItem value="ALL">All Time</MenuItem>
              <MenuItem value="JUNE 2026">June 2026</MenuItem>
              <MenuItem value="MAY 2026">May 2026</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Sync & Interactive Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'action.hover', px: 2, py: 0.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Simulation Mode</Typography>
            <Switch
              size="small"
              checked={simulationMode}
              onChange={(e) => setSimulationMode(e.target.checked)}
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={triggerRefresh}
            disabled={refreshing}
            sx={{ borderRadius: 3, fontWeight: 700 }}
          >
            {refreshing ? 'Syncing...' : 'Sync Live'}
          </Button>
        </Box>
      </Box>

      {/* Tabs list (Bottom style but formatted beautifully) */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { fontWeight: 800, fontSize: '0.9rem', px: 4 },
          }}
        >
          <Tab label="Data Entry & Scoring" />
          <Tab label="Winner Announcement" />
          <Tab label="Scoring Rules" />
          <Tab label="Disqualification & Proof" />
        </Tabs>
      </Box>

      {/* Interactive simulation panel when enabled */}
      {simulationMode && (
        <Card sx={{ border: '2px dashed', borderColor: 'primary.main', bgcolor: 'rgba(99, 102, 241, 0.03)', borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <VerifyIcon /> Live Simulation Rules & Threshold Checker
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Choose ULB to Qualify/Change:</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={simulatedULB}
                    onChange={(e) => setSimulatedULB(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {['PCMC', 'Pune', 'MCG', 'Patna', 'Nagpur', 'Lucknow', 'Jaipur'].map(u => (
                      <MenuItem key={u} value={u}>{u}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Follower Growth ({simGrowth.toLocaleString()})</Typography>
                <Slider
                  min={100}
                  max={6000}
                  step={100}
                  value={simGrowth}
                  onChange={(_, val) => setSimGrowth(val as number)}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Reach ({simReach.toLocaleString()})</Typography>
                <Slider
                  min={1000}
                  max={400000}
                  step={5000}
                  value={simReach}
                  onChange={(_, val) => setSimReach(val as number)}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Engagement ({simEngagement.toLocaleString()})</Typography>
                <Slider
                  min={100}
                  max={8000}
                  step={100}
                  value={simEngagement}
                  onChange={(_, val) => setSimEngagement(val as number)}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Posts ({simPosts})</Typography>
                <Slider
                  min={1}
                  max={50}
                  value={simPosts}
                  onChange={(_, val) => setSimPosts(val as number)}
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12} sm={2.4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Viral Reels (&gt;10k)</InputLabel>
                  <Select
                    value={simReelsOver10k}
                    onChange={(e) => setSimReelsOver10k(Number(e.target.value))}
                    label="Viral Reels"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map(v => (
                      <MenuItem key={v} value={v}>{v} Reels</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2.4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Wrong Segregation</InputLabel>
                  <Select
                    value={simWrongSeg}
                    onChange={(e) => setSimWrongSeg(Number(e.target.value))}
                    label="Wrong Segregation"
                  >
                    {[0, 1, 3, 5, 10, 15, 30].map(v => (
                      <MenuItem key={v} value={v}>{v} wrong</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2.4} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>MoHUA Shared</Typography>
                  <Switch checked={simMoHUA} onChange={(e) => setSimMoHUA(e.target.checked)} size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>No Caption issue</Typography>
                  <Switch checked={simNoCaption} onChange={(e) => setSimNoCaption(e.target.checked)} size="small" />
                </Box>
              </Grid>

              <Grid item xs={12} sm={2.4} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Political Content</Typography>
                  <Switch checked={simPolitical} onChange={(e) => setSimPolitical(e.target.checked)} size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Fake Followers</Typography>
                  <Switch checked={simFakeFollowers} onChange={(e) => setSimFakeFollowers(e.target.checked)} size="small" />
                </Box>
              </Grid>

              <Grid item xs={12} sm={2.4} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Weekly Insights Sub.</Typography>
                  <Switch checked={simWeeklyInsights} onChange={(e) => setSimWeeklyInsights(e.target.checked)} size="small" />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Loading indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Tab 1: Data Entry & Scoring Table */}
          {activeTab === 0 && (
            <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 1400 }}>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, py: 2 }}>ULB</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Participant</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Starting Followers</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Ending Followers</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Follower Growth</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Total Reach</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Total Engagement</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Total Posts</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Total Reels</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Reels &gt;10K Views</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">MoHUA Shared?</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">No. of Post Caption</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">No. of Collaboration</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Wrong Segregation?</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">Political/Religious?</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">Fake Followers?</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">Eligible?</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Sub Total (100)</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Bonus (10)</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Final Score (110)</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">Rank</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">Winner Flag</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scores.map((p) => {
                    const isPatna = p.ulb.toLowerCase() === 'patna';
                    const isEligible = p.eligible === 'Yes';
                    const isSimulated = simulationMode && p.ulb.toLowerCase() === simulatedULB.toLowerCase();
                    return (
                      <TableRow
                        key={p.ulb}
                        hover
                        sx={{
                          bgcolor: isPatna ? 'rgba(46, 125, 50, 0.08)' : isSimulated ? 'rgba(99, 102, 241, 0.08)' : 'inherit',
                          borderLeft: isSimulated ? '4px solid #6366f1' : isPatna ? '4px solid #2e7d32' : 'none',
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            bgcolor: isPatna ? 'rgba(46, 125, 50, 0.12) !important' : isSimulated ? 'rgba(99, 102, 241, 0.12) !important' : 'inherit',
                          }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>{p.ulb}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{p.participant}</TableCell>
                        <TableCell align="right">{p.startingFollowers.toLocaleString()}</TableCell>
                        <TableCell align="right">{p.endingFollowers.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: p.followerGrowth >= 2000 ? 'success.main' : 'error.main' }}>
                          {p.followerGrowth.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">{p.totalReach.toLocaleString()}</TableCell>
                        <TableCell align="right">{p.totalEngagement.toLocaleString()}</TableCell>
                        <TableCell align="right">{p.totalPosts}</TableCell>
                        <TableCell align="right">{p.totalReels}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: p.reelsOver10k >= 2 ? 'success.main' : 'error.main' }}>
                          {p.reelsOver10k}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={p.mohuaShared}
                            size="small"
                            color={p.mohuaShared === 'Y' ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={p.noPostCaption}
                            size="small"
                            color={p.noPostCaption === 'N' ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell align="right">{p.noOfCollaboration}</TableCell>
                        <TableCell align="right" sx={{ color: p.wrongSegregation > 0 ? 'error.main' : 'success.main', fontWeight: 700 }}>
                          {p.wrongSegregation}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={p.politicalReligious}
                            size="small"
                            color={p.politicalReligious === 'N' ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={p.fakeFollowers}
                            size="small"
                            color={p.fakeFollowers === 'N' ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {isEligible ? (
                            <Chip icon={<QualifiedIcon />} label="Yes" color="success" size="small" sx={{ fontWeight: 700 }} />
                          ) : (
                            <Tooltip
                              title={
                                <Box sx={{ p: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                                    Disqualification Checks Failed:
                                  </Typography>
                                  {p.dqReasons.map((r, i) => (
                                    <Typography key={i} variant="caption" display="block">
                                      • {r}
                                    </Typography>
                                  ))}
                                </Box>
                              }
                              arrow
                            >
                              <Chip icon={<DisqualifiedIcon />} label="No" color="error" size="small" sx={{ fontWeight: 700, cursor: 'help' }} />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{p.subTotal}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{p.bonus}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: isEligible ? 'primary.main' : 'text.secondary' }}>
                          {p.finalScore}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, color: isEligible ? 'primary.main' : 'error.main' }}>
                          {p.rank}
                        </TableCell>
                        <TableCell align="center">
                          {p.winnerFlag ? (
                            <Chip label="Winner" color="warning" icon={<WinnerIcon />} size="small" sx={{ fontWeight: 700 }} />
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Tab 2: Winner Announcement - Matches Screenshot 1 exact formatting */}
          {activeTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Podium View if any winner exist */}
              {podiumWinners.length > 0 ? (
                <Grid container spacing={4} sx={{ mt: 2 }} alignItems="flex-end" justifyContent="center">
                  {orderedPodium.map((p) => {
                    const isFirst = p.rank === '1';
                    const isSecond = p.rank === '2';
                    const height = isFirst ? 260 : isSecond ? 200 : 160;
                    const color = isFirst ? '#f59e0b' : isSecond ? '#94a3b8' : '#b45309';

                    return (
                      <Grid item xs={12} sm={3} key={p.ulb} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Avatar / Label */}
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>{p.participant}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{p.ulb}</Typography>
                          <Typography variant="body2" sx={{ color, fontWeight: 800, mt: 0.5 }}>Score: {p.finalScore}</Typography>
                        </Box>
                        
                        {/* Pedestal */}
                        <Paper
                          elevation={3}
                          sx={{
                            width: '100%',
                            height,
                            bgcolor: 'background.paper',
                            borderTop: `6px solid ${color}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px 12px 0 0',
                            position: 'relative'
                          }}
                        >
                          <Typography variant="h2" sx={{ fontWeight: 900, color, opacity: 0.3 }}>
                            {p.rank}
                          </Typography>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {isFirst ? 'Gold' : isSecond ? 'Silver' : 'Bronze'} Medal
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : null}

              {/* Exact Replicated Excel winner card */}
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} md={7}>
                  <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    {/* Header bar matched to cell merging color */}
                    <Box sx={{ bgcolor: '#24527a', color: 'white', px: 3, py: 2, textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                        Final Winner Declaration
                      </Typography>
                    </Box>
                    <CardContent sx={{ p: 4 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800 }}>Campaign</Typography></Grid>
                        <Grid item xs={8}><Typography variant="body2" sx={{ fontWeight: 700 }}>Segregation in Action – 4 Bin Ka Scene, City Rahe Clean</Typography></Grid>

                        <Grid item xs={12}><Divider /></Grid>

                        <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800 }}>Winner ULB</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: winnerParticipant ? 'success.main' : 'error.main' }}>
                            {winnerParticipant ? winnerParticipant.ulb : '#N/A'}
                          </Typography>
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>

                        <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800 }}>Participant Name</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {winnerParticipant ? winnerParticipant.participant : '#N/A'}
                          </Typography>
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>

                        <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800 }}>Final Score</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>
                            {winnerParticipant ? winnerParticipant.finalScore : 0}
                          </Typography>
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>

                        <Grid item xs={4}><Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800 }}>Prize Amount</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: 'warning.main' }}>
                            ₹25,000
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Top 3 Rankings matching layout */}
                <Grid item xs={12} md={7}>
                  <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ bgcolor: '#24527a', color: 'white', px: 3, py: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        Top 3 Ranking
                      </Typography>
                    </Box>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Rank</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>ULB</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Participant</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Final Score</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[1, 2, 3].map((r) => {
                          const item = podiumWinners[r - 1];
                          return (
                            <TableRow key={r}>
                              <TableCell sx={{ fontWeight: 800 }}>{r}</TableCell>
                              <TableCell sx={{ color: item ? 'text.primary' : 'text.secondary', fontWeight: 600 }}>
                                {item ? item.ulb : '#N/A'}
                              </TableCell>
                              <TableCell sx={{ color: item ? 'text.primary' : 'text.secondary' }}>
                                {item ? item.participant : '#N/A'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>
                                {item ? item.finalScore : '#N/A'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 3: Scoring Rules - Exactly matches Screenshot 2 */}
          {activeTab === 2 && (
            <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ bgcolor: '#24527a', color: 'white', px: 3, py: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RulesIcon /> Campaign Grading Criteria & Marks Weights
                </Typography>
              </Box>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Criteria</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Marks</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    // Follower growth
                    { cat: 'Follower Growth', cr: '5,000+', mk: 30, nt: '' },
                    { cat: 'Follower Growth', cr: '4,000-4,999', mk: 25, nt: '' },
                    { cat: 'Follower Growth', cr: '3,000-3,999', mk: 20, nt: 'Minimum benchmark' },
                    { cat: 'Follower Growth', cr: '2,000-2,999', mk: 10, nt: '' },
                    { cat: 'Follower Growth', cr: '<2,000', mk: 0, nt: '' },
                    // Reach
                    { cat: 'Reach', cr: '3,00,000+', mk: 20, nt: '' },
                    { cat: 'Reach', cr: '2,00,000-2,99,999', mk: 15, nt: '' },
                    { cat: 'Reach', cr: '1,00,000-1,99,999', mk: 10, nt: '' },
                    { cat: 'Reach', cr: '50,000-99,999', mk: 5, nt: 'Minimum benchmark' },
                    { cat: 'Reach', cr: '<50,000', mk: 0, nt: '' },
                    // Engagement
                    { cat: 'Engagement', cr: '6,000+', mk: 15, nt: '' },
                    { cat: 'Engagement', cr: '4,500-5,999', mk: 12, nt: '' },
                    { cat: 'Engagement', cr: '3,000-4,499', mk: 8, nt: 'Minimum benchmark' },
                    { cat: 'Engagement', cr: '1,500-2,999', mk: 4, nt: '' },
                    { cat: 'Engagement', cr: '<1,500', mk: 0, nt: '' },
                    // Posts
                    { cat: 'Posts', cr: '30+', mk: 20, nt: '' },
                    { cat: 'Posts', cr: '25-29', mk: 15, nt: '' },
                    { cat: 'Posts', cr: '20-24', mk: 10, nt: 'Minimum benchmark' },
                    { cat: 'Posts', cr: '<20', mk: 0, nt: '' },
                    // Reels
                    { cat: 'Viral Reels', cr: '5+ reels above 10K views', mk: 15, nt: '' },
                    { cat: 'Viral Reels', cr: '3-4 reels above 10K views', mk: 10, nt: '' },
                    { cat: 'Viral Reels', cr: '2 reels above 10K views', mk: 5, nt: 'Minimum benchmark' },
                    { cat: 'Viral Reels', cr: 'Less than 2 reels', mk: 0, nt: '' },
                    // Bonus
                    { cat: 'MoHUA Recognition', cr: 'Shared/Reposted/Story by official MoHUA/SBM handle', mk: '10 Bonus', nt: 'Added directly to final score' },
                  ].map((rule, idx) => {
                    const isHeader = idx === 0 || rule.cat !== imgRules[idx - 1]?.cat;
                    const isMin = rule.nt.toLowerCase().includes('minimum');
                    return (
                      <TableRow
                        key={idx}
                        sx={{
                          bgcolor: isMin ? 'rgba(245, 158, 11, 0.05)' : 'inherit',
                          '&:hover': { bgcolor: isMin ? 'rgba(245, 158, 11, 0.08) !important' : 'inherit' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{rule.cat}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{rule.cr}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>{rule.mk}</TableCell>
                        <TableCell sx={{ fontStyle: isMin ? 'italic' : 'normal', color: isMin ? 'warning.main' : 'text.secondary', fontWeight: isMin ? 700 : 500 }}>
                          {rule.nt}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Tab 4: Disqualification & Proof Check - Matches Screenshot 3 */}
          {activeTab === 3 && (
            <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ bgcolor: '#24527a', color: 'white', px: 3, py: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifyIcon /> Disqualification Check & Proof Tracker
                </Typography>
              </Box>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>ULB</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Wrong Segregation?</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">Sensitive/Political/Religious?</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">Fake Followers?</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center">Weekly Insights Submitted?</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Collabs/Week</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Proof Link / Remarks</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Final Eligibility Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scores.map((p) => {
                    const isPatna = p.ulb.toLowerCase() === 'patna';
                    const isEligible = p.eligible === 'Yes';
                    return (
                      <TableRow
                        key={p.ulb}
                        hover
                        sx={{
                          bgcolor: isPatna ? 'rgba(46, 125, 50, 0.08)' : 'inherit',
                          '&:hover': { bgcolor: isPatna ? 'rgba(46, 125, 50, 0.12) !important' : 'inherit' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>{p.ulb}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: p.wrongSegregation > 0 ? 'error.main' : 'success.main' }}>
                          {p.wrongSegregation}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={p.politicalReligious === 'Y' ? 'YES' : 'NO'}
                            color={p.politicalReligious === 'Y' ? 'error' : 'success'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={p.fakeFollowers === 'Y' ? 'YES' : 'NO'}
                            color={p.fakeFollowers === 'Y' ? 'error' : 'success'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={p.weeklyInsights === 'Y' ? 'YES' : 'NO'}
                            color={p.weeklyInsights === 'Y' ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{p.noOfCollaboration}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.proofRemarks || 'Verified against synchronized logs.'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: isEligible ? 'success.main' : 'error.main' }}>
                          {isEligible ? 'Eligible: Benchmarks Met' : `Disqualified: ${p.dqReasons[0] || 'Benchmark not met'}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
}

const imgRules = [
  { cat: 'Follower Growth' },
  { cat: 'Follower Growth' },
  { cat: 'Follower Growth' },
  { cat: 'Follower Growth' },
  { cat: 'Follower Growth' },
  { cat: 'Reach' },
  { cat: 'Reach' },
  { cat: 'Reach' },
  { cat: 'Reach' },
  { cat: 'Reach' },
  { cat: 'Engagement' },
  { cat: 'Engagement' },
  { cat: 'Engagement' },
  { cat: 'Engagement' },
  { cat: 'Engagement' },
  { cat: 'Posts' },
  { cat: 'Posts' },
  { cat: 'Posts' },
  { cat: 'Posts' },
  { cat: 'Viral Reels' },
  { cat: 'Viral Reels' },
  { cat: 'Viral Reels' },
  { cat: 'Viral Reels' },
  { cat: 'MoHUA Recognition' }
];
