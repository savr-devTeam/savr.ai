# Savr.ai — Autonomous Meal Planning

Savr.ai scans grocery receipts and turns purchases into personalized, actionable meal plans. Designed for a fast hackathon demo, this repo contains a responsive React frontend, serverless AWS backend (Lambda + API Gateway), receipt OCR (Textract), and AI reasoning (Amazon Bedrock / Claude).

Live demo: https://savr-ai-one.vercel.app

Quick highlights

- Upload a grocery receipt (image / PDF)
- Parse items & prices with Textract
- Enrich and reason about groceries with Bedrock (Claude)
- Generate weekly meal plans tailored to diet, allergies, budget
- Session-based lightweight user persistence (no third-party auth required for demo)

---

## Features

- **Receipt Scanning** - Extracts purchased items using **Amazon Textract**
- **AI Reasoning Engine** - Generates meal plans via **Claude 4.5** on **Amazon Bedrock**
- **Agent Orchestration** - Uses **Bedrock AgentCore** for reasoning and tool calling
- **Data Management** - Stores user profiles, receipts, and meal plans in **DynamoDB**
- **Serverless Backend** - Built with **AWS Lambda** and **API Gateway**
- **Frontend Dashboard** - Responsive **React + Vite + Vercel** web app
- **Monitoring & Analytics** - **CloudWatch** and **X-Ray** for logging

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Axios, Vercel  
**Backend:** AWS Lambda (Python 3.9), API Gateway, Textract, Bedrock  
**Database:** DynamoDB  
**Storage:** S3

## Screenshot / Demo

Include screenshots or a short GIF here for the presentation. Example:

![Demo placeholder](./frontend/public/demo-placeholder.png)

---

## What’s in this repository

- `frontend/` — React + Vite single-page app (Dashboard, MealPlan, ReceiptScan)
- `backend/` — Lambda handlers (receipt parsing, upload, analyze, preferences)
- `infra/` — AWS CDK stacks (S3, DynamoDB, Lambda, API Gateway, IAM)

---

## Architecture (high level)

1. Frontend uploads receipts via presigned S3 URLs (Lambda generates URL)
2. Textract (via `parse_receipt` Lambda) extracts items/prices from the receipt
3. AI analysis Lambda (`analyze_receipt_ai`) calls Amazon Bedrock (Claude) to produce categories, recipes, health & budget insights
4. Meal planning generation uses Bedrock and stores plans in DynamoDB

Diagram (suggested for slides):

- Browser → API Gateway → Lambda → S3 / DynamoDB / Bedrock

---

## Quickstart — Run locally (Frontend)

1. Install dependencies and run frontend locally

```powershell
cd frontend
npm install
npm run dev
# opens on http://localhost:5173 by default (Vite)
```

2. For quick development without deploying backend, the frontend has safe fallbacks and mocked flows. To run end-to-end, you’ll need access to the deployed API Gateway and S3/DynamoDB resources (or run CDK locally and deploy).

---

## API (important endpoints)

Base URL: set `VITE_API_URL` in `frontend/.env` or rely on the fallback configured in `frontend/src/services/api.js`.

- POST `/upload` — Request a presigned S3 URL. Body: `{ fileName, contentType, userId }` → returns `{ uploadUrl, s3Key }`
- POST `/parse-receipt` — Parse an uploaded receipt. Body: `{ s3Key, userId }` → returns parsed items
- POST `/analyze-receipt` — Bedrock-powered AI analysis. Body: `{ s3Key, userId }` → returns insights, recipe suggestions, budget analysis
- POST `/generate-plan` — Generate a meal plan from preferences. Body: `{ preferences, userId }`
- GET `/meal-plan` — Fetch stored meal plan by `userId`

If you hit a 404 for `/upload` or other endpoints, confirm `VITE_API_URL` points to the correct API Gateway stage URL.

---

## Development notes & design decisions (for judges)

- Session-based lightweight user identification (no strict auth) to keep the demo friction-free
- Serverless-first architecture for rapid iteration and low-cost demo hosting
- Uses Bedrock Claude for high-level reasoning and recipe suggestions — decoupled from OCR pipeline so each piece can be demonstrated independently

---

## How to present (2–3 minute flow for judges)

1. Open the frontend (Vercel preview / local dev)
2. Show the Dashboard and preference settings
3. Click Upload receipt → pick a photo of a grocery receipt
4. Demonstrate parsing (Textract) and AI insights (Claude) and the generated meal suggestions
5. Generate a meal plan and show it rendered with MealCard grid

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Open a PR and reference the hackathon issue

We follow conventional commits and small PRs for faster reviews during the event.

---

## License

This project is provided for hackathon/demo use. Add a license if you plan to open source it.
