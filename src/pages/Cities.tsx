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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocationCity as CityIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { City } from '../types';

export default function Cities() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [cityName, setCityName] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cities');
      setCities(res.data);
    } catch (err) {
      console.error('Failed to load cities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleOpen = () => {
    setCityName('');
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) {
      setError('City name is required.');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await api.post('/cities', { name: cityName });
      handleClose();
      fetchCities();
    } catch (err: any) {
      console.error('Error creating city:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create city.');
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add City
        </Button>
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
                    <Typography variant="caption" color="text.secondary">
                      City ID: {city.id}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => navigate(`/cities/${city.id}`)}
                    sx={{ fontWeight: 700 }}
                  >
                    View Details
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteCity(city.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Add New City</DialogTitle>
        <form onSubmit={handleCreateCity}>
          <DialogContent sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
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
              disabled={actionLoading}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={16} /> : null}
            >
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
