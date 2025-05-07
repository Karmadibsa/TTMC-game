import {Case} from './case.model';

/**
 * Interface pour la configuration globale du plateau.
 */
export interface BoardConfig {
  cases: Case[];
  numberOfColumns: number; // Nombre de colonnes pour le calcul du serpentin
  numberOfRows: number; // Nombre de lignes pour le calcul du serpentin
}
