# CliniView - Medical Document Management Platform

CliniView is a streamlined healthcare platform that connects patients and doctors for medical document management and basic symptom checking. The platform provides secure document sharing and professional medical feedback.

## Project Structure

```
/
├── ARCHITECTURE.md       # Detailed architecture documentation
├── frontend/             # Next.js + TypeScript frontend
├── backend/              # Node.js + Express + MongoDB backend
└── ml/                   # Python-based ML services with FastAPI (symptom checker)
```

## Features

### Patient Features
- Secure authentication with Google OAuth
- Upload and manage medical documents
- View doctor's comments on your documents
- Basic symptom checker

### Doctor Features
- Secure authentication with Google OAuth
- Access to assigned patient documents
- Add diagnostic notes and recommendations to patient documents

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- React Context API for auth management

### Backend
- Node.js with Express
- MongoDB for data persistence
- JWT Authentication
- Google OAuth 2.0

### ML Services
- Python with FastAPI
- Basic symptom classification
- Document text extraction

## Getting Started

### Prerequisites
- Node.js v18+
- Python 3.8+ (3.9+ recommended)
- MongoDB

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cliniview.git
   cd cliniview
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Create .env.local file with required environment variables
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create .env file with required environment variables
   npm run dev
   ```

4. **ML Service Setup**
   ```bash
   cd ml
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements-minimal.txt
   python app.py
   ```

## Environment Variables

Create the following environment files:

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ML_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/cliniview
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
```

### ML Service (.env)
```
PORT=5000
BACKEND_URL=http://localhost:3001/api
```

## Development

### Running All Services Together

1. Start the MongoDB database:
   ```bash
   # Make sure MongoDB is running on localhost:27017
   ```

2. Start all services in separate terminals:

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - ML Service
   cd ml
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python app.py
   
   # Terminal 3 - Frontend
   cd frontend
   npm run dev
   ```

3. Access the application at http://localhost:3000

### Default Ports
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- ML API: http://localhost:5000/api

### API Documentation

- Backend API: http://localhost:3001/api/docs
- ML API: http://localhost:5000/docs

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request