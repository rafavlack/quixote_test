# Usage-Based AI Wrapper - Backend Engine

## 1. Architecture Decisions

### Language and Runtime
- **TypeScript**: Chosen to ensure type safety and improve developer experience, especially when dealing with external API responses (Supabase, Stripe, LLMs).
- **Node.js & Express**: A lightweight and scalable choice for building a proxy server. Express provides the necessary middleware support for handling JSON requests and routing.

### Project Structure (Hexagonal-ish / Layered)
- The architecture follows a layered approach to separate concerns:
    - **Controllers**: Handle HTTP-specific logic.
    - **Services**: Contain the core business logic (LLM Proxying, Usage Tracking).
    - **Models**: Define data structures and interfaces.
    - **Routes**: Define the API endpoints.
    - **Config**: Centralized configuration for environment variables and external clients.

### Integration Strategy
- **Supabase**: Used as the primary data store for user roles and transaction logging due to its native PostgreSQL support and ease of integration.
- **LiteLLM / OpenRouter**: Acts as a unified interface to interact with various LLMs, simplifying the proxy logic.
- **Stripe / Openmeter**: Selected for usage-based billing to automatically report consumption data for each user request.

### Deployment
- **Qovery**: The application is configured to be deployed on Qovery, following the requirements for modern infrastructure management.

## 2. Project Structure

```text
src/
├── config/       # Environment variables and client initializations
├── controllers/  # API route handlers
├── models/       # TypeScript interfaces and data models
├── routes/       # Endpoint definitions
├── services/     # Business logic (IA Proxy, Billing, Database)
└── index.ts      # Application entry point
tests/            # Unit and integration tests
```

## 3. How to Run and Test Locally

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in the required keys (Supabase, Stripe, OpenRouter).

### Running Locally
- **Development Mode** (with auto-reload):
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  npm run start
  ```

### Testing
- **Run all tests**:
  ```bash
  npm test
  ```
