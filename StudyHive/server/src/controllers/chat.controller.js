import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import Message from "../models/Message.model.js";
import Chat from "../models/chat.js";
const getMessages = asyncHandler(async(req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await Message.find({ groupId }).populate('sender', 'username');

        return res
        .status(200)
        .json({
            success: true,
            data: messages
        });
    } catch (error) {
        throw new ApiError(500, error?.message)
    }
})
const startChat = async (req, res) => {
    try {
      const { user1, user2 } = req.body;
  
      // Ensure both users are provided
      if (!user1 || !user2) {
        return res.status(400).json({ message: "Both users are required" });
      }
  
      // Check if a chat already exists between these users
      let chat = await Chat.findOne({
        participants: { $all: [user1, user2] },
      });
  
      if (!chat) {
        // Create a new chat if it doesn't exist
        chat = new Chat({ participants: [user1, user2] });
        await chat.save();
      }
  
      res.status(200).json({ chatId: chat._id });
    } catch (error) {
      console.error("Error starting chat:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  };
  
  // Fetch chat messages for a specific chat
const getChatMessages = async (req, res) => {
    try {
    
      const { chatId } = req.params;
  
      // Find chat by ID
      const chat = await Chat.findById(chatId).populate("messages.sender", "username");
  
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
  
      res.status(200).json(chat.messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  };
  
  // Send a message in a chat
const sendMessage = async (req, res) => {
    try {
        console.log("Chat send message controller")
      const { chatId } = req.params;
      const { sender, text } = req.body;
  
      if (!sender || !text) {
        return res.status(400).json({ message: "Sender and message text are required" });
      }
  
      // Find the chat and add a new message
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
  
      chat.messages.push({ sender, text });
      await chat.save();
  
      res.status(201).json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  };
export {
    getMessages,getChatMessages,sendMessage,startChat
}