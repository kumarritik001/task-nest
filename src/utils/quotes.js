const criticismQuotes = [
  { text: "You didn't come this far to only come this far. But you're acting like it.", author: "Reality Check" },
  { text: "Your comfort zone is a beautiful place, but nothing ever grows there.", author: "Brutal Truth" },
  { text: "Stop waiting for motivation. Discipline doesn't need it.", author: "Hard Pill" },
  { text: "Every minute you waste is a minute someone else is using to outwork you.", author: "Competition" },
  { text: "You're not tired. You're just used to quitting.", author: "Wake Up" },
  { text: "Dreams don't work unless you do. And you've been slacking.", author: "Mirror Talk" },
  { text: "The gap between where you are and where you want to be is called effort.", author: "Math" },
  { text: "You have the same 24 hours. What's your excuse?", author: "Clock" },
  { text: "Nobody cares about your potential. Show results.", author: "Market" },
  { text: "You're not busy. You're just unfocused.", author: "Honest Hour" },
];

const appreciationQuotes = [
  { text: "You're not just building projects. You're building a career.", author: "Big Picture" },
  { text: "Every line of code, every calculation — it all compounds.", author: "Compound Effect" },
  { text: "You're ahead of 90% of people who just talk about doing it.", author: "Action Gap" },
  { text: "Consistency beats intensity. And you're showing up daily.", author: "Grind" },
  { text: "The fact that you're tracking means you care. That's rare.", author: "Self-Aware" },
  { text: "Chemical engineers don't just mix chemicals. They mix ambition with execution.", author: "Core" },
  { text: "Your future self is thanking you for this discipline.", author: "Time Travel" },
  { text: "Small wins stack up. You're stacking.", author: "Momentum" },
  { text: "You're not behind. You're just on your own timeline.", author: "Perspective" },
  { text: "The world needs more people who actually finish what they start.", author: "Finisher" },
];

export function getCriticismQuote() {
  return criticismQuotes[Math.floor(Math.random() * criticismQuotes.length)];
}

export function getAppreciationQuote() {
  return appreciationQuotes[Math.floor(Math.random() * appreciationQuotes.length)];
}

export function getAllCriticismQuotes() {
  return criticismQuotes;
}

export function getAllAppreciationQuotes() {
  return appreciationQuotes;
}
