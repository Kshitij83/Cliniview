# CliniView Project Architecture

## Overview

CliniView is a modern healthcare platform designed to help patients manage their health records and doctors to efficiently track patient information. The platform leverages artificial intelligence to provide insights and recommendations based on medical data.

## Project Structure

The project is divided into three main components:

### 1. Frontend (Next.js)

The frontend is built with Next.js and provides different interfaces for patients and doctors.

```
frontend/
├── src/
│   ├── app/ - Next.js app router pages
│   │   ├── auth/ - Authentication pages
│   │   ├── dashboard/ - Dashboard pages for patients and doctors
│   │   └── page.tsx - Home page
│   ├── components/ - Reusable UI components
│   │   ├── layout/ - Layout components
│   │   └── ui/ - UI components
│   ├── contexts/ - React contexts
│   ├── lib/ - Utility functions
│   └── types/ - TypeScript type definitions
```

### 2. Backend (Node.js with Express and TypeScript)

The backend provides RESTful APIs for the frontend and handles business logic, data storage, and authentication.

```
backend/
├── src/
│   ├── config/ - Configuration files
│   │   └── db.ts - Database configuration
│   ├── controllers/ - Request handlers
│   │   ├── ai.controller.ts - AI-related endpoints
│   │   ├── auth.controller.ts - Authentication endpoints
│   │   ├── doctor.controller.ts - Doctor-related endpoints
│   │   ├── document.controller.ts - Document management endpoints
│   │   └── patient.controller.ts - Patient-related endpoints
│   ├── middleware/ - Express middleware
│   ├── models/ - Mongoose models
│   ├── routes/ - Express routes
│   ├── services/ - Business logic services
│   ├── utils/ - Utility functions
│   └── server.ts - Express server entry point
├── uploads/ - Document storage directory
```

### 3. ML Service (Python with FastAPI)

The ML service provides AI capabilities for the platform using machine learning models.

```
ml/
├── app.py - FastAPI application entry point
├── data/ - Data files and sample data
├── models/ - ML model files and training scripts
├── services/ - ML service modules
│   ├── health_summary.py - Health summary generation service
│   ├── risk_prediction.py - Health risk prediction service
│   └── symptom_checker.py - Symptom analysis service
├── utils/ - Utility functions
│   ├── model_loader.py - Functions to load ML models
│   └── text_extraction.py - Text extraction utilities
```

## Communication Flow

1. The frontend communicates with the backend API to fetch and store data.
2. The backend communicates with the ML service when AI capabilities are needed.
3. The ML service processes the data and returns insights to the backend.
4. The backend stores the AI-generated insights and returns them to the frontend.

```
Frontend (Next.js) ⟷ Backend (Express) ⟷ ML Service (FastAPI)
```

## Data Flow for Key Features

### Symptom Checking

1. Patient enters symptoms in the frontend
2. Frontend sends symptoms to backend API
3. Backend forwards symptoms to ML service
4. ML service analyzes symptoms and returns possible conditions
5. Backend stores the results and returns them to the frontend
6. Frontend displays the results to the patient

### Health Summary Generation

1. Patient uploads medical documents
2. Documents are stored in the backend
3. Backend sends document URLs to the ML service
4. ML service analyzes documents and generates a health summary
5. Backend stores the summary and returns it to the frontend
6. Frontend displays the health summary to the patient

## Authentication and Security

- JWT-based authentication for API access
- API key authentication for ML service
- Role-based access control (patient vs doctor)
- Secure document storage

## Development Workflow

1. Run the backend server (Node.js)
   ```
   cd backend
   npm install
   npm run dev
   ```

2. Run the frontend application (Next.js)
   ```
   cd frontend
   npm install
   npm run dev
   ```

3. Run the ML service (Python)
   ```
   cd ml
   pip install -r requirements.txt
   python app.py
   ```

## Environment Variables

Each component requires specific environment variables. Example files (.env.example) are provided in each directory.

## API Documentation

- Backend API: Available at `http://localhost:3001/api-docs` when the backend is running
- ML API: Available at `http://localhost:5000/docs` when the ML service is running