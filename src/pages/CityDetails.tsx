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

      // Fetch all posts (we'll filter client-side by active tab)
      // Since there's no direct search filter post API in details, we can get posts by city and filter.
      // We will write a custom endpoint in post controller or dashboard or just get them.
      // Wait! Let's get the posts. The post records can be fetched from a custom path, or we can filter them from posts DB.
      // Let's call the reports generator query or add a mock fetch. Let's look at what APIs we support.
      // The `PostRepository` supports `findByCityId`. Let's create an endpoint in `SocialAccountController` or a custom posts controller.
      // Wait, we didn't add a PostController. But we have `PostRepository`. Let's quickly verify where we can fetch posts.
      // Oh! Let's add a `/api/posts/city/{cityId}` controller or similar if needed.
      // Wait, did we write a PostController? Let's check.
      // In the controllers list we wrote: Auth, City, SocialAccount, Target, Dashboard, Report.
      // We didn't write a PostController! But we can easily query posts or add a simple mapping.
      // Wait, we can fetch posts in `ReportService` or `DashboardController`.
      // Let's add a quick REST controller mapping in the backend for posts so that we can fetch them!
      // Wait, is it better to add it? Yes! Let's write a simple `PostController.java` to fetch posts for a city.
      // Let's create `PostController.java` right after this! That is extremely clean and avoids errors.
      // For now, let's write `CityDetails.tsx` to call `/api/posts/city/${id}`.
      const postsRes = await api.get(`/posts/city/${id}`);
      setPosts(postsRes.data);
    } catch (err) {
      console.error('Failed to load city details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  // Filter accounts, targets, posts for selected platform tab
  const activeAccount = accounts.find(a => a.platform === activeTab);
  const activeTarget = targets.find(t => t.platform === activeTab);
  const activePosts = posts.filter(p => p.platform === activeTab);

  // Calculate actual post types
  const staticCount = activePosts.filter(p => p.postType === 'STATIC').length;
  const carouselCount = activePosts.filter(p => p.postType === 'CAROUSEL').length;
  const reelCount = activePosts.filter(p => p.postType === 'REEL').length;

  const targetDaily = activeTarget ? activeTarget.getDailyPostTarget || activeTarget.dailyPostTarget : 0;
  
  // To evaluate daily achievement, calculate posts today
  const todayStr = new Date().toISOString().split('T')[0];
  const postsToday = activePosts.filter(p => p.postDate === todayStr).length;

  const achievementRate = targetDaily > 0 ? Math.min(100, (postsToday / targetDaily) * 100) : (postsToday > 0 ? 100 : 0);
  const pendingCount = Math.max(0, targetDaily - postsToday);

  const platforms = [
    { label: 'Instagram', value: 'INSTAGRAM' },
    { label: 'Facebook', value: 'FACEBOOK' },
    { label: 'LinkedIn', value: 'LINKEDIN' },
    { label: 'X (Twitter)', value: 'X' },
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
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              {city.name} Profile
            </Typography>
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
