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
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Assessment as ReportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Task as TaskIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { City, Report } from '../types';

export default function Reports() {
  const [cities, setCities] = useState<City[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);

  // Form states
  const [selectedCityId, setSelectedCityId] = useState<number | 'GLOBAL'>('GLOBAL');
  const [reportType, setReportType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [reportFormat, setReportFormat] = useState<'PDF' | 'EXCEL'>('PDF');
  const [generating, setGenerating] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const fetchCities = async () => {
    try {
      setLoadingCities(true);
      const res = await api.get('/cities');
      setCities(res.data);
    } catch (err) {
      console.error('Failed to load cities:', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchCities();
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setAlert(null);

    try {
      const cityIdParam = selectedCityId === 'GLOBAL' ? null : selectedCityId;
      await api.post('/reports/generate', null, {
        params: {
          type: reportType,
          format: reportFormat,
          cityId: cityIdParam,
        }
      });

      setAlert({ type: 'success', msg: 'Report compiled successfully!' });
      fetchReports();
    } catch (err) {
      console.error('Report compilation failed:', err);
      setAlert({ type: 'error', msg: 'Report compilation failed.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId: number, filename: string) => {
    try {
      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] as string,
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('File download failed:', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
          Reports Compilation Hub
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate targeted PDF summaries or raw Excel metrics logs.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Generator Form */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <ReportIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Compile Document
                </Typography>
              </Box>

              {alert && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 2 }}>
                  {alert.msg}
                </Alert>
              )}

              <form onSubmit={handleGenerate}>
                <FormControl fullWidth sx={{ mb: 2.5 }}>
                  <InputLabel id="report-city-label">Scope</InputLabel>
                  <Select
                    labelId="report-city-label"
                    value={selectedCityId}
                    label="Scope"
                    onChange={(e) => setSelectedCityId(e.target.value as any)}
                    disabled={loadingCities || generating}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="GLOBAL">Global (All Cities)</MenuItem>
                    {cities.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2.5 }}>
                  <InputLabel id="report-type-label">Interval</InputLabel>
                  <Select
                    labelId="report-type-label"
                    value={reportType}
                    label="Interval"
                    onChange={(e) => setReportType(e.target.value as any)}
                    disabled={generating}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="DAILY">Daily Report</MenuItem>
                    <MenuItem value="WEEKLY">Weekly Report</MenuItem>
                    <MenuItem value="MONTHLY">Monthly Report</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 4 }}>
                  <InputLabel id="report-format-label">Output Format</InputLabel>
                  <Select
                    labelId="report-format-label"
                    value={reportFormat}
                    label="Output Format"
                    onChange={(e) => setReportFormat(e.target.value as any)}
                    disabled={generating}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="PDF">PDF Document</MenuItem>
                    <MenuItem value="EXCEL">Excel Worksheet</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={generating}
                  startIcon={generating ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <TaskIcon />}
                >
                  {generating ? 'Compiling...' : 'Generate File'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* History Log Table */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Compilation History Log
              </Typography>

              {loadingReports ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : reports.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                  No reports have been compiled yet. Use the panel on the left to compile a report.
                </Typography>
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', flexGrow: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>File ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Scope</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Generated At</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Download</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((r) => {
                        const pathParts = r.filePath.split(/[\\/]/);
                        const filename = pathParts[pathParts.length - 1];
                        const isPdf = filename.toLowerCase().endsWith('.pdf');

                        return (
                          <TableRow key={r.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>#{r.id}</TableCell>
                            <TableCell>{r.city ? r.city.name : 'Global'}</TableCell>
                            <TableCell>
                              <Chip
                                label={r.reportType}
                                size="small"
                                icon={isPdf ? <PdfIcon /> : <ExcelIcon />}
                                color={isPdf ? 'error' : 'success'}
                                variant="outlined"
                                sx={{ fontWeight: 600, px: 0.5 }}
                              />
                            </TableCell>
                            <TableCell>
                              {r.generatedAt ? new Date(r.generatedAt).toLocaleString() : 'N/A'}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Download File">
                                <IconButton
                                  color="primary"
                                  onClick={() => handleDownload(r.id, filename)}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
