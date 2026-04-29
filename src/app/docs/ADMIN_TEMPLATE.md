# Admin Template - Full Access Configuration

## Overview

The **Administrator template** is the most comprehensive user template in CoHive, providing complete access to all workflow steps, features, and administrative functions.

---

## Full Capabilities

### All Workflow Steps (13 Total)

The Admin template has access to **every workflow hexagon** in CoHive:

1. **Enter** - Project initialization (required, always first)
2. **Knowledge Base (research)** - File management and research access
3. **Luminaries** - Expert interviews and thought leader insights
4. **Panelist** - Panel member feedback and responses
5. **Consumers** - Consumer personas and buyer insights
6. **Competitors** - Competitive intelligence and market analysis
7. **Colleagues** - Internal stakeholder feedback
8. **Cultural Voices** - Cultural trends and analysis
9. **Social Listening** - Social media sentiment and trends
10. **Wisdom** - Crowdsourced insights contribution
11. **Grade** - Scoring and evaluation
12. **Findings** - Final reports and recommendations
13. **My Files (review)** - Project history and audit trail

**This is the only template with access to ALL hexes.**

---

## Complete Permissions

The Admin template has **all permissions enabled**:

```typescript
permissions: {
  canEditTemplates: true,      // ✅ Create and modify user templates
  canApproveResearch: true,     // ✅ Approve/reject research files in Knowledge Base
  canViewAllProjects: true,     // ✅ Access all projects across workspace
  canExportData: true           // ✅ Export data to Databricks
}
```

### What Each Permission Enables

#### Can Edit Templates
- Create new user templates
- Modify existing templates
- Configure visible steps for other roles
- Set permissions for other users
- Access Template Manager UI

#### Can Approve Research
- Approve pending research files in Knowledge Base
- Move files from "Pending" to "Approved" status
- Quality control over research assets
- Manage workspace knowledge quality

#### Can View All Projects
- Access projects created by any user
- View all brands and project types
- See complete workspace activity
- Monitor usage and executions

#### Can Export Data
- Send data to Databricks from any hex
- Execute AI assessments
- Run persona evaluations
- Export findings and reports

---

## Question Configuration

The Admin template has **all questions enabled** for all workflow steps:

```typescript
questionConfig: {
  Enter: {
    visibleQuestions: [0, 1],
    defaultResponses: {},
    requiredQuestions: [0, 1]
  },
  research: {
    visibleQuestions: [0, 1, 2, 3],
    defaultResponses: {},
    requiredQuestions: []
  },
  // ... all other hexes have questions [0, 1, 2] visible
}
```

**No questions are hidden or pre-filled** - admins have complete control over all inputs.

---

## Databricks Instructions

The Admin template includes comprehensive Databricks integration for every hex:

| Hex | Databricks Instruction |
|-----|------------------------|
| **Enter** | Initialize project in Databricks workspace. Create project directory and metadata tables. |
| **Knowledge Base** | Process uploaded research files. Extract insights using NLP models. Store in Delta tables. |
| **Luminaries** | Process expert interview transcripts. Extract key themes and insights. |
| **Panelist** | Process panelist feedback and responses. Generate comprehensive analysis. |
| **Consumers** | Run buyer persona analysis. Generate segment profiles and insights. |
| **Competitors** | Execute competitive intelligence queries. Update market share models. |
| **Colleagues** | Process internal stakeholder feedback. Generate team collaboration insights. |
| **Cultural Voices** | Analyze cultural trends and voices. Generate cultural insights report. |
| **Social Listening** | Process social media sentiment. Generate trending topics report. |
| **Wisdom** | Process and store crowdsourced insights. Tag and categorize wisdom contributions. |
| **Grade** | Score and evaluate results. Generate assessment reports. |
| **Findings** | Generate final report. Execute recommendation models. Export to presentation format. |
| **My Files** | Review all project files and history. Generate audit reports. |

---

## Conversation Settings

The Admin template uses the **highest-tier AI model** for persona assessments:

```typescript
conversationSettings: {
  conversationMode: 'multi-round',
  modelEndpoint: 'databricks-claude-sonnet-4-6'  // Tier 1 Premium model
}
```

### Why Claude Sonnet 4.6?

- **Highest quality** persona responses
- **Rich, nuanced** voice characteristics
- **Best for marketing** persona work
- **Anthropic's flagship** model for CoHive
- **Multi-round conversations** for deep analysis

**Admins can change this** to any other model via Template Manager.

---

## Use Cases

### Primary Admin Functions

