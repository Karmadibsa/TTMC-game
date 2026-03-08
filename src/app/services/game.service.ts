// src/app/services/game.service.ts
import {inject, Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Team } from '../models/team.model';
import {Case, CASE_THEMES, CaseTheme, CaseType} from '../models/case.model';
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
  private showAxelCases = false;
  private boardCasesSubject = new BehaviorSubject<Case[]>([]);
  boardCases$ = this.boardCasesSubject.asObservable();

  constructor() {
    const cases = this.generateThemedSerpentineBoard(this.actualNumberOfCasesOnBoard);
    this.boardConfig.cases = cases;
    this.boardCasesSubject.next(cases);
  }

  getShowAxelCases(): boolean { return this.showAxelCases; }

  setShowAxelCases(show: boolean): void {
    this.showAxelCases = show;
    const cases = this.generateThemedSerpentineBoard(this.actualNumberOfCasesOnBoard);
    this.boardConfig.cases = cases;
    this.boardCasesSubject.next(cases);
  }

  private generateThemedSerpentineBoard(numberOfCases: number): Case[] {
    const cases: Case[] = [];
    const cols = this.boardConfig.numberOfColumns;
    const rowsTotal = this.boardConfig.numberOfRows;

    const intrepideCaseIds: number[] = [5, 12, 19, 26, 33, 39].filter(id => id < numberOfCases);
    // Calcul du nombre de cases normales (hors START, FINAL, INTREPIDE)
    const regularCaseCount = numberOfCases - 2 - intrepideCaseIds.length; // 34 pour un plateau 6x7

    // Pool équilibré de types, mélangé aléatoirement
    const baseTypes: CaseType[] = this.showAxelCases
      ? [CaseType.PLAISIR, CaseType.SCOLAIRE, CaseType.MATURE, CaseType.IMPROBABLE, CaseType.AXEL]
      : [CaseType.PLAISIR, CaseType.SCOLAIRE, CaseType.MATURE, CaseType.IMPROBABLE];

    const pool: CaseType[] = [];
    const fullCycles = Math.floor(regularCaseCount / baseTypes.length);
    const remainder = regularCaseCount % baseTypes.length;
    for (let c = 0; c < fullCycles; c++) pool.push(...baseTypes);
    // Le reste est distribué équitablement (pas toujours les mêmes types)
    const remainderTypes = this.shuffleArray([...baseTypes]).slice(0, remainder);
    pool.push(...remainderTypes);
    const shuffledPool = this.shuffleArray(pool);
    let poolIndex = 0;

    for (let i = 0; i < numberOfCases; i++) {
      const caseId = i;
      let caseType!: CaseType;
      let caseTitle!: string;
      let isSpecialAction = false;
      let directionIndicator: 'left' | 'right' | 'down' | undefined = undefined;

      const row0 = Math.floor(caseId / cols);
      let col0: number;

      if (row0 % 2 === 0) { // Ligne paire: Gauche -> Droite
        col0 = caseId % cols;
      } else { // Ligne impaire: Droite -> Gauche
        col0 = cols - 1 - (caseId % cols);
      }

      // Détermination du type et du titre, EN DONNANT LA PRIORITÉ AUX CASES SPÉCIALES (DÉPART ET FIN)
      if (caseId === 0) {
        caseType = CaseType.START;
        caseTitle = "Départ";
      } else if (caseId === numberOfCases - 1) { // Condition pour la DERNIÈRE case
        caseType = CaseType.FINAL_CHALLENGE;
        caseTitle = "N'hésite pas à gagner";
        directionIndicator = (row0 % 2 === 0) ? 'right' : 'left'; // Ajustement ici
      } else if (intrepideCaseIds.includes(caseId)) {
        caseType = CaseType.INTREPIDE;
        caseTitle = caseType.toString();
        isSpecialAction = true;
      } else { // Cases normales — tirage depuis le pool mélangé
        caseType = shuffledPool[poolIndex++];
        caseTitle = caseType.toString();
      }

      // Gestion des flèches (sauf pour la dernière case, déjà gérée)
      if (caseId < numberOfCases - 1) {
        if (row0 % 2 === 0) { // Ligne paire: Gauche -> Droite
          if (col0 < cols - 1) directionIndicator = 'right';
          else if (row0 < rowsTotal - 1) directionIndicator = 'down';
        } else { // Ligne impaire: Droite -> Gauche
          if (col0 > 0) directionIndicator = 'left';
          else if (row0 < rowsTotal - 1) directionIndicator = 'down';
        }
      }

      //Avant derniere case
      if (caseId === numberOfCases - 2 && directionIndicator === 'down') { // Avant-dernière case
        if (Math.floor((numberOfCases - 1) / cols) === row0) { // Si la dernière case est sur la même ligne
          directionIndicator = (row0 % 2 === 0) ? 'right' : 'left';
        } // Sinon, la flèche 'down' (si applicable) est déjà correcte
      }

      const theme: CaseTheme | undefined = CASE_THEMES[caseType];
      if (!theme) { console.error(`Thème manquant pour ${caseType} (ID: ${caseId}).`); }

      const gridRowStartCSS = row0 + 1;
      const gridColStartCSS = col0 + 1;

      cases.push({
        id: caseId, title: caseTitle, type: caseType,
        theme: theme || CASE_THEMES[CaseType.IMPROBABLE], // Thème de repli
        gridArea: `${gridRowStartCSS} / ${gridColStartCSS} / ${gridRowStartCSS + 1} / ${gridColStartCSS + 1}`,
        isSpecialAction: isSpecialAction, directionIndicator: directionIndicator
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

  private shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  moveTeamToCase(teamId: number, caseId: number): void {
    const maxPosition = this.actualNumberOfCasesOnBoard - 1;
    const newPosition = Math.max(0, Math.min(caseId, maxPosition));
    const currentTeams = this.teamsSubject.getValue();
    let almostWonTeamName: string | null = null;
    const updatedTeams = currentTeams.map(team => {
      if (team.id === teamId) {
        if (newPosition === maxPosition && this.boardConfig.cases[newPosition]?.type === CaseType.FINAL_CHALLENGE) {
          almostWonTeamName = team.name;
        }
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
