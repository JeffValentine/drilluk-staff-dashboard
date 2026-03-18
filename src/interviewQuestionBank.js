export const INTERVIEW_FORM_FIELDS = [
  { key: 'fullName', label: 'Full name', placeholder: 'Your name', type: 'text', required: true },
  { key: 'discordName', label: 'Discord username', placeholder: 'name#0000 or @name', type: 'text', required: true },
  { key: 'age', label: 'Age', placeholder: '18', type: 'number', required: true },
  { key: 'country', label: 'Where are you from?', placeholder: 'Country / region', type: 'text', required: true },
  { key: 'hoursPerWeek', label: 'Hours per week on Drill UK', placeholder: '20', type: 'number', required: true },
];

export const INTERVIEW_LONG_FIELDS = [
  { key: 'priorBans', label: 'Have you ever been banned before?', placeholder: 'Explain any prior bans or say no.', required: true },
  { key: 'staffExperience', label: 'Previous staff experience', placeholder: 'Where have you staffed before, if anywhere?', required: true },
  { key: 'whyStaff', label: 'Why do you want to join staff?', placeholder: 'Explain why you want the role and what you would bring.', required: true },
  { key: 'whyDrill', label: 'Why Drill UK specifically?', placeholder: 'Why this server and not another one?', required: true },
];

const entryQuestionBank = [
  {
    category: 'Process',
    question: 'What is the safe first step before acting on most incidents?',
    correct: 'Ensure there is an in-city report and enough context before enforcement.',
    wrong: [
      'Teleport first and sort the details out after.',
      'Punish first if the player seems guilty enough.',
      'Wait for someone else to deal with it without checking the report.',
    ],
  },
  {
    category: 'Evidence',
    question: 'What evidence standard should staff ask for in most report reviews?',
    correct: 'A clear clip around the incident plus report context.',
    wrong: [
      'A screenshot with no timeline is always enough.',
      'Only staff testimony matters once a report exists.',
      'Any short clip is valid even if the build-up is missing.',
    ],
  },
  {
    category: 'Rules',
    question: 'What is a core violence rule reminder for trainees?',
    correct: 'No random deathmatch behavior; force must be roleplay-justified.',
    wrong: [
      'Any kill is fine if the player was annoying.',
      'Violence is allowed as long as there are two witnesses.',
      'Gunplay needs no context if both sides are armed.',
    ],
  },
  {
    category: 'RP Standard',
    question: 'Before approving force, what must be verified?',
    correct: 'There was a valid roleplay reason and timeline for the action.',
    wrong: [
      'Whether the player who died has prior warnings.',
      'Whether the attacker is in a gang.',
      'Whether the clip starts after the force already happened.',
    ],
  },
  {
    category: 'Rules',
    question: 'What should staff check after a player death return?',
    correct: 'Whether no-longer-relevant-memory expectations were respected.',
    wrong: [
      'Whether the player came back with a different outfit.',
      'Whether the player returned only after talking in OOC.',
      'Whether the player says they forgot the situation.',
    ],
  },
  {
    category: 'RP Standard',
    question: 'How should FearRP be explained?',
    correct: 'Players should value character life and react realistically to danger.',
    wrong: [
      'Players only need to comply when fully unarmed.',
      'FearRP only matters during police scenes.',
      'FearRP means every gunpoint must end in surrender.',
    ],
  },
  {
    category: 'Abuse',
    question: 'What is powergaming in report terms?',
    correct: 'Forcing outcomes or unrealistic actions that deny fair roleplay response.',
    wrong: [
      'Using a powerful vehicle during a chase.',
      'Winning a report because your clip is clearer.',
      'Talking fast during support scenes.',
    ],
  },
  {
    category: 'Abuse',
    question: 'What should be checked when outside info seems used in-city?',
    correct: 'Whether out-of-character information was used for in-character advantage.',
    wrong: [
      'Whether the players are in the same Discord server.',
      'Whether the suspect has a Twitch account.',
      'Whether the clip contains any local voice at all.',
    ],
  },
  {
    category: 'Enforcement',
    question: 'What is the moderation priority when a player logs during conflict?',
    correct: 'Preserve timeline and evidence first, then apply process consistently.',
    wrong: [
      'Immediately community service them without checking logs.',
      'Ignore the case unless they reconnect within one minute.',
      'Punish only if another player demands it in chat.',
    ],
  },
  {
    category: 'Rules',
    question: 'How should vehicle-based harm incidents be reviewed?',
    correct: 'Verify RP context, intent, and whether it matches server standards.',
    wrong: [
      'Any vehicle hit is automatically valid if the driver says it was accidental.',
      'If there is damage, it is always VDM.',
      'Only the final impact matters, not the build-up.',
    ],
  },
  {
    category: 'Fairness',
    question: 'What principle protects trust in staff decisions?',
    correct: 'Review evidence without favoritism and apply equal standards.',
    wrong: [
      'Back your friends if the case is close.',
      'Prioritize the player with the longer playtime.',
      'Let seniority alone decide the outcome.',
    ],
  },
  {
    category: 'Escalation',
    question: 'When should a second opinion be requested?',
    correct: 'When the case is unclear, high impact, or potentially biased.',
    wrong: [
      'Only after you already issued the punishment.',
      'Only if the reported player asks for one.',
      'Never, because it slows support too much.',
    ],
  },
  {
    category: 'Support',
    question: 'What tone should all support interactions keep?',
    correct: 'Calm, respectful, and clear even when players are frustrated.',
    wrong: [
      'Strict and cold so authority is obvious.',
      'Short and dismissive so cases move faster.',
      'Aggressive when the player is rude first.',
    ],
  },
  {
    category: 'Onboarding',
    question: 'How should new or confused players be helped quickly?',
    correct: 'Direct them to rules, FAQ, keybinds, and commands with clear guidance.',
    wrong: [
      'Tell them to figure it out alone through trial and error.',
      'Only answer if they open a Discord ticket.',
      'Send them to another staff member immediately without helping.',
    ],
  },
  {
    category: 'Rules',
    question: 'What should staff remind players about rule knowledge?',
    correct: 'Not knowing rules is not accepted as a defense.',
    wrong: [
      'Rule ignorance is acceptable for older players.',
      'Rule ignorance removes the need for punishment.',
      'Only gang rules need to be known in advance.',
    ],
  },
  {
    category: 'Evidence',
    question: 'What should be verified first in disputed clips?',
    correct: 'Timeline order, provocations, and context before deciding outcomes.',
    wrong: [
      'Who uploaded the clip fastest.',
      'Who has the higher rank in the city.',
      'Whether the clip was posted in Discord first.',
    ],
  },
  {
    category: 'Enforcement',
    question: 'What matters when choosing the right punishment for a rule break?',
    correct: 'Consistency with existing standards and similar prior cases.',
    wrong: [
      'How frustrated the reporter sounds.',
      'Whether the punished player argues back.',
      'Picking the heaviest option to deter appeals.',
    ],
  },
  {
    category: 'Escalation',
    question: 'What should you do when you are not fully confident in your final verdict?',
    correct: 'Escalate through chain of command and document the handoff clearly.',
    wrong: [
      'Close the case and let another staff member reopen it later.',
      'Issue a punishment anyway so the report is not delayed.',
      'Wait for the players to settle it themselves.',
    ],
  },
];

