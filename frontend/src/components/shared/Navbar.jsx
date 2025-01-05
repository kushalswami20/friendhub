import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Home,
  Bell,
  LogOut,
  User,
  Search
} from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");

  const BASE_URL = "https://friendhub-backend.onrender.com/friend";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setSearchError("");

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(`${BASE_URL}/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: query }),
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          throw new Error("Authentication failed");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Search failed");
        }

        const data = await response.json();
        setSearchResults(data.users || []);
      } catch (error) {
        console.error("Search error:", error);
        setSearchError(error.message);
        setSearchResults([]);

        if (error.message === "Authentication failed") {
          navigate("/login");
        }
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [navigate]
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setSearchError("");
  };

  const handleSearch = () => {
    debouncedSearch(searchQuery);
  };

  const handleSelectUser = (user) => {
    setSearchQuery("");
    navigate(`/user/${user._id}`);
  };

  return (
    <div className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NavigationMenu className="h-16">
          <NavigationMenuList className="w-full flex items-center justify-between">
            {/* Left side navigation */}
            <div className="flex items-center space-x-8">
              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  className="text-xl font-bold"
                  onClick={() => navigate("/")}
                >
                  FriendHub
                </Button>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={() => navigate("/")}
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </NavigationMenuItem>
            </div>

            {/* Search Bar */}
            <div className="flex items-center max-w-md px-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="border border-gray-300 rounded-l-md px-4 py-2 w-full focus:outline-none focus:ring focus:border-blue-500"
              />
              <Button
                variant="outline"
                onClick={handleSearch}
                className="rounded-r-md px-4 py-2"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Right side navigation */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NavigationMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {notifications.length > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                          {notifications.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem key={notification.id}>
                          {notification.message}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </NavigationMenuItem>

              {/* User Menu */}
              <NavigationMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </NavigationMenuItem>
            </div>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="absolute top-1/6 left-1/2 transform -translate-x-1/2 mt-2 bg-white shadow-md border rounded-md w-[400px] max-h-60 overflow-y-auto">
          {searchResults.map((user) => (
            <div
              key={user._id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectUser(user)}
            >
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {searchError && (
        <div className="absolute bg-red-100 text-red-500 p-2 mt-2 rounded-md">
          {searchError}
        </div>
      )}
    </div>
  );
};

export default Navbar;
