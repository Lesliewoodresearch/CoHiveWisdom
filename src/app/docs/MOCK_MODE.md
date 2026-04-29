# Mock Mode for Figma Make

## Overview

Mock Mode allows CoHive to run in Figma Make without requiring Databricks authentication. This is useful for design review, prototyping, and demonstrating the interface.

## When Mock Mode Activates

Mock Mode automatically activates when CoHive is running on:
- Any `figma.com` domain (Figma Make environment)
- `localhost` or `127.0.0.1` (local development)
- Any hostname containing `figma-make`
- When `VITE_MOCK_MODE=true` environment variable is set

## What Mock Mode Does

### Authentication
- **Bypasses Databricks OAuth** - No OAuth flow required
- **Auto-authenticates** - After entering email/password, you go straight to the app
- **Mock session** - Uses a fake access token that passes all auth checks

### Visual Indicator
- Displays a **purple "🎨 Mock Mode" badge** in the top-left corner
- Always visible when mock mode is active

### Functionality
- ✅ **Full UI access** - All hexagons and navigation work normally
- ✅ **Local state** - User responses, templates, and settings save to localStorage
- ✅ **No external calls** - Skips all Databricks API calls
- ⚠️ **Simulated saves** - "Save to Knowledge Base" actions log but don't actually save
- ⚠️ **No real data** - Research files, assessments, and AI features won't work with real data

### What Works
- Hexagonal navigation and workflow
- User templates and model templates
- Local file uploads (ideas files, etc.)
- UI interactions and forms
- Export/import project data

### What Doesn't Work
- Knowledge Base file loading/saving (simulated only)
- AI assessments and recommendations
- Databricks workspace operations
- Real authentication

## Usage in Figma Make

1. Open CoHive in Figma Make
2. Mock mode activates automatically (you'll see the purple badge)
3. Enter any email and password `cohive2024`
4. You're in! No Databricks OAuth needed

## For Developers

Mock mode is implemented in `/utils/mockMode.ts` and integrated into:
- `/utils/databricksAuth.ts` - Returns mock session
- `/components/Login.tsx` - Skips OAuth modal
- `/components/ProcessWireframe.tsx` - Bypasses auth checks
- `/App.tsx` - Shows visual indicator

To explicitly enable mock mode in any environment:
```bash
VITE_MOCK_MODE=true
```

## Security Note

Mock mode is safe for design/demo purposes. It only works in non-production environments and doesn't expose any real credentials or data.
