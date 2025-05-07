// src/app/services/game.service.ts
import {inject, Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Team } from '../models/team.model';
import {Case, CASE_THEMES, CaseShapeType, CaseTheme, CaseType} from '../models/case.model';
import { BoardConfig } from '../models/board.model';
import {SweetAlertService} from '../service/sweetalert.service';


@Injectable({
  providedIn: 'root'
})
export class GameService {
  private sweetAlertService = inject(SweetAlertService);

  private techNouns: string[] = [
    "Le Débugueur", "Le Compilateur", "Le Serveur", "Le Client", "L'API", "Le Framework",
    "La Base de Données", "Le Script", "Le Pixel", "Le Processeur", "Le Cloud", "Le Cookie",
    "Le Firewall", "L'Algorithme", "Le Hacker", "Le Développeur", "Le Routeur", "Le Cache",
    "Le Module", "Le Thread", "La Fonction", "La Variable", "L'Interface", "Le Dépôt",
    "Le Jeton", "Le Binaire", "Le Noyau", "Le Microservice", "Le Conteneur"
  ];
  private techAdjectives: string[] = [
    "Agile", "Réactif", "Asynchrone", "Virtuel", "Encrypté", "Optimisé", "Compilé",
    "Déployé", "Scalable", "Robuste", "Innovant", "Quantique", "Buggé", "OpenSource",
    "Intuitif", "Sécurisé", "Dynamique", "Statique", "Modulaire", "Performant",
    "Connecté", "Full-Stack", "Cyber-Punk", "Futuriste", "Rétro", "Vectoriel",
    "Distribué", "Event-Driven", "Serverless"
  ];
  private defaultTeamIcons: string[] = [
    'sports_esports', 'flag', 'emoji_events', 'pets', 'rocket_launch', 'bug_report',
    'build', 'code', 'memory', 'security', 'star', 'favorite', 'anchor', 'public',
    'explore', 'extension', 'settings', 'thumb_up', 'verified_user', 'flutter_dash'
  ];

  private teamsSubject = new BehaviorSubject<Team[]>([]);
  teams$ = this.teamsSubject.asObservable();
  private usedTeamNames = new Set<string>();

  private readonly boardConfig: BoardConfig = {
    cases: [],
    numberOfColumns: 6,
    numberOfRows: 7,
  };
  // Source de vérité pour le nombre total de cases sur le plateau
  private readonly actualNumberOfCasesOnBoard = this.boardConfig.numberOfColumns * this.boardConfig.numberOfRows;

  private nextTeamId = 1;

  constructor() {
    this.boardConfig.cases = this.generateThemedSerpentineBoard(this.actualNumberOfCasesOnBoard);
  }

  // Assurez-vous que CaseShapeType est bien importé et que Case a une propriété 'shape'
// import { Case, CaseType, CASE_THEMES, CaseTheme, CaseShapeType } from '../interfaces/case.interface';

