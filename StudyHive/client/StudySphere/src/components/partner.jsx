import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { UserIcon, MessageCircle } from 'lucide-react';

export default function Partner() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get user ID from Redux store
  const user = useSelector((state) => state.auth.userData);
  const userId = user?._id;
  const metaapi = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchPartner = async () => {
      if (!userId) return;

      try {
        const response = await axios.get(`${metaapi}/api/v1/users/find-partner/${userId}`);
        const data = response.data.bestMatch;
        console.log(data);
        setPartners(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching partners:', error);
      }
      setLoading(false);
    };

    fetchPartner();
  }, [metaapi, userId]);

  const handleStartChat = async (partnerId) => {
    try {
      // You'll need to implement the actual chat creation endpoint
      // console.log(partnerId);
      const response = await axios.post(`${metaapi}/api/v1/chats/create`, {
        userId: userId,
        partnerId: partnerId
      });
      
      // Redirect to chat page or open chat window
      // You can modify this based on your routing setup
      window.location.href = `/chat/${response.data.chatId}`;
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-6">Study Partners</h2>
      {partners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partners.map((partner, index) => (
            <div key={partner._id || index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <div className="flex items-center space-x-4">
                  {partner.profilePic ? (
                    <img
                      src={partner.profilePic}
                      alt={`${partner.username}'s profile`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold">{partner.username || partner.name}</h3>
                    {partner.studyStyle && (
                      <p className="text-sm text-gray-600">Style: {partner.studyStyle}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleStartChat(partner._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {partner.skills?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {partner.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {partner.interests?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {partner.interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {partner.availability !== undefined && (
                    <p className="text-sm mt-2">
                      <span className="font-medium">Status: </span>
                      <span className={partner.availability ? "text-green-600" : "text-red-600"}>
                        {partner.availability ? "Available" : "Not Available"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">No suitable partners found. Try updating your preferences.</p>
        </div>
      )}
    </div>
  );
}