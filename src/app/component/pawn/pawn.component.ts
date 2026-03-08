// src/app/components/pawn/pawn.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Team } from '../../models/team.model';
import { NgClass, NgStyle } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-pawn',
  templateUrl: './pawn.component.html',
  imports: [NgStyle, NgClass, MatIcon],
  styleUrls: ['./pawn.component.scss']
})
export class PawnComponent implements OnChanges {
  @Input() teamData!: Team;
  @Input() position!: { x: number; y: number };
  @Input() isDragging: boolean = false;

  pawnStyle: any = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['position'] || changes['isDragging'] ||
      (changes['teamData'] &&
        (changes['teamData'].currentValue?.color !== changes['teamData'].previousValue?.color ||
          changes['teamData'].currentValue?.icon !== changes['teamData'].previousValue?.icon)
      )
    ) {
      this.updatePawnStyle();
    }
  }

  private updatePawnStyle(): void {
    if (this.teamData && this.position) {
      this.pawnStyle = {
        'background-color': this.teamData.color,
        'left.px': this.position.x,
        'top.px': this.position.y,
      };
    }
  }
}
