# CoHive - AI-Powered Research & Analysis Platform

CoHive is an AI tool interface that runs on Databricks, featuring a unique hexagonal breadcrumb navigation system for conducting research and analysis workflows.

## Features

- **Hexagonal Workflow Navigation**: Visual breadcrumb system for navigating research steps
- **Databricks Integration**: OAuth authentication and data persistence
- **Multi-Client Workspace Support**: Domain-based workspace routing
- **Knowledge Base Management**: Hierarchical filtering and file management
- **AI Assessment System**: Multi-round persona responses with fact-checking
- **Mock Mode**: Automatic detection for Figma Make environment

## Prerequisites

- Node.js 18+ and pnpm
- Databricks workspace with OAuth app configured
- Environment variables configured (see `.env.example`)

## Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Databricks credentials
   ```

3. **Run Development Server**
   ```bash
   # Dev server runs automatically in Figma Make
   # For local development, use your preferred method
   ```

4. **Build for Production**
   ```bash
   pnpm build
   ```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - `VITE_COHIVE_PASSWORD`
   - `DATABRICKS_CLIENT_ID`
   - `DATABRICKS_CLIENT_SECRET`
   - `VITE_DATABRICKS_WORKSPACE_HOST`
3. Deploy!

The `vercel.json` configuration is already set up for:
- SPA routing with rewrites
- Serverless API functions
- Optimized build output

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/              # Vercel serverless functions
│   │   ├── components/       # React components
│   │   ├── utils/            # Utility functions
│   │   ├── App.tsx           # Main application
│   │   └── main.tsx          # Entry point
│   ├── data/                 # Static data and content
│   ├── styles/               # CSS and theming
│   └── types/                # TypeScript definitions
├── guidelines/               # Development guidelines
├── docs/                     # Documentation
└── vercel.json              # Vercel deployment config
```

## Documentation

- See `/guidelines/Guidelines.md` for complete development guidelines
- See `/docs/` for feature-specific documentation
- Design system reference: `/styles/cohive-design-system.md`

## Environment Variables

Required variables:

- `VITE_COHIVE_PASSWORD`: Login password (default: cohive2024)
- `DATABRICKS_CLIENT_ID`: Databricks OAuth client ID
- `DATABRICKS_CLIENT_SECRET`: Databricks OAuth client secret
- `VITE_DATABRICKS_WORKSPACE_HOST`: Databricks workspace URL

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **Build**: Vite 6
- **Backend**: Vercel Serverless Functions
- **Database**: Databricks
- **UI Components**: Radix UI + shadcn/ui

## License

Proprietary - All rights reserved

---

Built with ❤️ for Databricks-powered research workflows
