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
} from '@mui/material';
import {
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { City, SocialAccount } from '../types';

export default function SocialAccounts() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Connection Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountUrl, setAccountUrl] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);

  const fetchCities = async () => {
    try {
      const res = await api.get('/cities');
      setCities(res.data);
      if (res.data.length > 0) {
        setSelectedCityId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  const fetchAccounts = async (cityId: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/social-accounts/city/${cityId}`);
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCityId !== '') {
      fetchAccounts(selectedCityId);
    }
  }, [selectedCityId]);

  const handleOpenConnect = (platform: string) => {
    setSelectedPlatform(platform);
    setAccountName('');
    setAccountUrl('');
    setDialogError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setDialogError('Account name is required.');
      return;
    }

    setDialogLoading(true);
    setDialogError('');

    try {
      // Simulate platform login & user permission grant handshake
      await new Promise(resolve => setTimeout(resolve, 800)); // micro delay for realism

      await api.post(`/social-accounts/connect`, null, {
        params: {
          cityId: selectedCityId,
          platform: selectedPlatform,
          accountName,
          accountUrl: accountUrl || `https://${selectedPlatform.toLowerCase()}.com/${accountName.toLowerCase()}`,
        }
      });

      handleCloseDialog();
      if (selectedCityId !== '') {
        fetchAccounts(selectedCityId);
      }
    } catch (err) {
      console.error('Connection failed:', err);
      setDialogError('OAuth token exchange failed. Please verify API access permissions.');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDisconnect = async (accountId: number) => {
    if (!window.confirm('Disconnecting this channel deletes stored tokens and synced posts. Proceed?')) {
      return;
    }

    try {
      await api.delete(`/social-accounts/${accountId}`);
      if (selectedCityId !== '') {
        fetchAccounts(selectedCityId);
      }
    } catch (err) {
      console.error('Disconnection failed:', err);
    }
  };

  const platformsList = [
    { name: 'INSTAGRAM', label: 'Instagram Graph API', icon: <InstagramIcon sx={{ fontSize: 40, color: '#e1306c' }} /> },
    { name: 'FACEBOOK', label: 'Facebook Pages API', icon: <FacebookIcon sx={{ fontSize: 40, color: '#1877f2' }} /> },
    { name: 'LINKEDIN', label: 'LinkedIn Company API', icon: <LinkedInIcon sx={{ fontSize: 40, color: '#0a66c2' }} /> },
    { name: 'X', label: 'X (Twitter) Developer API', icon: <TwitterIcon sx={{ fontSize: 40, color: '#1da1f2' }} /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header & City Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Integrations &amp; OAuth Connections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect city profiles to their respective platform API keys and fetch feeds.
          </Typography>
        </Box>

        {cities.length > 0 && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="city-select-label">Select City</InputLabel>
            <Select
              labelId="city-select-label"
              value={selectedCityId}
              label="Select City"
              onChange={(e) => setSelectedCityId(Number(e.target.value))}
              sx={{ borderRadius: 3 }}
            >
              {cities.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {cities.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No cities found. Define cities in the configuration panel first.
        </Alert>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {platformsList.map((p) => {
            const connectedAccount = accounts.find(a => a.platform === p.name);
            return (
              <Grid item xs={12} sm={6} key={p.name}>
                <Card sx={{ height: '100%', position: 'relative' }}>
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      {p.icon}
                      <Chip
                        label={connectedAccount ? 'Connected' : 'Disconnected'}
                        color={connectedAccount ? 'success' : 'default'}
                        variant={connectedAccount ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                      {p.label}
                    </Typography>

                    {connectedAccount ? (
                      <Box sx={{ flexGrow: 1, mb: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Account Name: {connectedAccount.accountName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, wordBreak: 'break-all' }}>
                          URL: {connectedAccount.accountUrl}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, display: 'block' }}>
                          OAuth Token Expiry: 60 days remaining
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, flexGrow: 1 }}>
                        Authorize secure access to ingest static posts, multiple images, video reels, and retrieve interactions logs.
                      </Typography>
                    )}

                    <Box sx={{ mt: 'auto' }}>
                      {connectedAccount ? (
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={<LinkOffIcon />}
                          onClick={() => handleDisconnect(connectedAccount.id)}
                        >
                          Disconnect Channel
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<LinkIcon />}
                          onClick={() => handleOpenConnect(p.name)}
                        >
                          Connect Account
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Connection Handshake Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Connect to {selectedPlatform}</DialogTitle>
        <form onSubmit={handleConnect}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {dialogError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {dialogError}
              </Alert>
            )}
            
            <Typography variant="body2" color="text.secondary">
              Simulating the secure OAuth connections. Fill in page name parameters to fetch target streams.
            </Typography>

            <TextField
              fullWidth
              label="Account / Page Name"
              placeholder="e.g. MunicipalCorporation"
              variant="outlined"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={dialogLoading}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />

            <TextField
              fullWidth
              label="Account URL (Optional)"
              placeholder="Leave blank for automatic formatting"
              variant="outlined"
              value={accountUrl}
              onChange={(e) => setAccountUrl(e.target.value)}
              disabled={dialogLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} disabled={dialogLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={dialogLoading}
              startIcon={dialogLoading ? <CircularProgress size={16} /> : null}
            >
              Connect OAuth
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
