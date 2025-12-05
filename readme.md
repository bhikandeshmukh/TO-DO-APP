# 🚀 Streamline Todo App - Complete Setup Guide

## 📦 Project Structure

```
streamline-app/
├── backend/                 # Python Flask Backend
│   ├── app.py
│   ├── requirements.txt
│   └── .env
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

---

## 🔧 Option 1: React + Firebase (Recommended for Vercel)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enable **Authentication** (Email/Password)
4. Enable **Firestore Database**
5. Get your config from Project Settings

### Step 2: Setup React Project

```bash
# Create Vite React project
npm create vite@latest streamline-frontend -- --template react
cd streamline-frontend

# Install dependencies
npm install firebase lucide-react

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: Configure Tailwind

**tailwind.config.js:**
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 4: Add Firebase Config

Create `src/App.jsx` and paste the React code from the first artifact.

**Replace Firebase config with your credentials:**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 5: Deploy to Vercel

```bash
# Build the project
npm run build

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

## 🐍 Option 2: Python Flask Backend + React Frontend

### Backend Setup

**Step 1: Create Backend Directory**

```bash
mkdir streamline-backend
cd streamline-backend
```

**Step 2: Create requirements.txt**

```txt
Flask==3.0.0
flask-cors==4.0.0
Flask-PyMongo==2.3.0
PyJWT==2.8.0
python-dotenv==1.0.0
gunicorn==21.2.0
```

**Step 3: Install Dependencies**

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

**Step 4: Create .env File**

```env
MONGO_URI=mongodb://localhost:27017/streamline_db
SECRET_KEY=your-super-secret-key-change-this-in-production
```

**Step 5: Install MongoDB**

- Download from [MongoDB.com](https://www.mongodb.com/try/download/community)
- Or use MongoDB Atlas (cloud) - Free tier available

**Step 6: Run Backend**

```bash
python app.py
# Backend runs on http://localhost:5000
```

### Frontend Setup (for Python Backend)

**Step 1: Create React App**

```bash
npm create vite@latest streamline-frontend -- --template react
cd streamline-frontend
npm install axios lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 2: Create API Service**

**src/api.js:**
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (email, password) => 
    api.post('/auth/register', { email, password }),
  login: (email, password) => 
    api.post('/auth/login', { email, password })
};

export const todos = {
  getAll: () => api.get('/todos'),
  create: (todo) => api.post('/todos', todo),
  update: (id, todo) => api.put(`/todos/${id}`, todo),
  delete: (id) => api.delete(`/todos/${id}`)
};

export default api;
```

**Step 3: Update App Component**

Modify the React component to use the Python backend API instead of Firebase.

**Step 4: Run Frontend**

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🌐 Deployment Options

### Vercel (React + Firebase)
```bash
# Frontend only
vercel

# Custom domain
vercel --prod
```

### Render (Python Backend)
1. Push code to GitHub
2. Go to [Render.com](https://render.com)
3. Connect repository
4. Set environment variables
5. Deploy

### Railway (Full Stack)
1. Go to [Railway.app](https://railway.app)
2. Deploy from GitHub
3. Add MongoDB service
4. Set environment variables

### Heroku (Full Stack)
```bash
# Install Heroku CLI
heroku login
heroku create streamline-app

# Add MongoDB
heroku addons:create mongolab:sandbox

# Deploy
git push heroku main
```

---

## 📝 Configuration Files

### package.json (Frontend)
```json
{
  "name": "streamline-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.7.1",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
```

### index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Streamline - Task Management</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### src/main.jsx
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## 🔒 Security Tips

1. **Never commit sensitive data**
   - Add `.env` to `.gitignore`
   - Use environment variables

2. **Firebase Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{todoId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

3. **CORS Configuration**
   - Only allow your frontend domain
   - Don't use `*` in production

---

## 🐛 Troubleshooting

### Firebase Issues
- Check if Authentication is enabled
- Verify Firestore rules
- Check console for errors

### Python Backend Issues
- MongoDB not running: `mongod`
- Port already in use: Change port in app.py
- CORS errors: Check flask-cors configuration

### React Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`

---

## 📞 Support

For issues or questions:
- Check Firebase docs: [firebase.google.com/docs](https://firebase.google.com/docs)
- Flask docs: [flask.palletsprojects.com](https://flask.palletsprojects.com)
- React docs: [react.dev](https://react.dev)

---

## 🎉 You're All Set!

Choose your preferred option:
- **Firebase + Vercel** = Easiest deployment, no backend needed
- **Python + React** = Full control, self-hosted option

Happy coding! 🚀