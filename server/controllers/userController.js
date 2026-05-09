const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc  Get user by username
// @route GET /api/users/:username
const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', '_id name username profilePicture')
      .populate('following', '_id name username profilePicture');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Update user profile
// @route PUT /api/users/update
const updateProfile = async (req, res) => {
  try {
    const { name, bio, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.fieldname === 'profilePicture' ? 'profiles' : 'posts'}/${req.file.filename}`;
    }

    const user = await User.findById(req.user._id).select('+password');

    if (password) {
      user.password = password;
      await user.save(); // triggers pre-save hook for hashing
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('followers', '_id name username profilePicture')
      .populate('following', '_id name username profilePicture');

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Follow a user
// @route POST /api/users/:id/follow
const followUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const alreadyFollowing = targetUser.followers.includes(req.user._id);
    if (alreadyFollowing) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }

    await User.findByIdAndUpdate(req.params.id, { $push: { followers: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $push: { following: req.params.id } });

    // Create notification
    await Notification.create({
      recipient: req.params.id,
      sender: req.user._id,
      type: 'follow'
    });

    const updatedTarget = await User.findById(req.params.id)
      .populate('followers', '_id name username profilePicture')
      .populate('following', '_id name username profilePicture');
    const updatedMe = await User.findById(req.user._id)
      .populate('followers', '_id name username profilePicture')
      .populate('following', '_id name username profilePicture');

    res.json({ success: true, targetUser: updatedTarget, currentUser: updatedMe });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Unfollow a user
// @route POST /api/users/:id/unfollow
const unfollowUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'Cannot unfollow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });

    const updatedTarget = await User.findById(req.params.id)
      .populate('followers', '_id name username profilePicture')
      .populate('following', '_id name username profilePicture');
    const updatedMe = await User.findById(req.user._id)
      .populate('followers', '_id name username profilePicture')
      .populate('following', '_id name username profilePicture');

    res.json({ success: true, targetUser: updatedTarget, currentUser: updatedMe });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Get followers list
// @route GET /api/users/:id/followers
const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', '_id name username profilePicture bio');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, followers: user.followers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Get following list
// @route GET /api/users/:id/following
const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('following', '_id name username profilePicture bio');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, following: user.following });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc  Search users by username
// @route GET /api/users/search?q=
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, users: [] });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    }).select('_id name username profilePicture bio followers').limit(20);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getUserByUsername,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers
};
