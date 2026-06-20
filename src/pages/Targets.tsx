import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { City, Target } from '../types';

export default function Targets() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states per platform
  const [platformTargets, setPlatformTargets] = useState<Record<string, {
    dailyStaticTarget: number;
    dailyCarouselTarget: number;
    dailyReelTarget: number;
    dailyPostTarget: number;
  }>>({
    INSTAGRAM: { dailyStaticTarget: 0, dailyCarouselTarget: 0, dailyReelTarget: 0, dailyPostTarget: 0 },
    FACEBOOK: { dailyStaticTarget: 0, dailyCarouselTarget: 0, dailyReelTarget: 0, dailyPostTarget: 0 },
    LINKEDIN: { dailyStaticTarget: 0, dailyCarouselTarget: 0, dailyReelTarget: 0, dailyPostTarget: 0 },
    X: { dailyStaticTarget: 0, dailyCarouselTarget: 0, dailyReelTarget: 0, dailyPostTarget: 0 },
  });

  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

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

  const fetchTargets = async (cityId: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/targets/city/${cityId}`);
      const list: Target[] = res.data;
      
      const defaults = {
        INSTAGRAM: { dailyStaticTarget: 0, dailyCarouselTarget: 0, dailyReelTarget: 0, dailyPostTarget: 0 },
        FACEBOOK: { dailyStaticTarget: 0, dailyCarouselTarget: 0, dailyReelTarget: 0, dailyPostTarget: 0 },
        LINKEDIN: { dailyStaticTarget: 0, dailyCarouselTarget: 0, dailyReelTarget: 0, dailyPostTarget: 0 },
        X: { dailyStaticTarget: 0, dailyCarouselTarget: 0, dailyReelTarget: 0, dailyPostTarget: 0 },
      };

      list.forEach((t) => {
        if (defaults[t.platform as keyof typeof defaults]) {
          defaults[t.platform as keyof typeof defaults] = {
            dailyStaticTarget: t.dailyStaticTarget,
            dailyCarouselTarget: t.dailyCarouselTarget,
            dailyReelTarget: t.dailyReelTarget,
            dailyPostTarget: t.dailyPostTarget,
          };
        }
      });

      setPlatformTargets(defaults);
      setTargets(list);
    } catch (err) {
      console.error('Failed to load targets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCityId !== '') {
      fetchTargets(selectedCityId);
    }
  }, [selectedCityId]);

  const handleInputChange = (platform: string, field: string, value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    setPlatformTargets((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: num,
      },
    }));
  };

  const handleSave = async (platform: string) => {
    if (selectedCityId === '') return;

    setSaving((prev) => ({ ...prev, [platform]: true }));
    try {
      const payload = {
        platform,
        ...platformTargets[platform],
      };

      await api.post(`/targets/city/${selectedCityId}`, payload);
      setAlertMsg(`Successfully saved targets configuration for ${platform}.`);
      setAlertOpen(true);
    } catch (err) {
      console.error('Failed to update targets:', err);
      setAlertMsg('Failed to update targets configurations.');
      setAlertOpen(true);
    } finally {
      setSaving((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const platforms = [
    { name: 'INSTAGRAM', label: 'Instagram', icon: <InstagramIcon sx={{ color: '#e1306c' }} /> },
    { name: 'FACEBOOK', label: 'Facebook', icon: <FacebookIcon sx={{ color: '#1877f2' }} /> },
    { name: 'LINKEDIN', label: 'LinkedIn', icon: <LinkedInIcon sx={{ color: '#0a66c2' }} /> },
    { name: 'X', label: 'X (Twitter)', icon: <TwitterIcon sx={{ color: '#1da1f2' }} /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Target Engine Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Set daily publishing goals for each content category per platform.
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
              {cities.map((c) => (
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
          {platforms.map((p) => {
            const values = platformTargets[p.name];
            return (
              <Grid item xs={12} md={6} key={p.name}>
                <Card>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      {p.icon}
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {p.label}
                      </Typography>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Daily Static Target"
                          type="number"
                          value={values.dailyStaticTarget}
                          onChange={(e) => handleInputChange(p.name, 'dailyStaticTarget', e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Daily Carousel Target"
                          type="number"
                          value={values.dailyCarouselTarget}
                          onChange={(e) => handleInputChange(p.name, 'dailyCarouselTarget', e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Daily Reel Target"
                          type="number"
                          value={values.dailyReelTarget}
                          onChange={(e) => handleInputChange(p.name, 'dailyReelTarget', e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Daily Post Target (Overall)"
                          type="number"
                          value={values.dailyPostTarget}
                          onChange={(e) => handleInputChange(p.name, 'dailyPostTarget', e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      </Grid>
                    </Grid>

                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={saving[p.name] ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SaveIcon />}
                      onClick={() => handleSave(p.name)}
                      disabled={saving[p.name]}
                    >
                      {saving[p.name] ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Save Notification */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={3000}
        onClose={() => setAlertOpen(false)}
        message={alertMsg}
      />
    </Box>
  );
}
