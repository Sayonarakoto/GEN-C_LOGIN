# GEN-C Login

GEN-C Login is a full-stack campus portal for student and staff workflows. It provides role-based dashboards and tools for gate passes, late-entry requests, library services, security checks, and administration.

## Features

- Separate access and dashboards for students, faculty/HODs, security staff, librarians, and administrators.
- Student requests for late entry, special passes, library activation, and book borrowing.
- Faculty/HOD workflows for reviewing requests and managing gate passes.
- QR-code pass generation and verification for campus security.
- Library, student, settings, and audit-log APIs.
- Real-time updates and notifications using Socket.IO.
- PDF generation, spreadsheet uploads, and optional Vercel Blob file storage.
- Installable Progressive Web App (PWA).

## Technology stack

| Area | Library or technology | Purpose |
| --- | --- | --- |
| Frontend | React | Component-based user interface. |
| Frontend tooling | Vite | Development server and production builds. |
| Routing | React Router | Client-side routes and role-protected pages. |
| UI | Material UI, Emotion, Bootstrap, React Bootstrap | Components, styling, and responsive layouts. |
| API client | Axios | HTTP requests to the backend. |
| Charts and dates | Recharts, date-fns, Day.js | Dashboard visualizations and date/time handling. |
| Live updates | Socket.IO client | Real-time client/server communication. |
| PWA | vite-plugin-pwa | Service worker, offline caching, and install support. |
| Backend | Node.js, Express | HTTP API and server middleware. |
| Database | MongoDB, Mongoose | Persistent data and MongoDB models. |
| Authentication | JSON Web Token, bcryptjs | Signed tokens and password hashing. |
| Validation and protection | express-validator, Helmet, CORS, express-rate-limit | Request validation, security headers, cross-origin access, and rate limiting. |
| File and document handling | Multer, ExcelJS, PDFKit, pdf-lib | Uploads, spreadsheet processing, and PDF generation. |
| Email and storage | Nodemailer, Vercel Blob | Email delivery and optional cloud file storage. |
| QR and MFA | qrcode, speakeasy | QR-code creation and multi-factor authentication utilities. |
| Logging | Winston | Server-side application logging. |

Dependency manifests and lockfiles are in the repository root (frontend) and `server/` (backend).

## Project layout

```text
.
├── api/                 # Vercel serverless endpoints
├── public/              # Static assets
├── src/                 # React application
│   ├── admin/
│   ├── components/
│   ├── context/
│   ├── Dashboards/
│   ├── faculty/
│   ├── Pages/
│   └── student/
├── server/              # Express API, MongoDB models, routes, and services
├── .github/             # GitHub release-note configuration and workflows
├── package.json         # Frontend scripts and dependencies
└── README.md
```

## Requirements

- Node.js `20.19+` or `22.12+`
- npm
- A MongoDB instance, local or hosted

An SMTP account is needed for email features. A Vercel Blob token is only needed when using Vercel Blob storage.

## Run locally

### 1. Install dependencies

From the repository root:

```bash
npm ci
npm --prefix server ci
```

### 2. Configure environment variables

Create a **root-level** `.env.test` file. The frontend's `npm run dev` uses Vite's `test` mode, and the backend also loads `.env.test` from the repository root (then `.env` as a fallback).

```dotenv
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/paperlessCampus

# Use unique, strong, private values for your local environment.
JWT_SECRET=replace-with-a-private-secret
JWT_REFRESH_SECRET=replace-with-a-different-private-secret
PASS_TOKEN_SECRET=replace-with-another-private-secret

VITE_API_BASE_URL=http://localhost:3001
VITE_USE_VERCEL_BLOB=false
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Optional: required for email delivery and password-reset emails.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
DEFAULT_FROM_EMAIL=

# Optional: only required when using Vercel Blob storage.
BLOB_READ_WRITE_TOKEN=
```

The application also supports optional settings such as `ACCESS_TOKEN_EXPIRES`, `REFRESH_TOKEN_EXPIRES`, `VALID_DEPARTMENTS`, `COLLEGE_HOURS_START`, `COLLEGE_HOURS_END`, `LATE_ENTRY_CUTOFF`, and `GATE_PASS_EXTRA_MINUTES`.

Environment files are git-ignored. Do not commit credentials, production tokens, or real secrets. For deployment, configure environment variables in the hosting provider rather than copying local secrets.

### 3. Start MongoDB and the backend

Make sure MongoDB is running and `MONGO_URI` points to it. In one terminal:

```bash
cd server
npm start
```

The API listens on `http://localhost:3001` by default.

### 4. Start the frontend

In another terminal, from the repository root:

```bash
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Scripts

### Frontend (repository root)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server in `test` mode. |
| `npm run build` | Create the production frontend in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run deploy` | Build and publish `dist/` using `gh-pages`; requires GitHub Pages to be configured. |

### Backend (`server/`)

| Command | Description |
| --- | --- |
| `npm start` | Start the Express server with nodemon. |
| `npm test` | Run Jest. There are currently no matching server test files. |

## Production and deployment

- Build the frontend with `npm run build`; the static output is written to `dist/`.
- The frontend can be hosted on a static hosting provider. Set `VITE_API_BASE_URL` to the public backend URL when building.
- Run the backend on a Node.js host and configure `MONGO_URI`, JWT secrets, `PORT`, and any email or storage settings in the host's environment settings.
- Set `ALLOWED_ORIGINS` on the backend to the deployed frontend origin(s).
- `npm run deploy` publishes the frontend using the repository's `gh-pages` script. Confirm the Vite `base` setting matches the selected hosting path before deploying to a project subpath.

## Release notes

Push a version tag such as `v0.1.0` to trigger the GitHub Actions workflow, which creates a draft GitHub release with automatically generated notes and a commit-history section since the previous version tag. For the first release, the section includes all non-merge commits reachable from the tag. To update an existing draft, run **Draft release notes** from the Actions tab and enter the tag. Release notes are grouped using merged pull request labels configured in `.github/release.yml`:

- `enhancement` → Features
- `bug` → Bug Fixes
- `documentation` → Documentation

Unmatched pull requests are grouped under Other Changes. Review the draft under **GitHub → Releases** before publishing it.

## CI/CD

The **CI** GitHub Actions workflow runs for pull requests targeting `Master-Prod` and for pushes to that branch. It installs the frontend and backend dependencies, checks backend JavaScript syntax, builds the frontend, and runs the backend Jest command. There are currently no backend test files, so the Jest step allows an empty test suite.

Vercel and Render are connected to GitHub and deploy automatically when changes reach their configured deployment branches. To make sure only passing changes are deployed:

1. In GitHub, protect `Master-Prod` with a branch rule or ruleset.
2. Require pull requests and require the **CI / Build and test** status check before merging.
3. Configure both Vercel and Render to deploy from `Master-Prod`.
4. Merge changes only after CI passes.

Direct pushes to `Master-Prod` can start the provider deployments before the CI workflow finishes. Avoid direct pushes if you need CI to gate production deployments. The current ESLint command reports existing issues and is not included as a blocking CI check.
