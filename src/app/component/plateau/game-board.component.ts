// src/app/components/game-board/game-board.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // Important pour @for, NgStyle, etc. si standalone
import { Subscription } from 'rxjs';

import { GameService } from '../../services/game.service'; // Vérifie ce chemin
import { Team } from '../../models/team.model';         // Vérifie ce chemin
import { Case } from '../../models/case.model';           // Vérifie ce chemin

// Importe les composants enfants s'ils sont standalone
import { TeamControlBarComponent } from '../team-control-bar/team-control-bar.component'; // Vérifie ce chemin
import { PawnComponent } from '../pawn/pawn.component';                 // Vérifie ce chemin
import { CaseComponent } from '../case/case.component';                   // Vérifie ce chemin

@Component({
  selector: 'app-game-board',
  standalone: true, // Important si tu utilises cette approche
  imports: [
    CommonModule, // Pour @for, NgStyle, et d'autres directives communes
    TeamControlBarComponent,
    PawnComponent,
    CaseComponent
  ],
  templateUrl: './game-board.component.html', // Renommé par rapport à './game-board.component.html' de ton code
  styleUrls: ['./game-board.component.scss']  // Renommé par rapport à './game-board.component.scss'
})
export class GameBoardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('boardGridElement') boardGridElement!: ElementRef<HTMLDivElement>;

  cases: Case[] = [];
  teams: Team[] = [];
  boardStyle: any = {}; // Pour [ngStyle] sur board-grid

  private pawnPositions: Map<number, { x: number; y: number }> = new Map();
  private teamsSubscription!: Subscription;
  private isViewInitialized = false;

  constructor(
    private gameService: GameService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const boardConfig = this.gameService.getBoardConfig();
    this.cases = boardConfig.cases;
    // Initialise boardStyle ici, car numberOfColumns/Rows ne devrait pas changer après init
    this.boardStyle = {
      'grid-template-columns': `repeat(${boardConfig.numberOfColumns}, 1fr)`,
      'grid-template-rows': `repeat(${boardConfig.numberOfRows}, 1fr)`,
    };

    this.teamsSubscription = this.gameService.teams$.subscribe(updatedTeams => {
      const oldTeams = [...this.teams]; // Crée une copie pour comparaison
      this.teams = updatedTeams;

      let positionsOrTeamsChanged = updatedTeams.length !== oldTeams.length;
      if (!positionsOrTeamsChanged && updatedTeams.length > 0) {
        for (const newTeam of updatedTeams) {
          const oldTeamInstance = oldTeams.find(ot => ot.id === newTeam.id);
          if (!oldTeamInstance || oldTeamInstance.position !== newTeam.position) {
            positionsOrTeamsChanged = true;
            break;
          }
        }
      }

      if (positionsOrTeamsChanged) {
        if (this.isViewInitialized) {
          this.updateAllPawnPositions();
        } else {
          // Si la vue n'est pas prête, pré-calculer ou attendre ngAfterViewInit
          // Le pré-calcul évite que getPawnPosition ne retourne (0,0) la première fois
          this.precalculatePawnPositionsWithFallback();
        }
      }
      this.cdRef.detectChanges(); // Important pour mettre à jour la vue après des changements asynchrones
    });

    // Initialisation des équipes de démo si aucune n'existe
    if (this.gameService.getTeams().length === 0) {
      this.gameService.addTeam(); // Laisse GameService gérer les noms/couleurs par défaut
      this.gameService.addTeam();
    } else {
      // Si des équipes existent déjà (ex: rechargement de page avec état conservé),
      // s'assurer que leurs positions sont calculées.
      if (!this.isViewInitialized) {
        this.precalculatePawnPositionsWithFallback();
      } else {
        this.updateAllPawnPositions();
      }
    }
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    console.log("[GameBoardComponent] ngAfterViewInit: boardGridElement disponible.");
    this.updateAllPawnPositions(); // Force le recalcul avec le DOM prêt
    this.cdRef.detectChanges(); // Nécessaire car on a modifié des données liées au template après le cycle de vérification standard
  }

  ngOnDestroy(): void {
    if (this.teamsSubscription) {
      this.teamsSubscription.unsubscribe();
    }
  }

  precalculatePawnPositionsWithFallback(): void {
    console.log("[GameBoardComponent] Pré-calcul des positions (méthode de repli).");
    this.teams.forEach(team => {
      this.pawnPositions.set(team.id, this.gameService.calculatePawnPosition(team.position, undefined));
    });
  }

  updateAllPawnPositions(): void {
    if (!this.boardGridElement?.nativeElement && this.teams.length > 0) {
      console.warn("[GameBoardComponent] updateAllPawnPositions: boardGridElement non prêt. Utilisation du repli.");
      this.precalculatePawnPositionsWithFallback(); // Tomber sur le repli si le board n'est pas prêt
      return;
    }
    // console.log("[GameBoardComponent] Mise à jour de toutes les positions (calcul précis)."); // Peut devenir verbeux
    this.teams.forEach(team => {
      this.pawnPositions.set(
        team.id,
        this.gameService.calculatePawnPosition(team.position, this.boardGridElement?.nativeElement)
      );
    });
  }

  getPawnPosition(teamId: number): { x: number; y: number } {
    const pos = this.pawnPositions.get(teamId);
    if (pos) {
      return pos;
    }

    // Si la position n'est pas dans la map (devrait être rare avec la nouvelle logique,
    // mais peut arriver lors du tout premier rendu avant que l'abonnement aux équipes
    // ou ngAfterViewInit n'aient peuplé la map).
    // console.warn(`[GameBoardComponent] Position pour team ${teamId} non trouvée dans la map, calcul à la volée.`);
    const team = this.teams.find(t => t.id === teamId);
    if (team) {
      // Tenter de calculer, en utilisant le repli si boardGridElement n'est pas prêt.
      const calculatedPos = this.gameService.calculatePawnPosition(team.position, this.boardGridElement?.nativeElement);
      // Ne pas mettre à jour la map ici pour éviter des effets de bord dans un getter de template.
      // La map sera mise à jour par les cycles de ngOnInit ou ngAfterViewInit.
      return calculatedPos;
    }
    return { x: -1000, y: -1000 }; // Positionner hors écran si aucune donnée
  }

  // --- Handlers pour TeamControlBarComponent ---
  handleAddNewTeamRequest(): void {
    this.gameService.addTeam();
  }

  handleRemoveTeamRequest(teamId: number): void {
    this.gameService.removeTeam(teamId);
  }

  handleUpdateTeamNameRequest(event: { id: number; name: string }): void {
    this.gameService.updateTeamName(event.id, event.name);
  }

  handleUpdateTeamColorRequest(event: { id: number; color: string }): void {
    this.gameService.updateTeamColor(event.id, event.color);
  }

  handleMoveTeamRequest(event: { teamId: number; steps: number }): void {
    this.gameService.moveTeam(event.teamId, event.steps);
    // Après un mouvement, les positions des pions doivent être mises à jour.
    // L'abonnement à teams$ dans ngOnInit devrait s'en charger,
    // car moveTeam modifie la position dans le GameService, qui émet une nouvelle liste d'équipes.
  }

  handleUpdateTeamIconRequest(event: { id: number; icon: string }): void {
    this.gameService.updateTeamIcon(event.id, event.icon);
  }

  handleResetTeamsRequest(): void {
    this.gameService.resetAllTeams();
  }
}
