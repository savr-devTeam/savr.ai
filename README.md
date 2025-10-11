# 🧠 savr.ai – Autonomous Meal Planning Agent

**savr.ai** is an autonomous AI agent built on **AWS** that scans grocery receipts and generates personalized meal plans based on users’ dietary restrictions, allergies, and fitness goals.  
By combining **Amazon Textract**, **Amazon Bedrock (Claude 4.5 Sonnet)**, and **AgentCore**, the system intelligently extracts grocery data and turns it into actionable, health-conscious meal recommendations.

---

## 🚀 Features

- 📸 **Receipt Scanning** – Extracts purchased items using **Amazon Textract**
- 🧩 **AI Reasoning Engine** – Generates meal plans via **Claude 4.5** on **Amazon Bedrock**
- 🧠 **Agent Orchestration** – Uses **Bedrock AgentCore** for reasoning and tool calling
- 🗂️ **Data Management** – Stores user profiles, receipts, and meal plans in **DynamoDB**
- ⚙️ **Serverless Backend** – Built with **AWS Lambda** and **API Gateway**
- 💻 **Frontend Dashboard** – Responsive **React + Vercel** web app for uploads and meal viewing
- 🔐 **User Authentication** – Secured through **Amazon Cognito**
- 📊 **Monitoring & Analytics** – **CloudWatch** and **X-Ray** for logging and performance tracing

---
