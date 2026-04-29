/**
 * Gems Save API
 *
 * Saves a selected gem (highlighted text) to the gems table
 * and increments gem_inclusion_count on the source file.
 * All Databricks credentials read from environment variables.
 *
 * Location: api/databricks/gems/save.js
 */

import { getDatabricksConfig } from '../../utils/validateEnv.js';
import { logGem, logError } from '../../utils/logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workspaceHost, accessToken, warehouseId, schema } = getDatabricksConfig();

    const {
      gemText,
      fileId,
      fileName,
      assessmentType,
      hexId,
      hexLabel,
      brand,
      projectType,
      createdBy,
    } = req.body;

    if (!gemText || !createdBy) {
      return res.status(400).json({ error: 'gemText and createdBy are required' });
    }

    const gemId = `gem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[Gems Save] Saving gem from file: ${fileName} (${fileId})`);
    console.log(`[Gems Save] Gem text: "${gemText.substring(0, 80)}..."`);

    const escapedText = gemText.replace(/'/g, "''");
    const escapedFileName = (fileName || '').replace(/'/g, "''");
    const escapedBrand = (brand || '').replace(/'/g, "''");
    const escapedProjectType = (projectType || '').replace(/'/g, "''");
    const escapedHexId = (hexId || '').replace(/'/g, "''");
    const escapedHexLabel = (hexLabel || '').replace(/'/g, "''");
    const escapedAssessmentType = (assessmentType || '').replace(/'/g, "''");
    const escapedCreatedBy = (createdBy || '').replace(/'/g, "''");

    // Step 1: Insert gem
    const insertSQL = `
      INSERT INTO knowledge_base.${schema}.gems (
        gem_id, gem_text, file_id, file_name, assessment_type,
        hex_id, hex_label, brand, project_type, created_by, created_at
      ) VALUES (
        '${gemId}',
        '${escapedText}',
        ${fileId ? `'${fileId}'` : 'NULL'},
        ${fileName ? `'${escapedFileName}'` : 'NULL'},
        '${escapedAssessmentType}',
        '${escapedHexId}',
        '${escapedHexLabel}',
        '${escapedBrand}',
        '${escapedProjectType}',
        '${escapedCreatedBy}',
        CURRENT_TIMESTAMP()
      )
    `;

    const insertResponse = await fetch(
      `https://${workspaceHost}/api/2.0/sql/statements`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ warehouse_id: warehouseId, statement: insertSQL, wait_timeout: '30s' }),
      }
    );

    if (!insertResponse.ok) {
      const errorData = await insertResponse.json();
      throw new Error(`Gem insert failed: ${errorData.message || insertResponse.statusText}`);
    }

    console.log(`[Gems Save] Gem inserted: ${gemId}`);
    logGem({ userEmail: createdBy, brand, hexId, fileName, gemId });

    // Step 2: Increment gem_inclusion_count on source file (non-fatal if fails)
    if (fileId) {
      const incrementResponse = await fetch(
        `https://${workspaceHost}/api/2.0/sql/statements`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            warehouse_id: warehouseId,
            statement: `UPDATE knowledge_base.${schema}.file_metadata
                        SET gem_inclusion_count = gem_inclusion_count + 1,
                            updated_at = CURRENT_TIMESTAMP()
                        WHERE file_id = '${fileId}'`,
            wait_timeout: '30s',
          }),
        }
      );

      if (!incrementResponse.ok) {
        console.error('[Gems Save] Failed to increment gem_inclusion_count (non-fatal)');
      } else {
        console.log(`[Gems Save] Incremented gem_inclusion_count for file: ${fileId}`);
      }
    }

    return res.status(200).json({ success: true, gemId, message: 'Gem saved successfully' });

  } catch (error) {
    console.error('[Gems Save] Error:', error);
    logError({ userEmail: req.body?.createdBy, brand: req.body?.brand, hexId: req.body?.hexId, error, context: { operation: 'gem_save' } });
    return res.status(500).json({ error: 'Gem save failed', message: error.message });
  }
}