const coreValueBank = [
  {
    category: 'Core Value',
    question: 'How should staff apply: Respectful with community?',
    correct: 'Keep the server calm, helpful, and professional in every support interaction.',
    wrong: [
      'Only be respectful when players are polite first.',
      'Respect matters more in Discord than in-game reports.',
      'Being blunt is fine as long as the punishment is correct.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: Respectful with staff?',
    correct: 'Support the team-first standard and handle disagreements professionally.',
    wrong: [
      'Challenge staff publicly to establish authority.',
      'Only respect senior staff, not peers or trainees.',
      'Avoid communication so conflict cannot happen.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: Upholds the rules?',
    correct: 'Know the rules well enough to teach them, not just enforce them.',
    wrong: [
      'Only memorize punishments, not the reasoning behind them.',
      'Rely on other staff to explain the rules for you.',
      'Only focus on the rules you personally use most.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: Applies same standards?',
    correct: 'Keep reviews unbiased and fair regardless of who is involved.',
    wrong: [
      'Adjust decisions depending on who reports first.',
      'Use lighter standards on familiar players.',
      'Match the punishment to how annoyed the reporter is.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: Follows chain of command?',
    correct: 'Escalate unclear cases instead of freelancing decisions.',
    wrong: [
      'Only escalate if a player demands a higher staff member.',
      'Skip escalation to keep reports moving faster.',
      'Ask for help only after action has already been taken.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: Monitors trap talk?',
    correct: 'Protect the structured semi-serious environment from needless escalation.',
    wrong: [
      'Ignore trap talk unless it turns into a ticket.',
      'Only intervene when it happens in public Discord channels.',
      'Treat it as harmless if no one reports it immediately.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: Motivated to learn?',
    correct: 'Stay current on server systems and improve beyond basic moderation buttons.',
    wrong: [
      'Learning stops once you pass your first quiz.',
      'Only learn the commands you already use daily.',
      'Wait for promotions before learning more systems.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: Socializes with staff?',
    correct: 'Be a visible and cooperative part of the team rather than isolated.',
    wrong: [
      'Avoid staff interaction so your decisions stay independent.',
      'Only speak to staff during disciplinary matters.',
      'Limit communication to your direct trainer only.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: Shows initiative?',
    correct: 'Know where to point players: rules, FAQ, commands, keybinds, and support.',
    wrong: [
      'Wait for another staff member to take the lead on all issues.',
      'Only help if a player asks the exact right question.',
      'Focus only on punishments, not guidance.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: Completes staff duties?',
    correct: 'Follow through consistently so public support promises are real.',
    wrong: [
      'Close cases quickly even if follow-up is missing.',
      'Only prioritize reports from known players.',
      'Treat duties as optional outside peak hours.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: Educates community members?',
    correct: 'Help players understand rules and expectations clearly.',
    wrong: [
      'Only punish, never explain.',
      'Direct everyone to Discord regardless of context.',
      'Assume players already know enough once they join.',
    ],
  },
  {
    category: 'Core Value',
    question: 'How should staff apply: No recent rule breaks?',
    correct: 'Credibility matters when enforcing standards on others.',
    wrong: [
      'Past rule breaks do not matter for staff trust at all.',
      'Only bans affect staff credibility, not warnings.',
      'Your own behavior is separate from your staff authority.',
    ],
  },
];

function toQuizQuestions(bank) {
  return bank.map((item) => ({
    category: item.category,
    question: item.question,
    options: [item.correct, ...item.wrong],
    answer: 0,
  }));
}

export const INTERVIEW_ENTRY_QUIZ = {
  key: 'public-tmod-entry',
  title: 'T-MOD Entry Quiz',
  description: 'Baseline Drill UK rule handling, support tone, and report review questions for applicants.',
  questions: toQuizQuestions(entryQuestionBank),
  passScore: 80,
};

export const INTERVIEW_CORE_VALUES_QUIZ = {
  key: 'public-tmod-core-values',
  title: 'T-MOD Core Values Quiz',
  description: 'Core behavior and standards expected from a Trial Moderator applicant.',
  questions: toQuizQuestions(coreValueBank),
  passScore: 80,
};
