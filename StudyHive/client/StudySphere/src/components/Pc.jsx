import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { useSelector } from "react-redux";

const socket = io("http://localhost:5000"); // Connect to backend

export default function ChatPage() {
  const { chatId } = useParams(); // Get chat ID from URL
  const user = useSelector((state) => state.auth.userData); // Get logged-in user
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/v1/chat/${chatId}/messages`, // Updated route
          { withCredentials: true }
        );
        setMessages(response.data); // Store fetched messages
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    // Listen for new messages via WebSocket
    socket.on("newMessage", (message) => {
      if (message.chatId === chatId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off("newMessage"); // Cleanup listener
    };
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/v1/chat/${chatId}/messages`, // Updated route
        {
          sender: user._id,
          text: newMessage,
        },
        { withCredentials: true }
      );

      socket.emit("sendMessage", { chatId, sender: user._id, text: newMessage }); // Emit new message
      setNewMessage(""); // Clear input
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen p-6 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4 text-center">Chat</h2>

      <div className="flex-1 overflow-y-auto bg-white p-4 rounded-lg shadow-md">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 my-2 rounded-md ${
                msg.sender === user._id ? "bg-blue-500 text-white ml-auto" : "bg-gray-300 text-black"
              } max-w-xs`}
            >
              <strong>{msg.sender === user._id ? "You" : msg.sender.username}</strong>: {msg.text}
            </div>
          ))
        )}
      </div>

      <div className="flex mt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-l-md"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
