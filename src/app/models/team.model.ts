// src/app/interfaces/team.interface.ts

/**
 * Interface représentant une équipe de joueurs.
 */
export interface Team {
  id: number;         // Identifiant unique de l'équipe
  name: string;       // Nom de l'équipe
  color: string;      // Couleur du pion de l'équipe (format hexadécimal, ex: '#FF0000')
  position: number;   // ID de la case actuelle de l'équipe (0 pour la case départ)
  icon: string; // Nouvelle propriété pour l'icône de l'équipe
}
