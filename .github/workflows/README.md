# CI/CD Pipeline Documentation

## Overview

This repository uses GitHub Actions for continuous integration and deployment.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:** Pull requests and pushes to main/develop

**Jobs:**

- Infrastructure validation (CDK synth + tests)
- Frontend build and tests
- Backend Lambda validation
- Security scanning

### 2. CD Pipeline (`cd.yml`)

**Triggers:** Manual workflow dispatch

**Environments:** dev, staging, production

**Jobs:**

- Pre-deployment checks
- Infrastructure deployment (CDK)
- Frontend deployment (Vercel)
- Post-deployment smoke tests

### 3. PR Checks (`pr-checks.yml`)

**Triggers:** Pull request events

**Checks:**

- PR size labeling
- PR title convention validation

## Branch Strategy

main (production)
↑
└── develop (staging)
↑
└── feature/\* (dev)

## Deployment Process

### Manual Deployment

1. Go to Actions → CD Pipeline
2. Click "Run workflow"
3. Select environment (dev/staging/production)
4. Click "Run workflow"

### Automatic Deployment (Future)

- Merges to `develop` → auto-deploy to `staging`
- Merges to `main` → auto-deploy to `production`

## Required Secrets

| Secret                  | Description                   |
| ----------------------- | ----------------------------- |
| `AWS_ACCESS_KEY_ID`     | AWS access key for deployment |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for deployment |
| `AWS_ACCOUNT_ID`        | AWS account ID                |
| `VERCEL_TOKEN`          | Vercel deployment token       |

_More to be added_

---
