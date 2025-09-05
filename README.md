Perfect 👍 Let’s extend the **README** to also list the **major dependencies** for both frontend & backend — so anyone cloning your repo knows exactly what tech stack they’re pulling.

Here’s the updated version:

---

# GEN-C\_LOGIN 🚀

A full-stack login system for faculty, students, and security built with:

* **Frontend:** React + Vite + Bootstrap + Ant Design
* **Backend:** Node.js + Express.js + MongoDB

---

## 📂 Project Structure

```
GEN-C_LOGIN/
│── client/       # React frontend
│── server/       # Node.js + Express backend
│── README.md
```

---

## ⚡ Prerequisites

Make sure you have installed:

* [Node.js](https://nodejs.org/) (v18+ recommended)
* [MongoDB](https://www.mongodb.com/try/download/community) or MongoDB Atlas

---

## 🛠️ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/GEN-C_LOGIN.git
cd GEN-C_LOGIN
```

---

### 2️⃣ Install Dependencies

* **Backend dependencies** (inside `/server`):

```bash
cd server
npm install
```

* **Frontend dependencies** (inside `/client`):

```bash
cd ../client
npm install
```

✅ That’s it — all dependencies will be installed from `package.json`.

---

## 📦 Major Dependencies

### Backend (server)

* `express` → Web framework
* `mongoose` → MongoDB ODM
* `bcryptjs` → Password hashing
* `jsonwebtoken` → JWT authentication
* `cors` → Cross-origin requests
* `dotenv` → Environment variable management
* `multer` → File uploads

### Frontend (client)

* `react` → Frontend library
* `react-dom` → React DOM rendering
* `react-router-dom` → Routing
* `axios` → HTTP client
* `bootstrap` → UI framework
* `antd` → Ant Design components

---

## ⚙️ Backend Setup

#### 📌 Environment Variables

Create a `.env` file in the **server/** folder:

```
MONGO_URI=mongodb://127.0.0.1:27017/genclogin
PORT=3001
JWT_SECRET=yourSuperSecretKey
```

#### 🚀 Start Backend

```bash
npm start
```

Runs at [http://localhost:3001](http://localhost:3001).

---

## 🎨 Frontend Setup

#### 🚀 Start Frontend

```bash
cd ../client
npm run dev
```

Runs at [http://localhost:5173](http://localhost:5173).

---

## 🔑 Test Faculty Login

Sample data for MongoDB:

```json
{
  "fullName": "Test Faculty",
  "email": "faculty@test.com",
  "employeeId": "2141",
  "department": "CT",
  "password": "214121",
  "designation": "faculty"
}
```

---

## 🧪 API Testing with cURL

```bash
curl -X POST http://localhost:3001/auth/faculty-login \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"2141","password":"214121"}'
```

---

## 📖 Scripts

### Backend

* `npm start` → Run server
* `npm run dev` → Run server with nodemon

### Frontend

* `npm run dev` → Start dev server
* `npm run build` → Build for production

---

## 🤝 Contributing

1. Fork the repo
2. Create a new branch (`feature/my-feature`)
3. Commit changes (`git commit -m "Added X feature"`)
4. Push to branch and open a PR

---

## 📜 License

MIT License © 2025

---

