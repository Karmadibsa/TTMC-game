// src/app/components/team-control-bar/team-control-bar.component.ts
import {Component, Input, Output, EventEmitter, inject} from '@angular/core';
import { CommonModule } from '@angular/common'; // Pour NgFor, NgIf
import { FormsModule } from '@angular/forms';   // Pour [(ngModel)]

import { Team } from '../../models/team.model';
import {LucideAngularModule} from 'lucide-angular';
import {MatIcon} from '@angular/material/icon';
import {SweetAlertService} from '../../service/sweetalert.service';
import {IconSelectorComponent} from '../icon-selector/icon-selector.component'; // Ajuste le chemin

@Component({
  selector: 'app-team-control-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MatIcon, IconSelectorComponent],
  templateUrl: './team-control-bar.component.html',
  styleUrls: ['./team-control-bar.component.scss']
})
export class TeamControlBarComponent {
  @Input() teams: Team[] = [];
  @Input() showAxelCases: boolean = false;

  @Output() addTeamRequest = new EventEmitter<void>();
  @Output() toggleAxelCasesRequest = new EventEmitter<void>();
  @Output() regenerateBoardRequest = new EventEmitter<void>();
  @Output() updateTeamIconRequest = new EventEmitter<{ id: number; icon: string }>();
  @Output() removeTeamRequest = new EventEmitter<number>();
  @Output() updateTeamNameRequest = new EventEmitter<{ id: number; name: string }>();
  @Output() updateTeamColorRequest = new EventEmitter<{ id: number; color: string }>();
  @Output() moveTeamRequest = new EventEmitter<{ teamId: number; steps: number }>();
  @Output() resetTeamsRequest = new EventEmitter<void>();

  showSettingsModal = false;

  // Injection du service SweetAlertService
  private sweetAlertService = inject(SweetAlertService);

  onAddTeam(): void {
    this.addTeamRequest.emit();
  }

  onRemoveTeam(teamId: number, teamName: string): void { // Ajout de teamName pour le message de confirmation
    this.sweetAlertService.confirmAction(
      `Supprimer ${teamName} ?`, // Titre de la confirmation
      `Êtes-vous sûr de vouloir supprimer l'équipe "${teamName}" ? Cette action est irréversible.`, // Texte
      () => { // Action à exécuter si confirmé
        this.removeTeamRequest.emit(teamId);
        // Optionnel: afficher un toast de succès après la suppression
        // this.sweetAlertService.show(`L'équipe "${teamName}" a été supprimée.`, 'success');
      },
      'Oui, supprimer', // Texte du bouton de confirmation
      'Non, annuler'    // Texte du bouton d'annulation
    );
  }

  onMoveTeamStep(teamId: number, steps: number): void {
    this.moveTeamRequest.emit({ teamId: teamId, steps: steps });
  }

  // Nouvelle méthode pour le bouton Reset
  onResetAllTeams(): void {
    this.resetTeamsRequest.emit();
  }

  onTeamIconChange(teamId: number, newIcon: string): void {
    this.updateTeamIconRequest.emit({ id: teamId, icon: newIcon });
  }

  onToggleAxelCases(): void {
    this.toggleAxelCasesRequest.emit();
  }

  onOpenSettings(): void {
    this.showSettingsModal = true;
  }

  onCloseSettings(): void {
    this.showSettingsModal = false;
  }

  onRegenerateBoard(): void {
    this.regenerateBoardRequest.emit();
    this.showSettingsModal = false;
  }
}
