# Scalable Auth API 🚀

Welcome to the **Scalable Auth API**, a production-grade, highly secure, and multi-versioned authentication backend designed to serve as the definitive foundation for modern web and mobile applications. Built with **Node.js, Express, and MongoDB**, this repository is not just a standard authentication server; it is a masterclass in API design, showcasing the evolution of authentication mechanisms from simple JSON Web Tokens (JWT) to state-of-the-art refresh token rotation, device tracking, and advanced security protocols.

Whether you are building a simple Single Page Application (SPA), a complex microservices architecture, or a native mobile client, this API provides the exact authentication version tailored to your security and scalability needs. 

---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Architecture & Versioning Strategy](#architecture--versioning-strategy)
   - [v1: Basic Stateless JWT Auth](#v1-basic-stateless-jwt-auth)
   - [v2: Secure Cookie-Based Auth](#v2-secure-cookie-based-auth)
   - [v3: Enhanced Bearer Auth & Rate Limiting](#v3-enhanced-bearer-auth--rate-limiting)
   - [v4: Refresh Token Implementation](#v4-refresh-token-implementation)
   - [v5: Enterprise-Grade Auth (Device ID & Token Rotation)](#v5-enterprise-grade-auth-device-id--token-rotation)
4. [Technology Stack](#technology-stack)
5. [Deep Dive: Security Implementations](#deep-dive-security-implementations)
6. [Detailed API Reference](#detailed-api-reference)
7. [Getting Started (Local Development)](#getting-started-local-development)
8. [Environment Variables](#environment-variables)
9. [Project Directory Structure](#project-directory-structure)
10. [Swagger Documentation](#swagger-documentation)
11. [Deployment Guidelines](#deployment-guidelines)
12. [Contributing](#contributing)
13. [License](#license)

---

## 🌟 Project Overview

Authentication is the most critical component of any application. A single vulnerability can lead to data breaches, compromised user accounts, and severe reputational damage. The **Scalable Auth API** was engineered to solve the complex challenges developers face when implementing authentication flows. 

This project provides a fully documented, tested, and scalable backend that handles:
- User Registration and Cryptographically Secure Password Hashing
- Email Verification via One-Time Passwords (OTPs)
- Secure Login flows with customizable token delivery (Headers vs. Cookies)
- Advanced Session Management (Logout, Logout All Devices)
- Secure Password Reset capabilities using self-invalidating JWTs
- Rate Limiting and Brute-force protection

By structuring the API into multiple versions (`v1` through `v5`), the codebase serves as an educational benchmark and a practical toolkit. Developers can choose the version that best fits their frontend client requirements without rewriting complex backend logic.

---

## ✨ Core Features

- **Multi-Versioned Architecture:** Five distinct API versions demonstrating different authentication strategies.
- **OTP Email Verification:** Cryptographically generated 6-digit OTPs sent via email (using Resend) to verify user ownership before granting login access.
- **Cryptographic Hashing:** Utilization of `bcrypt` for password hashing and custom OTP hashing to prevent database leaks from compromising active codes.
- **Refresh Token Rotation:** Advanced mitigation against token theft. If a refresh token is reused, the system detects the breach and revokes all tokens for that user.
- **Device Tracking:** Seamless user tracking across different devices using unique Device IDs injected into HTTP-only cookies.
- **Single-Use Password Reset Links:** Forgot password functionality that generates JWTs keyed against the user's current password hash, ensuring the link becomes permanently invalid immediately after use.
- **Swagger UI Integration:** Fully documented API contracts powered by `swagger-jsdoc` and `swagger-ui-express`, allowing developers to test endpoints interactively.
- **Centralized Error Handling:** Consistent error response formatting to simplify frontend integration.

---

## 🏗 Architecture & Versioning Strategy

The defining characteristic of this project is its versioned approach to authentication. Each version builds upon the previous one, introducing more sophisticated security measures.

### v1: Basic Stateless JWT Auth
The foundational version of the API. It relies on standard stateless JSON Web Tokens (JWT). 
- **Delivery:** Tokens are returned in the JSON payload upon successful login or registration.
- **Usage:** Clients must manually store the token (e.g., in `localStorage`) and attach it to the `Authorization` header as a Bearer token for protected routes.
- **Best For:** Server-to-server communication or simple mobile applications where cookie management is complex.

### v2: Secure Cookie-Based Auth
Introduces browser security best practices.
- **Delivery:** Tokens are strictly injected into `HttpOnly`, `Secure`, and `SameSite` cookies.
- **Advantage:** Completely mitigates Cross-Site Scripting (XSS) attacks since JavaScript cannot access the token.
- **Usage:** The browser automatically attaches the cookie to subsequent requests.
- **Best For:** Traditional web applications and SPAs running on the same domain as the API.

### v3: Enhanced Bearer Auth & Rate Limiting
Combines the statelessness of `v1` with aggressive security middleware.
- **Enhancement:** Introduces strict rate limiting on sensitive endpoints like `/login`, `/register`, and `/resend-otp` to thwart brute-force attacks and credential stuffing.
- **Usage:** Standard Bearer token in headers.
- **Best For:** Public-facing APIs subject to high traffic and potential abuse.

### v4: Refresh Token Implementation
Solves the problem of long-lived access tokens.
- **Mechanism:** Issues a short-lived Access Token (e.g., 15 minutes) and a long-lived Refresh Token (e.g., 7 days).
- **Flow:** When the access token expires, the client sends the refresh token to a dedicated endpoint to receive a new access token without requiring the user to log in again.
- **Storage:** Refresh tokens are tracked in the database/Redis, allowing administrators or users to revoke them.

### v5: Enterprise-Grade Auth (Device ID & Token Rotation)
The ultimate, production-ready implementation.
- **Device Tracking:** Assigns a unique, long-lived `deviceId` cookie to the client's browser. This binds the refresh token not just to the user, but to the specific physical device.
- **Refresh Token Rotation:** Every time a refresh token is used, it is consumed and a new one is issued.
- **Breach Detection:** If an old, already consumed refresh token is presented to the API, the system assumes the token was stolen. It immediately revokes **all** active sessions for that user to protect the account.
- **Advanced Session Management:** Introduces `/logout` (kills the current device session) and `/logout-all` (kills sessions on all devices).
- **Best For:** High-security applications, financial technology, and enterprise SaaS platforms.

---

## 💻 Technology Stack

The project leverages a modern, highly performant JavaScript ecosystem:

- **Runtime Environment:** Node.js (v18+)
- **Web Framework:** Express.js (v5.x for native Promise support and enhanced routing)
- **Database:** MongoDB (via Mongoose v9.x ORM)
- **In-Memory Store:** Redis (v5.x for high-speed rate limiting and optional token caching)
- **Security & Cryptography:** 
  - `bcrypt` (Password hashing)
  - `jsonwebtoken` (Token generation and verification)
  - `crypto` (Native Node.js module for Device ID and OTP generation)
- **Email Delivery:** Resend API (`resend` SDK)
- **Documentation:** Swagger UI Express & Swagger JSDoc
- **Package Manager:** PNPM for lightning-fast, disk-efficient dependency management.

---

## 🛡 Deep Dive: Security Implementations

Security is not an afterthought in this project; it is the core architectural driver.

### 1. OTP Verification Flow
When a user registers, they are marked as `isVerified: false`. An OTP is generated using a cryptographically secure pseudo-random number generator (CSPRNG). 
- **Hash Verification:** The raw OTP is never stored in the database. It is hashed, and only the hash is saved. When the user submits the OTP, it is compared against the hash, similar to a password.
- **Expiration & Cooldown:** OTPs expire after a configured time (e.g., 10 minutes). The `/resend-otp` endpoint enforces a strict cooldown period (e.g., 60 seconds) to prevent email spamming.

### 2. Self-Invalidating Password Resets
Traditional password reset flows store a reset token in the database. This API uses a stateless approach:
- A JWT is generated containing the user's ID.
- **The Secret:** The JWT is signed using a secret key **combined with the user's current password hash**.
- **The Result:** The moment the user successfully changes their password, their password hash changes. Consequently, the signature of the reset JWT is permanently invalidated, guaranteeing it can only be used exactly once.

### 3. Protection Against Token Theft (v5)
If a malicious actor steals a `HttpOnly` cookie containing a refresh token (e.g., via a network proxy or physical machine access), they could theoretically maintain infinite access. 
- **Mitigation:** Token rotation combined with breach detection. When the legitimate user and the attacker attempt to use the same refresh token family, the system detects the reuse of a consumed token and triggers a global session invalidation.

---

## 📡 Detailed API Reference

Below is an extensive breakdown of the endpoints available across the API versions. Note that while the endpoint paths are similar across versions, their internal handling, parameter consumption, and response structures differ significantly based on the architectural strategy discussed above.

### Authentication Endpoints (Available in v1 - v5)

#### 1. Register a New User
- **Route:** `POST /v{1-5}/auth/register`
- **Description:** Creates a new user account, generates a secure OTP, stores the hashed OTP, and sends a verification email.
- **Payload:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Responses:**
  - `201 Created`: User successfully registered.
  - `409 Conflict`: Email already exists.

#### 2. Verify Account
- **Route:** `POST /v{1-5}/auth/verify`
- **Description:** Verifies the user's email address using the OTP. In v2-v5, this also issues the initial access/refresh tokens.
- **Payload:**
  ```json
  {
    "email": "john.doe@example.com",
    "otp": "123456"
  }
  ```
- **Responses:**
  - `200 OK`: Account verified successfully. (Returns tokens based on version).
  - `400 Bad Request`: Invalid or expired OTP.

#### 3. Resend OTP
- **Route:** `POST /v{1-5}/auth/resend-otp`
- **Description:** Generates and emails a new OTP to an unverified user. Enforces a cooldown period.
- **Payload:** `{ "email": "user@example.com" }`
- **Responses:**
  - `200 OK`: OTP resent.
  - `429 Too Many Requests`: Cooldown period active.

#### 4. Login
- **Route:** `POST /v{1-5}/auth/login`
- **Description:** Authenticates a user. The response changes based on the version (e.g., JSON payload in v1, `Set-Cookie` headers in v2/v5). In v5, it also provisions a `deviceId`.
- **Payload:**
  ```json
  {
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: Login successful.
  - `401 Unauthorized`: Invalid credentials.
  - `403 Forbidden`: Account not verified.

#### 5. Get Current User (Me)
- **Route:** `GET /v{1-5}/auth/me`
- **Description:** Fetches the profile of the currently authenticated user. Requires valid authorization (Bearer token or Cookie, depending on version).
- **Responses:**
  - `200 OK`: Returns user object.
  - `401 Unauthorized`: Missing or invalid token.

#### 6. Forgot Password
- **Route:** `POST /v{1-5}/auth/forgot-password`
- **Description:** Initiates the password recovery flow by sending a self-invalidating reset link via email. Always returns a generic response to prevent email enumeration attacks.
- **Payload:** `{ "email": "user@example.com" }`

#### 7. Reset Password
- **Route:** `POST /v{1-5}/auth/reset-password/:resetToken`
- **Description:** Finalizes password recovery. The `:resetToken` is validated against the user's current password hash.
- **Payload:** `{ "password": "NewSecurePassword456!" }`

#### 8. Change Password (Authenticated)
- **Route:** `POST /v{1-5}/auth/change-password`
- **Description:** Allows an authenticated user to change their password by providing their current password.
- **Payload:**
  ```json
  {
    "currentPassword": "SecurePassword123!",
    "newPassword": "BrandNewPassword789!"
  }
  ```

### Advanced Session Management (v4 & v5 Only)

#### 9. Refresh Token
- **Route:** `POST /v{4-5}/auth/refresh`
- **Description:** Exchanges a valid refresh token for a new access token. In v5, this triggers token rotation and device ID validation.
- **Responses:**
  - `200 OK`: New tokens issued.
  - `401 Unauthorized`: Invalid, expired, or compromised token.

#### 10. Logout (Current Device)
- **Route:** `POST /v{4-5}/auth/logout`
- **Description:** Invalidates the current refresh token and clears the authentication cookies for the current device.

#### 11. Logout All Devices (v5 Only)
- **Route:** `POST /v5/auth/logout-all`
- **Description:** Wipes all active sessions across all devices for the authenticated user. Invaluable for responding to compromised accounts.

---

## 🚀 Getting Started (Local Development)

Follow these steps to set up the Scalable Auth API locally for development and testing.

### Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: Version 18.x or higher.
- **PNPM**: Fast, disk space efficient package manager (`npm install -g pnpm`).
- **MongoDB**: A running local instance or an Atlas cloud URI.
- **Redis**: A running Redis server for rate limiting features.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd Auth_Api/apps/api
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `apps/api` directory using the `.env.example` as a template. (See the [Environment Variables](#environment-variables) section below).

4. **Start the Development Server:**
   This project leverages native Node.js `--watch` and `--env-file` flags, eliminating the need for `nodemon` or `dotenv` packages.
   ```bash
   pnpm run dev
   ```
   The server should now be running on `http://localhost:3000`.

---

## ⚙️ Environment Variables

The application requires specific configuration parameters to operate securely. Below is the required structure for your `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Connections
MONGO_URI=mongodb://localhost:27017/scalable_auth
REDIS_URL=redis://localhost:6379

# JWT Secrets (Must be long, random cryptographic strings)
ACCESS_TOKEN_SECRET=your_super_secret_access_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key_here
RESET_TOKEN_SECRET=your_super_secret_reset_key_here

# Token Expirations
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
RESET_TOKEN_EXPIRES_MINUTES=10
OTP_EXPIRES_MINUTES=10

# Email Delivery (Resend API)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=Auth <onboarding@resend.dev>
```

> **⚠️ SECURITY WARNING:** Never commit your `.env` file to version control. Always ensure `NODE_ENV` is set to `production` in live environments to enforce `Secure` cookies and disable verbose error stack traces.

---

## 📂 Project Directory Structure

The project follows a modular, feature-driven architecture to maintain clean separation of concerns:

```
apps/api/
├── src/
│   ├── config/            # Database, Redis, and Swagger configurations
│   ├── middlewares/       # Rate limiting, Auth guards, Global Error Handler
│   ├── models/            # Mongoose Schema definitions (User)
│   ├── services/          # Third-party integrations (e.g., Resend Email Service)
│   ├── templates/         # HTML templates for Email rendering
│   ├── utils/             # Helper functions (OTP generation, JWT management)
│   ├── v1/                # Version 1: Controllers and Routes (Basic JWT)
│   ├── v2/                # Version 2: Controllers and Routes (Cookies)
│   ├── v3/                # Version 3: Controllers and Routes (Bearer + Rate Limits)
│   ├── v4/                # Version 4: Controllers and Routes (Refresh Tokens)
│   ├── v5/                # Version 5: Controllers and Routes (Enterprise Auth)
│   └── server.js          # Express Application Entry Point
├── package.json           # Project metadata and scripts
└── .env                   # Environment variables
```

This structure ensures that as the API evolves, older versions remain intact and functional, strictly adhering to the Open/Closed principle.

---

## 📚 Swagger Documentation

The API includes automated, interactive documentation powered by Swagger.

Once the development server is running, navigate to:
**`http://localhost:3000/docs`**

The Swagger UI provides:
- A comprehensive list of all endpoints grouped by version.
- Detailed request payload schemas and parameter definitions.
- Example response structures for success and error states.
- Interactive "Try it out" functionality allowing you to execute real HTTP requests directly from the browser.
- Configured security schemes supporting Basic Auth, Bearer Tokens, and Cookies.

---

## 🚢 Deployment Guidelines

Preparing this API for production requires adherence to strict deployment practices.

1. **Reverse Proxy:** Always deploy the Node.js application behind a robust reverse proxy like NGINX or AWS ALB. The proxy should handle SSL/TLS termination.
2. **Process Management:** Use a process manager like PM2 or container orchestration like Kubernetes/Docker Swarm to ensure the application automatically restarts upon failure.
3. **Environment Security:** 
   - Ensure `NODE_ENV=production`.
   - Use deeply complex, generated strings for all JWT Secrets.
   - Restrict CORS origins strictly to your production frontend domain.
4. **Database Security:** Ensure MongoDB and Redis instances are deployed in private subnets, not exposed to the public internet, and require robust authentication.

---

## 🤝 Contributing

We welcome contributions to improve the security, scalability, and functionality of the Auth API.

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/advanced-auth-metric`).
3. Commit your changes (`git commit -m 'Add biometric auth framework'`).
4. Push to the branch (`git push origin feature/advanced-auth-metric`).
5. Open a Pull Request detailing the purpose and architectural impact of your changes.

---

## 📄 License

This project is licensed under the **ISC License**. You are free to use, modify, and distribute this codebase for both educational and commercial purposes. Always prioritize security audits when adapting authentication logic for production environments.

---
*Built with ❤️ for secure, scalable software development.*
