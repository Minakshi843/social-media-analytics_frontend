import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { City, SocialAccount } from '../types';

export default function SocialAccounts() {
  const [cities, setCities] = useState<City[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCityId, setFilterCityId] = useState<number | 'ALL'>('ALL');
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');

  // Callback Status Banner
  const [alertInfo, setAlertInfo] = useState<{ severity: 'success' | 'error'; message: String } | null>(null);

  // CRUD Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);

  // Form Fields
  const [formCityId, setFormCityId] = useState<number | ''>('');
  const [formPlatform, setFormPlatform] = useState('');
  const [formAccountName, setFormAccountName] = useState('');
  const [formAccountHandle, setFormAccountHandle] = useState('');
  const [formAccountUrl, setFormAccountUrl] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);

  const fetchCities = async () => {
    try {
      const res = await api.get('/cities');
      setCities(res.data);
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/social-accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
    fetchAccounts();

    // Check url search params for OAuth callback response
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const platform = params.get('platform');
    if (status === 'success') {
      setAlertInfo({
        severity: 'success',
        message: `Successfully authenticated ${platform || 'channel'} account via OAuth!`,
      });
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'error') {
      setAlertInfo({
        severity: 'error',
        message: `OAuth authentication handshake failed for ${platform || 'channel'}. Please verify client secrets and access rights.`,
      });
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleOpenAdd = () => {
    setFormCityId(cities.length > 0 ? cities[0].id : '');
    setFormPlatform('INSTAGRAM');
    setFormAccountName('');
    setFormAccountHandle('');
    setFormAccountUrl('');
    setDialogError('');
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (account: SocialAccount) => {
    setSelectedAccount(account);
    setFormAccountName(account.accountName);
    setFormAccountHandle(account.accountHandle);
    setFormAccountUrl(account.accountUrl);
    setDialogError('');
    setEditDialogOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCityId || !formPlatform || !formAccountName.trim() || !formAccountHandle.trim()) {
      setDialogError('Please fill in all required fields.');
      return;
    }

    setDialogLoading(true);
    setDialogError('');

    try {
      const generatedUrl = formAccountUrl.trim() 
        ? formAccountUrl.trim() 
        : `https://${formPlatform.toLowerCase()}.com/${formAccountHandle.replace('@', '').toLowerCase()}`;

      await api.post('/social-accounts', {
        cityId: formCityId,
        platform: formPlatform,
        accountName: formAccountName,
        accountHandle: formAccountHandle.startsWith('@') ? formAccountHandle : `@${formAccountHandle}`,
        accountUrl: generatedUrl,
      });

      setAddDialogOpen(false);
      fetchAccounts();
    } catch (err: any) {
      console.error(err);
      setDialogError(err.response?.data?.message || 'Failed to create social account.');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    if (!formAccountName.trim() || !formAccountHandle.trim() || !formAccountUrl.trim()) {
      setDialogError('All fields are required.');
      return;
    }

    setDialogLoading(true);
    setDialogError('');

    try {
      await api.put(`/social-accounts/${selectedAccount.id}`, {
        accountName: formAccountName,
        accountHandle: formAccountHandle.startsWith('@') ? formAccountHandle : `@${formAccountHandle}`,
        accountUrl: formAccountUrl,
      });

      setEditDialogOpen(false);
      fetchAccounts();
    } catch (err: any) {
      console.error(err);
      setDialogError(err.response?.data?.message || 'Failed to update social account.');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this social account integration?')) {
      return;
    }
    try {
      await api.delete(`/social-accounts/${id}`);
      fetchAccounts();
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  const handleOAuthConnect = (platform: string, cityId: number) => {
    // Redirect browser to spring boot authorize callback
    const authorizeUrl = `http://localhost:8080/api/oauth/${platform.toLowerCase()}/authorize?cityId=${cityId}`;
    window.location.href = authorizeUrl;
  };

  const handleOAuthDisconnect = async (platform: string, cityId: number) => {
    if (!window.confirm(`Disconnect OAuth tokens for ${platform}? This stops automated feeds ingestion.`)) {
      return;
    }
    try {
      await api.post(`/oauth/${platform.toLowerCase()}/disconnect?cityId=${cityId}`);
      fetchAccounts();
      setAlertInfo({
        severity: 'success',
        message: `Successfully disconnected ${platform} OAuth access tokens.`,
      });
    } catch (err) {
      console.error('Disconnect failed:', err);
      setAlertInfo({
        severity: 'error',
        message: `Failed to disconnect ${platform} account.`,
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return <InstagramIcon sx={{ color: '#e1306c', fontSize: 28 }} />;
      case 'FACEBOOK':
        return <FacebookIcon sx={{ color: '#1877f2', fontSize: 28 }} />;
      case 'LINKEDIN':
        return <LinkedInIcon sx={{ color: '#0a66c2', fontSize: 28 }} />;
      case 'X':
        return <TwitterIcon sx={{ color: '#ffffff', fontSize: 28 }} />;
      default:
        return null;
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Chip label="Connected" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case 'TOKEN_EXPIRED':
        return <Chip label="Token Expired" color="warning" size="small" sx={{ fontWeight: 700 }} />;
      case 'ERROR':
        return <Chip label="Error" color="error" size="small" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label="Not Connected" color="default" variant="outlined" size="small" sx={{ fontWeight: 700 }} />;
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountHandle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = filterCityId === 'ALL' || account.cityId === filterCityId;
    const matchesPlatform = filterPlatform === 'ALL' || account.platform === filterPlatform;

    return matchesSearch && matchesCity && matchesPlatform;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header and Add Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Social Channels &amp; OAuth Integrations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage profile connection parameters, verify tokens, and link city dashboards to target social pages.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: 3, textTransform: 'none', px: 3 }}
        >
          Add Channel Profile
        </Button>
      </Box>

      {alertInfo && (
        <Alert
          severity={alertInfo.severity}
          onClose={() => setAlertInfo(null)}
          sx={{ borderRadius: 3 }}
        >
          {alertInfo.message}
        </Alert>
      )}

      {/* Filter and Search Panel */}
      <Card sx={{ p: 2, borderRadius: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-city-label">Filter by City</InputLabel>
              <Select
                labelId="filter-city-label"
                value={filterCityId}
                label="Filter by City"
                onChange={(e) => setFilterCityId(e.target.value as number | 'ALL')}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="ALL">All Cities</MenuItem>
                {cities.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-platform-label">Filter by Platform</InputLabel>
              <Select
                labelId="filter-platform-label"
                value={filterPlatform}
                label="Filter by Platform"
                onChange={(e) => setFilterPlatform(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="ALL">All Platforms</MenuItem>
                <MenuItem value="INSTAGRAM">Instagram</MenuItem>
                <MenuItem value="FACEBOOK">Facebook</MenuItem>
                <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
                <MenuItem value="X">X (Twitter)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Refresh Channel Statuses">
              <IconButton onClick={fetchAccounts} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Card>

      {/* Accounts Listing */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredAccounts.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No connected social channels found matching the selected filters. Click 'Add Channel Profile' to create one.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredAccounts.map((account) => (
            <Grid item xs={12} sm={6} md={4} key={account.id}>
              <Card sx={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  
                  {/* Platform & Status Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getPlatformIcon(account.platform)}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {account.platform}
                      </Typography>
                    </Box>
                    {getStatusChip(account.connectionStatus)}
                  </Box>

                  {/* Core Details */}
                  <Box sx={{ my: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {account.accountName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {account.accountHandle}
                    </Typography>
                    <Chip
                      label={account.cityName}
                      size="small"
                      sx={{ mt: 1.5, fontWeight: 700, backgroundColor: 'action.selected' }}
                    />
                  </Box>

                  {/* clickable channel URL */}
                  <Typography
                    variant="caption"
                    color="primary"
                    component="a"
                    href={account.accountUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textDecoration: 'none', display: 'block', wordBreak: 'break-all', mt: 'auto', mb: 1, '&:hover': { textDecoration: 'underline' } }}
                  >
                    {account.accountUrl}
                  </Typography>

                  {/* Dynamic Action Buttons */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    {account.connectionStatus === 'CONNECTED' ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<LinkOffIcon />}
                        onClick={() => handleOAuthDisconnect(account.platform, account.cityId)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Disconnect Token
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<LinkIcon />}
                        onClick={() => handleOAuthConnect(account.platform, account.cityId)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Connect OAuth
                      </Button>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEdit(account)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Edit
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(account.id)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>

                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Account Handshake Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Add Channel Profile</DialogTitle>
        <form onSubmit={handleAddSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {dialogError && <Alert severity="error" sx={{ borderRadius: 2 }}>{dialogError}</Alert>}

            <FormControl fullWidth>
              <InputLabel id="add-city-select-label">Assign to City</InputLabel>
              <Select
                labelId="add-city-select-label"
                value={formCityId}
                label="Assign to City"
                onChange={(e) => setFormCityId(Number(e.target.value))}
                disabled={dialogLoading}
                sx={{ borderRadius: 3 }}
              >
                {cities.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="add-platform-select-label">Platform</InputLabel>
              <Select
                labelId="add-platform-select-label"
                value={formPlatform}
                label="Platform"
                onChange={(e) => setFormPlatform(e.target.value)}
                disabled={dialogLoading}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="INSTAGRAM">Instagram</MenuItem>
                <MenuItem value="FACEBOOK">Facebook</MenuItem>
                <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
                <MenuItem value="X">X (Twitter)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Account Name"
              placeholder="e.g. PCMC Official Feed"
              value={formAccountName}
              onChange={(e) => setFormAccountName(e.target.value)}
              disabled={dialogLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              label="Account Handle"
              placeholder="e.g. @pcmc_official"
              value={formAccountHandle}
              onChange={(e) => setFormAccountHandle(e.target.value)}
              disabled={dialogLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              label="Account URL (Optional)"
              placeholder="Leave blank for automatic platform formatting"
              value={formAccountUrl}
              onChange={(e) => setFormAccountUrl(e.target.value)}
              disabled={dialogLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setAddDialogOpen(false)} disabled={dialogLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={dialogLoading}
              startIcon={dialogLoading ? <CircularProgress size={16} /> : null}
            >
              Add Profile
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Channel Profile</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {dialogError && <Alert severity="error" sx={{ borderRadius: 2 }}>{dialogError}</Alert>}

            <TextField
              fullWidth
              label="Account Name"
              value={formAccountName}
              onChange={(e) => setFormAccountName(e.target.value)}
              disabled={dialogLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              label="Account Handle"
              value={formAccountHandle}
              onChange={(e) => setFormAccountHandle(e.target.value)}
              disabled={dialogLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              label="Account URL"
              value={formAccountUrl}
              onChange={(e) => setFormAccountUrl(e.target.value)}
              disabled={dialogLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditDialogOpen(false)} disabled={dialogLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={dialogLoading}
              startIcon={dialogLoading ? <CircularProgress size={16} /> : null}
            >
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
