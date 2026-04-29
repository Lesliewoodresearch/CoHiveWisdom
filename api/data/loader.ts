/**
 * Persona Data Loader
 *
 * Central access point for all persona and agent content.
 * Wraps personaContentData.ts with typed helpers that mirror the
 * Python data/loader.py pattern (load_luminaries, add_luminary).
 *
 * Usage:
 *   import { getPersona, getAllPersonas, getPersonasByCategory } from './loader';
 *
 *   const ogilvy = getPersona('david-ogilvy');
 *   const luminaries = getPersonasByCategory('luminary');
 *   const colleagues = getPersonasByCategory('colleague');
 */

import {
  getPersonaContent,
  getAllPersonaIds,
  hasPersonaContent,
} from '../../data/personaContentData.js';

import type { PersonaContent } from '../../data/personas.js';

// ── Category helpers ──────────────────────────────────────────────────────────

/**
 * Persona ID prefixes that indicate category membership.
 * Extend this map when new categories are added to persona-content/.
 */
const CATEGORY_PREFIXES: Record<string, string[]> = {
  luminary:   [
    'david-ogilvy', 'bill-bernbach', 'leo-burnett', 'david-ogilvy',
    'dan-wieden', 'lee-clow', 'jeff-goodby', 'rich-silverstein',
    'alex-bogusky', 'john-hegarty', 'dave-trott', 'greg-hahn',
    'tiffany-rolfe', 'margaret-johnson', 'paula-scher', 'george-lois',
    'howard-gossage', 'rosser-reeves', 'russell-colley', 'claude-hopkins',
    'eugene-schwartz', 'joseph-sugarman', 'drayton-bird', 'byron-sharp',
    'rory-sutherland', 'seth-godin', 'steve-jobs', 'oprah-winfrey',
    'mary-kay-ash', 'mary-wells-lawrence', 'estee-lauder', 'coco-chanel',
    'don-draper', 'willy-wonka', 'luminaries-tech-cto',
  ],
  colleague:  ['colleagues-'],
  consumer:   ['consumers-'],
  cultural:   ['cultural-'],
  grade_demo: ['grade-demo-'],
  grade_life: ['grade-lifestyle-'],
  grade_psyc: ['grade-psycho-'],
  panelist:   ['panelist-'],
};

function matchesCategory(id: string, category: string): boolean {
  const prefixes = CATEGORY_PREFIXES[category] ?? [];
  return prefixes.some(p =>
    // Exact match for individual IDs (luminaries), prefix match for groups
    p.endsWith('-') ? id.startsWith(p) : id === p
  );
}

// ── Core loaders ──────────────────────────────────────────────────────────────

/**
 * Returns the persona content for a given ID.
 * Returns a safe fallback object if the ID is not found — never throws.
 */
export function getPersona(personaId: string): PersonaContent {
  return getPersonaContent(personaId);
}

/**
 * Returns all persona IDs currently registered in personaContentData.ts.
 */
export function getAllPersonaIds_(): string[] {
  return getAllPersonaIds();
}

/**
 * Returns all persona objects for every registered ID.
 */
export function getAllPersonas(): PersonaContent[] {
  return getAllPersonaIds().map(id => getPersonaContent(id));
}

/**
 * Returns true if a persona ID has content registered.
 */
export function personaExists(personaId: string): boolean {
  return hasPersonaContent(personaId);
}

// ── Category-filtered loaders ─────────────────────────────────────────────────

/**
 * Returns all personas belonging to a named category.
 *
 * Valid categories:
 *   'luminary' | 'colleague' | 'consumer' | 'cultural' |
 *   'grade_demo' | 'grade_life' | 'grade_psyc' | 'panelist'
 */
export function getPersonasByCategory(category: string): PersonaContent[] {
  return getAllPersonaIds()
    .filter(id => matchesCategory(id, category))
    .map(id => getPersonaContent(id));
}

/**
 * Returns all luminary (advertising legend / external expert) personas.
 * These map to cohive/personas/luminaries in the Python project.
 */
export function getLuminaries(): PersonaContent[] {
  return getPersonasByCategory('luminary');
}

/**
 * Returns all colleague personas (internal team roles).
 */
export function getColleagues(): PersonaContent[] {
  return getPersonasByCategory('colleague');
}

/**
 * Returns all consumer personas.
 */
export function getConsumers(): PersonaContent[] {
  return getPersonasByCategory('consumer');
}

// ── Bulk loader (mirrors Python load_luminaries) ──────────────────────────────

/**
 * Returns a map of personaId → PersonaContent for a given list of IDs.
 * Unknown IDs return a safe fallback rather than throwing.
 * Mirrors load_luminaries() in Python's data/loader.py.
 */
export function loadPersonas(personaIds: string[]): Record<string, PersonaContent> {
  return Object.fromEntries(
    personaIds.map(id => [id, getPersonaContent(id)])
  );
}

/**
 * Returns a flat array of PersonaContent for a given list of IDs.
 * Convenience wrapper around loadPersonas() for use in assessment runs.
 */
export function loadPersonaList(personaIds: string[]): PersonaContent[] {
  return personaIds.map(id => getPersonaContent(id));
}