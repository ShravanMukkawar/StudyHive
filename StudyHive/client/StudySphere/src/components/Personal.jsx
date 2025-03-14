import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { useSelector } from "react-redux";

// Use environment variable for API URL
const API_BASE_URL ="http://localhost:5000";
const socket = io(API_BASE_URL); // Connect to backend

export default function Personal() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingChats, setLoadingChats] = useState({}); // Track loading per user

  const user = useSelector((state) => state.auth.userData);

  useEffect(() => {
    if (user?._id) {
      setCurrentUserId(user._id);
    }
  }, [user]);

  useEffect(() => {
    console.log("Updated currentUserId:", currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/v1/users/search`);
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleStartChat = useCallback(
    async (userId) => {
      if (loadingChats[userId]) return; // Prevent multiple clicks for the same user
      setLoadingChats((prev) => ({ ...prev, [userId]: true }));

      try {
        if (!currentUserId) {
          throw new Error("User not authenticated");
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/v1/chat/start`,
          { user1: currentUserId, user2: userId },
          { withCredentials: true }
        );
        console.log("response",response);
        if (!response.data?.chatId) {
          throw new Error("Failed to retrieve chat ID");
        }

        navigate(`/chat/${response.data.chatId}`);
      } catch (error) {
        console.error("Error starting chat:", error);
        alert("Something went wrong: " + error.message);
      } finally {
        setLoadingChats((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [currentUserId, loadingChats]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg m-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p>{error}</p>
        <button
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Community Members</h2>
      {users.length === 0 ? (
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, index) => (
            <div
              key={user._id || index}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-6 flex flex-col items-center">
                <h3 className="text-xl font-semibold text-gray-800">{user.username}</h3>
                <button
                  onClick={() => handleStartChat(user._id)}
                  className={`mt-6 w-full py-2 text-white rounded-md transition-colors duration-300 ${
                    loadingChats[user._id]
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  disabled={loadingChats[user._id]}
                >
                  {loadingChats[user._id] ? "Starting..." : "Start Chat"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
