import express from 'express';
import { sendfriendrequest,acceptfriendrequest,rejectfriendrequest,getfriendrequests,cancelfriendrequest,getfriendslist,getRecommendations,searchUsers } from '../controllers/friend.controller.js';
import { auth } from '../middleware/auth.js';
const router = express.Router();
router.post('/request', auth,sendfriendrequest);
router.put('/request/:requestId/accept',auth, acceptfriendrequest);
router.put('/request/:requestId/reject', auth,rejectfriendrequest);
router.delete('/request/:requestId', auth,cancelfriendrequest);
router.get('/requests', auth,getfriendrequests);
router.get('/list', auth,getfriendslist);
router.get('/recommendations', auth,getRecommendations);
router.post('/search', auth,searchUsers);



export default router;  // Export the router to use it in other files