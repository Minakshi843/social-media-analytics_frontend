import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
  ThumbUp as LikesIcon,
  Comment as CommentsIcon,
  Visibility as ImpressionsIcon,
  People as ReachIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { City, Target, SocialAccount, Post } from '../types';

export default function CityDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [city, setCity] = useState<City | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('INSTAGRAM');
  const [citiesList, setCitiesList] = useState<City[]>([]);
  
  // Filtering States
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [postTypeFilter, setPostTypeFilter] = useState<'ALL' | 'STATIC' | 'CAROUSEL' | 'REEL'>('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch city
      const cityRes = await api.get(`/cities/${id}`);
      setCity(cityRes.data);

      // Fetch targets
      const targetsRes = await api.get(`/targets/city/${id}`);
      setTargets(targetsRes.data);

      // Fetch accounts
      const accountsRes = await api.get(`/social-accounts/city/${id}`);
      setAccounts(accountsRes.data);

      const postsRes = await api.get(`/posts/city/${id}`);
      setPosts(postsRes.data);
    } catch (err) {
      console.error('Failed to load city details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load cities list for dropdown selection and default redirection
  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await api.get('/cities');
        setCitiesList(res.data);
        // If there's no id in URL and we have cities, redirect to the first city
        if (!id && res.data.length > 0) {
          navigate(`/city-profile/${res.data[0].id}`, { replace: true });
        }
      } catch (err) {
        console.error('Failed to load cities list:', err);
      }
    };
    loadCities();
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSyncCity = async () => {
    if (!city) return;
    try {
      setSyncing(true);
      await api.post(`/social-accounts/city/${city.id}/sync`);
      await fetchData();
    } catch (err) {
      console.error('Failed to sync city accounts:', err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !city) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!city) {
    return (
      <Alert severity="error">
        City not found. <Button onClick={() => navigate('/cities')}>Go Back</Button>
      </Alert>
    );
  }

  // Filter accounts, targets, posts for selected platform tab and filters
  const activeAccount = accounts.find(a => a.platform === activeTab);
  const activeTarget = targets.find(t => t.platform === activeTab) || {
    dailyStaticTarget: 5,
    dailyCarouselTarget: 2,
    dailyReelTarget: 3,
    dailyPostTarget: 10
  };

  // Get active start and end dates based on preset
  let activeStart = '';
  let activeEnd = '';
  if (datePreset === 'TODAY') {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    activeStart = localDate.toISOString().split('T')[0];
    activeEnd = activeStart;
  } else if (datePreset === '7_DAYS') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    activeStart = d.toISOString().split('T')[0];
  } else if (datePreset === '30_DAYS') {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    activeStart = d.toISOString().split('T')[0];
  } else if (datePreset === 'CUSTOM') {
    activeStart = customStartDate;
    activeEnd = customEndDate;
  }

  // Filter activePosts with date and postType constraints
  const activePosts = posts.filter(p => {
    if (p.platform !== activeTab) return false;
    if (postTypeFilter !== 'ALL' && p.postType !== postTypeFilter) return false;
    if (activeStart && p.postDate < activeStart) return false;
    if (activeEnd && p.postDate > activeEnd) return false;
    return true;
  });

  // Calculate actual post types
  const staticCount = activePosts.filter(p => p.postType === 'STATIC').length;
  const carouselCount = activePosts.filter(p => p.postType === 'CAROUSEL').length;
  const reelCount = activePosts.filter(p => p.postType === 'REEL').length;

  const targetDaily = activeTarget.dailyPostTarget;
  
  // To evaluate daily achievement, calculate posts today
  const todayStr = new Date().toISOString().split('T')[0];
  const postsToday = activePosts.filter(p => p.postDate === todayStr).length;

  const achievementRate = targetDaily > 0 ? Math.min(100, (postsToday / targetDaily) * 100) : (postsToday > 0 ? 100 : 0);
  const pendingCount = Math.max(0, targetDaily - postsToday);

  const platforms = [
    { label: 'Instagram', value: 'INSTAGRAM' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Top Navigation Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/cities')} color="primary">
            <BackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                {city.name} Profile
              </Typography>
              {citiesList.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={city.id}
                    onChange={(e) => navigate(`/city-profile/${e.target.value}`)}
                    sx={{ borderRadius: 3, fontWeight: 700 }}
                  >
                    {citiesList.map((c) => (
                      <MenuItem key={c.id} value={c.id} sx={{ fontWeight: 600 }}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Platform-wise performance details, target metrics, and synchronized feeds.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={syncing ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <RefreshIcon />}
          onClick={handleSyncCity}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync City'}
        </Button>
      </Box>

      {/* Social Integration Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {platforms.map(p => (
            <Tab
              key={p.value}
              label={p.label}
              value={p.value}
              sx={{ fontWeight: 700, fontSize: '0.95rem', px: 3 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Target & Platform Connection Summary */}
      {!activeAccount ? (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {activeTab} is not connected for {city.name}. Navigate to the{' '}
          <strong style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/accounts')}>
            Social Accounts
          </strong>{' '}
          panel to link page credentials.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Filtering Toolbar */}
          <Card sx={{ p: 2.5, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2.5} alignItems="center">
              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth size="small">
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 0.75, display: 'block', color: 'text.secondary' }}>
                    FILTER BY POST TYPE
                  </Typography>
                  <Select
                    value={postTypeFilter}
                    onChange={(e) => setPostTypeFilter(e.target.value as any)}
                    sx={{ borderRadius: 2.5, fontWeight: 700 }}
                  >
                    <MenuItem value="ALL" sx={{ fontWeight: 600 }}>All Content Types</MenuItem>
                    <MenuItem value="STATIC" sx={{ fontWeight: 600 }}>Static Posts</MenuItem>
                    <MenuItem value="CAROUSEL" sx={{ fontWeight: 600 }}>Carousels</MenuItem>
                    <MenuItem value="REEL" sx={{ fontWeight: 600 }}>Reels</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth size="small">
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 0.75, display: 'block', color: 'text.secondary' }}>
                    DATE RANGE PRESET
                  </Typography>
                  <Select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value as any)}
                    sx={{ borderRadius: 2.5, fontWeight: 700 }}
                  >
                    <MenuItem value="ALL" sx={{ fontWeight: 600 }}>All Time</MenuItem>
                    <MenuItem value="TODAY" sx={{ fontWeight: 600 }}>Today</MenuItem>
                    <MenuItem value="7_DAYS" sx={{ fontWeight: 600 }}>Last 7 Days</MenuItem>
                    <MenuItem value="30_DAYS" sx={{ fontWeight: 600 }}>Last 30 Days</MenuItem>
                    <MenuItem value="CUSTOM" sx={{ fontWeight: 600 }}>Custom Date Range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {datePreset === 'CUSTOM' && (
                <>
                  <Grid item xs={12} sm={3} md={3}>
                    <FormControl fullWidth size="small">
                      <Typography variant="caption" sx={{ fontWeight: 800, mb: 0.75, display: 'block', color: 'text.secondary' }}>
                        START DATE
                      </Typography>
                      <TextField
                        size="small"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontWeight: 700 } }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3} md={3}>
                    <FormControl fullWidth size="small">
                      <Typography variant="caption" sx={{ fontWeight: 800, mb: 0.75, display: 'block', color: 'text.secondary' }}>
                        END DATE
                      </Typography>
                      <TextField
                        size="small"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontWeight: 700 } }}
                      />
                    </FormControl>
                  </Grid>
                </>
              )}
            </Grid>
          </Card>

          {/* Target achievement cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Statics (Actual vs Goal)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {staticCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'gray' }}>/ {activeTarget?.dailyStaticTarget || 0} (daily)</span>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Carousels (Actual vs Goal)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {carouselCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'gray' }}>/ {activeTarget?.dailyCarouselTarget || 0} (daily)</span>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Reels (Actual vs Goal)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {reelCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'gray' }}>/ {activeTarget?.dailyReelTarget || 0} (daily)</span>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Achievement Rate / Pending Today
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {achievementRate.toFixed(0)}% <span style={{ fontSize: '1rem', fontWeight: 500, color: '#f43f5e' }}>({pendingCount} pending)</span>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Synchronized Posts Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Synchronized Feed List
              </Typography>
              {activePosts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No posts synchronized. Click "Sync City" to run a feed fetcher.
                </Typography>
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Post ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Caption</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Likes</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Comments</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Reach</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Impressions</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Published At</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Link</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activePosts.map((post) => (
                        <TableRow key={post.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{post.postId}</TableCell>
                          <TableCell>
                            <Chip
                              label={post.postType}
                              size="small"
                              color={post.postType === 'REEL' ? 'success' : post.postType === 'CAROUSEL' ? 'secondary' : 'primary'}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {post.caption}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                              <LikesIcon sx={{ fontSize: 14, color: 'text.secondary' }} /> {post.likes}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                              <CommentsIcon sx={{ fontSize: 14, color: 'text.secondary' }} /> {post.comments}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                              <ReachIcon sx={{ fontSize: 14, color: 'text.secondary' }} /> {post.reach}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                              <ImpressionsIcon sx={{ fontSize: 14, color: 'text.secondary' }} /> {post.impressions}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{post.postDate}</Typography>
                            <Typography variant="caption" color="text.secondary">{post.postTime}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Original Post">
                              <IconButton size="small" component="a" href={post.postUrl} target="_blank" rel="noopener noreferrer">
                                <LaunchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
