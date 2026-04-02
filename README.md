# 🏠 StayMate Hostel Management System – Backend

## 🚀 Overview

This repository contains the **backend API** for the StayMate Hostel Management System.
It handles authentication, room management, residents, billing, maintenance, and more.

---

## 🛠️ Tech Stack

* 🟢 Node.js
* ⚡ Express.js
* 🍃 MongoDB (Mongoose)
* 🔐 JWT Authentication
* 🌐 Render (Deployment)

---

## 📦 Features

* 🔐 Authentication (Login/Register)
* 👥 User & Resident Management
* 🏠 Room Management
* 🛠️ Maintenance Requests API
* 💳 Billing & Payments API
* 📄 Invoice Generation
* 📧 Email Notifications

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone <your-backend-repo-link>
cd backend
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup environment variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

### 4️⃣ Run the server

```bash
npm run dev
```

or

```bash
node index.js
```

---

## 🌍 Deployment

Backend is deployed using Render.

👉 Live API URL:
https://managementbackend-0njb.onrender.com

---

## 🔗 API Endpoints (Sample)

| Method | Endpoint           | Description   |
| ------ | ------------------ | ------------- |
| POST   | /api/auth/register | Register user |
| POST   | /api/auth/login    | Login user    |
| GET    | /api/users         | Get users     |
| POST   | /api/rooms         | Add room      |
| GET    | /api/maintenance   | Get requests  |

---

## 🔒 CORS Configuration

Supports:

* http://localhost:5173
* https://darling-jelly-524929.netlify.app

---

## 📁 Folder Structure

```
Config/
Routers/
Controllers/
Models/
index.js
```

---

## 👩‍💻 Author

Developed by Kirisha Priya

---

## ⭐ Notes

* REST API architecture
* Secure authentication with JWT
* Modular route structure
