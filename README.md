# ⚡ SocialPulse — Full-Stack Social Media App

A complete, production-ready social media web application built as a **CodeAlpha Internship Project**.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (SPA) |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| File Uploads | Multer |

## 📁 Folder Structure

```
CodeAlpha_SocialMedia/
├── client/                  # Frontend (SPA)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── api.js           # Fetch wrapper + token utils
│       ├── auth.js          # Login / Register
│       ├── posts.js         # Feed, create post, like, delete
│       ├── profile.js       # Profile, post detail, comments, edit profile
│       ├── explore.js       # Explore grid + user search
│       ├── notifications.js # Notifications
│       └── app.js           # Router + init
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   └── Notification.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   ├── commentController.js
│   │   └── notificationController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── postRoutes.js
│   │   ├── commentRoutes.js
│   │   └── notificationRoutes.js
│   ├── middleware/
│   │   ├── auth.js          # JWT protect middleware
│   │   └── upload.js        # Multer config
│   ├── server.js
│   └── seed.js              # DB seeder
├── .env
├── package.json
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongodb://localhost:27017`) **or** a MongoDB Atlas URI

### 1. Clone & Install

```bash
git clone https://github.com/your-username/CodeAlpha_SocialMedia.git
cd CodeAlpha_SocialMedia
npm install
```

### 2. Configure Environment

Edit `.env` in the root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/socialmedia
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

### 3. Seed the Database (optional)

```bash
npm run seed
```

This creates **5 sample users** and **10 sample posts**.

**Sample login credentials after seeding:**
| Name | Email | Password |
|---|---|---|
| Alex Morgan | alex@example.com | password123 |
| Sarah Chen | sarah@example.com | password123 |
| Marcus Johnson | marcus@example.com | password123 |
| Priya Sharma | priya@example.com | password123 |
| Jordan Blake | jordan@example.com | password123 |

### 4. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Visit: **http://localhost:5000**

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login and get JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/search?q=` | ❌ | Search users by name/username |
| GET | `/api/users/:username` | ❌ | Get user profile |
| PUT | `/api/users/update` | ✅ | Update profile (multipart/form-data) |
| POST | `/api/users/:id/follow` | ✅ | Follow a user |
| POST | `/api/users/:id/unfollow` | ✅ | Unfollow a user |
| GET | `/api/users/:id/followers` | ❌ | Get followers list |
| GET | `/api/users/:id/following` | ❌ | Get following list |

### Posts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/posts/feed?page=&limit=` | ✅ | Get feed posts |
| GET | `/api/posts/explore?page=&limit=` | ❌ | Get all posts |
| GET | `/api/posts/user/:userId` | ❌ | Get posts by user |
| GET | `/api/posts/:id` | ❌ | Get single post |
| POST | `/api/posts` | ✅ | Create post (multipart/form-data) |
| DELETE | `/api/posts/:id` | ✅ | Delete own post |
| POST | `/api/posts/:id/like` | ✅ | Toggle like/unlike |

### Comments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/comments/:postId` | ❌ | Get all comments for a post |
| POST | `/api/comments/:postId` | ✅ | Add a comment |
| DELETE | `/api/comments/:id` | ✅ | Delete own comment |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | ✅ | Get user notifications |
| PUT | `/api/notifications/markread` | ✅ | Mark all as read |

---

## ✨ Features

- 🔐 JWT authentication with bcrypt password hashing
- 📱 Responsive mobile-first design (dark theme)
- 🏠 Home feed (posts from followed users + self)
- 🔍 Explore all posts + search users by username
- 💬 Post detail with comments (add/delete)
- ❤️ Like/unlike toggle with real-time count update
- 👤 User profiles with follower/following counts
- ➕ Follow/Unfollow with instant UI update
- 📷 Image uploads for posts and profile picture
- 🔔 Notifications (likes, comments, follows) with unread badge
- ✏️ Edit profile (name, bio, avatar, password)
- 📄 Pagination for feed and explore
- 🌱 Database seed with sample data

---

## 👤 Author

**CodeAlpha Internship Project**  
Built with ❤️ using Node.js, Express, MongoDB & Vanilla JS