# BeaconOps: Smart Logistics & Delivery Management System

BeaconOps is a comprehensive MERN stack application designed to manage and optimize logistics, supplier risk, shipment tracking, and inventory status for large-scale delivery operations.

## 🚀 Features

-   **Supplier Risk Management**: AI-driven scoring for supplier reliability, financial stability, and geopolitical risks.
-   **Shipment Tracking**: Real-time status monitoring, delay prediction, and carrier performance analytics.
-   **Inventory Optimization**: Forecast-aware inventory management with stockout prevention alerts.
-   **Intelligent Alert System**: Automated generation and escalation of critical alerts based on risk thresholds.
-   **What-If Simulations**: Execute complex logistics scenarios to predict the impact of disruptions.
-   **Role-Based Access Control (RBAC)**: Fine-grained permissions for Super Admins, Org Admins, Risk Analysts, and Logistics Operators.

## 🛠️ Tech Stack

-   **Frontend**: React, Redux Toolkit, Tailwind CSS, Lucide React, Recharts, Vite.
-   **Backend**: Node.js, Express, Mongoose, JWT (Refresh Token Rotation), Joi Validation.
-   **Database**: MongoDB.
-   **Monitoring**: Winston Logging, Audit Trails.

## 📦 Project Structure

```bash
├── backend/            # Express API with Mongoose models and AI agents
├── frontend/           # React SPA built with Vite and Tailwind
├── package.json        # Root workspace-like scripts
└── .gitignore          # Git exclusion rules
```

## ⚙️ Getting Started

### Prerequisites

-   Node.js (v18+)
-   MongoDB (v6+)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/itstharusha/BeaconOps.git
    cd BeaconOps
    ```

2.  Install all dependencies:
    ```bash
    npm run install:all
    ```

3.  Configure environment variables:
    -   Create a `.env` file in the `backend/` directory based on `.env.example`.

4.  Start the application:
    ```bash
    npm run start:all
    ```

## 📜 Scripts

-   `npm run install:all`: Installs root, backend, and frontend dependencies.
-   `npm run start:all`: Runs both backend and frontend concurrently.
-   `npm run backend`: Runs only the backend in development mode (with nodemon).
-   `npm run frontend`: Runs only the frontend.

## 🛡️ Security

-   Atomic JWT Refresh Token Rotation.
-   Bcrypt password hashing.
-   Rate limiting and XSS protection.
-   Strict organization isolation for multi-tenant data safety.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
