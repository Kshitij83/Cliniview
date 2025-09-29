# Cliniview Backend

Backend API for the Cliniview healthcare platform that provides RESTful endpoints for patients and doctors to interact with medical records, AI health summaries, and more.

## Technologies Used

- **Node.js**: JavaScript runtime
- **TypeScript**: Static type checking
- **Express.js**: Web application framework
- **MongoDB & Mongoose**: NoSQL database with ODM
- **Google OAuth 2.0**: Authentication
- **JWT**: Token-based authorization
- **Multer**: File upload handling
- **Morgan**: HTTP request logger
- **Axios**: HTTP client for ML service integration

## Project Structure

```
/src
  /config      # Configuration files
  /controllers # Route controllers
  /middleware  # Express middleware
  /models      # Mongoose models with TypeScript interfaces
  /routes      # API routes
  /services    # Business logic
  /utils       # Utility functions
  server.ts    # Entry point
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a .env file in the root directory with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/cliniview
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   FRONTEND_URL=http://localhost:3000
   FILE_UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=10485760
   ML_SERVICE_URL=http://localhost:5001/api
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. For production build:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/google`: Google OAuth login
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with credentials

### Patients
- `GET /api/patients/:id`: Get patient details
- `PUT /api/patients/:id`: Update patient information
- `POST /api/patients/:id/documents`: Upload medical documents
- `GET /api/patients/:id/documents`: Get all patient documents
- `GET /api/patients/:id/ai-summary`: Get AI-generated health summary

### Doctors
- `GET /api/doctors/:id`: Get doctor details
- `PUT /api/doctors/:id`: Update doctor information
- `GET /api/doctors/:id/patients`: Get doctor's patients
- `POST /api/doctors/patients/:id/diagnostic-notes`: Add diagnostic notes

### AI Services
- `POST /api/ai/symptom-check`: Symptom checker service
- `GET /api/ai/health-summary/:patientId`: Generate health summary

### Medical Documents
- `GET /api/documents/:id`: Get document by ID
- `DELETE /api/documents/:id`: Delete document

## Testing

Run tests using Jest:
```bash
npm test
```

## Google OAuth Setup

To set up Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "Credentials"
4. Create an "OAuth client ID"
5. Configure the consent screen
6. Add authorized redirect URIs (e.g., `http://localhost:5000/api/auth/google/callback`)
7. Copy the Client ID and Client Secret to your .env file

## TypeScript Development

- The project uses TypeScript for type safety
- Models include interfaces for proper typing
- Run TypeScript compilation with:
  ```bash
  npm run build
  ```
- Check for type errors with:
  ```bash
  npm run check
  ```