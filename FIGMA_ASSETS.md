# Image Assets Reference

This file documents all image assets used in the Wisdom app.

## Current Assets

### Logo (Main CoHive Logo with Bird)
- **File**: `src/imports/CoHive_Logo_witthBird.png`
- **Used in**: Login.tsx (landing page)
- **Import**: `import loginImage from '../../imports/CoHive_Logo_witthBird.png'`
- **Purpose**: Main landing page logo with hummingbird graphic

### Logo (CoHive Text Logo)
- **File**: `src/imports/CoHiveLogo.png`
- **Used in**: App_Simple.tsx (main Wisdom app)
- **Import**: `import cohiveLogo from "../imports/CoHiveLogo.png"`
- **Purpose**: CoHive text logo displayed above the Wisdom hex

### Gem Icon
- **Asset ID**: `figma:asset/53dc6cf554f69e479cfbd60a46741f158d11dd21.png`
- **Used in**: App.tsx (favicon)
- **Purpose**: Browser favicon/tab icon

## Usage Notes

- Logo images are stored in `src/imports/` directory
- Use relative imports from component files
- Gem icon still uses `figma:asset` scheme for favicon
