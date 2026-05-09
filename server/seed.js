require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Notification.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create 5 users
    const usersData = [
      {
        name: 'Alex Morgan',
        username: 'alexmorgan',
        email: 'alex@example.com',
        password: 'password123',
        bio: '📸 Photography enthusiast | Travel addict | Coffee lover ☕',
        profilePicture: ''
      },
      {
        name: 'Sarah Chen',
        username: 'sarahchen',
        email: 'sarah@example.com',
        password: 'password123',
        bio: '🎨 Digital Artist | UI/UX Designer | Creating beautiful things',
        profilePicture: ''
      },
      {
        name: 'Marcus Johnson',
        username: 'marcusj',
        email: 'marcus@example.com',
        password: 'password123',
        bio: '💻 Full-Stack Developer | Open Source Contributor | Tech Blogger',
        profilePicture: ''
      },
      {
        name: 'Priya Sharma',
        username: 'priyasharma',
        email: 'priya@example.com',
        password: 'password123',
        bio: '🌱 Sustainability advocate | Foodie | Nature lover 🌿',
        profilePicture: ''
      },
      {
        name: 'Jordan Blake',
        username: 'jordanblake',
        email: 'jordan@example.com',
        password: 'password123',
        bio: '🎵 Music producer | Sound engineer | Always in the studio',
        profilePicture: ''
      }
    ];

    const users = await User.create(usersData);
    console.log('👥 Created 5 users');

    // Set up follow relationships
    await User.findByIdAndUpdate(users[0]._id, {
      $push: { following: [users[1]._id, users[2]._id, users[3]._id] }
    });
    await User.findByIdAndUpdate(users[1]._id, {
      $push: { followers: [users[0]._id], following: [users[0]._id, users[4]._id] }
    });
    await User.findByIdAndUpdate(users[2]._id, {
      $push: { followers: [users[0]._id], following: [users[3]._id] }
    });
    await User.findByIdAndUpdate(users[3]._id, {
      $push: { followers: [users[0]._id, users[2]._id] }
    });
    await User.findByIdAndUpdate(users[4]._id, {
      $push: { followers: [users[1]._id] }
    });

    // Create 10 posts
    const postsData = [
      {
        author: users[0]._id,
        content: '🌅 Just caught the most breathtaking sunrise at the coast this morning. Some moments are just too perfect not to share. The colors were absolutely surreal! #Photography #Nature #Sunrise',
        likes: [users[1]._id, users[2]._id, users[3]._id]
      },
      {
        author: users[1]._id,
        content: '✨ Just finished my latest UI redesign project! Clean, minimal, and focused on user experience. What do you think? I spent weeks perfecting every pixel. #UIDesign #UX #Design',
        likes: [users[0]._id, users[4]._id]
      },
      {
        author: users[2]._id,
        content: '🚀 Excited to share my latest open-source project! Built a real-time chat app with Node.js and WebSockets. Link in bio. Feel free to contribute! #OpenSource #NodeJS #WebDev',
        likes: [users[0]._id, users[1]._id, users[3]._id, users[4]._id]
      },
      {
        author: users[3]._id,
        content: '🌱 Started my zero-waste journey today! It\'s challenging but so rewarding. Every small action counts. Here are 5 easy swaps to start your eco-friendly life. #Sustainability #EcoFriendly',
        likes: [users[0]._id, users[2]._id]
      },
      {
        author: users[4]._id,
        content: '🎵 New beat just dropped on SoundCloud! This one is a fusion of lo-fi hip-hop and ambient electronic. It took 3 weeks to get right. Give it a listen and let me know what you think! #Music #Producer',
        likes: [users[1]._id, users[2]._id]
      },
      {
        author: users[0]._id,
        content: '☕ There\'s something magical about early morning coffee while the rest of the world is still asleep. Just you, your thoughts, and the perfect brew. What\'s your morning ritual? #MorningVibes #Coffee',
        likes: [users[2]._id, users[4]._id]
      },
      {
        author: users[1]._id,
        content: '🎨 Experimenting with generative art today. Used Python + matplotlib to create these geometric patterns. Each one is unique because it\'s procedurally generated. Art meets code! #GenerativeArt #Creative',
        likes: [users[0]._id, users[3]._id]
      },
      {
        author: users[2]._id,
        content: '💡 Hot take: The best programmers aren\'t the ones who know the most syntax, but the ones who can break complex problems into simple, elegant solutions. What\'s your take? #Programming #Tech #Opinion',
        likes: [users[0]._id, users[1]._id, users[4]._id]
      },
      {
        author: users[3]._id,
        content: '🍃 Made this incredible plant-based curry today. The secret? Fresh coconut milk and a homemade spice blend. Tastes absolutely incredible! Recipe in the comments below 👇 #Vegan #Foodie #Recipe',
        likes: [users[0]._id]
      },
      {
        author: users[4]._id,
        content: '🎧 Been studying the compositional techniques of Hans Zimmer and I\'m absolutely blown away by his approach to building emotional tension through layering minimal musical phrases. Pure genius! #Music #Composition',
        likes: [users[2]._id, users[3]._id]
      }
    ];

    const posts = await Post.create(postsData);
    console.log('📝 Created 10 posts');

    // Create some comments
    const commentsData = [
      { post: posts[0]._id, author: users[1]._id, text: 'This is absolutely stunning! What camera are you using? 📷' },
      { post: posts[0]._id, author: users[2]._id, text: 'Wow, the colors are unreal! Where was this taken?' },
      { post: posts[2]._id, author: users[0]._id, text: 'This is amazing! Just starred the repo. Will contribute soon!' },
      { post: posts[2]._id, author: users[4]._id, text: 'Great work! WebSockets are so powerful for real-time apps.' },
      { post: posts[4]._id, author: users[0]._id, text: 'This is fire! 🔥 The ambient elements really add depth.' },
      { post: posts[7]._id, author: users[1]._id, text: 'Completely agree. Problem-solving skills > syntax knowledge anytime.' }
    ];

    await Comment.create(commentsData);
    console.log('💬 Created sample comments');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('   Email: alex@example.com | Password: password123');
    console.log('   Email: sarah@example.com | Password: password123');
    console.log('   Email: marcus@example.com | Password: password123');
    console.log('   Email: priya@example.com | Password: password123');
    console.log('   Email: jordan@example.com | Password: password123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
