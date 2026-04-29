# CoHive - Insight into Inspiration

AI-powered research synthesis tool for Databricks with hexagonal workflow navigation.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required for Databricks integration
VITE_DATABRICKS_CLIENT_ID=your_client_id
VITE_DATABRICKS_REDIRECT_URI=http://localhost:3000/oauth/callback
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

### Core Documentation
- **[Guidelines.md](./Guidelines.md)** - Development standards and best practices
- **[INSTALLATION.md](./INSTALLATION.md)** - Complete installation guide
- **[DATABRICKS_SETUP.md](./DATABRICKS_SETUP.md)** - Databricks OAuth setup
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference

### Feature Documentation
- **[MODEL_TEMPLATES.md](../models/MODEL_TEMPLATES.md)** - AI model selection system
- **[KNOWLEDGE_BASE_ACCESS_POLICY.md](./KNOWLEDGE_BASE_ACCESS_POLICY.md)** - Access control policy
- **[PASSWORD_PROTECTION.md](./PASSWORD_PROTECTION.md)** - Landing page authentication
- **[SESSION_VERSIONING_EXAMPLES.md](./SESSION_VERSIONING_EXAMPLES.md)** - Version control examples
- **[WISDOM_HEX_DOCUMENTATION.md](./WISDOM_HEX_DOCUMENTATION.md)** - Wisdom hex features

### Technical Documentation
- **[/api/README.md](../api/README.md)** - API implementation details
- **[/models/README.md](../models/README.md)** - Model system architecture
- **[/data/persona-content/README.md](../data/persona-content/README.md)** - Persona system
- **[/data/prompts/README.md](../data/prompts/README.md)** - Prompt templates

### Historical Documentation
- **[/docs/archive/](./archive/)** - Implementation logs and migration guides

## 🔑 Key Features

### Hexagonal Workflow System
- **Launch**: Start your research journey
- **Action**: Execute synthesis and recommendations
- **Optional Steps**: External Experts, Panel Homes, Buyers, Competitors, Knowledge Base, Wisdom (crowdsource insights), Test Against Segments
- Visual breadcrumb navigation with status indicators

### Databricks Integration
- **OAuth 2.0 Authentication** - Secure, credential-less login
- **File Browsing** - Access Workspace, Volumes, and DBFS
- **Research Import** - Import documents directly from Databricks
- **Ideas File Upload** - Load existing ideas documents for AI context
- **Wisdom Contributions** - Share insights via text, voice, photo, or video
- **API Integration** - Vercel serverless functions proxy to Databricks REST APIs

### Template System
- Role-based workflows (Researcher vs Non-Researcher)
- Customizable step visibility
- Default responses and instructions
- Import/Export project data (includes ideas files and all content)

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   CoHive    │─────▶│ Vercel Serverless│─────▶│ Databricks  │
│  Frontend   │      │   Functions      │      │   Backend   │
│ (React +    │      │  (TypeScript)    │      │ (AI + Data) │
│  Vite)      │      │                  │      │             │
└─────────────┘      └──────────────────┘      └─────────────┘
```

**Components:**
- **Frontend**: React + Vite application
- **API Layer**: Vercel serverless functions in `/api`
- **Backend**: Databricks for AI processing and data storage

## 🔐 Authentication

### Databricks OAuth
All credentials stored in Databricks, not in browser or third-party services.

**Flow:**
1. User enters workspace URL
2. Redirected to Databricks for login
3. User authorizes CoHive
4. Databricks returns OAuth token
5. Token used for API calls via Vercel functions

### Security
- ✅ OAuth 2.0 industry standard
- ✅ Credentials managed by Databricks
- ✅ Tokens auto-refresh
- ✅ Session-only storage (sessionStorage)
- ✅ Expires when browser closes

## 📁 Project Structure

```
/
├── api/                        # Vercel serverless functions
│   ├── databricks/             # Organized Databricks endpoints
│   │   ├── ai/                 # AI operations
│   │   ├── assessment/         # Assessment system
│   │   ├── gems/               # Saved insights
│   │   └── knowledge-base/     # Knowledge base operations
│   ├── setup/                  # Database initialization
│   └── utils/                  # API utilities
│
├── components/                 # React components
│   ├── HexagonBreadcrumb.tsx   # Core hex component
│   ├── ProcessWireframe.tsx    # Main application
│   ├── ModelTemplateManager.tsx # Model selection UI
│   ├── TemplateManager.tsx     # User templates
│   └── ui/                     # shadcn/ui components
│
├── models/                     # AI model system
│   ├── README.md               # Architecture docs
│   ├── MODEL_TEMPLATES.md      # User guide
│   ├── model_names.md          # Available models
│   ├── factory.ts              # Model factory
│   └── registry.ts             # Model registry
│
├─�� data/                       # Data and content
│   ├── persona-content/        # Persona JSON files
│   ├── prompt-content/         # Prompt templates
│   ├── prompts/                # Prompt system
│   └── stepContentData.ts      # Hex definitions
│
├── utils/                      # Frontend utilities
│   ├── databricksAuth.ts       # OAuth
│   ├── databricksAPI.ts        # API client
│   └── sessionVersioning.ts    # Version control
│
├── styles/                     # Styling
│   ├── cohive-theme.ts         # Design tokens
│   └── globals.css             # Global styles
│
├── docs/                       # Documentation
│   ├── README.md               # This file
│   ├── Guidelines.md           # Dev standards
│   ├── API_DOCUMENTATION.md    # API reference
│   └── archive/                # Historical docs
│
└── vercel.json                 # Vercel config
```

## 🎨 Design System

CoHive uses a custom design system with:
- **Color tokens** - Semantic colors for each workflow step
- **Hexagon components** - Consistent size variants
- **Spacing scale** - Standardized spacing
- **Theme configuration** - `/styles/cohive-theme.ts`

See `/styles/cohive-design-system.md` for details.

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Test API locally with Vercel CLI
vercel dev
```

### Adding Features

1. Create component in `/components`
2. Import design tokens from `/styles/cohive-theme.ts`
3. Follow guidelines in `/guidelines/Guidelines.md`
4. Test locally before committing

### API Development

API endpoints are in `/api` as Vercel serverless functions:

```typescript
// /api/example.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return res.status(200).json({ message: 'Hello' });
}
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for details.

## 🚢 Deployment

### Deploy to Vercel

#### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Option 2: GitHub Integration

1. Push to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy automatically on push

### Environment Variables

Set in Vercel project settings:
- `VITE_DATABRICKS_CLIENT_ID` - OAuth client ID
- `VITE_DATABRICKS_REDIRECT_URI` - Production callback URL (https://your-domain.vercel.app/oauth/callback)

## ❓ Troubleshooting

### "OAuth configuration missing"
- Check `.env` file has `VITE_DATABRICKS_CLIENT_ID`
- Restart dev server after changing `.env`

### "Cannot connect to Databricks"
- Verify OAuth credentials are correct
- Check workspace URL format
- Ensure OAuth app is properly configured in Databricks

### "API endpoint not found"
- Verify `/api` directory structure
- Check `vercel.json` configuration
- Test with `vercel dev` locally

See documentation files for more troubleshooting help.

## 📖 Additional Resources

- [Databricks OAuth Documentation](https://docs.databricks.com/dev-tools/auth.html)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## 📝 License

See [Attributions.md](./Attributions.md) for details.

## 🤝 Contributing

1. Follow design system guidelines
2. Use TypeScript for type safety
3. Test OAuth flow before committing
4. Document new features
5. Maintain consistency with existing code

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: ✅ Production Ready