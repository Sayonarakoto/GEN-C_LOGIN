# GEN-C_LOGIN 🚀

A full-stack system for faculty, students, and security built with:

* **Frontend:** React + Vite + Bootstrap
* **Backend:** Node.js + Express.js + MongoDB

---

## 📂 Project Structure

```
GEN-C_LOGIN/
├───server/       # Backend (Node.js + Express + MongoDB)
├───src/          # Frontend (React + Vite)
└───README.md
```

---

## 🛠️ Local Development

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [MongoDB](https://www.mongodb.com/try/download/community)

### 2. Install Dependencies

* **Backend:**
  ```bash
  cd server
  npm install
  ```

* **Frontend:**
  ```bash
  npm install
  ```

### 3. Backend Setup
Create a `.env` file in the `server/` directory:
```
MONGO_URI=mongodb://127.0.0.1:27017/paperlessCampus
PORT=3001
JWT_SECRET=your_super_secret_key
PASS_TOKEN_SECRET=your_pass_token_secret
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com
```

### 4. Running Locally
* **Start Backend:** `cd server && npm start` (Runs on `http://localhost:3001`)
* **Start Frontend:** `npm run dev` (Runs on `http://localhost:5173`)

---

## ☁️ Production Deployment

### 1. Backend (e.g., Render)
1. Set up a Web Service on Render.
2. Set Build Command: `npm install` (in `server/` directory)
3. Set Start Command: `node server/index.js`
4. Add Environment Variables in the **Render Dashboard -> Environment** tab:
   - `NODE_ENV=production`
   - `MONGO_URI`, `JWT_SECRET`, `PASS_TOKEN_SECRET`, SMTP settings as listed in Backend Setup.

### 2. Frontend (e.g., Vercel)
1. Deploy as a Vite project.
2. Set Environment Variables in **Vercel Project Settings -> Environment Variables**:
   - `VITE_API_BASE_URL=https://<your-backend-url>`
   - `VITE_API_URL=https://<your-backend-url>`

---

## 📖 Available Scripts

### Backend
* `npm start`: Runs the server using nodemon.

### Frontend
* `npm run dev`: Starts the development server.
* `npm run build`: Builds the application for production.

---

## 📜 License
MIT License © 2026
