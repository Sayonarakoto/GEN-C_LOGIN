module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected to Socket.IO');

    socket.on('disconnect', () => {
      console.log('User disconnected from Socket.IO');
    });
  });
};
