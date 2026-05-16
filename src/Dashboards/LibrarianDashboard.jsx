import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Container, 
    Grid, 
    Typography, 
    Paper, 
    Divider, 
    Drawer, 
    List, 
    ListItem, 
    ListItemIcon, 
    ListItemText,
    Card,
    CardContent,
    Stack,
    Avatar,
    Badge,
    Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LiveBorrowingTable from '../Pages/librarian/LiveBorrowingTable';
import PendingPasses from '../Pages/librarian/PendingPasses';
import BookInventory from '../Pages/librarian/BookInventory';
import MemberManagement from '../Pages/librarian/MemberManagement';
import LibrarianProfile from '../Pages/librarian/LibrarianProfile';
import { 
    Dashboard as DashboardIcon, 
    Book, 
    People, 
    Badge as BadgeIcon, 
    ReportProblem, 
    Notifications,
    Download,
    Logout,
    Person
} from '@mui/icons-material';
import api from '../api/client';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { resolveProfileImageUrl } from '../utils/resolveProfileImageUrl';

const drawerWidth = 240;

const LibrarianDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        overdueBooks: 0,
        pendingRequests: 0,
        issuedToday: 0,
        newMembers: 0,
        borrowingTrend: []
    });
    const [currentView, setCurrentView] = useState('dashboard');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/library/dashboard/stats');
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        fetchStats();
    }, []);

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, view: 'dashboard' },
        { text: 'Book Inventory', icon: <Book />, view: 'inventory' },
        { text: 'Member Management', icon: <People />, view: 'members' },
        { text: 'ID Requests', icon: <BadgeIcon />, view: 'requests' },
        { text: 'Reports', icon: <ReportProblem />, view: 'reports' },
        { text: 'Profile', icon: <Person />, view: 'profile' },
    ];

    const handleDownloadReport = async () => {
        try {
            const response = await api.get('/library/dashboard/stats/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `library_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Failed to download report", error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/librarian-login');
    };

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            {/* 1. Persistent Side Navigation */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#1e293b', color: 'white' },
                }}
            >
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" color="inherit">GEN-C LIBRARY</Typography>
                </Box>
                <List>
                    {menuItems.map((item, index) => (
                        <ListItem 
                            button 
                            key={item.text} 
                            onClick={() => setCurrentView(item.view)}
                            sx={{ mb: 1, bgcolor: currentView === item.view ? 'rgba(255,255,255,0.1)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            <ListItemIcon sx={{ color: currentView === item.view ? '#fff' : 'rgba(255,255,255,0.7)' }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                    <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <ListItem button onClick={handleLogout} sx={{ mb: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)' }}><Logout /></ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItem>
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                {/* Top Bar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">{currentView === 'dashboard' ? 'Dashboard Overview' : menuItems.find(i => i.view === currentView)?.text}</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button 
                            variant="outlined" 
                            startIcon={<Download />} 
                            onClick={handleDownloadReport}
                            sx={{ bgcolor: 'white', borderColor: '#e0e0e0', color: 'text.primary', '&:hover': { bgcolor: '#f5f5f5' } }}
                        >
                            Download Report
                        </Button>
                        <Typography variant="body2" color="text.secondary">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
                        <Notifications color="action" />
                        <Avatar 
                            src={user?.profilePictureUrl ? resolveProfileImageUrl(user.profilePictureUrl) : undefined}
                            alt={user?.fullName || 'Librarian'}
                            sx={{ width: 32, height: 32, bgcolor: 'primary.main', cursor: 'pointer' }}
                            onClick={() => setCurrentView('profile')}
                        >{user?.fullName?.charAt(0).toUpperCase() || 'L'}</Avatar>
                    </Stack>
                </Box>

                {currentView === 'dashboard' && (
                    <>
                        {/* 2. Quick Action Stats */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <StatCard title="Total Overdue" value={stats.overdueBooks} color="#ef4444" icon={<ReportProblem />} />
                            <StatCard title="Pending IDs" value={stats.pendingRequests} color="#f59e0b" icon={<BadgeIcon />} />
                            <StatCard title="Issued Today" value={stats.issuedToday} color="#3b82f6" icon={<Book />} />
                            <StatCard title="New Members" value={stats.newMembers} color="#10b981" icon={<People />} />
                        </Grid>

                        {/* Main Content Grid */}
                        <Grid container spacing={3}>
                            {/* Chart Section - Full Width */}
                            <Grid item xs={12}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                                    <Typography variant="h6" gutterBottom fontWeight="600">Weekly Borrowing Trends</Typography>
                                    <Box sx={{ height: 300, width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={stats.borrowingTrend}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Line type="monotone" dataKey="books" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Main - Left (60%) Live Borrowing */}
                            <Grid item xs={12} lg={8}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0', height: '100%' }}>
                                    <Typography variant="h6" gutterBottom fontWeight="600">Live Borrowing Feed</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <LiveBorrowingTable />
                                </Paper>
                            </Grid>

                            {/* Main - Right (40%) Pending ID Requests */}
                            <Grid item xs={12} lg={4}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" fontWeight="600">ID Requests</Typography>
                                        <Badge badgeContent={stats.pendingRequests} color="error" sx={{ mr: 1 }} />
                                    </Box>
                                    <PendingPasses />
                                </Paper>
                            </Grid>
                        </Grid>
                    </>
                )}

                {currentView === 'inventory' && <BookInventory />}
                {currentView === 'requests' && <PendingPasses />}
                {currentView === 'members' && <MemberManagement />}
                {currentView === 'reports' && <Typography variant="h6" color="textSecondary" align="center" mt={4}>Reports Module Coming Soon</Typography>}
                {currentView === 'profile' && <LibrarianProfile />}
            </Box>
        </Box>
    );
};

const StatCard = ({ title, value, color, icon }) => (
    <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography color="textSecondary" variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>{title}</Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: color }}>{value}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 48, height: 48 }}>
                    {icon}
                </Avatar>
            </CardContent>
        </Card>
    </Grid>
);

export default LibrarianDashboard;