  private generateThemedSerpentineBoard(numberOfCases: number): Case[] {
    const cases: Case[] = [];
    const cols = this.boardConfig.numberOfColumns; // Nombre de colonnes
    const rowsTotal = this.boardConfig.numberOfRows; // Nombre total de lignes (calculé ou fixe)

    // Votre séquence de types de cases
    const regularCaseTypesSequence: CaseType[] = [
      CaseType.PLAISIR, CaseType.SCOLAIRE, CaseType.MATURE, CaseType.IMPROBABLE,
      CaseType.PLAISIR, CaseType.SCOLAIRE, CaseType.AXEL, CaseType.IMPROBABLE, CaseType.MATURE,
    ];
    const intrepideCaseIds: number[] = [5, 12, 19, 26, 33, 39].filter(id => id < numberOfCases);

    for (let i = 0; i < numberOfCases; i++) {
      const caseId = i; // Utilisation de l'index 0 pour les calculs de position
      let caseType!: CaseType;
      let caseTitle!: string;
      let isSpecialAction = false;
      let shape: CaseShapeType = CaseShapeType.NORMAL; // Initialisation de la forme

      const row0 = Math.floor(caseId / cols); // Ligne 0-indexée
      let col0Logical: number; // Colonne 0-indexée sur la ligne logique (avant serpentin)
      let col0Visual: number;  // Colonne 0-indexée visuelle (après serpentin)

      const isEvenRow = row0 % 2 === 0; // Ligne paire (0, 2, 4...) va de Gauche -> Droite

      if (isEvenRow) { // Ligne paire: Gauche -> Droite
        col0Logical = caseId % cols;
        col0Visual = col0Logical;
      } else { // Ligne impaire: Droite -> Gauche
        col0Logical = caseId % cols;
        col0Visual = cols - 1 - (caseId % cols);
      }

      // Détermination du type et du titre
      if (caseId === 0) {
        caseType = CaseType.START;
        caseTitle = "Départ";
      } else if (caseId === numberOfCases - 1) {
        caseType = CaseType.FINAL_CHALLENGE;
        caseTitle = "N'hésite pas à gagner";
      } else if (intrepideCaseIds.includes(caseId)) {
        caseType = CaseType.INTREPIDE;
        caseTitle = caseType.toString();
        isSpecialAction = true;
      } else {
        const specialCasesBeforeThis = 1 + intrepideCaseIds.filter(id => id < caseId).length;
        const normalCaseIndex = Math.max(0, caseId - specialCasesBeforeThis);
        const sequenceIndex = normalCaseIndex % regularCaseTypesSequence.length;
        caseType = regularCaseTypesSequence[sequenceIndex];
        caseTitle = caseType.toString();
      }

      // --- Détermination de la forme (shape) ---
      const isFirstCaseInRow = col0Logical === 0;
      const isLastCaseInRow = col0Logical === cols - 1;
      const isLastRow = row0 === rowsTotal - 1; // ou Math.floor((numberOfCases -1) / cols)

      if (caseId === 0) { // Toute première case du jeu
        if (numberOfCases === 1) shape = CaseShapeType.NORMAL; // Plateau 1x1
        else shape = CaseShapeType.START_RIGHT; // Commence toujours vers la droite
      } else if (caseId === numberOfCases - 1) { // Toute dernière case du jeu
        if (numberOfCases === 1) shape = CaseShapeType.NORMAL;
        else if (isEvenRow) shape = CaseShapeType.END_RIGHT; // Fin de ligne G->D
        else shape = CaseShapeType.END_LEFT;      // Fin de ligne D->G
      } else { // Cases intermédiaires
        if (isEvenRow) { // Ligne Gauche -> Droite
          if (isFirstCaseInRow) shape = CaseShapeType.START_RIGHT;
          else if (isLastCaseInRow) {
            // Si c'est la fin d'une ligne mais pas la dernière ligne, on ne veut pas de END_RIGHT
            // car elle doit connecter vers le bas (la forme POINTS_RIGHT gère cela visuellement)
            shape = isLastRow ? CaseShapeType.END_RIGHT : CaseShapeType.POINTS_RIGHT;
          }
          else shape = CaseShapeType.POINTS_RIGHT;
        } else { // Ligne Droite -> Gauche
          if (isFirstCaseInRow) shape = CaseShapeType.START_LEFT; // En fait la "fin" visuelle de la progression D->G pour cette ligne
          else if (isLastCaseInRow) {
            // Si c'est la fin d'une ligne (visuellement à droite) mais pas la dernière ligne
            shape = isLastRow ? CaseShapeType.END_LEFT : CaseShapeType.POINTS_LEFT;
          }
          else shape = CaseShapeType.POINTS_LEFT;
        }
      }

      // Correction pour les "coins" où la direction change vers le bas.
      // Une case en fin de ligne (mais pas la dernière du plateau) devrait ressembler à une case intermédiaire
      // pour que la "pointe" s'emboîte avec la case du dessous si elle continue.
      // Cette logique est complexe si on veut des flèches vers le bas. Pour l'emboîtement pur,
      // on peut simplifier: une fin de ligne est toujours END_*, un début de ligne START_*.
      // L'exemple actuel est plus simple: START, POINTS, END.

      // Si la case suivante est sur la ligne du dessous, la case actuelle est une "fin" de sa direction horizontale
      // mais doit visuellement s'emboîter avec le "début" de la case du dessous.
      // La logique de `POINTS_RIGHT` et `POINTS_LEFT` est conçue pour avoir une entaille et une pointe.
      // `END_RIGHT` a une entaille à gauche et un bord droit. `START_RIGHT` a un bord gauche et une pointe à droite.

      // Pour la dernière case d'une ligne qui n'est PAS la dernière ligne du plateau:
      if (!isLastRow && isLastCaseInRow && caseId < numberOfCases -1) {
        if (isEvenRow) { // Fin de ligne G->D, va descendre
          // La case a une pointe à droite (POINTS_RIGHT), la case en dessous aura une entaille à gauche (START_LEFT)
          // Cela ne s'emboîte pas directement.
          // On pourrait vouloir que la case de fin de ligne G->D ait une forme "END_RIGHT"
          // et la case en dessous sur la ligne D->G commence par "START_LEFT".
          // La logique actuelle est:
          // Ligne 1: START_R, POINTS_R, ..., POINTS_R (ou END_R si dernière ligne)
          // Ligne 2: START_L, POINTS_L, ..., POINTS_L (ou END_L si dernière ligne)
          //
          // Cela signifie qu'une case POINTS_RIGHT (entaille G, pointe D) serait suivie par
          // une case START_LEFT (bord D, pointe G). Ils s'emboîtent.
          //
          // Donc, la logique pour isLastCaseInRow est correcte pour l'emboîtement.
          // Si isLastCaseInRow ET isEvenRow -> END_RIGHT
          // Si isLastCaseInRow ET !isEvenRow -> END_LEFT
          // Si isFirstCaseInRow ET isEvenRow -> START_RIGHT
          // Si isFirstCaseInRow ET !isEvenRow -> START_LEFT

          // Réevaluation de la forme pour les fins de ligne qui ne sont pas la fin du plateau
          if (isEvenRow) shape = CaseShapeType.END_RIGHT;
          else shape = CaseShapeType.END_LEFT;

        }
      }
      // Et pour la première case d'une ligne qui n'est PAS la première ligne du plateau
      if (row0 > 0 && isFirstCaseInRow && caseId < numberOfCases -1 ) {
        if (isEvenRow) shape = CaseShapeType.START_RIGHT;
        else shape = CaseShapeType.START_LEFT;
      }

      // S'assurer que la toute première et toute dernière case ont priorité
      if (caseId === 0) {
        if (numberOfCases === 1) shape = CaseShapeType.NORMAL;
        else shape = CaseShapeType.START_RIGHT;
      } else if (caseId === numberOfCases - 1) {
        if (numberOfCases === 1) shape = CaseShapeType.NORMAL;
        else if (isEvenRow) shape = CaseShapeType.END_RIGHT;
        else shape = CaseShapeType.END_LEFT;
      }


      const theme: CaseTheme | undefined = CASE_THEMES[caseType];
      if (!theme) { console.error(`Thème manquant pour ${caseType} (ID: ${caseId}).`); }

      const gridRowStartCSS = row0 + 1;
      const gridColStartCSS = col0Visual + 1; // Utilisation de la colonne visuelle

      cases.push({
        id: caseId + 1, // ID 1-indexé pour la logique externe
        title: caseTitle,
        type: caseType,
        theme: theme || CASE_THEMES[CaseType.IMPROBABLE], // Thème de repli
        gridArea: `${gridRowStartCSS} / ${gridColStartCSS} / ${gridRowStartCSS + 1} / ${gridColStartCSS + 1}`,
        isSpecialAction: isSpecialAction,
        shape: shape, // Assignation de la forme calculée
        // directionIndicator: directionIndicator, // Supprimé car remplacé par 'shape'
      });
    }
    return cases;
  }



