const express = require('express');
const router = express.Router();
const { addComment, deleteComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.post('/:postId', protect, addComment);
router.delete('/:id', protect, deleteComment);
router.get('/:postId', getComments);

module.exports = router;
