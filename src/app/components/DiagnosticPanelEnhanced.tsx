/**
 * Enhanced Error Message Examples for DiagnosticPanel
 * 
 * This file contains examples of improved error messages with clear diagnostics
 * that explain exactly what broke, where, and how to fix it.
 */

// Example enhanced error messages for key tests:

export const ENHANCED_ERROR_MESSAGES = {
  hexagonCount: {
    fail: (found: number, hexIds: string) => ({
      message: `✗ BROKEN: Only ${found}/13 hexagons rendered. Missing hexagons may indicate:
      
1. Template visibility settings hiding hexagons (check current template's visibleSteps)
2. Component rendering errors in ProcessFlow.tsx
3. Missing hex definitions in processSteps array

WHERE TO FIX:
- Check /components/ProcessFlow.tsx for all 13 hex definitions
- Verify current template in TemplateManager allows all hexes to be visible
- Check browser console for React rendering errors`,
      expected: '13 hexagons: Enter, Colleagues, Luminaries, Cultural Voices, Panelist, Competitors, Social Listening, Consumers, Score Results, Findings, Knowledge Base, Share Your Wisdom, My Files',
      received: `${found} hexagons found: ${hexIds || 'none'}`,
    }),
    pass: (count: number) => `✓ All ${count} hexagons rendered correctly with proper data-hex-id attributes`,
  },

  hexagonColors: {
    fail: (missing: string[]) => ({
      message: `✗ BROKEN: ${missing.length} hexagon(s) missing SVG elements. This breaks the visual design.

WHAT BROKE: Hexagons without SVG: ${missing.join(', ')}

WHY THIS HAPPENS:
- HexagonBreadcrumb component not rendering SVG properly
- stepColors not being imported from cohive-theme.ts
- SVG element removed or commented out in HexagonBreadcrumb.tsx

WHERE TO FIX:
- Check /components/HexagonBreadcrumb.tsx SVG rendering
- Verify stepColors import from /styles/cohive-theme.ts
- Ensure each hex has a valid color in stepColors object`,
      expected: 'Each hexagon contains <svg> element with fill color from stepColors',
      received: `Missing SVG in ${missing.length} hexagon(s): ${missing.join(', ')}`,
    }),
    pass: () => '✓ All hexagons have SVG elements with proper color styling from stepColors',
  },

  hexagonClickable: {
    fail: (nonClickable: string[]) => ({
      message: `✗ BROKEN: ${nonClickable.length} hexagon(s) not clickable. Navigation is broken for these hexes.

WHAT BROKE: Non-clickable hexagons: ${nonClickable.join(', ')}

WHY THIS HAPPENS:
- Hexagons not wrapped in <button> elements
- onClick handlers missing or undefined
- Event listeners not attached properly

WHERE TO FIX:
- Check /components/ProcessFlow.tsx hex rendering
- Ensure each hexagon is wrapped: <button onClick={handleClick}><HexagonBreadcrumb /></button>
- Verify handleHexClick function is defined and passed correctly`,
      expected: 'All hexagons wrapped in <button> elements with onClick handlers',
      received: `${nonClickable.length} non-clickable hexagons: ${nonClickable.join(', ')}`,
    }),
    pass: (count: number) => `✓ ${count} hexagons have click handlers for navigation`,
  },

  templateButton: {
    fail: () => ({
      message: `✗ BROKEN: "Manage Templates" button not found in header. Users cannot access template configuration.

WHAT BROKE: Template Settings button is missing from the UI

WHY THIS HAPPENS:
- Button removed or commented out in ProcessWireframe.tsx
- Conditional rendering hiding the button
- Header component not rendering properly

WHERE TO FIX:
- Check /components/ProcessWireframe.tsx header section
- Look for Settings icon button that opens TemplateManager
- Verify the button isn't hidden by conditional logic (e.g., role-based visibility)
- Check for <Settings /> icon import from lucide-react`,
      expected: '<button> with text "Manage Templates" in header',
      received: 'Button not found - check header rendering in ProcessWireframe.tsx',
    }),
    pass: () => '✓ Template Settings button found in header navigation',
  },

  databricksAuth: {
    fail: () => ({
      message: `✗ NOT AUTHENTICATED: User is not authenticated with Databricks.

WHAT THIS MEANS:
- OAuth flow not completed
- Running in mock mode (Figma Make environment)
- Authentication was dismissed or failed

IMPACT:
- Cannot access real Databricks Knowledge Base
- Cannot save assessments to Databricks
- Using mock data instead of real data

WHERE TO CHECK:
- Look for 'databricks_authenticated' in localStorage
- Check if running in Figma Make (mock mode auto-enabled)
- Verify DatabricksAuthModal completed successfully`,
      expected: 'databricks_authenticated = "true" in localStorage',
      received: 'Not authenticated or mock mode active',
    }),
    warning: () => ({
      message: `⚠ WARNING: Not authenticated (may be in mock mode for Figma Make testing)`,
      expected: 'databricks_authenticated = "true"',
      received: 'null or false',
    }),
    pass: () => '✓ User authenticated with Databricks OAuth',
  },

  templatesStorage: {
    fail: () => ({
      message: `✗ BROKEN: No templates found in localStorage. Template system is not initialized.

WHAT BROKE: cohive_templates is missing from localStorage

WHY THIS HAPPENS:
- First-time user (no templates created yet)
- localStorage was cleared
- Template initialization failed
- Default templates not loaded on first run

WHERE TO FIX:
- Check TemplateManager.tsx initialization code
- Verify default templates are created on first load
- Check for localStorage.setItem('cohive_templates', ...) calls
- Look for template initialization in useEffect hooks`,
      expected: 'cohive_templates array in localStorage with at least default templates',
      received: 'null - no templates in storage',
    }),
    pass: (count: number) => `✓ ${count} template(s) available in localStorage`,
  },

  knowledgeBaseModes: {
    fail: (found: number) => ({
      message: `✗ BROKEN: Only ${found}/4 Knowledge Base modes found. Mode switching is incomplete.

WHAT BROKE: Missing mode buttons in Knowledge Base

EXPECTED MODES:
1. Synthesis (for uploading research and creating insights)
2. Personas (for managing persona library)
3. Read/Edit/Approve (for file approval workflow)
4. Workspace (admin-only Databricks operations)

WHY THIS HAPPENS:
- Buttons not rendering in ResearchView.tsx
- Conditional logic hiding modes based on role
- Component rendering error

WHERE TO FIX:
- Check /components/ResearchView.tsx mode button rendering
- Verify role-based visibility (Workspace is admin-only)
- Look for mode state management and button onClick handlers`,
      expected: '4 mode buttons: Synthesis, Personas, Read/Edit/Approve, Workspace',
      received: `${found} mode buttons found`,
    }),
    pass: (count: number) => `✓ ${count} Knowledge Base modes available for navigation`,
  },

  fileUpload: {
    fail: () => ({
      message: `✗ BROKEN: No file upload inputs found. Users cannot upload files to the system.

WHAT BROKE: <input type="file"> elements are missing

WHY THIS HAPPENS:
- File upload component not rendering
- Conditional logic hiding upload inputs
- Wrong mode selected (upload only available in certain modes)

WHERE TO FIX:
- Check current Knowledge Base mode (upload in Synthesis/Workspace)
- Verify file input rendering in mode-specific components
- Look for <input type="file" /> in ResearchView.tsx
- Check if user has permission to upload (non-researchers can't upload to KB)`,
      expected: 'At least 1 <input type="file"> element in current view',
      received: '0 file inputs found',
    }),
    warning: () => ({
      message: `⚠ WARNING: No file inputs visible (may need to navigate to upload mode)`,
      expected: 'File input in certain modes/views',
      received: 'Not currently visible',
    }),
    pass: (count: number) => `✓ ${count} file upload input(s) available`,
  },

  assessmentTypes: {
    fail: () => ({
      message: `✗ BROKEN: Assessment type buttons not found. Users cannot run AI assessments.

WHAT BROKE: Assess/Recommend/Unified buttons are missing

WHY THIS HAPPENS:
- CentralHexView not rendering assessment section
- Not on a persona hex (assessment only available on persona hexes)
- Component rendering error in assessment controls

WHERE TO FIX:
- Navigate to a persona hex (Colleagues, Luminaries, Consumers, etc.)
- Check /components/CentralHexView.tsx assessment button rendering
- Verify assessment type state management
- Look for buttons with text "Assess", "Recommend", "Unified"`,
      expected: '3 assessment type buttons: Assess, Recommend, Unified',
      received: 'Buttons not found - may not be on persona hex',
    }),
    pass: (count: number) => `✓ ${count} assessment type buttons available for AI analysis`,
  },
};

