import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Case } from '../models/case.model';
import { TypeCase } from '../models/team.model';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  getAllCases(): Observable<Case[]> {
    console.log('Requête des cases en cours...');
    return this.http.get<Case[]>(`${this.apiUrl}/cases`).pipe(
      tap(data => console.log('Données des cases reçues:', data)),
      catchError(error => {
        console.error('Erreur lors de la récupération des cases:', error);
        return throwError(() => error);
      })
    );
  }

  getAllTypeCases(): Observable<TypeCase[]> {
    console.log('Requête des types de case en cours...');
    return this.http.get<TypeCase[]>(`${this.apiUrl}/types-case`).pipe(
      tap(data => console.log('Données des types reçues:', data)),
      catchError(error => {
        console.error('Erreur lors de la récupération des types de case:', error);
        return throwError(() => error);
      })
    );
  }
}
