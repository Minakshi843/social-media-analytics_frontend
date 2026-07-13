import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Switch,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import api from '../services/api';
import { User } from '../types';

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePermissionToggle = async (id: number, field: string, currentValue: boolean) => {
    try {
      // Optimistic state update
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === id ? { ...u, [field]: !currentValue } : u))
      );

      await api.put(`/users/${id}/permissions`, {
        [field]: !currentValue,
      });
    } catch (err) {
      console.error('Failed to update permission:', err);
      setError('Failed to update user permission. Reverting...');
      // Fetch users again to revert state on error
      fetchUsers();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Title */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
          User & Permissions Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure feature permissions and access rights for Admin accounts.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Main Users Table */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 800 }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Can Add Cities</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Can Connect Accounts</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Can Modify Targets</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No administrator accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{user.username}</TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role.replace('ROLE_', '')}
                          size="small"
                          color={user.role === 'ROLE_SUPERADMIN' ? 'secondary' : 'primary'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      
                      {/* Can Add City Switch */}
                      <TableCell align="center">
                        <Switch
                          checked={user.canAddCity !== false}
                          onChange={() => handlePermissionToggle(user.id, 'canAddCity', user.canAddCity !== false)}
                          color="success"
                        />
                      </TableCell>

                      {/* Can Connect Accounts Switch */}
                      <TableCell align="center">
                        <Switch
                          checked={user.canConnectAccounts !== false}
                          onChange={() => handlePermissionToggle(user.id, 'canConnectAccounts', user.canConnectAccounts !== false)}
                          color="success"
                        />
                      </TableCell>

                      {/* Can Modify Targets Switch */}
                      <TableCell align="center">
                        <Switch
                          checked={user.canUpdateTargets !== false}
                          onChange={() => handlePermissionToggle(user.id, 'canUpdateTargets', user.canUpdateTargets !== false)}
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
