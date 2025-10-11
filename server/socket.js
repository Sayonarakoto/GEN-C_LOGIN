let io;
const userSocketMap = new Map();

function init(server) {
  io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
  });

  io.on('connection', (socket) => {
    console.log(`A user connected to Socket.IO: ${socket.id}`);

    socket.on('authenticate', (userId) => {
      if (userId) {
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} authenticated and mapped to socket ${socket.id}`);
        socket.join(userId);
      } else {
        console.warn(`Authentication attempt with invalid userId from socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from Socket.IO: ${socket.id}`);
      for (let [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`User ${userId} unmapped from socket ${socket.id}`);
          break;
        }
      }
    });
  });
}

function getIo() {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
}

function getUserSocketMap() {
    return userSocketMap;
}

function sendSocketNotification(recipientId, subject, message) {
    const io = getIo();
    const userSocketMap = getUserSocketMap();
    if (userSocketMap.has(recipientId)) {
        const socketId = userSocketMap.get(recipientId);
        io.to(socketId).emit('newNotification', { subject, message });
        console.log(`Sent notification to ${recipientId} on socket ${socketId}`);
    } else {
        console.warn(`Recipient ${recipientId} not found in userSocketMap. Notification not sent.`);
    }
}

module.exports = {
  init,
  getIo,
  getUserSocketMap,
  sendSocketNotification,
};