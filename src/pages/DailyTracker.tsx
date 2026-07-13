import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  People as FollowersIcon,
  ThumbUp as LikesIcon,
  Comment as CommentsIcon,
  Share as SharesIcon,
  Visibility as ImpressionsIcon,
  Launch as LaunchIcon,
  EmojiEvents as CollabIcon,
  TrackChanges as TargetIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { City, SocialAccount, Post, Target } from '../types';

export default function DailyTracker() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });
  
  const [cities, setCities] = useState<City[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch cities
      try {
        const res = await api.get('/cities');
        setCities(res.data);
      } catch (e) {
        console.error('Failed to load cities:', e);
      }

      // Fetch accounts
      try {
        const res = await api.get('/social-accounts');
        setAccounts(res.data);
      } catch (e) {
        console.error('Failed to load accounts:', e);
      }

      // Fetch posts
      try {
        const res = await api.get('/posts');
        setPosts(res.data);
      } catch (e) {
        console.error('Failed to load posts:', e);
      }

      // Fetch targets
      try {
        const res = await api.get('/targets');
        setTargets(res.data);
      } catch (e) {
        console.error('Failed to load targets:', e);
      }

    } catch (err) {
      console.error('General error loading daily tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDownloadCSV = () => {
    const headers = [
      'City/ULB', 'Expert Name', 'Followers', 'Following',
      'Reels Target', 'Reels Achieved',
      'Carousel Target', 'Carousel Achieved',
      'Static Target', 'Static Achieved',
      'Total Target', 'Total Achieved',
      'Achievement Rate (%)',
      'Likes', 'Comments', 'Shares', 'Reach', 'Impressions', 'Collabs'
    ];

    const csvRows = [
      headers.join(','),
      ...trackerRows.map(row => [
        `"${row.city.name.replace(/"/g, '""')}"`,
        `"${row.expertName.replace(/"/g, '""')}"`,
        row.followers,
        row.following,
        row.target.dailyReelTarget || 0,
        row.actual.reel,
        row.target.dailyCarouselTarget || 0,
        row.actual.carousel,
        row.target.dailyStaticTarget || 0,
        row.actual.static,
        row.target.dailyPostTarget || 0,
        row.actual.total,
        row.achievementRate.toFixed(1),
        row.metrics.likes,
        row.metrics.comments,
        row.metrics.shares,
        row.metrics.reach,
        row.metrics.impressions,
        row.metrics.collabs
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daily_Tracker_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Baseline fallbacks for experts
  const fallbackExperts: Record<string, string> = {
    'PCMC': 'Sachin Mahajan',
    'PUNE': 'Vipin',
    'MCG': 'Akshay',
    'PATNA': 'Abhishek',
    'NAGPUR': 'Ashwini',
    'LUCKNOW': 'Vanshika',
    'JAIPUR': 'Manoj',
  };

  const trackerRows = cities.map((city) => {
    const cityNameKey = city.name.toUpperCase();
    const expertName = city.participantName || fallbackExperts[cityNameKey] || 'Unknown Expert';
    
    // Linked accounts for this city
    const cityAccounts = accounts.filter((a) => a.cityId === city.id && a.connectionStatus === 'CONNECTED');
    const hasConnection = cityAccounts.length > 0;
    
    // Followers & Following Count (sum across connected accounts)
    const followers = cityAccounts.reduce((acc, a) => acc + (a.followersCount || 0), 0);
    const following = cityAccounts.reduce((acc, a) => acc + (a.followingCount || 0), 0);

    // Target configuration for this city
    const cityTarget = targets.find((t) => t.city?.id === city.id && t.platform === 'INSTAGRAM') || {
      dailyStaticTarget: 0,
      dailyCarouselTarget: 0,
      dailyReelTarget: 0,
      dailyPostTarget: 0,
    };

    // Filter posts for this city on the selected date
    const cityPostsOnDate = posts.filter(
      (p) => p.city?.id === city.id && p.postDate === selectedDate
    );

    // Calculate actual achievements
    const staticCount = cityPostsOnDate.filter((p) => p.postType === 'STATIC').length;
    const carouselCount = cityPostsOnDate.filter((p) => p.postType === 'CAROUSEL').length;
    const reelCount = cityPostsOnDate.filter((p) => p.postType === 'REEL').length;
    const totalCount = cityPostsOnDate.length;

    // Sum up engagement metrics
    const likes = cityPostsOnDate.reduce((acc, p) => acc + (p.likes || 0), 0);
    const comments = cityPostsOnDate.reduce((acc, p) => acc + (p.comments || 0), 0);
    const reach = cityPostsOnDate.reduce((acc, p) => acc + (p.reach || 0), 0);
    const impressions = cityPostsOnDate.reduce((acc, p) => acc + (p.impressions || 0), 0);
    const shares = cityPostsOnDate.reduce((acc, p) => acc + (p.shares || 0), 0);
    const collabs = cityPostsOnDate.reduce((acc, p) => acc + (p.collaborationsCount || 0), 0);

    // Calculate target achievement rate
    const targetDaily = cityTarget.dailyPostTarget;
    const achievementRate = targetDaily > 0 
      ? Math.min(100, (totalCount / targetDaily) * 100) 
      : (totalCount > 0 ? 100 : 0);

    return {
      city,
      expertName,
      hasConnection,
      followers,
      following,
      target: cityTarget,
      actual: {
        static: staticCount,
        carousel: carouselCount,
        reel: reelCount,
        total: totalCount,
      },
      metrics: {
        likes,
        comments,
        shares,
        reach,
        impressions,
        collabs,
      },
      achievementRate,
    };
  });

  // Calculate global summary cards for the selected date
  const totalPostsToday = trackerRows.reduce((acc, r) => acc + r.actual.total, 0);
  const totalLikesToday = trackerRows.reduce((acc, r) => acc + r.metrics.likes, 0);
  const totalReachToday = trackerRows.reduce((acc, r) => acc + r.metrics.reach, 0);
  const averageAchievement = trackerRows.length > 0 
    ? trackerRows.reduce((acc, r) => acc + r.achievementRate, 0) / trackerRows.length 
    : 0;

  if (loading && !refreshing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Title Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Daily Performance Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Unified view of daily publishing targets, follower growth, and post metrics for all cities.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            type="date"
            label="Selected Tracking Date"
            InputLabelProps={{ shrink: true }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, fontWeight: 700 } }}
          />
          <IconButton onClick={handleRefresh} disabled={refreshing} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 1 }}>
            {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadCSV}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 2.5, height: 40 }}
          >
            Download Report
          </Button>
        </Box>
      </Box>

      {/* Summary Aggregate Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                Total Posts Today
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {totalPostsToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                Total Likes Recieved
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {totalLikesToday.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                Total Reach Today
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                {totalReachToday.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                Average Achievement Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                {averageAchievement.toFixed(0)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Unified Table */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 800 }}>City / ULB</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Expert Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Followers / Following</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Progress vs Target</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Achievement Rate</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Likes</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Comments</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Shares</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Reach</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Impressions</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Collabs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trackerRows.map((row) => (
                  <TableRow key={row.city.id} hover>
                    {/* City details */}
                    <TableCell sx={{ fontWeight: 700 }}>{row.city.name}</TableCell>
                    
                    {/* Expert Name */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.expertName}
                      </Typography>
                    </TableCell>

                    {/* Followers & Following */}
                    <TableCell align="center">
                      {row.hasConnection ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {row.followers.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">/</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {row.following.toLocaleString()}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip label="Disconnected" size="small" variant="outlined" color="warning" sx={{ fontWeight: 600 }} />
                      )}
                    </TableCell>

                    {/* Target Progress stats */}
                    <TableCell align="center">
                      <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0.5, textAlign: 'left' }}>
                        <Typography variant="caption" display="block">
                          🎬 Reels: <strong>{row.actual.reel}</strong> / {row.target.dailyReelTarget}
                        </Typography>
                        <Typography variant="caption" display="block">
                          🖼️ Carousels: <strong>{row.actual.carousel}</strong> / {row.target.dailyCarouselTarget}
                        </Typography>
                        <Typography variant="caption" display="block">
                          📸 Statics: <strong>{row.actual.static}</strong> / {row.target.dailyStaticTarget}
                        </Typography>
                        <Divider sx={{ my: 0.25 }} />
                        <Typography variant="caption" display="block" sx={{ fontWeight: 700 }}>
                          📈 Total: <strong>{row.actual.total}</strong> / {row.target.dailyPostTarget}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Achievement rate */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: 120 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {row.achievementRate.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={row.achievementRate}
                          color={row.achievementRate >= 100 ? 'success' : row.achievementRate > 0 ? 'warning' : 'error'}
                          sx={{ borderRadius: 1, height: 6 }}
                        />
                      </Box>
                    </TableCell>

                    {/* Likes */}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <LikesIcon sx={{ fontSize: 14, color: 'text.secondary' }} /> {row.metrics.likes}
                      </Box>
                    </TableCell>

                    {/* Comments */}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <CommentsIcon sx={{ fontSize: 14, color: 'text.secondary' }} /> {row.metrics.comments}
                      </Box>
                    </TableCell>

                    {/* Shares */}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <SharesIcon sx={{ fontSize: 14, color: 'text.secondary' }} /> {row.metrics.shares}
                      </Box>
                    </TableCell>

                    {/* Reach */}
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {row.metrics.reach.toLocaleString()}
                    </TableCell>

                    {/* Impressions */}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {row.metrics.impressions.toLocaleString()}
                    </TableCell>

                    {/* Collabs */}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <CollabIcon sx={{ fontSize: 14, color: 'secondary.main' }} /> {row.metrics.collabs}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
