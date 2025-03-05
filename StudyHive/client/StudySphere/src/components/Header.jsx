import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LogoutBtn from "./LogoutBtn.jsx";
import { User } from "lucide-react";
import { logout } from "../store/Slice.js";

function Header() {
  const authStatus = useSelector((state) => state.auth.status);
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('/');

  const navBar = [
    {
      title: "Home",
      slug: '/',
      active: true,
      icon: "🏠"
    },
    {
      title: 'Login',
      slug: '/login',
      active: !authStatus,
      icon: "🔑"
    },
    {
      title: "Your Groups",
      slug: '/group',
      active: authStatus,
      icon: "👥"
    },
    {
      title: 'Join Groups',
      slug: 'joinGroups',
      active: authStatus,
      icon: "🤝"
    },
    {
      title: 'Profile',
      slug: '/profile',
      active: authStatus,
      icon: "👤"
    },
    {
      title: 'Partner',
      slug: '/partner',
      active: authStatus,
      icon: ""
    }
  ];

  const handleNavigation = (slug) => {
    setActiveItem(slug);
    navigate(slug);
  };

  return (
    <header className="relative w-full">
      <div className="fixed top-0 w-full z-50">
        <div className="w-full flex justify-end items-center px-8 h-20 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 animate-gradient-x backdrop-blur-md bg-opacity-90 shadow-lg border-b border-white/10">
          <style>
            {`
              @keyframes gradient-x {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .animate-gradient-x {
                background-size: 200% 200%;
                animation: gradient-x 15s ease infinite;
              }
              .nav-item::before {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 50%;
                width: 0;
                height: 3px;
                background: white;
                transition: all 0.3s ease;
                transform: translateX(-50%);
              }
              .nav-item:hover::before {
                width: 85%;
              }
              .nav-item.active::before {
                width: 85%;
              }
            `}
          </style>

          <nav className="flex items-center h-full space-x-12 mr-4">
            {navBar.map((item) => 
              item.active && (
                <div key={item.title} className="h-full flex items-center">
                  <button
                    className={`nav-item relative px-6 py-3 text-white font-semibold text-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center space-x-3 ${
                      activeItem === item.slug ? 'active' : ''
                    }`}
                    onClick={() => handleNavigation(item.slug)}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="tracking-wide">{item.title}</span>
                  </button>
                </div>
              )
            )}

            {authStatus && (
              <div className="transform transition-all duration-300 hover:scale-105 ml-4">
                <LogoutBtn />
              </div>
            )}
          </nav>
        </div>
      </div>

      <div className="h-20"></div>
    </header>
  );
}

export default Header;