  getBoardConfig(): Readonly<BoardConfig> { return this.boardConfig; }
  getTeams(): Team[] { return this.teamsSubject.getValue(); }

  private getRandomTechName(): string {
    let teamName = ""; let attempts = 0;
    const maxAttempts = (this.techNouns.length * this.techAdjectives.length) + 50;
    do {
      const noun = this.techNouns[Math.floor(Math.random() * this.techNouns.length)];
      const adj = this.techAdjectives[Math.floor(Math.random() * this.techAdjectives.length)];
      teamName = `${noun} ${adj}`; attempts++;
    } while (this.usedTeamNames.has(teamName) && attempts < maxAttempts);
    if (this.usedTeamNames.has(teamName)) {
      let count = 1; let fallbackName;
      do { fallbackName = `Équipe ${String.fromCharCode(65 + count)}${count++}`; }
      while (this.usedTeamNames.has(fallbackName) && count < 700); // Limite
      teamName = fallbackName;
    }
    return teamName;
  }
  private getRandomDefaultIcon(): string {
    return this.defaultTeamIcons[Math.floor(Math.random() * this.defaultTeamIcons.length)];
  }

  addTeam(name?: string, color?: string, icon?: string): void {
    const currentTeams = this.teamsSubject.getValue();
    let finalTeamName: string;
    if (name) {
      finalTeamName = name.trim();
      if (!finalTeamName) { this.sweetAlertService.showPopUp('Le nom ne peut être vide.', 'warning'); return; }
      if (this.usedTeamNames.has(finalTeamName) || currentTeams.some(t => t.name === finalTeamName)) {
        this.sweetAlertService.showPopUp(`Nom "${finalTeamName}" déjà pris.`, 'warning'); return;
      }
    } else {
      finalTeamName = this.getRandomTechName();
      while(this.usedTeamNames.has(finalTeamName) || currentTeams.some(t => t.name === finalTeamName)){
        finalTeamName = this.getRandomTechName();
      }
    }
    this.usedTeamNames.add(finalTeamName);
    const teamColor = color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const teamIcon = icon || this.getRandomDefaultIcon();
    const newTeam: Team = {
      id: this.nextTeamId++, name: finalTeamName, color: teamColor, position: 0, icon: teamIcon
    };
    this.teamsSubject.next([...currentTeams, newTeam]);
  }

