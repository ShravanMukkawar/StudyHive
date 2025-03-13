import React, { useEffect, useState } from "react";

export default function Personal() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/v1/users/search")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const handleStartChat = (userId) => {
    console.log(`Starting chat with user ID: ${userId}`);
    // Add your chat initialization logic here
    // For example: navigate(`/chat/${userId}`) or trigger a modal
  };

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
              key={user.id || index}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <img 
                    src={user.profilePic || "https://via.placeholder.com/150"} 
                    alt={user.username} 
                    className="w-24 h-24 object-cover rounded-full border-4 border-gray-100 shadow"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150";
                    }}
                  />
                  {user.online && (
                    <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800">{user.username}</h3>
                
                <div className="mt-2 text-center">
                  <p className="text-gray-600">
                    <span className="font-medium">Branch:</span> {user.branch || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">College:</span> {user.collegeName || "N/A"}
                  </p>
                </div>
                
                <button
                  onClick={() => handleStartChat(user.id)}
                  className="mt-6 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  Start Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}