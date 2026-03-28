// server.mjs - Run with: node server.mjs
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3001;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://ieltsbuddyv2.vercel.app",
      "https://ieltsbuddy.app",
      "https://www.ieltsbuddy.app",
      "http://64.227.183.105:3000",
      /\.vercel\.app$/
    ],
    methods: ["GET", "POST"]
  }
});

let waitingQueue = [];
const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // --- PRIVATE NOTIFICATIONS ---
  socket.on('join-user-room', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} joined room: user-${userId}`);
    }
  });

  // Internal event for worker to notify completion
  socket.on('evaluation-finished', (data) => {
    const { userId, attemptId, sectionType } = data;
    console.log(`Evaluation finished for user ${userId}, attempt ${attemptId}`);
    io.to(`user-${userId}`).emit('evaluation-ready', { attemptId, sectionType });
  });

  // --- EXISTING P2P LOGIC ---
  io.emit('online-count', io.engine.clientsCount);

  socket.on('find-partner', (userData) => {
    console.log('User looking for partner:', socket.id);

    waitingQueue = waitingQueue.filter(u => u.socketId !== socket.id);

    if (waitingQueue.length > 0) {
      const partner = waitingQueue.shift();
      const roomId = `room-${Date.now()}`;

      socket.join(roomId);
      io.sockets.sockets.get(partner.socketId)?.join(roomId);

      activeSessions.set(roomId, {
        users: [socket.id, partner.socketId],
        startTime: Date.now()
      });

      socket.emit('matched', { roomId, isInitiator: true, partnerId: partner.socketId });
      io.to(partner.socketId).emit('matched', { roomId, isInitiator: false, partnerId: socket.id });

      console.log('Matched:', socket.id, 'with', partner.socketId, 'in', roomId);
    } else {
      waitingQueue.push({ socketId: socket.id, ...userData });
      socket.emit('waiting');
      console.log('Added to queue:', socket.id, 'Queue size:', waitingQueue.length);
    }
  });

  socket.on('cancel-search', () => {
    waitingQueue = waitingQueue.filter(u => u.socketId !== socket.id);
    console.log('User cancelled search:', socket.id);
  });

  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('end-call', ({ roomId }) => {
    socket.to(roomId).emit('partner-left');
    activeSessions.delete(roomId);
    socket.leave(roomId);
    console.log('Call ended in room:', roomId);
  });

  socket.on('disconnect', () => {
    waitingQueue = waitingQueue.filter(u => u.socketId !== socket.id);
    for (const [roomId, session] of activeSessions) {
      if (session.users.includes(socket.id)) {
        socket.to(roomId).emit('partner-left');
        activeSessions.delete(roomId);
      }
    }
    io.emit('online-count', io.engine.clientsCount);
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});