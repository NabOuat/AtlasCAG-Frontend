/**
 * Charte Graphique & Design System - AtlasCAG (AFOR Côte d'Ivoire)
 * Ce fichier centralise tous les styles, couleurs et badges réutilisables.
 */

// 1. Palette de couleurs principale
export const C = {
  // Couleurs de marque AFOR
  primary:      '#C75A24', // Orange AFOR
  primaryDark:  '#a8491c',
  primaryLight: '#fdf0ea',
  
  teal:         '#41A6C7', // Bleu/Teal secondaire
  tealDark:     '#3390af',
  tealLight:    '#e8f6fb',
  
  success:      '#43D793', // Vert succès
  successDark:  '#35b87a',
  successLight: '#eafbf3',

  orange:       '#C75A24', // Alias orange
  green:        '#43D793', // Alias vert succès

  navy:         '#1a2536', // Fond Sidebar / En-têtes sombres
  sidebarHover: 'rgba(255,255,255,0.08)',

  // Couleurs sémantiques standards
  bg:           '#f1f5f9', // Fond général de l'app (Slate 100)
  card:         '#ffffff', // Fond des cartes/panneaux
  border:       '#e2e8f0', // Bordures légères (Slate 200)
  text:         '#0f172a', // Texte principal (Slate 900)
  muted:        '#64748b', // Texte secondaire (Slate 500)
  light:        '#94a3b8', // Texte d'aide ou désactivé (Slate 400)
  red:          '#ef4444', // Rouge erreur / suppression
  yellow:       '#f59e0b', // Jaune avertissement
  gray:         '#6b7280', // Gris standard

  // Couleurs spécifiques aux types de fichiers
  excel:        '#217346',
  pdf:          '#dc2626',
}

// 2. Styles de badges pour les statuts des dossiers
export const STATUT_STYLE = {
  EN_COURS: { bg: '#fef9c3', text: '#b45309', label: 'En cours' },
  VALIDE:   { bg: '#dcfce7', text: '#15803d', label: 'Validé' },
  REJETE:   { bg: '#fee2e2', text: '#b91c1c', label: 'Rejeté' },
  ARCHIVE:  { bg: '#f3f4f6', text: '#6b7280', label: 'Archivé' },
  ANNULE:   { bg: '#fce7f3', text: '#9d174d', label: 'Annulé' },
}

// 3. Styles de badges pour les types de dossiers
export const TYPE_STYLE = {
  DTV:                { bg: '#e0f2fe', text: '#0369a1', label: 'DTV' },
  CF:                 { bg: '#dcfce7', text: '#15803d', label: 'CF' },
  CONTRACTUALISATION: { bg: '#fef3c7', text: '#92400e', label: 'Contrat' },
}

// 3b. Styles de badges pour le statut CF (Suivi CF)
export const STATUT_CF_STYLE = {
  LEVE:             { bg: '#fef3c7', text: '#b45309', label: 'Levé' },
  PROV:             { bg: '#e0f2fe', text: '#0369a1', label: 'Provisoire' },
  EN_PUBLICITE:     { bg: '#fce7f3', text: '#be185d', label: 'En publicité' },
  APRES_PUBLICITE:  { bg: '#f3e8ff', text: '#7c3aed', label: 'Après publicité' },
  DEF:              { bg: '#fdf0ea', text: '#C75A24', label: 'Définitif' },
  REJETE:           { bg: '#fee2e2', text: '#b91c1c', label: 'Rejeté' },
}

// 3c. Styles de badges pour l'avancement CF (PVCL / RDC / Publicité)
export const AVANCEMENT_CF_STYLE = {
  AUCUNE: { bg: '#f3f4f6', text: '#6b7280', label: 'Aucune étape' },
  PVCL:   { bg: '#dcfce7', text: '#15803d', label: 'PVCL (Constat)' },
  RDC:    { bg: '#dbeafe', text: '#1d4ed8', label: 'RDC' },
  PUB:    { bg: '#fef3c7', text: '#92400e', label: 'Publicité annoncée' },
}

// 3d. Styles de badges pour le type de traitement (Planning Bureau)
// Couleurs d'identité (catégorielles) — le rouge/vert restent réservés aux statuts.
export const TYPE_TRAITEMENT_STYLE = {
  ZIP_SHAPE: { bg: '#fdf0ea', text: '#C75A24', label: 'Traitement ZIP / Shape' },
  PDF:       { bg: '#e8f6fb', text: '#3390af', label: 'Édition PDF' },
}

// 4. Styles de badges pour la gravité des anomalies (contrôle qualité)
export const GRAVITE_STYLE = {
  BLOQUANTE: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444', label: 'Bloquante' },
  MAJEURE:   { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: 'Majeure' },
  MINEURE:   { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af', label: 'Mineure' },
}

// 5. Raccourcis de styles communs (Ombres, Radius, Transitions)
export const S = {
  shadowLight: '0 1px 4px rgba(0,0,0,0.06)',
  shadowCard:  '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
  shadowModal: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
  radiusSm:    '6px',
  radiusMd:    '8px',
  radiusLg:    '12px',
  radiusXl:    '16px',
  transition:  'all 0.15s ease-in-out',
}
