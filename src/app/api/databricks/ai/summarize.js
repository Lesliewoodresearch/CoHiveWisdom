/**
 * Databricks AI Summary Generation API
 *
 * Generates markdown summaries from Findings data using Databricks AI.
 * Fetches actual file content from Databricks Knowledge Base for selected files.
 * All Databricks credentials read from environment variables.
 *
 * Location: api/databricks/ai/summarize.js
 */

import { getDatabricksConfig } from '../../utils/validateEnv.js';
import { getModel } from '../../models/factory.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workspaceHost, accessToken, warehouseId, schema } = getDatabricksConfig();

    const {
      brand,
      projectType,
      fileName,
      selectedFiles,
      outputOptions,
      hexExecutions,
      completedSteps,
      responses,
      userEmail,
      userRole,
      modelEndpoint = 'databricks-claude-sonnet-4-6',
    } = req.body;

    if (!brand || !projectType || !userEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['brand', 'projectType', 'userEmail'],
      });
    }

    console.log(`[AI Summary] Generating summary for ${brand} - ${projectType}`);
    console.log(`[AI Summary] Selected files: ${selectedFiles?.length || 0}`);
    console.log(`[AI Summary] Output options: ${outputOptions?.join(', ') || 'none'}`);
    console.log(`[AI Summary] Completed steps: ${completedSteps?.join(', ') || 'none'}`);

    // ── Step 1: Fetch content of selected iteration files from Databricks ──
    let filesWithContent = [];
    
    if (selectedFiles && selectedFiles.length > 0) {
      console.log(`[AI Summary] Fetching ${selectedFiles.length} iteration file(s) from Databricks...`);
      
      filesWithContent = await Promise.all(
        selectedFiles.map(async (fileName) => {
          try {
            // Query file metadata from Knowledge Base
            const metaResp = await fetch(
              `https://${workspaceHost}/api/2.0/sql/statements`,
              {
                method: 'POST',
                headers: { 
                  Authorization: `Bearer ${accessToken}`, 
                  'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                  warehouse_id: warehouseId,
                  statement: `SELECT file_id, file_path, file_name, file_type, file_size_bytes
                              FROM knowledge_base.${schema}.file_metadata
                              WHERE (file_name = '${fileName.replace(/'/g, "''")}' 
                                     OR file_name = '${fileName.replace(/'/g, "''")}.txt'
                                     OR file_name = '${fileName.replace(/'\.txt$/i, '').replace(/'/g, "''")}')
                              AND file_type = 'Findings'
                              ORDER BY CASE WHEN file_name = '${fileName.replace(/'/g, "''")}' THEN 1
                                            WHEN file_name = '${fileName.replace(/'/g, "''")}' || '.txt' THEN 2
                                            ELSE 3 END
                              LIMIT 1`,
                  wait_timeout: '30s',
                }),
              }
            );

            if (!metaResp.ok) {
              console.warn(`[AI Summary] Metadata query failed for ${fileName}: ${metaResp.status}`);
              return { fileName, content: null, error: 'Metadata query failed' };
            }

            const metaResult = await metaResp.json();
            const rows = metaResult.result?.data_array || [];

            if (rows.length === 0) {
              console.warn(`[AI Summary] File not found in KB: ${fileName}`);
              return { fileName, content: null, error: 'File not found' };
            }

            const [fileId, filePath, resolvedFileName, fileType, fileSizeBytes] = rows[0];
            console.log(`[AI Summary] ✅ Found: ${resolvedFileName} (${fileSizeBytes} bytes)`);

            // Download file content
            const fileResp = await fetch(
              `https://${workspaceHost}/api/2.0/fs/files${filePath}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!fileResp.ok) {
              console.warn(`[AI Summary] File download failed for ${fileName}: ${fileResp.status}`);
              return { fileName, content: null, error: 'Download failed' };
            }

            const fileBuffer = Buffer.from(await fileResp.arrayBuffer());
            let textContent = '';

            // Iteration files are now saved as .txt — read as plain text
            // Also handle legacy .json files gracefully
            const rawText = fileBuffer.toString('utf-8');
            try {
              const jsonContent = JSON.parse(rawText);
              // Legacy JSON — extract readable text from hexExecutions
              const lines = [];
              const hx = jsonContent.hexExecutions || {};
              const hexOrder = ['research','Luminaries','panelist','Consumers','competitors','Colleagues','cultural','social','Grade','Wisdom'];
              const ordered = [...hexOrder.filter(h => hx[h]?.length > 0), ...Object.keys(hx).filter(h => !hexOrder.includes(h) && hx[h]?.length > 0)];
              for (const hexId of ordered) {
                const execs = hx[hexId];
                if (!execs?.length) continue;
                lines.push(`${hexId.toUpperCase()} HEX`);
                execs.forEach((ex, i) => { if (ex.assessment) lines.push(ex.assessment); });
              }
              textContent = lines.join('\n\n') || rawText;
              console.log(`[AI Summary] ✅ Parsed legacy JSON for ${fileName} (${textContent.length} chars)`);
            } catch {
              // Plain text (new format)
              textContent = rawText;
              console.log(`[AI Summary] ✅ Loaded text content for ${fileName} (${textContent.length} chars)`);
            }

            // Truncate very large files
            if (textContent.length > 50000) {
              textContent = textContent.slice(0, 50000) + '\n\n[... content truncated ...]';
            }

            return { fileName, content: textContent, fileId };

          } catch (err) {
            console.error(`[AI Summary] Error loading ${fileName}:`, err.message);
            return { fileName, content: null, error: err.message };
          }
        })
      );

      const successfulFiles = filesWithContent.filter(f => f.content);
      console.log(`[AI Summary] Successfully loaded ${successfulFiles.length}/${selectedFiles.length} files`);
    }

    // ── Step 2: Build the AI prompt ──
    const systemPrompt = `You are an expert marketing strategist and analyst. Your task is to create comprehensive, well-structured markdown summaries of marketing campaign findings and insights.

Your summaries should:
- Be clear, concise, and actionable
- Use proper markdown formatting (headers, lists, bold, italic, tables)
- Include relevant data and insights from the provided information
- Organize information logically with clear sections
- Highlight key findings and recommendations
- Be professional and suitable for executive presentation
- Synthesize information from multiple iteration files when provided`;

    let userPrompt = `Generate a comprehensive markdown summary for the following marketing project:\n\n**Brand:** ${brand}\n**Project Type:** ${projectType}\n**Summary File:** ${fileName}\n\n`;

    // Include output options
    if (outputOptions?.length > 0) {
      userPrompt += `\n**Requested Output Elements:**\n`;
      outputOptions.forEach(option => { userPrompt += `- ${option}\n`; });
    }

    // Include completed steps
    if (completedSteps?.length > 0) {
      userPrompt += `\n**Workflow Steps Completed:**\n`;
      completedSteps.forEach(step => { userPrompt += `- ${step}\n`; });
    }

    // ── Include actual file content from Databricks ──
    const successfulFiles = filesWithContent.filter(f => f.content);
    if (successfulFiles.length > 0) {
      userPrompt += `\n---\n\n## ITERATION FILE CONTENTS\n\nThe following iteration files were selected for summarization. Analyze their content thoroughly:\n\n`;
      
      for (const file of successfulFiles) {
        userPrompt += `### File: ${file.fileName}\n\n`;
        userPrompt += `\`\`\`json\n${file.content}\n\`\`\`\n\n`;
      }
    }

    // Include hex execution data (from current session)
    if (hexExecutions && Object.keys(hexExecutions).length > 0) {
      userPrompt += `\n---\n\n## CURRENT SESSION HEX EXECUTIONS\n\n`;
      for (const [hexId, executions] of Object.entries(hexExecutions)) {
        if (executions?.length > 0) {
          userPrompt += `### ${hexId}\n`;
          userPrompt += `Total executions: ${executions.length}\n\n`;
          const latest = executions[executions.length - 1];
          if (latest.selectedFiles) userPrompt += `**Selected Files:** ${latest.selectedFiles.join(', ')}\n`;
          if (latest.assessmentType) {
            const types = Array.isArray(latest.assessmentType) ? latest.assessmentType : [latest.assessmentType];
            userPrompt += `**Assessment Type:** ${types.join(', ')}\n`;
          }
          if (latest.assessment) userPrompt += `**Assessment:** ${latest.assessment}\n`;
          userPrompt += `\n`;
        }
      }
    }

    // Include project details from responses
    if (responses?.Enter) {
      userPrompt += `\n**Project Details:**\n`;
      if (responses.Enter[0]) userPrompt += `- Brand: ${responses.Enter[0]}\n`;
      if (responses.Enter[1]) userPrompt += `- Project Type: ${responses.Enter[1]}\n`;
      if (responses.Enter[2]) userPrompt += `- Project File: ${responses.Enter[2]}\n`;
    }

    // ── Build CONDITIONAL summary instructions based ONLY on selected output options ──
    userPrompt += `\n---\n\n## SUMMARY INSTRUCTIONS\n\n`;
    userPrompt += `Based on the iteration file contents provided above, create a markdown summary that includes **ONLY** the following sections that were explicitly requested:\n\n`;

    // Track which sections to include
    const sectionsToInclude = [];

    if (outputOptions?.includes('Executive Summary')) {
      sectionsToInclude.push('Executive Summary');
      userPrompt += `### 1. Executive Summary\n`;
      userPrompt += `Create a detailed executive summary that:\n`;
      userPrompt += `- Provides a high-level overview of the project (${brand} - ${projectType})\n`;
      userPrompt += `- Synthesizes the key findings from all selected iteration files\n`;
      userPrompt += `- Highlights the most important insights and conclusions\n`;
      userPrompt += `- Is suitable for executive/stakeholder presentation\n\n`;
    }

    if (outputOptions?.includes('Share all Ideas as a list')) {
      sectionsToInclude.push('Ideas List');
      userPrompt += `### ${sectionsToInclude.length}. Complete Ideas List\n`;
      userPrompt += `Extract and compile ALL ideas mentioned across the iteration files:\n`;
      userPrompt += `- Create a comprehensive numbered list of every idea\n`;
      userPrompt += `- Group ideas by category or hex if applicable\n`;
      userPrompt += `- Include brief descriptions for each idea\n`;
      userPrompt += `- Note which iteration/file each idea came from\n\n`;
    }

    if (outputOptions?.includes('Provide a grid with all "final" ideas with their scores')) {
      sectionsToInclude.push('Ideas Grid');
      userPrompt += `### ${sectionsToInclude.length}. Ideas Scoring Grid\n`;
      userPrompt += `Create a markdown table showing all final ideas with their evaluations:\n`;
      userPrompt += `- Include columns for: Idea Name, Description, Score/Rating, Source File\n`;
      userPrompt += `- Extract any scoring, ratings, or assessment data from the iterations\n`;
      userPrompt += `- Sort by score/priority if available\n`;
      userPrompt += `- Use proper markdown table formatting\n\n`;
    }

    if (outputOptions?.includes('Include Gems')) {
      sectionsToInclude.push('Gems');
      userPrompt += `### ${sectionsToInclude.length}. Key Gems & Insights\n`;
      userPrompt += `Identify and highlight the most valuable insights (gems):\n`;
      userPrompt += `- Extract particularly noteworthy findings from the iteration data\n`;
      userPrompt += `- Highlight breakthrough ideas or unexpected discoveries\n`;
      userPrompt += `- Include strategic insights that stand out\n`;
      userPrompt += `- Format each gem with context and source reference\n\n`;
    }

    if (outputOptions?.includes('Include User Notes from all iterations as an Appendix')) {
      sectionsToInclude.push('Appendix');
      userPrompt += `### ${sectionsToInclude.length}. Appendix: Iteration Notes\n`;
      userPrompt += `Compile detailed notes from all iterations:\n`;
      userPrompt += `- Include user assessments and observations from each iteration\n`;
      userPrompt += `- Preserve hex execution details and responses\n`;
      userPrompt += `- Document the workflow progression across iterations\n`;
      userPrompt += `- Include any relevant metadata or timestamps\n\n`;
    }

    // Handle case where no options selected
    if (sectionsToInclude.length === 0) {
      userPrompt += `No specific output options were selected. Please provide a brief overview of the iteration files including:\n`;
      userPrompt += `- A short summary of the project scope\n`;
      userPrompt += `- Key points from the iteration data\n`;
      userPrompt += `- Any notable findings\n\n`;
    }

    userPrompt += `---\n\n**IMPORTANT:** Only include the ${sectionsToInclude.length > 0 ? sectionsToInclude.length : 'requested'} section(s) listed above: ${sectionsToInclude.join(', ') || 'Brief Overview'}.\n`;
    userPrompt += `Do NOT add additional sections that were not requested.\n`;
    userPrompt += `Format the output in clean, well-structured markdown.`;

    console.log(`[AI Summary] Sections to include: ${sectionsToInclude.join(', ') || 'Brief Overview'}`);
    console.log(`[AI Summary] Prompt length: ${userPrompt.length} chars`);
    console.log(`[AI Summary] Calling: ${modelEndpoint}`);

    const model = getModel(modelEndpoint, { workspaceHost, accessToken });
    const result = await model.invoke({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 4000,
      temperature: 0.7,
    });

    console.log(`[AI Summary] SUCCESS — ${result.content.length} chars`);

    return res.status(200).json({
      success: true,
      summary: result.content,
      model: result.modelId,
      usage: result.usage,
      metadata: {
        brand,
        projectType,
        fileName,
        completedSteps: completedSteps?.length || 0,
        hexExecutions: Object.keys(hexExecutions || {}).length,
        filesLoaded: successfulFiles.length,
        filesRequested: selectedFiles?.length || 0,
        sectionsIncluded: sectionsToInclude,
        outputOptions: outputOptions || [],
      },
    });

  } catch (error) {
    console.error('[AI Summary] Error:', error);
    return res.status(500).json({ error: 'Summary generation failed', message: error.message });
  }
}
