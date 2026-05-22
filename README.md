# 📊 DataPulse

DataPulse is a premium, full-stack Next.js web application designed to monitor, track, and analyze CSV API endpoints. Utilizing a notebook-style layout, DataPulse checks for structural and data updates, provides real-time change logs, and offers high-fidelity data previews. It is built with a sleek, custom dark-glassmorphic design system.

---

## ✨ Features

### 🔐 Secure Authentication & Gateway
* **Google OAuth 2.0 Integration**: Single Sign-On (SSO) utilizing `next-auth` for secure user sessions.
* **Premium Gateway Page**: A split-screen login page featuring time-of-day greeting triggers and a glowing geometric data-network SVG visualization with responsive animations.

### 📓 Notebook-Style Interface
* **Collapsible Cells**: Each endpoint is managed as a standalone cell within a unified notebook layout.
* **Header Configurations**: Add custom HTTP request headers (such as authorization or API keys) per endpoint.
* **Quick Controls**: Pin critical endpoints to the top, toggle active polling intervals, edit details, or remove records instantly.
* **Bulk Synced Updates**: Trigger single-cell or batch refreshes across all endpoints simultaneously.

### 🔍 Powerful Data Operations
* **Inline Table Previews**: Inspect CSV sheets directly inside the card with paginated grid previews.
* **Dynamic Column Selection**: Toggle columns on/off using the interactive column picker to optimize screen space.
* **Fuzzy Search & Filters**: Filter cells by custom tags, URL status (OK, Error, Unfetched), and query terms.
* **Targeted Row Search**: Query data row values instantly using client-side grid filters.
* **One-Click Export**: Save and export CSV snapshots directly back to your local filesystem.

### 🔄 Change Detection & Diff Logging
* **Cryptographic Hashing**: Compares raw CSV hash differences on page load.
* **Visual Delta Alerts**: Notifies you of modifications (rows added, rows removed, column structure shifts) via alert banners and status badges.
* **Historical Changelogs**: A slide-out global drawer displaying complete chronological records of updates.

---

## 🛠️ Technology Stack

* **Framework**: Next.js (App Router, Server Actions)
* **Database**: MongoDB via Mongoose ODM
* **Authentication**: NextAuth.js (Google Provider)
* **CSV Parsing**: PapaParse (High-performance JS parser)
* **Styling**: Vanilla CSS (Tailored Design Tokens, Glassmorphism, CSS variables, CSS micro-animations)

---

## 📂 Project Architecture

```
contact-sheet/
├── app/                        # Next.js App Router Pages & API Routes
│   ├── api/                    # Backend API handlers
│   │   ├── auth/               # next-auth authentication endpoints
│   │   └── endpoints/          # CRUD & diff comparison routes
│   ├── login/                  # Gateway page route
│   ├── globals.css             # Unified CSS Design Tokens & animations
│   ├── layout.jsx              # Global HTML shell & Providers wrapper
│   └── page.jsx                # Core dashboard landing page
├── components/                 # Reusable UI Components
│   ├── NotebookApp.jsx         # Dashboard coordinator component
│   ├── NotebookCell.jsx        # Individual endpoint card control
│   ├── DataPreviewTable.jsx    # CSV data viewer & exporter
│   ├── CustomSelect.jsx        # Custom dark-theme drop-down selector
│   └── ChangelogDrawer.jsx     # Portal-rendered history drawer
├── models/                     # Mongoose Schema Definitions (User, Endpoint, Changelog)
├── lib/                        # Shared DB and Auth helper configurations
├── public/                     # Static assets & icons
└── package.json                # Project dependencies & scripts
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your system:
* [Node.js](https://nodejs.org/) (v18.x or higher)
* [MongoDB Instance](https://www.mongodb.com/) (Local or MongoDB Atlas Cluster)
* Google Developer Console Account (for OAuth credentials)

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/your-username/contact-sheet.git
cd contact-sheet
npm install
```

### 2. Environment Variables Configuration
Create a `.env.local` file in the root folder:
```bash
touch .env.local
```

Populate the variables as follows:

| Environment Variable | Description | Example / Required Value |
|----------------------|-------------|--------------------------|
| `MONGODB_URI`        | MongoDB database connection string | `mongodb+srv://user:pass@cluster.mongodb.net/contact-sheet` |
| `NEXTAUTH_URL`       | The canonical root URL of the project | `http://localhost:3000` |
| `NEXTAUTH_SECRET`    | A secure random token used to encrypt JWT cookies | `your-jwt-encryption-secret-string` |
| `GOOGLE_CLIENT_ID`   | Google Cloud Console Client ID | `xxxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console Client Secret Key | `GOCSPX-xxxxxx` |

> [!IMPORTANT]
> When configuring the Google Client credentials, verify that the **Authorized Redirect URI** in your Google Cloud Console matches `http://localhost:3000/api/auth/callback/google`.

### 3. Local Development Run
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 💾 Database Schema Reference

DataPulse persists records using three primary Mongoose collections:

### 1. Users (`users`)
Stores authenticated user profiles retrieved from Google OAuth.
```typescript
{
  googleId: string;       // Unique Google Auth ID
  email: string;          // User primary email address
  name: string;           // Display username
  avatar?: string;        // Profile picture URL
  createdAt: Date;
}
```

### 2. Endpoints (`endpoints`)
Tracks the metadata, query settings, and current state of each CSV API URL.
```typescript
{
  userId: ObjectId;       // Owner user reference
  name: string;           // Friendly name
  url: string;            // Target CSV API address
  description?: string;
  tags: string[];         // Organizational tag labels
  headers: Map<string, string>; // Custom request HTTP headers
  lastFetchedAt?: Date;
  lastHash?: string;      // SHA-256 fingerprint of the last fetch
  lastRowCount?: number;
  lastColumns: string[];  // Header columns in the last CSV sync
  isPinned: boolean;
  isActive: boolean;
  pollingInterval: number;// Auto-poll refresh time in seconds
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Changelogs (`changelogs`)
Stores individual records of changes detected during sync operations.
```typescript
{
  endpointId: ObjectId;   // Reference to the modified endpoint
  userId: ObjectId;       // Owner user reference
  timestamp: Date;
  previousHash?: string;
  newHash: string;
  previousRowCount?: number;
  newRowCount: number;
  addedRows: number;      // Rows added count
  removedRows: number;    // Rows deleted count
  changedColumns: {
    added: string[];      // New column headers
    removed: string[];    // Deleted column headers
  };
  summary: string;        // Human-readable change text
}
```

---

## 🎨 Color System & Design Tokens

DataPulse leverages custom CSS design variables to produce its premium dark theme:
* **Background Base** (`--bg-base`): `#04040c` (Very dark blue-gray space)
* **Background Surface** (`--bg-surface`): `#09091a` (Dark navy card backings)
* **Primary Accent** (`--primary`): `#7c3aed` (Electric violet)
* **Secondary Accent** (`--accent`): `#2dd4bf` (Luminous teal)
* **Text Highlight** (`--text-primary`): `#eef2ff` (Soft white-indigo)
* **Text Secondary** (`--text-secondary`): `#94a3b8` (Slate gray)

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
