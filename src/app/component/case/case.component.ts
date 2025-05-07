// src/app/components/case/case.component.ts
import { Component, Input } from '@angular/core';
import { Case } from '../../models/case.model';
import {NgClass} from '@angular/common';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-case',
  templateUrl: './case.component.html',
  imports: [
    NgClass
  ],
  styleUrls: ['./case.component.scss']
})
export class CaseComponent {
  @Input() caseData!: Case;

  getCaseClasses(): any {
    if (!this.caseData) {
      return {};
    }
    // On récupère le type en chaîne, on le met en minuscule et on remplace espaces et apostrophes par des tirets
    const typeClass = 'case-type-' + this.caseData.type.toLowerCase().replace(/\s|'/g, '-');
    const idClass = 'case-id-' + this.caseData.id;

    return {
      [typeClass]: true,
      [idClass]: true,
      'special-action-case': !!this.caseData.isSpecialAction
    };
  }
}

