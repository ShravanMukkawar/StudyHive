import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000"); // Adjust server URL

const PersonalChat = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    // Fetch previous messages when chatId is set
    if (chatId) {
      axios.get(`http://localhost:5000/api/v1/chats/${chatId}`)
        .then((res) => setMessages(res.data.messages))
        .catch((err) => console.error(err));
      
      // Join chat room
      socket.emit("join_chat", chatId);
    }

    return () => socket.off("receive_message");
  }, [chatId]);

  useEffect(() => {
    // Listen for new messages
    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });
  }, []);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const messageData = {
      chatId,
      senderId: userId,
      message: newMessage,
    };

    try {
      await axios.post("http://localhost:5000/api/v1/chat/p/send", messageData);
      socket.emit("send_message", messageData);
      setMessages((prev) => [...prev, messageData]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-white shadow-lg p-4">
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        {/* Dummy Chat List (Replace with API data) */}
        <div className="space-y-3">
          {["User A", "User B", "User C"].map((partnerName, index) => (
            <div
              key={index}
              onClick={() => setChatId(`chat-${index + 1}`)}
              className="p-2 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300"
            >
              {partnerName}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex flex-col flex-1 bg-white shadow-lg rounded-lg">
        <div className="bg-blue-500 text-white p-4 font-bold">
          {partner ? partner.name : "Select a chat"}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 max-w-xs rounded-lg ${
                msg.senderId === userId
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-300"
              }`}
            >
              {msg.message}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="flex p-4 border-t">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            onClick={sendMessage}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalChat;