  removeTeam(teamId: number): void {
    const currentTeams = this.teamsSubject.getValue();
    const teamToRemove = currentTeams.find(team => team.id === teamId);
    if (teamToRemove) this.usedTeamNames.delete(teamToRemove.name);
    this.teamsSubject.next(currentTeams.filter(team => team.id !== teamId));
  }

  updateTeamName(teamId: number, newNameInput: string): void {
    const newName = newNameInput.trim();
    const currentTeams = this.teamsSubject.getValue();
    const teamToUpdate = currentTeams.find(team => team.id === teamId);
    if (!teamToUpdate || teamToUpdate.name === newName) return;
    if (!newName) {
      this.sweetAlertService.showPopUp("Le nom ne peut être vide.", 'warning');
      this.teamsSubject.next([...currentTeams]); return;
    }
    if (currentTeams.some(team => team.id !== teamId && team.name === newName)) {
      this.sweetAlertService.showPopUp(`Nom "${newName}" déjà pris.`, 'warning');
      this.teamsSubject.next([...currentTeams]); return;
    }
    this.usedTeamNames.delete(teamToUpdate.name); this.usedTeamNames.add(newName);
    this.teamsSubject.next(currentTeams.map(t => t.id === teamId ? { ...t, name: newName } : t));
  }

  updateTeamColor(teamId: number, newColor: string): void {
    this.teamsSubject.next(this.teamsSubject.value.map(t => t.id === teamId ? { ...t, color: newColor } : t));
  }
  updateTeamIcon(teamId: number, newIcon: string): void {
    this.teamsSubject.next(this.teamsSubject.value.map(t => t.id === teamId ? { ...t, icon: newIcon } : t));
  }

