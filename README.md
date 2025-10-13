# Savr.ai - Autonomous Meal Planning Agent

**savr.ai** is an autonomous AI agent built on **AWS** that scans grocery receipts and generates personalized meal plans based on users' dietary restrictions, allergies, and fitness goals.  
By combining **Amazon Textract**, **Amazon Bedrock (Claude 4.5 Sonnet)**, and **AgentCore**, the system intelligently extracts grocery data and turns it into actionable, health-conscious meal recommendations.

---

## 🚀 Features

- **Receipt Scanning** - Extracts purchased items using **Amazon Textract**
- **AI Reasoning Engine** - Generates meal plans via **Claude 4.5** on **Amazon Bedrock**
- **Agent Orchestration** - Uses **Bedrock AgentCore** for reasoning and tool calling
- **Data Management** - Stores user profiles, receipts, and meal plans in **DynamoDB**
- **Serverless Backend** - Built with **AWS Lambda** and **API Gateway**
- **Frontend Dashboard** - Responsive **React + Vite + Vercel** web app
- **User Authentication** - Secured through **Amazon Cognito** _(planned)_
- **Monitoring & Analytics** - **CloudWatch** and **X-Ray** for logging _(planned)_

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Axios, Vercel  
**Backend:** AWS Lambda (Python 3.9), API Gateway, Textract, Bedrock  
**Database:** DynamoDB  
**Storage:** S3  
**Infrastructure:** AWS CDK, CloudFormation  
**CI/CD:** GitHub Actions

---

## 🚀 Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev          # Runs on http://localhost:3000
npm run build        # Production build
```

### Infrastructure

```bash
cd infra
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
cdk synth               # Generate CloudFormation (no AWS needed)
cdk deploy --all        # Deploy to AWS (requires credentials)
```

---

## 🔄 CI/CD

- **CI Pipeline**: Runs on every PR - Frontend build, linting, security scans
- **CD Pipeline**: Manual deployment to AWS + Vercel
- **Vercel**: Automatic preview deployments on every PR

See [`.github/workflows/README.md`](.github/workflows/README.md) for details.

---

## 📦 Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

### Backend (AWS)

```bash
cd infra
cdk deploy --all
```

---

## 🧪 Testing

```bash
# Frontend
cd frontend && npm run lint && npm run build

# Infrastructure
cd infra && pytest tests/ -v

# Backend
cd backend && pytest tests/ -v
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m "feat: add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

We use [Conventional Commits](https://www.conventionalcommits.org/).

---

## 👥 Team

**savr-devTeam** - Building the future of AI-powered meal planning

---

## 📝 Status

- ✅ Frontend structure
- ✅ Infrastructure as Code (CDK)
- ✅ CI/CD pipelines
- ✅ S3 upload workflow
- 🚧 Receipt parsing (in progress)
- 🚧 AI meal planning (in progress)
- 📋 Auth (planned)

---

**Built with ❤️ using AWS, React, and AI**
