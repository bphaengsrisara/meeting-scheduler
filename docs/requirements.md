# Requirements

A summary, in my own words, of the brief this project is built from.

## Goal

A simple meeting manager on the web: users create, update, delete and list
meetings.

## Core features

- Add a meeting with a title, a description, a due date and a status.
- See the list of meetings, with pagination or infinite scroll.
- Edit a meeting's title, description, due date and status.
- Delete a meeting.
- Meetings persist. The storage is free to choose: memory, a JSON file, SQLite
  or a database.

## Technical requirements

- Frontend in React or Vue, with any styling.
- Backend in Node.js with Express, or in Python with FastAPI or Flask.
- A simple REST API for the CRUD operations. The database may be mocked.
- A README with setup instructions.
- The app is containerized for deployment: frontend, backend and database.
- The app is deployed, for example on Vercel, Render, Heroku or Docker.

## Optional extras

- User authentication: login and logout.
- A UI design, for example in Figma, Adobe XD, Sketch or Penpot.
- Tests, unit or integration.
- A CI/CD flow for testing and deployment, for example GitHub Actions.

## Deliverables

- A public GitHub repository with the code, a clear commit history and a
  README.
- Instructions to run the app locally.

## Scope

About one week of work. It does not need to be perfect; the point is to show
how the software is structured and built.

## Screens

The brief sketches four pages for a "Candidate Meeting Scheduler".

1. **Login / logout (optional).** A logo and the title, email and password
   fields, a login button, and optionally a "continue as guest" link.
2. **Dashboard.** A list of upcoming meetings as cards. Each card shows the
   candidate's name and the role applied for, the date and time range, a
   status (confirmed or pending) and a button to view the details.
3. **Booking form.** Schedules a new meeting: candidate name (autocomplete or
   free text), position (a dropdown), date, start and end time, meeting type
   (on site or online) and notes.
4. **Candidate summary.** The candidate's name and role; their upcoming
   meetings with date, time and status; a notes area for the interviewer; the
   history of earlier interviews and evaluations; and buttons to edit the
   meeting, cancel the meeting and add feedback.

## A note on the two descriptions

The feature list describes a meeting by title, description, due date and
status. The screens describe it by candidate, position, date, start and end
time, type, notes and status. How the two are reconciled is recorded with the
data model.
