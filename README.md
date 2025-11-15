## Overview
We are students from the CFG degree Software Development course (autumn cohort). Unfortunately, we have only recently started our coding journey; therefore, we couldn't fully implement our vision (although we had great ambitions 😉). Initially, we wanted to create a web application with an interactive frontend and a simple backend. We agreed on JS for the frontend, Python for the backend interactions, and SQLite for the database. We divided the tasks among the four of us. We worked separately on them, but when we tried to merge the branches altogether, we faced many errors that made our project totally non-functional. We could solve some of them, but haven't succeeded at solving all of them; therefore, our application doesn't fully work. Our Main branch consists of the working application, while the rest of the code can be found on the following branches: Submission-Form (consists of the code for uploading the challenge solutions and sending them to the database), User-Panels (consists of the code for roles handling). 
As we've already mentioned, this is only the beginning of our coding journey; therefore, the syntax is not intuitive for us, and AI has been a big part of this project. Although we tried to write the code ourselves, we still had to use the AI guidance. We will still try to make this project work in our free time, make it fully work and make some improvements (change pure JS to the REACT framework, improve design and UI/UX). 


# Project Overview

This application is a lightweight hackathon management platform combining a Python/Flask backend with a simple HTML/CSS/JS frontend. It handles user roles, authentication, challenge retrieval, file submissions, validation, and database storage. The architecture is modular: a submission engine, an authentication and roles layer, a challenge-fetching service, and a frontend for interaction. The system relies on Python (Flask) for backend logic and SQLite for storage, while the user interface is delivered through HTML, CSS, and JavaScript.

## Challenge Retrieval & API Layer

The platform integrates a service that fetches external programming challenges (e.g., from Codewars), normalises their structure, enriches them with calculated submission deadlines, and exposes them via a unified `/api/challenges` endpoint. These challenges are used by the frontend to build an interactive list of available tasks. Additionally, the service provides simple HTML pages, such as the homepage and the challenge list view.

### Key features:

* External challenge retrieval (Codewars API)
* Unified challenge format for the frontend
* Submission deadline calculation
* HTML templates for homepage and challenges page
* REST endpoint for challenge consumption


## Authentication & Role Management

The system includes user registration, login, and role-based access control using JWT tokens. Backend routes enforce permissions for participants, judges, and admins. A lightweight HTML/JS frontend handles registration and login, storing tokens on the client. SQLAlchemy-based models enable portable database management, supporting SQLite in development and PostgreSQL in production.

### Key features: 

* Email/password registration
* JWT login with token expiration
* Role-based access (participant/judge/admin)
* Protected upload/download routes
* HTML/JS frontend with localStorage token handling
* Basic testing scripts for register/login/upload


## Submission Engine & Validation System

The backend contains a full submission workflow for challenge solutions. It validates uploaded CSV, JSON, and model/code files; checks schemas; enforces size constraints; and stores accepted or rejected files in structured directories named by challenge. Submissions are recorded in the database together with metadata and validation status. A mock HTML upload page is included to test realistic form-data file uploads.

### Key features:

* CSV/JSON parsing + schema validation
* Support for model/code uploads (.py, .pkl, .onnx, etc.)
* Structured filesystem storage per challenge
* SQLite tables: users, roles, submissions, grades
* Mock data inserted for testing
* API endpoints: list challenges, submit, list submissions, download
* HTML form for real file upload testing


## Frontend Interface

The frontend provides a user-facing interface for browsing challenges, viewing details, and submitting solutions. Challenge cards accessible after clicking a button on the homepage display titles and descriptions and redirect users to the submission page. After a file is uploaded, the backend records it in the database and makes it available for review.

### Key features:

* Homepage displaying challenge cards
* Card-driven navigation to submission form
* Submission form linked to `/api/submit`
* HTML/CSS layout for visual structure
* JavaScript fetching API data and handling submissions
* Integrated end-to-end flow from challenge → upload → database entry


## Technologies Used

### Backend

* Python (Flask)
* SQLite
* PyJWT

### Frontend

* HTML
* CSS
* JavaScript


┌──────────────────────────────┐
│            Frontend           │
│  HTML / CSS / JS              │
│  - Homepage (challenge cards) │
│  - Submission form            │
│  - Login / Register           │
└───────────────┬──────────────┘
                │ REST (JSON / form-data)
                ▼
┌───────────────────────────────────────────┐
│                 Flask API                 │
│  Auth & Roles          Challenge Service  │
│  - /register           - /api/challenges  │
│  - /login (JWT)        - external fetch   │
│                                           │
│  Submission Engine                        │
│  - /api/submit                             │
│  - /api/submissions                        │
│  - /download                               │
└───────────────┬───────────────────────────┘
                │ SQL / filesystem
                ▼
┌───────────────────────────────────────────┐
│               Storage Layer               │
│  Database (SQLite):            │
│   - users, roles, user_roles              │
│   - submissions, grades                   │
│                                           │
│  File Storage: uploads/<challenge_id>/    │
└───────────────────────────────────────────┘
