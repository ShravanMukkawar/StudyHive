import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import Message from "./models/Message.model.js";

const app = express();

const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routers
import userRouter from "./routes/user.routes.js";
import groupRouter from "./routes/group.routes.js";
import resourceRouter from "./routes/resource.routes.js";
import chatRouter from "./routes/chat.routes.js";
import whiteboardRouter from "./routes/whiteboard.routes..js";

app.use("/api/v1/users", userRouter);
app.use('/api/v1/group', groupRouter);
app.use('/api/v1/resource', resourceRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/whiteboard', whiteboardRouter);

const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

const users = {}; // Store userId -> socketId mapping

// Handle Socket.io connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register user for private chat
  socket.on("register", (userId) => {
    users[userId] = socket.id;
    console.log(`User registered: ${userId} with socket ID: ${socket.id}`);
  });

  // Join group chat room
  socket.on("join_group", async (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group: ${groupId}`);

    // Fetch chat history from the database
    try {
      const messages = await Message.find({ groupId }).sort({ timestamp: 1 });
      socket.emit('chat_history', messages);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  });

  // Handle incoming group chat messages
  socket.on("send_message", async (data) => {
    const { groupId, message, userId, username } = data;

    const newMessage = new Message({
      groupId,
      userId,
      username,
      message,
      timestamp: new Date()
    });

    try {
      await newMessage.save();

      // Broadcast the message to the group
      io.to(groupId).emit("receive_message", {
        message,
        userId,
        username,
        timestamp: newMessage.timestamp
      });

      console.log(`Message sent to group ${groupId} by user ${username}: ${message}`);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  // Handle leaving a group
  socket.on("leave_group", (groupId) => {
    socket.leave(groupId);
    console.log(`User ${socket.id} left group: ${groupId}`);
  });

  socket.on("send_chat_message", async (message) => {
    console.log("Received chat message:", message);
  
    try {
      const savedMessage = new Message({
        groupId: message.groupId,
        userId: message.userId,
        username: message.username,
        message: message.message,
        timestamp: message.timestamp || new Date().toISOString(),
      });
  
      await savedMessage.save();
  
      // Broadcast message only to users in the correct group
      io.to(message.groupId).emit("new_group_message", savedMessage);
  
      console.log("Message broadcasted to group:", message.groupId);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });
  
    // Handle user disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    Object.keys(users).forEach((userId) => {
      if (users[userId] === socket.id) delete users[userId];
    });
  });
});

export { app, server };
