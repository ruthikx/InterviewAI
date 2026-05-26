# Interview AI

AI-powered interview preparation app built with React, Vite, Express, MongoDB, and LLM integrations. Users can sign up, upload a resume or add a self-description, paste a job description, and get a personalized interview report with:

- Match score
- Technical interview questions
- Behavioral interview questions
- Skill gap analysis
- Day-wise preparation plan
- AI-generated resume PDF tailored to the target role

The frontend is intended to be deployed on Netlify and the backend on Render.

## Tech Stack

### Frontend

- React 19
- React Router
- Axios
- Sass
- Lottie animations
- Vite

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT cookie authentication
- Multer for file uploads
- `pdf-parse` for resume text extraction

### AI / External Services

- Groq for primary structured generation
- Google Gemini as fallback
- html2pdf.app for resume PDF generation

## Project Structure

```text
GenAI/
+-- backend/
|   +-- server.js
|   +-- package.json
|   `-- src/
|       +-- app.js
|       +-- config/
|       +-- controllers/
|       +-- middlewares/
|       +-- models/
|       +-- routes/
|       `-- services/
`-- frontend/
    +-- package.json
    +-- vite.config.js
    +-- public/
    `-- src/
        +-- features/
        +-- app.routes.jsx
        +-- App.jsx
        `-- main.jsx
```

## Features

### Authentication

- Register and login with email/password
- JWT stored in an HTTP-only cookie
- Protected routes on the frontend
- Logout support with token blacklisting

### Interview Report Workflow

1. User submits a job description.
2. User uploads a resume PDF or writes a self-description.
3. Backend extracts resume text and sends the profile + JD to AI.
4. AI returns a structured interview report.
5. Report is stored in MongoDB and shown in the dashboard.

### Resume PDF Generation

- A saved interview report can be converted into an AI-tailored resume PDF.
- The backend generates structured HTML first, then converts it to PDF using `html2pdf.app`.

## Main User Flow

### Home page

- Paste job description
- Upload resume
- Optionally add self-description
- Generate a new interview plan
- View previously generated reports

### Interview report page

- See match score
- Review technical questions
- Review behavioral questions
- Review skill gaps
- Follow the preparation roadmap
- Download generated resume as PDF

## API Routes

### Auth routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/logout`
- `GET /api/auth/get-me`

### Interview routes

- `POST /api/interview/`
- `GET /api/interview/`
- `GET /api/interview/report/:interviewId`
- `POST /api/interview/resume/pdf/:interviewReportId`

## Environment Variables

### Backend `.env`

Create `backend/.env` with:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
GROQ_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:5173
HTML2PDF_API_KEY=your_html2pdf_api_key
PORT=3000
```

### Frontend `.env`

Create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:3000
```

## Local Development

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Start the backend

```bash
cd backend
npm run dev
```

### 3. Start the frontend

```bash
cd frontend
npm run dev
```

### 4. Open the app

Frontend default URL:

```text
http://localhost:5173
```

## Deployment

### Frontend on Netlify

- Root directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable:
  - `VITE_API_URL=https://your-render-backend-url.onrender.com`

### Backend on Render

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `GOOGLE_GENAI_API_KEY`
  - `GROQ_API_KEY`
  - `HTML2PDF_API_KEY`
  - `CLIENT_URL=https://your-netlify-site.netlify.app`
  - `PORT=10000` or Render default

### Cross-origin cookie setup

Because the app uses cookie-based auth across Netlify and Render:

- backend CORS must allow the Netlify frontend URL
- frontend requests must use `withCredentials: true`
- cookies are configured as `httpOnly`, `secure`, and `sameSite: "none"`

## Data Models

### User

- `username`
- `email`
- `password`

### Interview Report

- `title`
- `jobDescription`
- `resume`
- `selfDescription`
- `matchScore`
- `technicalQuestions[]`
- `behavioralQuestions[]`
- `skillGaps[]`
- `preparationPlan[]`
- `user`
- timestamps

## Notes

- Resume uploads are handled in memory using Multer.
- The backend currently parses resume content from PDF files.
- Groq is used first for faster responses; Gemini is used as a fallback.
- The repository still contains the default Vite README inside `frontend/README.md`.

## Important Security Note

Real secrets are present in the current local `backend/.env`. Those values should not be shared publicly, and if they have been exposed anywhere outside your machine, they should be rotated.
