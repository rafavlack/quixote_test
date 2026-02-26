# AI-as-a-Service Dashboard (Full-Stack / Ops Engineer)

## Overview
This project is a simplified "AI-as-a-Service" backend engine that processes AI requests, handles billing logic, and manages usage tracking.

## Features (Role 1: Full-stack / Ops Engineer)
- [x] Initial project setup with TypeScript.
- [ ] Connect to Supabase (PostgreSQL) to fetch user data.
- [ ] Proxy a request to an LLM using LiteLLM/OpenRouter.
- [ ] Report usage (tokens/requests) to Stripe API or Openmeter.
- [ ] Basic schema for logging transactions.
- [ ] Docker-compose configuration for deployment.

## Tech Stack
- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** Supabase (PostgreSQL)
- **Billing:** Stripe / Openmeter
- **IA Proxy:** LiteLLM / OpenRouter

## Project Structure
```
src/
├── config/       # Configuration files (env, database, etc.)
├── controllers/  # Route handlers
├── models/       # Data models and interfaces
├── routes/       # API route definitions
├── services/     # Business logic (LLM proxy, Billing, etc.)
└── index.ts      # Entry point
tests/            # Unit and integration tests
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`.

### Running the Application
- **Development:**
  ```bash
  npm run dev
  ```
- **Build:**
  ```bash
  npm run build
  ```
- **Start Production:**
  ```bash
  npm run start
  ```
