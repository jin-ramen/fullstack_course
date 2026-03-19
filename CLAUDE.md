# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a fullstack notes application built as part of the Full Stack Open course. It has two independent sub-projects:

- `back-end/` — Express.js REST API with MongoDB (Mongoose), JWT authentication
- `front-end/` — React (Vite) SPA consuming the backend API via axios

## Commands

### Back-end (`back-end/`)

```bash
npm run dev      # Start with file watching (NODE_ENV=development)
npm start        # Production start (NODE_ENV=production)
npm test         # Run all tests (NODE_ENV=test, uses node --test)
npm run lint     # ESLint
```

Run a single test file:
```bash
node --test test/average.test.js
```

### Front-end (`front-end/`)

```bash
npm run dev      # Vite dev server
npm run build    # Production build
npm run lint     # ESLint
npm run server   # json-server mock API on port 3001
```

## Architecture

### Back-end

**Entry points:** `index.js` starts the server; `app.js` configures Express and exports the app (kept separate for testability with supertest).

**Request flow:**
```
index.js → app.js → controllers/* → models/*
```

**Key patterns:**
- `utils/config.js` — loads `.env` via dotenv; switches `MONGODB_URI` to `TEST_MONGODB_URI` when `NODE_ENV=test`
- `utils/middleware.js` — `requestLogger`, `unknownEndpoint`, `errorHandler` (handles CastError, ValidationError, MongoServerError, JWT errors)
- `utils/logger.js` — thin wrapper around console; suppressed in test mode

**Routes:**
- `GET/POST/PUT/DELETE /api/notes` — note CRUD; POST requires Bearer token in `Authorization` header
- `POST /api/users` — user registration (bcrypt password hashing)
- `POST /api/login` — returns JWT token (expires in 1 hour)

**Auth:** Token extracted from `Authorization: Bearer <token>` header inside `controllers/notes.js` (`getTokenFrom`). JWT verified against `process.env.SECRET`.

**Models:**
- `Note` — has `content`, `important`, `user` (ref to User)
- `User` — has `username`, `name`, `passwordHash`, `notes` (array of Note refs)

### Front-end

The React app currently points to `http://localhost:3001` (json-server) in `src/services/notes.js`. In production the back-end serves the built front-end from its `dist/` folder (`app.use(express.static('dist'))`).

**State management:** All state lives in `App.jsx` — no external state library. Data fetched via `src/services/notes.js` (axios wrapper).

## Environment Variables (back-end)

Required in `back-end/.env`:
```
MONGODB_URI=...       # Production MongoDB connection string
TEST_MONGODB_URI=...  # Separate test database
PORT=3001
SECRET=...            # JWT signing secret
```
