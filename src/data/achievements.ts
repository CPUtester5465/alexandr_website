export interface Achievement {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  color: string;
}

export const achievements: Achievement[] = [
  { 
    id: 'math-olympiad',
    title: "Math Olympiad Gold Medal", 
    desc: "First place in regional mathematics competition",
    emoji: "🥇",
    color: "#FFD700" // Gold
  },
  { 
    id: 'science-fair',
    title: "Science Fair Winner", 
    desc: "Best project on renewable energy",
    emoji: "🔬",
    color: "#C0C0C0" // Silver
  },
  { 
    id: 'spelling-bee',
    title: "Spelling Bee Champion", 
    desc: "School district champion 2024",
    emoji: "🐝",
    color: "#CD7F32" // Bronze
  },
  { 
    id: 'chess-tournament',
    title: "Chess Tournament 3rd Place", 
    desc: "Bronze medal in state championship",
    emoji: "♟️",
    color: "#50C878" // Green
  },
  { 
    id: 'coding-competition',
    title: "Coding Competition", 
    desc: "Created an app to help students",
    emoji: "🖥️",
    color: "#6495ED" // Blue
  }
];
