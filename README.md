# AppZMakers_Teamora

This is the development repository for the WorkForge Portal, a modern web application designed to track employee attendance, manage leave requests, and view analytics.

## Tech Stack
- **Frontend**: React, Lucide Icons, TailwindCSS
- **Backend**: Node.js, Express, MongoDB Mongoose
- **API Documentation**: Swagger UI

## Getting Started

### Installation
Install dependencies for both frontend and backend:
```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

### Running the Services
Run the development servers:
```bash
# Frontend dev server (Vite on http://localhost:5173)
cd frontend
npm run dev

# Backend API server (Express on http://localhost:5001)
cd backend
npm run dev
```

---

## Key Features & Custom Overrides

### 📄 Employee CV Management
- **Upload CV/Resume**: Employees can upload a PDF or DOCX file (up to 2.5MB) directly from their "My Profile" tab. Files are securely converted to Base64 and stored in MongoDB.
- **HR Viewing & Downloading**: HR managers can select any employee and view their CV in a new window or download it via a dedicated download icon.

### 🕒 Attendance Overrides & Auditing
- **Force Clock Out (Scenario 1)**: If an employee forgot to clock out or had a power outage, HR can force log them out and choose a check-out time.
- **Add Missed Logs (Scenario 2)**: HR can manually create attendance records date-wise for employees who forgot to clock in.
- **Recalculations**: Modifying check-in or check-out times triggers an automatic recalculation of working hours, breaks, and extra/less hours based on the system standard workday settings.
- **Audit Trails**: Every manual override or force logout sets the record to `adjusted`, storing who made the change (`adjustedBy`) and the reason for it (`adjustedReason`).

### 📊 Report Exports
- Export PDF workforce analytics reports in one click with a clean, high-contrast style.

# AppZTeamora-