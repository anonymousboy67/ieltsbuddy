// server.mjs - Run with: node server.mjs
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

let waitingQueue = [];
const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Broadcast online count to all clients
  io.emit('online-count', io.engine.clientsCount);

  // Join matchmaking queue
  socket.on('find-partner', (userData) => {
    console.log('User looking for partner:', socket.id);

    // Remove from queue if already there
    waitingQueue = waitingQueue.filter(u => u.socketId !== socket.id);

    if (waitingQueue.length > 0) {
      // Match with first person in queue
      const partner = waitingQueue.shift();
      const roomId = `room-${Date.now()}`;

      // Both join the room
      socket.join(roomId);
      io.sockets.sockets.get(partner.socketId)?.join(roomId);

      // Store active session
      activeSessions.set(roomId, {
        users: [socket.id, partner.socketId],
        startTime: Date.now()
      });

      // Notify both users they are matched
      socket.emit('matched', { roomId, isInitiator: true, partnerId: partner.socketId });
      io.to(partner.socketId).emit('matched', { roomId, isInitiator: false, partnerId: socket.id });

      console.log('Matched:', socket.id, 'with', partner.socketId, 'in', roomId);
    } else {
      // Add to queue
      waitingQueue.push({ socketId: socket.id, ...userData });
      socket.emit('waiting');
      console.log('Added to queue:', socket.id, 'Queue size:', waitingQueue.length);
    }
  });

  // Cancel matchmaking
  socket.on('cancel-search', () => {
    waitingQueue = waitingQueue.filter(u => u.socketId !== socket.id);
    console.log('User cancelled search:', socket.id);
  });

  // WebRTC signaling
  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
  });

  // End call
  socket.on('end-call', ({ roomId }) => {
    socket.to(roomId).emit('partner-left');
    activeSessions.delete(roomId);
    socket.leave(roomId);
    console.log('Call ended in room:', roomId);
  });

  // Disconnect
  socket.on('disconnect', () => {
    waitingQueue = waitingQueue.filter(u => u.socketId !== socket.id);
    // Notify partner if in active session
    for (const [roomId, session] of activeSessions) {
      if (session.users.includes(socket.id)) {
        socket.to(roomId).emit('partner-left');
        activeSessions.delete(roomId);
      }
    }
    // Broadcast updated online count
    io.emit('online-count', io.engine.clientsCount);
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log('Socket.io server running on port 3001');
});