1. **Workspace Management**
   - Approve/reject research files
   - Monitor all user activity
   - Quality control for knowledge base
   - Audit trails and compliance

2. **Template Administration**
   - Create role-specific templates
   - Configure permissions for teams
   - Set up new user workflows
   - Manage template library

3. **Full Workflow Testing**
   - Test all hexes and features
   - Validate integrations
   - Perform end-to-end QA
   - Troubleshoot user issues

4. **Complete Project Access**
   - View all brands and projects
   - Access any user's work
   - Generate workspace reports
   - Export comprehensive data

---

## Template Details

### Template ID
`admin`

### Role
`administrator`

### Template Name
"Administrator"

### Description
"Full access to all features, template management, and research approval"

---

## Comparison to Other Templates

| Feature | Admin | Research Leader | Marketing Manager | Executive |
|---------|-------|----------------|-------------------|-----------|
| **All 13 Hexes** | ✅ | ❌ (10 hexes) | ❌ (12 hexes) | ❌ (4 hexes) |
| **Edit Templates** | ✅ | ❌ | ❌ | ❌ |
| **Approve Research** | ✅ | ✅ | ❌ | ❌ |
| **View All Projects** | ✅ | ✅ | ❌ | ✅ |
| **Export Data** | ✅ | ✅ | ✅ | ❌ |
| **My Files (review)** | ✅ | ❌ | ❌ | ❌ |
| **All Permissions** | ✅ | ❌ | ❌ | ❌ |

**Admin is the ONLY template with:**
- Access to all 13 hexes
- Template editing capability
- Complete permission set
- My Files (review) access

---

## Security Considerations

### Who Should Have Admin Access?

✅ **Recommended:**
- Workspace administrators
- CoHive platform managers
- QA/testing team members
- Super users needing full access

❌ **Not Recommended:**
- End users
- External consultants
- Temporary contractors
- Non-technical stakeholders

### Best Practices

1. **Limit Admin Users** - Only grant to those who truly need full access
2. **Regular Audits** - Review who has admin access quarterly
3. **Use My Files** - Monitor workspace activity regularly
4. **Template Management** - Create role-specific templates for other users
5. **Research Approval** - Review and approve files promptly to unblock users

---

## Switching to Admin Template

### Via Template Manager

1. Click **"Template Settings"** in top navigation
2. Browse available templates
3. Select **"Administrator"** template
4. Click to activate

The template activates immediately and persists across sessions.

### Default Template

Admin is the **default template** for new CoHive installations:

```typescript
// ProcessWireframe.tsx
setCurrentTemplateId('admin');
localStorage.setItem('cohive_current_template_id', 'admin');
```

---

## Customizing Admin Template

### Via Template Editor

Admins can modify their own template:

1. Open **Template Manager**
2. Click **Edit** on Administrator template
3. Modify any settings:
   - Change conversation mode
   - Select different AI model
   - Adjust Databricks instructions
   - Update description

4. Click **Save Template**

**Note:** Admins can disable their own permissions, but this is not recommended.

---

## Troubleshooting

### Can't See All Hexes

**Problem:** Some hexes are missing from the workflow

**Solution:**
1. Open Template Manager
2. Verify Admin template is active (green checkmark)
3. Check that all 13 steps are listed in visibleSteps
4. If not, edit template and enable missing steps

### Can't Edit Templates

**Problem:** Template Manager shows no "Edit" buttons

**Solution:**
1. Verify `canEditTemplates` permission is enabled
2. Switch to Admin template if using another role
3. Check localStorage: `cohive_current_template_id` should be 'admin'

### Can't Approve Research Files

**Problem:** No "Approve" button in Knowledge Base

**Solution:**
1. Verify `canApproveResearch` permission is enabled
2. Ensure you're viewing Synthesis or Persona mode (not Workspace)
3. Switch to Admin or Research Leader template

---

## Version History

- **v1.0** - Initial admin template with basic permissions
- **v2.0** - Added conversation settings and model endpoint
- **v3.0** - Expanded to all 13 workflow hexes
- **v4.0** - Added complete question configuration for all hexes
- **v4.1** - Enabled all permissions (canApproveResearch added)

---

## Related Documentation

- `/Guidelines.md` - Overall CoHive development guidelines
- `/docs/KNOWLEDGE_BASE_ACCESS_POLICY.md` - Research file approval system
- `/docs/PROJECT_TYPE_PROMPTS.md` - Data scientist capabilities
- `/components/TemplateManager.tsx` - Template system implementation

---

**Last Updated:** April 2026
