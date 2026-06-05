export interface Match {
  id: string;
  date: string; // e.g., 'Today', 'Tomorrow', 'Saturday'
  dateStr: string; // e.g., 'OCT 24, 2024'
  teamA: string;
  teamB: string;
  teamAIcon?: string;
  teamBIcon?: string;
  startsIn?: string;
  kickoff: string;
  status: 'locked' | 'open';
  expectedA?: number; // lock value
  expectedB?: number; // lock value
  userGuessA?: number;
  userGuessB?: number;
  badge?: string; // e.g., 'MAJOR EVENT'
  predictedResult?: string;
}

export interface LeaderboardUser {
  rank: number;
  initials: string;
  email: string;
  badge?: string;
  points: number;
  isCurrentUser?: boolean;
}

export interface Stats {
  upcomingMatches: number;
  pendingGuesses: number;
  accuracyTier: string;
  userPosition: number;
  totalUsers: number;
  correctScores: number;
  correctOutcomes: number;
}
