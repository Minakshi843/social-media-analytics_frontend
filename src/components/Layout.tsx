import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  LocationCity as CityIcon,
  Share as SocialIcon,
  TrackChanges as TargetIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
  AccountCircle as UserIcon,
} from '@mui/icons-material';

const drawerWidth = 260;

interface LayoutProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Layout({ darkMode, toggleDarkMode }: LayoutProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Cities', icon: <CityIcon />, path: '/cities' },
    { text: 'Social Accounts', icon: <SocialIcon />, path: '/accounts' },
    { text: 'Targets', icon: <TargetIcon />, path: '/targets' },
    { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
  ];

  const username = localStorage.getItem('username') || 'Admin';
  const role = localStorage.getItem('role') || 'ROLE_ADMIN';
  const email = localStorage.getItem('email') || '';

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          S
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5, color: 'text.primary' }}>
          SocialPulse
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.25,
                  bgcolor: isActive ? 'primary.light' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.light' : theme.palette.mode === 'light' ? '#f1f5f9' : '#334155',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.contrastText' : 'text.secondary', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
          {username.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
            {username}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {role === 'ROLE_SUPERADMIN' ? 'Super Administrator' : role === 'ROLE_ADMIN' ? 'Administrator' : 'Viewer'}
          </Typography>
          {email && (
            <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ fontSize: '0.7rem' }}>
              {email}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={handleLogout} sx={{ ml: 'auto', color: 'error.main' }}>
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'City Profile'}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton onClick={toggleDarkMode} color="inherit" sx={{ mr: 1 }}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          <Button
            onClick={handleMenuOpen}
            color="inherit"
            startIcon={<Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.85rem' }}>{username.charAt(0).toUpperCase()}</Avatar>}
            sx={{ fontWeight: 600, py: 0.5, borderRadius: 3 }}
          >
            {username}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleLogout} sx={{ gap: 1.5, color: 'error.main', fontWeight: 600 }}>
              <LogoutIcon fontSize="small" /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: `1px solid ${theme.palette.divider}` },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, sm: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          bgcolor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
