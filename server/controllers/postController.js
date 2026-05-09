const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc  Get feed posts (followed users + own)
// @route GET /api/posts/feed
const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const me = await User.findById(req.user._id);
    const feedUsers = [...me.following, req.user._id];

    const total = await Post.countDocuments({ author: { $in: feedUsers } });
    const posts = await Post.find({ author: { $in: feedUsers } })
      .populate('author', '_id name username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Get all posts (explore)
// @route GET /api/posts/explore
const getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const total = await Post.countDocuments();
    const posts = await Post.find()
      .populate('author', '_id name username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Get single post
// @route GET /api/posts/:id
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', '_id name username profilePicture bio');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Create post
// @route POST /api/posts
const createPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const postData = {
      author: req.user._id,
      content: content.trim()
    };

    if (req.file) {
      postData.image = `/uploads/posts/${req.file.filename}`;
    }

    const post = await Post.create(postData);
    const populated = await Post.findById(post._id)
      .populate('author', '_id name username profilePicture');

    res.status(201).json({ success: true, post: populated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Delete post
// @route DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Like / unlike toggle
// @route POST /api/posts/:id/like
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      await Post.findByIdAndUpdate(req.params.id, { $pull: { likes: req.user._id } });
    } else {
      await Post.findByIdAndUpdate(req.params.id, { $push: { likes: req.user._id } });

      // Create notification (don't notify yourself)
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          post: post._id
        });
      }
    }

    const updatedPost = await Post.findById(req.params.id);
    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: updatedPost.likes.length,
      likes: updatedPost.likes
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Get posts by user ID
// @route GET /api/posts/user/:userId
const getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const total = await Post.countDocuments({ author: req.params.userId });
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', '_id name username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getFeed,
  getExplorePosts,
  getPost,
  createPost,
  deletePost,
  likePost,
  getUserPosts
};
