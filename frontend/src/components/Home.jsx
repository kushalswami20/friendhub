import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, UserPlus, UserMinus, UserCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Navbar from './shared/Navbar'

const Home = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [friendRequests, setFriendRequests] = useState({
    received: [],
    sent: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const BASE_URL = 'http://localhost:3000/friend';

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch friends list
  const fetchFriends = async () => {
    try {
      const response = await fetch(`${BASE_URL}/list`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (response.ok) {
        setFriends(data.friends || []);
      } else {
        throw new Error(data.message || 'Failed to fetch friends');
      }
    } catch (err) {
      console.error('Fetch friends error:', err);
      setError('Failed to fetch friends list');
    }
  };

  // Fetch friend recommendations
  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`${BASE_URL}/recommendations`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (response.ok) {
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error(data.message || 'Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Fetch recommendations error:', err);
      setError('Failed to fetch recommendations');
    }
  };

  // Fetch friend requests
  const fetchFriendRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/requests`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch requests');
      }

      const data = await response.json();
      setFriendRequests({
        received: data.receivedRequests || [],
        sent: data.sentRequests || []
      });
    } catch (err) {
      console.error('Fetch requests error:', err);
      setError('Failed to fetch friend requests');
    } finally {
      setLoading(false);
    }
  };

  // Send friend request
  const handleSendRequest = async (recipientId) => {
    try {
      const response = await fetch(`${BASE_URL}/request`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ recipientId })
      });
      const data = await response.json();
      if (response.ok) {
        fetchFriendRequests();
        fetchRecommendations();
      } else {
        throw new Error(data.message || 'Failed to send request');
      }
    } catch (err) {
      console.error('Send request error:', err);
      setError('Failed to send friend request');
    }
  };

  // Handle friend request actions (accept/reject)
  const handleRequestAction = async (requestId, action) => {
    try {
      const response = await fetch(`${BASE_URL}/request/${requestId}/${action}`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (response.ok) {
        fetchFriendRequests();
        if (action === 'accept') fetchFriends();
      } else {
        throw new Error(data.message || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error(`${action} request error:`, err);
      setError(`Failed to ${action} friend request`);
    }
  };

  // Cancel friend request
  const handleCancelRequest = async (requestId) => {
    try {
      const response = await fetch(`${BASE_URL}/request/${requestId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (response.ok) {
        fetchFriendRequests();
      } else {
        throw new Error(data.message || 'Failed to cancel request');
      }
    } catch (err) {
      console.error('Cancel request error:', err);
      setError('Failed to cancel friend request');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to view friends');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchFriends(),
          fetchRecommendations(),
          fetchFriendRequests()
        ]);
      } catch (err) {
        console.error('Initial fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Loading your connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Navbar />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends
            {friends.length > 0 && (
              <Badge variant="secondary" className="ml-2">{friends.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Requests
            {(friendRequests.received.length > 0 || friendRequests.sent.length > 0) && (
              <Badge variant="secondary" className="ml-2">
                {friendRequests.received.length + friendRequests.sent.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Suggested
            {recommendations.length > 0 && (
              <Badge variant="secondary" className="ml-2">{recommendations.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Friends</CardTitle>
              <CardDescription>People you're connected with</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No friends added yet</p>
                  <p className="text-sm">Check out the suggestions tab to find people you may know</p>
                </div>
              ) : (
                friends.map(friend => (
                  <div key={friend._id} 
                       className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {friend.firstname[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{friend.firstname} {friend.lastname}</p>
                      <p className="text-sm text-gray-500">@{friend.username}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6 space-y-6">
          {/* Received Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Received Requests</CardTitle>
              <CardDescription>People who want to connect with you</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {friendRequests.received.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending requests</p>
                </div>
              ) : (
                friendRequests.received.map(request => (
                  <div key={request._id} 
                       className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {request.sender.firstname[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {request.sender.firstname} {request.sender.lastname}
                      </p>
                      <p className="text-sm text-gray-500">@{request.sender.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => handleRequestAction(request._id, 'accept')}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRequestAction(request._id, 'reject')}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sent Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Sent Requests</CardTitle>
              <CardDescription>People you've invited to connect</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {friendRequests.sent.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sent requests</p>
                </div>
              ) : (
                friendRequests.sent.map(request => (
                  <div key={request._id} 
                       className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {request.recipient.firstname[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {request.recipient.firstname} {request.recipient.lastname}
                      </p>
                      <p className="text-sm text-gray-500">@{request.recipient.username}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleCancelRequest(request._id)}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Suggested Friends</CardTitle>
              <CardDescription>People you might know based on your connections</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations available</p>
                </div>
              ) : (
                recommendations.map(user => (
                  <div key={user._id} 
                       className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-medium">{user.firstname[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.firstname} {user.lastname}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                      {user.mutualFriendsCount > 0 && (
                        <Badge variant="secondary" className="mt-1">
                          {user.mutualFriendsCount} mutual friend{user.mutualFriendsCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <Button onClick={() => handleSendRequest(user._id)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;