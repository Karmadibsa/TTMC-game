// src/app/components/game-board/game-board.component.ts
import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild,
  AfterViewInit, ChangeDetectorRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { GameService } from '../../services/game.service';
import { Team } from '../../models/team.model';
import { Case } from '../../models/case.model';

import { TeamControlBarComponent } from '../team-control-bar/team-control-bar.component';
import { PawnComponent } from '../pawn/pawn.component';
import { CaseComponent } from '../case/case.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, TeamControlBarComponent, PawnComponent, CaseComponent],
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('boardGridElement') boardGridElement!: ElementRef<HTMLDivElement>;

  cases: Case[] = [];
  teams: Team[] = [];
  boardStyle: any = {};
  showAxelCases = false;
  boardPathPoints = '';
  boardPathD = '';       // courbe douce (cubique bezier)

  // --- Drag & drop state ---
  draggingTeamId: number | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  // -------------------------

  private pawnPositions: Map<number, { x: number; y: number }> = new Map();
  private teamsSubscription!: Subscription;
  private casesSubscription!: Subscription;
  private isViewInitialized = false;

  // Constantes grille (doit correspondre au CSS)
  private readonly GRID_COLS = 6;
  private readonly GRID_ROWS = 7;
  private readonly GRID_PADDING = 10;
  private readonly GRID_GAP = 8;

  constructor(
    private gameService: GameService,
    private cdRef: ChangeDetectorRef
  ) {}

  @HostListener('window:resize')
  onResize(): void {
    this.updateAllPawnPositions();
    this.computeBoardPath();
    this.cdRef.detectChanges();
  }

  ngOnInit(): void {
    const boardConfig = this.gameService.getBoardConfig();
    this.showAxelCases = this.gameService.getShowAxelCases();
    this.boardStyle = {
      'grid-template-columns': `repeat(${boardConfig.numberOfColumns}, 1fr)`,
      'grid-template-rows': `repeat(${boardConfig.numberOfRows}, 1fr)`,
    };

    this.casesSubscription = this.gameService.boardCases$.subscribe(updatedCases => {
      this.cases = updatedCases;
      if (this.isViewInitialized) {
        this.computeBoardPath();
      }
      this.cdRef.detectChanges();
    });

    this.teamsSubscription = this.gameService.teams$.subscribe(updatedTeams => {
      const oldTeams = [...this.teams];
      this.teams = updatedTeams;

      let positionsOrTeamsChanged = updatedTeams.length !== oldTeams.length;
      if (!positionsOrTeamsChanged && updatedTeams.length > 0) {
        for (const newTeam of updatedTeams) {
          const oldTeam = oldTeams.find(ot => ot.id === newTeam.id);
          if (!oldTeam || oldTeam.position !== newTeam.position) {
            positionsOrTeamsChanged = true;
            break;
          }
        }
      }

      if (positionsOrTeamsChanged) {
        if (this.isViewInitialized) {
          this.updateAllPawnPositions();
        } else {
          this.precalculatePawnPositionsWithFallback();
        }
      }
      this.cdRef.detectChanges();
    });

    if (this.gameService.getTeams().length === 0) {
      this.gameService.addTeam();
      this.gameService.addTeam();
    } else {
      if (!this.isViewInitialized) {
        this.precalculatePawnPositionsWithFallback();
      } else {
        this.updateAllPawnPositions();
      }
    }
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.updateAllPawnPositions();
    this.computeBoardPath();
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.teamsSubscription) this.teamsSubscription.unsubscribe();
    if (this.casesSubscription) this.casesSubscription.unsubscribe();
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  }

  precalculatePawnPositionsWithFallback(): void {
    this.teams.forEach(team => {
      this.pawnPositions.set(team.id, this.gameService.calculatePawnPosition(team.position, undefined));
    });
  }

  updateAllPawnPositions(): void {
    if (!this.boardGridElement?.nativeElement && this.teams.length > 0) {
      this.precalculatePawnPositionsWithFallback();
      return;
    }
    this.teams.forEach(team => {
      this.pawnPositions.set(
        team.id,
        this.gameService.calculatePawnPosition(team.position, this.boardGridElement?.nativeElement)
      );
    });
  }

  // ============================================================
  // Fil d'Ariane SVG — calcul des points reliant les cases
  // ============================================================

  private computeBoardPath(): void {
    const boardEl = this.boardGridElement?.nativeElement;
    if (!boardEl || this.cases.length === 0) return;

    const half = 20; // pion 40px → centre
    const pts: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < this.cases.length; i++) {
      const pos = this.gameService.calculatePawnPosition(i, boardEl);
      if (pos.x === -1000) continue;
      pts.push({ x: Math.round(pos.x + half), y: Math.round(pos.y + half) });
    }

    // Polyline brute (fallback)
    this.boardPathPoints = pts.map(p => `${p.x},${p.y}`).join(' ');

    // Courbe cubique bezier (Catmull-Rom → cubic bezier)
    this.boardPathD = this.catmullRomToBezier(pts, 0.3);

  }

  /** Convertit un tableau de points en chemin SVG cubique bezier lisse (Catmull-Rom). */
  private catmullRomToBezier(pts: Array<{ x: number; y: number }>, tension: number): string {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 2)];
      const p1 = pts[i - 1];
      const p2 = pts[i];
      const p3 = pts[Math.min(pts.length - 1, i + 1)];
      const cp1x = +(p1.x + (p2.x - p0.x) * tension).toFixed(1);
      const cp1y = +(p1.y + (p2.y - p0.y) * tension).toFixed(1);
      const cp2x = +(p2.x - (p3.x - p1.x) * tension).toFixed(1);
      const cp2y = +(p2.y - (p3.y - p1.y) * tension).toFixed(1);
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
    }
    return d;
  }

  // ============================================================
  // Pions — position avec étalement si même case
  // ============================================================

  getPawnPosition(teamId: number): { x: number; y: number } {
    const basePos = this.pawnPositions.get(teamId) ?? { x: -1000, y: -1000 };
    if (basePos.x === -1000) return basePos;

    if (this.draggingTeamId === teamId) return basePos;

    const team = this.teams.find(t => t.id === teamId);
    if (!team) return basePos;

    const teamsAtSamePos = this.teams.filter(t =>
      t.position === team.position && t.id !== this.draggingTeamId
    );
    if (teamsAtSamePos.length <= 1) return basePos;

    const idx = teamsAtSamePos.findIndex(t => t.id === teamId);
    const offset = this.getGroupOffset(idx, teamsAtSamePos.length);
    return { x: basePos.x + offset.x, y: basePos.y + offset.y };
  }

  private getGroupOffset(index: number, total: number): { x: number; y: number } {
    const r = 16;
    if (total === 2) {
      return [{ x: -r, y: 0 }, { x: r, y: 0 }][index] ?? { x: 0, y: 0 };
    }
    if (total === 3) {
      return [
        { x: 0, y: -r },
        { x: -r, y: Math.round(r * 0.6) },
        { x: r,  y: Math.round(r * 0.6) },
      ][index] ?? { x: 0, y: 0 };
    }
    if (total === 4) {
      const h = Math.round(r * 0.7);
      return [
        { x: -h, y: -h }, { x: h, y: -h },
        { x: -h, y:  h }, { x: h, y:  h },
      ][index] ?? { x: 0, y: 0 };
    }
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return {
      x: Math.round(r * Math.cos(angle)),
      y: Math.round(r * Math.sin(angle)),
    };
  }

  // ============================================================
  // Drag & Drop — hit-test par calcul de grille (plus précis)
  // ============================================================

  onPawnMouseDown(event: MouseEvent, teamId: number): void {
    event.preventDefault();
    event.stopPropagation();

    const boardEl = this.boardGridElement?.nativeElement;
    if (!boardEl) return;

    const currentPos = this.pawnPositions.get(teamId);
    if (!currentPos) return;

    this.draggingTeamId = teamId;
    const boardRect = boardEl.getBoundingClientRect();
    this.dragOffsetX = event.clientX - boardRect.left - currentPos.x;
    this.dragOffsetY = event.clientY - boardRect.top - currentPos.y;

    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
    this.cdRef.detectChanges();
  }

  private onDragMove = (event: MouseEvent): void => {
    if (this.draggingTeamId === null) return;
    const boardEl = this.boardGridElement?.nativeElement;
    if (!boardEl) return;

    const boardRect = boardEl.getBoundingClientRect();
    const x = event.clientX - boardRect.left - this.dragOffsetX;
    const y = event.clientY - boardRect.top - this.dragOffsetY;

    this.pawnPositions.set(this.draggingTeamId, { x, y });
    this.cdRef.detectChanges();
  };

  private onDragEnd = (event: MouseEvent): void => {
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);

    if (this.draggingTeamId === null) return;

    const boardEl = this.boardGridElement?.nativeElement;
    const teamId = this.draggingTeamId;
    this.draggingTeamId = null;

    if (boardEl) {
      const boardRect = boardEl.getBoundingClientRect();
      const relX = event.clientX - boardRect.left;
      const relY = event.clientY - boardRect.top;
      const caseId = this.getCaseIdAtGridPoint(relX, relY, boardEl);

      if (caseId !== null) {
        this.gameService.moveTeamToCase(teamId, caseId);
        this.cdRef.detectChanges();
        return;
      }
    }

    // Hors plateau → remettre à la position d'origine
    this.updateAllPawnPositions();
    this.cdRef.detectChanges();
  };

  /**
   * Calcule la case sous le curseur par math de grille — beaucoup plus précis
   * que document.elementsFromPoint qui est trompé par les z-index.
   */
  private getCaseIdAtGridPoint(relX: number, relY: number, boardEl: HTMLElement): number | null {
    const cols = this.GRID_COLS;
    const rows = this.GRID_ROWS;
    const padding = this.GRID_PADDING;
    const gap = this.GRID_GAP;

    const cellW = (boardEl.offsetWidth  - 2 * padding - (cols - 1) * gap) / cols;
    const cellH = (boardEl.offsetHeight - 2 * padding - (rows - 1) * gap) / rows;

    const adjX = relX - padding;
    const adjY = relY - padding;
    if (adjX < 0 || adjY < 0) return null;

    const col = Math.floor(adjX / (cellW + gap)); // 0-based
    const row = Math.floor(adjY / (cellH + gap)); // 0-based
    if (col < 0 || col >= cols || row < 0 || row >= rows) return null;

    // gridArea est au format CSS "row / col / row+1 / col+1" (1-based)
    const cssRow = row + 1;
    const cssCol = col + 1;
    const found = this.cases.find(c => {
      const parts = c.gridArea.split('/').map(s => parseInt(s.trim()));
      return parts[0] === cssRow && parts[1] === cssCol;
    });

    return found?.id ?? null;
  }

  // ============================================================
  // Handlers TeamControlBar
  // ============================================================

  handleAddNewTeamRequest(): void { this.gameService.addTeam(); }
  handleRemoveTeamRequest(teamId: number): void { this.gameService.removeTeam(teamId); }
  handleUpdateTeamNameRequest(event: { id: number; name: string }): void { this.gameService.updateTeamName(event.id, event.name); }
  handleUpdateTeamColorRequest(event: { id: number; color: string }): void { this.gameService.updateTeamColor(event.id, event.color); }
  handleMoveTeamRequest(event: { teamId: number; steps: number }): void { this.gameService.moveTeam(event.teamId, event.steps); }
  handleUpdateTeamIconRequest(event: { id: number; icon: string }): void { this.gameService.updateTeamIcon(event.id, event.icon); }
  handleResetTeamsRequest(): void { this.gameService.resetAllTeams(); }

  handleToggleAxelCasesRequest(): void {
    this.showAxelCases = !this.showAxelCases;
    this.gameService.setShowAxelCases(this.showAxelCases);
  }

  handleRegenerateBoardRequest(): void {
    this.gameService.setShowAxelCases(this.showAxelCases);
  }
}
