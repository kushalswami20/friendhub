import express from 'express';
import { Friend } from '../models/friend.js';
import { User } from '../models/user.js';

export const sendfriendrequest = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user._id; // Changed from req.user.id to req.user._id

        const recipient = await User.findById(recipientId);
        if (!recipient) {
            throw new Error('Recipient user not found');
        }

        // Check if users are already friends
        const areFriends = await User.findOne({
            _id: senderId,
            friends: recipientId
        });
        if (areFriends) {
            throw new Error('Users are already friends');
        }

        const existingRequest = await Friend.findOne({
            $or: [
                { sender: senderId, recipient: recipientId },
                { sender: recipientId, recipient: senderId }
            ]
        });
        if (existingRequest) {
            throw new Error('Friend request already exists');
        }

        const friendRequest = await Friend.create({
            sender: senderId,
            recipient: recipientId,
            status: 'pending'
        });

        // Update recipient's friends array
        await User.findByIdAndUpdate(recipientId, {
            $addToSet: { friends: friendRequest._id }
        });

        return res.status(201).json({
            message: "Friend request sent successfully.",
            success: true,
            friendRequest
        });

    } catch (error) {
        res.status(500).json({ message: 'Error sending friend request', error: error.message });
    }
};

export const acceptfriendrequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id; // Changed from req.user.id to req.user._id

        // Find and validate request
        const request = await Friend.findOne({
            _id: requestId,
            recipient: userId,
            status: 'pending'
        });

        if (!request) {
            throw new Error('Friend request not found');
        }

        request.status = 'accepted';
        await request.save();

        // Add users to each other's friend lists
        await Promise.all([
            User.findByIdAndUpdate(
                request.sender,
                { $addToSet: { friends: request.recipient } }
            ),
            User.findByIdAndUpdate(
                request.recipient,
                { $addToSet: { friends: request.sender } }
            )
        ]);

        return res.json({
            success: true,
            message: 'Friend request accepted',
            request
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const rejectfriendrequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id; // Changed from req.user.id to req.user._id

        const request = await Friend.findOneAndUpdate(
            {
                _id: requestId,
                recipient: userId,
                status: 'pending'
            },
            { status: 'rejected' },
            { new: true }
        );

        if (!request) {
            throw new Error('Friend request not found');
        }

        return res.json({
            success: true,
            message: 'Friend request rejected',
            request
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getfriendrequests = async (req, res) => {
    try {
        const userId = req.user._id; // Changed from req.user.id to req.user._id

        // Get received pending requests
        const receivedRequests = await Friend.find({ // Changed from FriendRequest to Friend
            recipient: userId,
            status: 'pending'
        }).populate('sender', 'username firstname lastname');

        // Get sent pending requests
        const sentRequests = await Friend.find({ // Changed from FriendRequest to Friend
            sender: userId,
            status: 'pending'
        }).populate('recipient', 'username firstname lastname');

        return res.json({
            success: true,
            receivedRequests,
            sentRequests
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const cancelfriendrequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id; // Changed from req.user.id to req.user._id

        const request = await Friend.findOneAndDelete({ // Changed from FriendRequest to Friend
            _id: requestId,
            sender: userId,
            status: 'pending'
        });

        if (!request) {
            throw new Error('Friend request not found');
        }

        return res.json({
            success: true,
            message: 'Friend request cancelled',
            requestId
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
export const getfriendslist = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find the user and populate their friends array with selected fields
        const user = await User.findById(userId)
            .populate('friends', 'username firstname lastname email')
            .select('friends');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Friends list retrieved successfully',
            friends: user.friends
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving friends list',
            error: error.message
        });
    }
};

export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 10;

        // Get current user's friends
        const currentUser = await User.findById(userId)
            .populate('friends')
            .select('friends');

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const currentUserFriendIds = currentUser.friends.map(friend => friend._id);

        // Get pending requests
        const pendingRequests = await Friend.find({
            $or: [
                { sender: userId, status: 'pending' },
                { recipient: userId, status: 'pending' }
            ]
        });

        const pendingUserIds = pendingRequests.map(request => 
            request.sender.equals(userId) ? request.recipient : request.sender
        );

        // Find potential friends based on mutual connections
        const recommendations = await User.aggregate([
            {
                $match: {
                    _id: { 
                        $nin: [
                            ...currentUserFriendIds, 
                            userId,
                            ...pendingUserIds
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'friends',
                    foreignField: '_id',
                    as: 'userFriends'
                }
            },
            {
                $addFields: {
                    mutualFriendsCount: {
                        $size: {
                            $setIntersection: ['$friends', currentUserFriendIds]
                        }
                    }
                }
            },
            {
                $match: {
                    mutualFriendsCount: { $gt: 0 }
                }
            },
            {
                $sort: {
                    mutualFriendsCount: -1
                }
            },
            {
                $limit: limit
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    firstname: 1,
                    lastname: 1,
                    email: 1,
                    mutualFriendsCount: 1
                }
            }
        ]);

        // If we don't have enough recommendations with mutual friends,
        // add some random users
        if (recommendations.length < limit) {
            const remainingCount = limit - recommendations.length;
            const randomUsers = await User.find({
                _id: { 
                    $nin: [
                        ...currentUserFriendIds, 
                        userId,
                        ...pendingUserIds,
                        ...recommendations.map(r => r._id)
                    ]
                }
            })
            .select('username firstname lastname email')
            .limit(remainingCount);

            randomUsers.forEach(user => {
                recommendations.push({
                    ...user.toObject(),
                    mutualFriendsCount: 0
                });
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Friend recommendations retrieved successfully',
            recommendations
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving friend recommendations',
            error: error.message
        });
    }
};
export const searchUsers = async (req, res) => {
    try {
        const { username } = req.body;
        const userId = req.user._id;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Find users whose username matches the search query (case-insensitive)
        const users = await User.find({
            _id: { $ne: userId }, // Exclude current user
            username: { $regex: username, $options: 'i' }
        })
        .select('username firstname lastname email')
        .limit(10);

        return res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error searching users',
            error: error.message
        });
    }
};