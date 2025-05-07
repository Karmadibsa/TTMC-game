import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatIcon} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';

@Component({
  selector: 'app-icon-selector',
  imports: [
    FormsModule,
    MatIcon
  ],
  templateUrl: './icon-selector.component.html',
  styleUrl: './icon-selector.component.scss'
})
export class IconSelectorComponent {
  @Input() selectedIcon: string = 'sports_esports'; // Icône par défaut
  @Output() selectedIconChange = new EventEmitter<string>();

  // Liste d'icônes Material à proposer - N'hésite pas à l'enrichir !
  // Vérifie que ces noms sont exacts (ex: 'sports_esports' et non 'sports_esport')
  icons: string[] = [
    'sports_esports', 'flag', 'emoji_events', 'pets', 'rocket_launch', 'bug_report',
    'build', 'code', 'memory', 'security', 'star', 'favorite', 'anchor', 'construction',
    'explore', 'extension', 'settings', 'thumb_up', 'verified_user', 'flutter_dash'
  ];
}

