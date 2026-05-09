const express = require('express');
const router = express.Router();
const {
  getFeed,
  getExplorePosts,
  getPost,
  createPost,
  deletePost,
  likePost,
  getUserPosts
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/feed', protect, getFeed);
router.get('/explore', getExplorePosts);
router.get('/user/:userId', getUserPosts);
router.get('/:id', getPost);
router.post('/', protect, upload.single('image'), createPost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);

module.exports = router;