  moveTeam(teamId: number, steps: number): void {
    const currentTeams = this.teamsSubject.getValue();
    let almostWonTeamName: string | null = null;
    const updatedTeams = currentTeams.map(team => {
      if (team.id === teamId) {
        let newPosition = team.position + steps;
        const maxPosition = this.actualNumberOfCasesOnBoard - 1;
        if (newPosition >= maxPosition) {
          newPosition = maxPosition;
          if (this.boardConfig.cases[newPosition]?.type === CaseType.FINAL_CHALLENGE) {
            almostWonTeamName = team.name;
          }
        } else if (newPosition < 0) { newPosition = 0; }
        return { ...team, position: newPosition };
      }
      return team;
    });
    this.teamsSubject.next(updatedTeams);
    if (almostWonTeamName) {
      this.sweetAlertService.showPopUp(
        `L'équipe ${almostWonTeamName} est sur la case "${CaseType.FINAL_CHALLENGE}" ! Préparez-vous !`,
        'info', 'Défi Final en Vue !'
      );
    }
  }

  // calculatePawnPosition : Garder la version qui FORCE LE REPLI pour l'instant
  // car tu as dit que le serpentin du pion fonctionnait avec.
  calculatePawnPosition(caseId: number, boardElement?: HTMLElement): { x: number; y: number } {
    const targetCase = this.boardConfig.cases.find(c => c.id === caseId);
    if (!targetCase) {
      console.error(`[GS] Case ${caseId} non trouvée pour pion.`);
      return { x: -1000, y: -1000 };
    }

    // TEMPORAIREMENT, ON FORCE LA SOLUTION DE REPLI
    // (Décommente le bloc if(boardElement) ci-dessous pour tester le calcul précis)
    /*
    if (boardElement) {
      const caseSelector = `.case-id-${caseId}`;
      const caseElement = boardElement.querySelector(caseSelector) as HTMLElement;
      if (caseElement) {
        const boardRect = boardElement.getBoundingClientRect();
        const caseRect = caseElement.getBoundingClientRect();
        const pawnSize = 40;
        const x = (caseRect.left - boardRect.left) + (caseRect.width / 2) - (pawnSize / 2);
        const y = (caseRect.top - boardRect.top) + (caseRect.height / 2) - (pawnSize / 2);
        return { x, y };
      }
    }
    */
    // console.log(`[DEBUG] FORCING FALLBACK for caseId ${caseId}`); // Décommente pour vérification

    const cols = this.boardConfig.numberOfColumns;
    const logicalRow = Math.floor(caseId / cols);
    let logicalCol: number;

    if (logicalRow % 2 === 0) { logicalCol = caseId % cols; }
    else { logicalCol = cols - 1 - (caseId % cols); }

    const boardPadding = 10; // **AJUSTE CETTE VALEUR** (padding CSS de ton .board-grid)
    const cellGap = 8;       // **AJUSTE CETTE VALEUR** (gap CSS de ton .board-grid)
    const pawnSize = 40;     // Taille de tes pions

    const approxCellWidth = boardElement?.offsetWidth ? (boardElement.offsetWidth - (2 * boardPadding) - ((cols - 1) * cellGap)) / cols : 90;
    const approxCellHeight = boardElement?.offsetHeight ? (boardElement.offsetHeight - (2 * boardPadding) - ((this.boardConfig.numberOfRows - 1) * cellGap)) / this.boardConfig.numberOfRows : 90;

    const x = boardPadding + (logicalCol * (approxCellWidth + cellGap)) + (approxCellWidth / 2) - (pawnSize / 2);
    const y = boardPadding + (logicalRow * (approxCellHeight + cellGap)) + (approxCellHeight / 2) - (pawnSize / 2);

    return { x, y };
  }

  resetAllTeams(): void {
    this.sweetAlertService.confirmAction(
      'Réinitialiser toutes les équipes ?',
      'Cette action est irréversible.',
      () => {
        this.teamsSubject.next([]);
        this.nextTeamId = 1;
        this.usedTeamNames.clear();
        this.sweetAlertService.show('Toutes les équipes ont été réinitialisées.', 'success', 'Réinitialisation');
      },
      'Oui, réinitialiser',
      'Non, annuler'
    );
  }
}
