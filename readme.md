# To Do App

A full-stack task management application with Todo List, Tickets system, and PWA support.

## Live Demo
- **Frontend:** [todobhikan.vercel.app](https://todobhikan.vercel.app)
- **Backend:** [to-do-bhikan-backend.vercel.app](https://to-do-bhikan-backend.vercel.app)

## Features

### To Do List
- Create, edit, delete tasks
- Priority levels (High/Medium/Low)
- Categories (Personal/Work/Shopping/Health)
- Mark as complete
- Search and filter
- Comments on tasks
- Export to PDF/Excel

### Tickets System
- Manual Ticket ID input
- Client issue tracking
- Status management (Open/In Progress/Resolved/Closed)
- Priority levels
- Filter by Client, Status, Search
- Comments and updates timeline

### PWA Support
- Install as mobile/desktop app
- Offline support

### Authentication
- User registration and login
- JWT based authentication
- Each user's data is separate

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python Flask |
| Database | MongoDB Atlas |
| Auth | JWT |
| Hosting | Vercel |

## Project Structure

```
TO-DO-APP/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── vercel.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── index.css
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── package.json
└── readme.md
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
MONGO_URI=your-mongodb-uri
SECRET_KEY=your-secret-key
```

### Frontend (.env.production)
```
VITE_API_URL=https://your-backend.vercel.app/api
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/todos | Get todos |
| POST | /api/todos | Create todo |
| GET | /api/tickets | Get tickets |
| POST | /api/tickets | Create ticket |
| GET | /api/tickets/clients | Get unique clients |
| GET | /api/export/pdf | Export PDF |
| GET | /api/export/excel | Export Excel |

## Author
Bhikan Deshmukh

## License
MIT