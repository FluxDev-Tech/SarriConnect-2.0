# 🏪 SariConnect Pro: Sari-Sari Store Management System

SariConnect is a comprehensive, full-stack management solution designed specifically for Sari-Sari stores. It streamlines daily operations, from inventory tracking and sales recording to customer debt management and professional receipt generation.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 🚀 Key Features

### 🛒 Modern Point of Sale (POS)
- **Responsive Design**: Fully optimized for both desktop and mobile devices with a dedicated tabbed interface.
* **Quick Search**: Find products instantly by name or barcode.
- **Flexible Payments**: Support for both **Cash** and **Utang (Debt)** transactions.
- **Real-time Cart**: Dynamic cart management with stock validation.

### 🧾 Professional Receipts
- **Custom Branding**: Upload your store logo and customize business details (Name, Address, Phone).
- **Thermal Printer Ready**: Optimized layout for standard 80mm thermal printers.
- **Automatic Generation**: Instantly generate receipts for sales and debt payments.
- **Custom Footer**: Add personalized thank-you messages or store policies.

### 📦 Inventory & Product Management
- **Stock Tracking**: Real-time monitoring of inventory levels.
- **Low Stock Alerts**: Visual indicators for products running low on stock.
- **Rich Product Profiles**: Support for product images, categories, and barcodes.
- **Analytics**: Visual dashboard showing top-selling products and revenue trends.

### 👥 Utang (Debt) Management
- **Customer Tracking**: Maintain a clear record of who owes what.
- **Payment History**: Mark debts as paid and generate payment receipts.
- **Total Receivables**: At-a-glance view of total outstanding balances.

---

## 🛠️ Tech Stack

### Frontend
- **React 19**: Modern UI library with functional components and hooks.
- **TypeScript**: Type-safe development for better maintainability.
- **Tailwind CSS 4**: Utility-first styling for a clean, modern aesthetic.
- **Zustand**: Lightweight and fast state management.
- **Motion**: Fluid animations and transitions.
- **Lucide React**: Crisp, consistent iconography.
- **Recharts**: Interactive data visualization.

### Backend
- **Node.js & Express**: Robust server-side architecture.
- **Better-SQLite3**: High-performance, local SQL database.
- **JWT & Bcrypt**: Secure authentication and password hashing.
- **TSX**: Direct execution of TypeScript on the server.

---

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

## 📱 Mobile Usage

SariConnect is designed to be "Mobile-First." For the best experience on a smartphone:
1. Open the POS.
2. Use the **Products** tab to add items to the cart.
3. Switch to the **Cart** tab to review, select payment type, and complete the transaction.
4. Print receipts directly from your mobile browser's print menu.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for Sari-Sari Store Owners.**
