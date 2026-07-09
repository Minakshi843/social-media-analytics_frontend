import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  useTheme,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  LinearProgress,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  LocationCity as CityIcon,
  Share as SocialIcon,
  PostAdd as PostIcon,
  CheckCircleOutline as AchieveIcon,
  PendingActions as PendingIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell as PieCell,
} from 'recharts';
import api from '../services/api';
import { DashboardStats, City } from '../types';

export default function Dashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | 'ALL'>('ALL');

  const fetchCities = async () => {
    try {
      const res = await api.get('/cities');
      setCities(res.data);
    } catch (err) {
      console.error('Failed to load cities for filter:', err);
    }
  };

  const fetchStats = async (cityId: number | 'ALL') => {
    try {
      setLoading(true);
      const url = cityId === 'ALL' ? '/dashboard/stats' : `/dashboard/stats?cityId=${cityId}`;
      const res = await api.get(url);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchStats(selectedCityId);
  }, [selectedCityId]);

  const handleGlobalSync = async () => {
    try {
      setSyncing(true);
      const url = selectedCityId === 'ALL'
        ? '/social-accounts/sync-all'
        : `/social-accounts/city/${selectedCityId}/sync`;
      await api.post(url);
      await fetchStats(selectedCityId);
    } catch (err) {
      console.error('Manual synchronization failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Fallback data structure if API is loading
  const data = stats || {
    totalCities: 0,
    totalAccounts: 0,
    totalPosts: 0,
    achievementRate: 0,
    pendingTargets: 0,
    platformPerformance: [],
    cityPerformance: [],
    monthlyTrends: [],
    dailyTrends: []
  };

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

  const cardData = [
    { title: 'Total Cities', value: data.totalCities, icon: <CityIcon />, color: 'primary.main' },
    { title: 'Total Accounts', value: data.totalAccounts, icon: <SocialIcon />, color: 'secondary.main' },
    { title: 'Total Posts', value: data.totalPosts, icon: <PostIcon />, color: 'success.main' },
    { title: 'Achievement %', value: `${data.achievementRate.toFixed(1)}%`, icon: <AchieveIcon />, color: 'info.main' },
    { title: 'Pending Targets', value: data.pendingTargets, icon: <PendingIcon />, color: 'error.main' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header and Manual Sync */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Executive Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pre-aggregated social media analytics and target metrics.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value as number | 'ALL')}
              sx={{ borderRadius: 3, fontWeight: 700 }}
            >
              <MenuItem value="ALL" sx={{ fontWeight: 600 }}>All Cities (Comparison)</MenuItem>
              {cities.map((c) => (
                <MenuItem key={c.id} value={c.id} sx={{ fontWeight: 600 }}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={syncing ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <RefreshIcon />}
            onClick={handleGlobalSync}
            disabled={syncing}
            sx={{ borderRadius: 3, textTransform: 'none', px: 3 }}
          >
            {syncing ? 'Syncing...' : 'Sync Channels'}
          </Button>
        </Box>
      </Box>

      {/* Metric Cards Row */}
      <Grid container spacing={3}>
        {cardData.map((card, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Card sx={{ position: 'relative', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Charts Area */}
      <Grid container spacing={3}>
        {/* Monthly Trend Area Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Monthly Content Types Distribution
              </Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="staticCount" name="Static" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="carouselCount" name="Carousel" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="reelCount" name="Reel" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="totalCount" name="Total" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Platform Share Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                {selectedCityId === 'ALL' ? 'City Post Shares' : 'Content Type Shares'}
              </Typography>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.platformPerformance.filter(p => p.posts > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="posts"
                      nameKey="platform"
                    >
                      {data.platformPerformance.map((entry, idx) => (
                        <PieCell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              {/* Custom Legend */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                {data.platformPerformance.map((entry, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[idx % COLORS.length] }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {entry.platform}: {entry.posts}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Trends Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Daily Publications Trend (Last 10 Days)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="staticCount" name="Static" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="carouselCount" name="Carousel" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="reelCount" name="Reel" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* City Achievements Leaderboard */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                City Performance Ranking
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: 'none', flexGrow: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total Posts</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Daily Target %</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Pending</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.cityPerformance.map((city) => (
                      <TableRow key={city.cityId}>
                        <TableCell sx={{ fontWeight: 600 }}>{city.cityName}</TableCell>
                        <TableCell align="right">{city.posts}</TableCell>
                        <TableCell align="right" sx={{ width: '35%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={city.achievementRate}
                                color={city.achievementRate >= 80 ? 'success' : city.achievementRate >= 50 ? 'warning' : 'error'}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {city.achievementRate.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: city.pending > 0 ? 'error.main' : 'success.main' }}>
                          {city.pending}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