// Helper function to format error messages
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n\nStack trace:\n${error.stack || 'No stack trace available'}`;
  }
  return String(error);
}

// Helper function to create actionable fix suggestions
export function suggestFix(testId: string, context: any): string {
  const fixes: Record<string, string> = {
    'nav-hex-count': `
1. Open /components/ProcessFlow.tsx
2. Check the processSteps array has all 13 hex definitions
3. Verify current template's visibleSteps includes all hexes
4. Check browser console for React component errors`,

    'nav-hex-colors': `
1. Open /components/HexagonBreadcrumb.tsx
2. Verify SVG element is rendering with fill={color}
3. Check stepColors import from /styles/cohive-theme.ts
4. Ensure color prop is being passed to HexagonBreadcrumb`,

    'template-storage': `
1. Open /components/TemplateManager.tsx
2. Check useEffect hook for default template initialization
3. Verify localStorage.setItem('cohive_templates', ...) is being called
4. Create at least one template manually to initialize the system`,

    'kb-modes': `
1. Open /components/ResearchView.tsx
2. Check mode button rendering section
3. Verify all 4 modes are defined in state
4. For Workspace mode: ensure user role is 'administrator'`,

    'files-upload': `
1. Navigate to Knowledge Base > Synthesis or Workspace mode
2. Check if user role allows file uploads
3. Verify <input type="file" /> element in current mode
4. Check conditional rendering logic for upload inputs`,
  };

  return fixes[testId] || 'No specific fix guidance available. Check component rendering and props.';
}
