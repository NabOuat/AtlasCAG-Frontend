// Hiérarchie des profils — ordre croissant de droits
const HIERARCHY = [
  'CET', 'AGENT_GNSS', 'CE',
  'CR', 'RAF',
  'SIFOR_JUNIOR', 'SIFOR_SENIOR',
  'CHEF_PROJET',
]

export const PROFILS = {
  CET:          'Chef d\'Équipe Technique',
  AGENT_GNSS:   'Agent GNSS',
  CE:           'Commissaire-Enquêteur',
  CR:           'Coordonnateur Régional',
  RAF:          'Responsable Administratif',
  SIFOR_JUNIOR: 'SIFOR Junior',
  SIFOR_SENIOR: 'SIFOR Senior',
  CHEF_PROJET:  'Chef de Projet',
}

// Retourne true si le profil de l'utilisateur est dans la liste autorisée
export const can = (user, allowedProfils) => {
  if (!user) return false
  return allowedProfils.includes(user.profil)
}

// Voit les deux zones
export const voidDeuxZones = (user) =>
  can(user, ['SIFOR_SENIOR', 'CHEF_PROJET'])

// Peut générer le PowerPoint CAG
export const peutGenererPPT = (user) =>
  can(user, ['SIFOR_SENIOR', 'CHEF_PROJET'])

// Peut valider un envoi vers SCCARTO / DIGIFOR / SIFOR
export const peutValiderEnvoi = (user) =>
  can(user, ['SIFOR_JUNIOR', 'SIFOR_SENIOR', 'CR', 'CHEF_PROJET'])
