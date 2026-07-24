import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid, 
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocationCity as CityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { City, Target } from '../types';

export default function Cities() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [cityName, setCityName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [dailyStaticTarget, setDailyStaticTarget] = useState<number>(5);
  const [dailyCarouselTarget, setDailyCarouselTarget] = useState<number>(2);
  const [dailyReelTarget, setDailyReelTarget] = useState<number>(3);
  const [dailyPostTarget, setDailyPostTarget] = useState<number>(10);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // RBAC Permission checks
  const userRole = localStorage.getItem('role') || 'ROLE_ADMIN';
  const canAddCity = localStorage.getItem('canAddCity') !== 'false';
  const canUpdateTargets = localStorage.getItem('canUpdateTargets') !== 'false';

  const fetchCities = async () => {
    try {
      setLoading(true);
      const [citiesRes, targetsRes] = await Promise.all([
        api.get('/cities'),
        api.get('/targets'),
      ]);
      setCities(citiesRes.data);
      setTargets(targetsRes.data);
    } catch (err) {
      console.error('Failed to load configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // Automatically calculate total daily goal as the sum of Reels, Carousel, and Static targets
  useEffect(() => {
    setDailyPostTarget(dailyReelTarget + dailyCarouselTarget + dailyStaticTarget);
  }, [dailyReelTarget, dailyCarouselTarget, dailyStaticTarget]);

  const handleOpen = (city: City | null = null) => {
    if (city) {
      setEditingCity(city);
      setCityName(city.name);
      setParticipantName(city.participantName || '');
      
      const cityTarget = targets.find(t => t.city?.id === city.id && t.platform === 'INSTAGRAM');
      if (cityTarget) {
        setDailyStaticTarget(cityTarget.dailyStaticTarget);
        setDailyCarouselTarget(cityTarget.dailyCarouselTarget);
        setDailyReelTarget(cityTarget.dailyReelTarget);
        setDailyPostTarget(cityTarget.dailyPostTarget);
      } else {
        setDailyStaticTarget(5);
        setDailyCarouselTarget(2);
        setDailyReelTarget(3);
        setDailyPostTarget(10);
      }
    } else {
      setEditingCity(null);
      setCityName('');
      setParticipantName('');
      setDailyStaticTarget(5);
      setDailyCarouselTarget(2);
      setDailyReelTarget(3);
      setDailyPostTarget(10);
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) {
      setError('City name is required.');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      let targetCityId: number;
      if (editingCity) {
        // Edit Mode
        await api.put(`/cities/${editingCity.id}`, { 
          name: cityName,
          participantName: participantName 
        });
        targetCityId = editingCity.id;
      } else {
        // Create Mode
        const res = await api.post('/cities', { 
          name: cityName,
          participantName: participantName 
        });
        targetCityId = res.data.id;
      }

      // Save/update daily targets for that city immediately on the same action
      await api.post(`/targets/city/${targetCityId}`, {
        platform: 'INSTAGRAM',
        dailyStaticTarget,
        dailyCarouselTarget,
        dailyReelTarget,
        dailyPostTarget,
      });

      handleClose();
      fetchCities();
    } catch (err: any) {
      console.error('Error saving city configuration:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to save configuration.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCity = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this city and all associated social accounts, targets, and analytics?')) {
      return;
    }

    try {
      await api.delete(`/cities/${id}`);
      fetchCities();
    } catch (err) {
      console.error('Failed to delete city:', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Cities Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage municipal reporting boundaries.
          </Typography>
        </Box>
        {(userRole === 'ROLE_SUPERADMIN' || canAddCity) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Add City
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : cities.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No cities configured. Click "Add City" above to define one.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {cities.map((city) => (
            <Grid item xs={12} sm={6} md={4} key={city.id}>
              <Card>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.contrastText',
                    }}
                  >
                    <CityIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {city.name}
                    </Typography>
                    {city.participantName && (
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 600, mt: 0.5 }}>
                        Expert: {city.participantName}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      City ID: {city.id}
                    </Typography>
                    
                    {/* Dynamic Target Summary on City Card */}
                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 3, width: '100%', minWidth: 200 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: 'text.secondary', mb: 0.75 }}>
                        DAILY INSTAGRAM GOALS:
                      </Typography>
                      <Grid container spacing={0.5}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }} display="block">🎬 Reels: <strong>{targets.find(t => t.city?.id === city.id)?.dailyReelTarget ?? 3}</strong></Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }} display="block">🖼️ Carousel: <strong>{targets.find(t => t.city?.id === city.id)?.dailyCarouselTarget ?? 2}</strong></Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }} display="block">📸 Static: <strong>{targets.find(t => t.city?.id === city.id)?.dailyStaticTarget ?? 5}</strong></Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }} display="block">📊 Total: <strong>{targets.find(t => t.city?.id === city.id)?.dailyPostTarget ?? 10}</strong></Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => navigate(`/city-profile/${city.id}`)}
                    sx={{ fontWeight: 700 }}
                  >
                    View Details
                  </Button>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {(userRole === 'ROLE_SUPERADMIN' || canUpdateTargets) && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpen(city)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {userRole === 'ROLE_SUPERADMIN' && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCity(city.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingCity ? 'Edit City' : 'Add New City'}
        </DialogTitle>
        <form onSubmit={handleSaveCity}>
          <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 1, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              label="City Name"
              placeholder="e.g. PCMC"
              variant="outlined"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              disabled={actionLoading || !canAddCity}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
            <TextField
              fullWidth
              label="Social Media Expert Name"
              placeholder="e.g. Sachin Mahajan"
              variant="outlined"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              disabled={actionLoading || !canAddCity}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
              Daily Instagram Targets
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Daily Reels"
                  value={dailyReelTarget}
                  onChange={(e) => setDailyReelTarget(parseInt(e.target.value) || 0)}
                  disabled={actionLoading || !canUpdateTargets}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Daily Carousel"
                  value={dailyCarouselTarget}
                  onChange={(e) => setDailyCarouselTarget(parseInt(e.target.value) || 0)}
                  disabled={actionLoading || !canUpdateTargets}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Daily Static"
                  value={dailyStaticTarget}
                  onChange={(e) => setDailyStaticTarget(parseInt(e.target.value) || 0)}
                  disabled={actionLoading || !canUpdateTargets}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Daily Total Goal (Auto)"
                  value={dailyPostTarget}
                  InputProps={{ readOnly: true }}
                  disabled={actionLoading}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { borderRadius: 3 },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading || (editingCity ? (!canAddCity && !canUpdateTargets) : !canAddCity)}
              startIcon={actionLoading ? <CircularProgress size={16} /> : null}
            >
              {editingCity ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
