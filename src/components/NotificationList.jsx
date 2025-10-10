import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Paper,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationList = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlineIcon color="success" />;
      case 'alert':
        return <WarningAmberIcon color="warning" />;
      case 'info':
      default:
        return <InfoOutlinedIcon color="info" />;
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    onClose(); // Close the notification list after clicking
  };

  return (
    <Paper elevation={5} sx={{ width: 350, maxHeight: 500, overflowY: 'auto', borderRadius: 2 }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <Typography variant="h6">Notifications</Typography>
        <IconButton onClick={(e) => { e.stopPropagation(); onClose(); }} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <List dense>
        {notifications.length === 0 ? (
          <ListItem>
            <ListItemText primary="No new notifications" sx={{ textAlign: 'center', py: 2 }} />
          </ListItem>
        ) : (
          notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{ bgcolor: notification.isRead ? '#f5f5f5' : '#e3f2fd' }}
              >
                <ListItemIcon>
                  {getIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.message}
                  secondary={new Date(notification.timestamp).toLocaleString()}
                  primaryTypographyProps={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))
        )}
      </List>
      {notifications.length > 0 && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee' }}>
          <Button startIcon={<MarkEmailReadIcon />} onClick={markAllAsRead} size="small">
            Mark All Read
          </Button>
          <Button startIcon={<DeleteForeverIcon />} onClick={clearNotifications} size="small" color="error">
            Clear All
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default NotificationList;
