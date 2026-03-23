# 🏪 SariConnect Pro: Sari-Sari Store Management System

SariConnect is a comprehensive, full-stack management solution designed specifically for Sari-Sari stores. It streamlines daily operations, from inventory tracking and sales recording to customer debt management and professional receipt generation.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)

## ✨ Key Features

- **Inventory Management**: Real-time tracking of stock levels with low-stock alerts.
- **Sales & POS**: Fast checkout with barcode scanning (camera-based) and professional receipt generation.
- **AI-Powered Insights**: Get business advice and sales summaries using Google Gemini AI.
- **Debt Tracking**: Manage customer "listas" (credit) with payment history.
- **Reports & Analytics**: Visual charts for sales performance and top-selling products.
- **Mobile-First Design**: Optimized for use on smartphones and tablets.

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express.
- **Database**: SQLite (via `better-sqlite3`).
- **AI**: Google Gemini API.
- **State Management**: Zustand.

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sariconnect.git
   cd sariconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   JWT_SECRET=your_super_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

---

## 🔐 Default Admin Credentials

When you first run the application, a default administrator account is created:

- **Email:** `admin@store.com`
- **Password:** `admin123`

*It is highly recommended to change these credentials after your first login.*

---

## 📱 Mobile Usage

SariConnect is designed to be "Mobile-First." For the best experience on a smartphone:
1. Open the POS.
2. Use the **Products** tab to add items to the cart.
3. Switch to the **Cart** tab to review, select payment type, and complete the transaction.
4. Print receipts directly from your mobile browser's print menu.

---

**Built with ❤️ for Sari-Sari Store Owners.**
