# Usage-Based AI Wrapper - Backend Engine (Full-Stack / Ops)

## 1. Architecture Decisions

### Language and Runtime
- **TypeScript**: Used for type safety throughout the application (Supabase schemas, LLM responses).
- **Node.js (ESM)**: Configured with ECMAScript Modules (`import/export`) for modern development standards.

### Deployment & Infrastructure
- **Qovery**: The application is fully prepared for deployment on Qovery, a powerful **Internal Developer Platform (IDP)** designed to bridge the gap between development and cloud infra.
    - **Why Qovery?**: It provides a "Heroku-like" experience on top of your own cloud account, offering **GitOps** workflows, automated environment provisioning, and preview environments for every Pull Request.
    - **Multi-Cloud Scalability**: Qovery excels in its ability to deploy and manage applications across multiple cloud providers like **AWS, Scaleway, GCP, and DigitalOcean** without complex Kubernetes configuration.
    - **Ease of Deployment**: With the provided `Dockerfile` and `.qovery.yml`, the application can be seamlessly integrated into a Qovery cluster to gain benefits like auto-scaling, advanced monitoring, and managed database provisioning.
- **Infrastructure Note**: During the assessment, a full automated deployment to Qovery was planned. However, it was identified that Qovery's current community/free tier primarily supports local cluster installation on Linux (via Qovery CLI/Local Cluster), while cloud-managed clusters are part of their professional tiers. To maintain the project's accessibility, the configuration remains ready for "Plug & Play" deployment once a compatible cluster is available.
- **Docker**: For immediate evaluation, the `docker-compose.yml` provides a perfect mirror of the production environment, ensuring consistent behavior across different environments.

### Project Structure
- **Hexagonal-ish Layered Architecture**:
    - `src/config`: Client initializations (Supabase, Stripe).
    - `src/controllers` & `src/routes`: Request handling and validation.
    - `src/middleware`: Custom authentication and security.
    - `src/services`: Core logic (AI Proxy, Usage Tracking, Billing).
    - `src/models`: Data definitions.

### Key Decisions
- **Unified Proxy (OpenRouter)**: Selected to provide access to multiple LLMs via a single API, fulfilling the "Proxy to LLM" requirement efficiently.
- **Supabase Auth & RLS**: Leveraged for security. Even though the Frontend handles the login UI, the Backend validates every request using a custom JWT middleware.
- **Usage-Based Billing**: Integrated with Stripe and backed by a PostgreSQL schema in Supabase to track every token processed.
- **Branching Strategy**: Used `develop` for integration and `main` for stable releases to simulate a professional DevOps environment.

## 2. Project Structure

```text
src/
├── config/       # Configuration (Supabase, Env)
├── middleware/   # Security (Auth Middleware)
├── models/       # Interfaces
├── routes/       # API endpoints (/generate, /usage, /billing)
├── services/     # AI Service, Billing Service, Usage Service
├── scripts/      # Integration and testing scripts
└── index.ts      # App entry point
tests/            # Unit tests (Jest)
```

## 3. How to Run and Test Locally

### Prerequisites
- Node.js (v18+)
- Docker & Docker-compose (Optional but recommended)

### Installation
1. Clone the repository.
2. Install dependencies: `npm install`
3. Set up `.env` (use `.env.example` as a template).

### Running
- **Docker (Full Stack setup)**:
  ```bash
  docker-compose up
  ```
- **Local Dev**:
  ```bash
  npm run dev
  ```

### API Endpoints (All require Authorization Bearer token)
- `POST /api/generate`: `{ "message": "...", "model": "..." }`
- `GET /api/usage`: Returns historical usage for the logged user.
- `GET /api/billing`: Returns total tokens and estimated cost.

### How to get a Bearer Token for Postman
To test the protected endpoints, you need a JWT (JSON Web Token). We've included a script to easily get a token for a fixed test user:

1.  Run the following command in your terminal:
    ```bash
    npx tsx src/scripts/auth-fixed-user.ts
    ```
2.  Copy the generated **Access Token (JWT)** from the console.
3.  In Postman, go to the **Authorization** tab, select **Bearer Token**, and paste your token.

### Using Postman Collection
A Postman collection is included in the project at `assets/postman/quixote_test.postman_collection.json` to help you test all endpoints quickly.
- **Import** the collection from the path above into Postman.
- **Set the token** in the Collection Authorization or at the request level.
- **Test `/api/generate`**: Send a POST request with the following body:
  ```json
  {
    "message": "Explain quantum physics in one sentence.",
    "model": "google/gemini-2.0-flash-lite-preview-02-05:free"
  }
  ```
  *(See `assets/test-evidence/api-generate.png` for a reference of a successful call).*

### Testing
- **Unit Tests (Bonus)**: `npm test`
- **Integration Tests (Manual)**: Run `npx tsx src/scripts/test-db-integration.ts` to verify database connectivity.

## 4. Integration Evidence

This section contains visual proof of the application's core functionality.

### 4.1 API Health Check
![Health Check](assets/test-evidence/health-check.png)
*Response confirming the API is live and reachable.*

### 4.2 AI Generation Proxy
![AI Generation](assets/test-evidence/api-generate.png)
*Example of a successful prompt proxying through OpenRouter with JWT authentication.*

### 4.3 Database Usage Logs
![Usage Logs](assets/test-evidence/usage-logs.png)
*Confirmation of usage data being persisted in Supabase after an AI request.*

### 4.4 Billing & Tokens Tracking
![Billing Info](assets/test-evidence/billing-info.png)
*Endpoint showing real-time token count and cost estimation for the user.*

