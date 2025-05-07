// src/app/interfaces/case.interface.ts

export enum CaseType {
  START = 'Start',
  IMPROBABLE = 'Improbable',
  PLAISIR = 'Plaisir',
  SCOLAIRE = 'Scolaire',
  MATURE = 'Mature',
  INTREPIDE = 'Intrépide',
  AXEL = "Case d'Axel",
  FINAL_CHALLENGE = "N'hésite pas à gagner",
}

export interface CaseTheme {
  background: string; // Au lieu de backgroundColor, on utilise background pour les gradients
  icon?: string;
  textColor?: string;
  titleFontSize?: string; // Pour spécifier la taille de la police du titre
}

export const CASE_THEMES: Record<CaseType, CaseTheme> = {
  [CaseType.START]: {
    // Superpose un léger dégradé sombre pour la lisibilité, puis l'image
    background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("fond_depart.jpg")',
    icon: 'flag',
    textColor: '#FFFFFF', // Texte blanc pour bien contraster avec le fond sombre/image
    titleFontSize: '3em' // Taille de police plus grande pour "Départ"
  },
  [CaseType.IMPROBABLE]: {
    background: 'linear-gradient(rgba(90,50,100,0.6), rgba(50,20,60,0.6)), url("fond_improbable.jpg")',
    icon: 'casino',
    textColor: '#FFFFFF',
    titleFontSize: '1.5em' // Taille standard pour les autres
  },
  [CaseType.PLAISIR]: {
    background: 'url("fond_plaisir.jpg")', // Image seule si elle est déjà bien contrastée
    icon: 'sentiment_very_satisfied',
    textColor: '#000000', // Adapter la couleur du texte à l'image de fond
    titleFontSize: '1.5em'
  },
  [CaseType.SCOLAIRE]: {
    background: 'linear-gradient(rgba(46, 204, 113, 0.7), rgba(39, 174, 96, 0.7)), url("fond_scolaire.jpg")',
    icon: 'school',
    textColor: '#FFFFFF',
    titleFontSize: '1.5em'
  },
  [CaseType.MATURE]: {
    background: 'linear-gradient(rgba(52, 152, 219, 0.7), rgba(41, 128, 185, 0.7)), url("fond_mature.jpg")',
    icon: 'work',
    textColor: '#FFFFFF',
    titleFontSize: '1.5em'
  },
  [CaseType.INTREPIDE]: {
    background: 'linear-gradient(rgba(231, 76, 60, 0.7), rgba(192, 57, 43, 0.7)), url("fond_intrepide.jpg")',
    icon: 'directions_run',
    textColor: '#FFFFFF',
    titleFontSize: '1.5em'
  },
  [CaseType.AXEL]: {
    background: 'linear-gradient(rgba(26, 188, 156, 0.7), rgba(22, 160, 133, 0.7)), url("fond_axel.jpg")',
    icon: 'extension',
    textColor: '#FFFFFF',
    titleFontSize: '1.5em'
  },
  [CaseType.FINAL_CHALLENGE]: {
    background: 'linear-gradient(rgba(193, 116, 21, 0.5), rgba(211, 84, 0, 0.5)), url("fond_final.jpg")',
    icon: 'emoji_events',
    textColor: '#FFFFFF',
    titleFontSize: '1.2em' // Un peu plus grand pour la case finale
  },
};

export interface Case {
  id: number;
  title: string;
  type: CaseType;
  gridArea: string;
  theme: CaseTheme;
  isSpecialAction?: boolean;
  directionIndicator?: 'left' | 'right' | 'up' | 'down';
}
