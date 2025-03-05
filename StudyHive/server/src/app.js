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
import whiteboardRouter from "./routes/whiteboard.routes..js"

app.use("/api/v1/users", userRouter);
app.use('/api/v1/group', groupRouter);
app.use('/api/v1/resource', resourceRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/whiteboard', whiteboardRouter)

const server = createServer(app);

// Initialize Socket.io instance
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// Handle Socket.io connections for group chats
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  /*** GROUP CHAT FUNCTIONALITY ***/

  // Join a group chat room
  socket.on("join_group", async (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group: ${groupId}`);

    // Fetch chat history for the group
    try {
      const messages = await Message.find({ groupId }).sort({ timestamp: 1 });
      socket.emit("chat_history", messages);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  });

  // Send a message to a group
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

      // Emit the message to all users in the group
      io.to(groupId).emit("receive_message", {
        message,
        userId,
        username,
        timestamp: newMessage.timestamp
      });

      console.log(`Message sent to group ${groupId} by user ${username}: ${message}`);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  // Leave a group chat
  socket.on("leave_group", (groupId) => {
    socket.leave(groupId);
    console.log(`User ${socket.id} left group: ${groupId}`);
  });

  /*** PRIVATE CHAT FUNCTIONALITY ***/

  // Join a private chat room (each user joins their own room)
  socket.on("join_private_chat", (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined private chat room: ${userId}`);
  });

  // Send a private message
  socket.on("send_private_message", async (data) => {
    const { senderId, receiverId, message } = data;

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
      timestamp: new Date()
    });

    try {
      await newMessage.save();

      // Emit the message only to the intended recipient
      io.to(receiverId).emit("receive_private_message", {
        senderId,
        message,
        timestamp: newMessage.timestamp
      });

      console.log(`Private message from ${senderId} to ${receiverId}: ${message}`);
    } catch (err) {
      console.error("Error saving private message:", err);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

export { app, server };
