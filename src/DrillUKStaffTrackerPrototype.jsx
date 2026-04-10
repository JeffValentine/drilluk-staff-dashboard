import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Shield, GraduationCap, CheckCircle2, Users, ArrowUpRight, ClipboardList, Star, HelpCircle, ExternalLink, BookOpen, MessageSquareWarning, Gavel, Swords, FileVideo, Radio, LifeBuoy, ShieldAlert, Upload, Trash2, KeyRound, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import ExperimentalStaffQuiz from '@/components/ExperimentalStaffQuiz';
import EmployeeHub from '@/components/EmployeeHub';
import QuizKnowledgeHub from '@/components/QuizKnowledgeHub';
import ManagementHub from '@/components/ManagementHub';
import InterviewHub from '@/components/InterviewHub';
import StaffEssentialsHub from '@/components/StaffEssentialsHub';
import { DEFAULT_INTERVIEW_TEMPLATE, normalizeInterviewTemplate } from '@/interviewQuestionBank';
import { EXPERIMENTAL_QUIZ_QUESTIONS } from '@/experimentalQuizData';

const roles = ['T-MOD', 'MOD', 'S-MOD', 'ADMIN', 'S-ADMIN', 'HEAD-ADMIN'];
const SITE_OWNER_EMAIL = 'justappletje@gmail.com';
const defaultRankDisplayNames = Object.fromEntries(roles.map(role => [role, role]));
const KNOWN_PROFILE_IDENTIFIER_KEYS = ['discord', 'fivem', 'license', 'license2', 'live', 'xbl', 'steam'];
const PROFILE_IDENTIFIER_LABELS = {
  discord: 'Discord',
  fivem: 'FiveM',
  license: 'License',
  license2: 'License 2',
  live: 'Live',
  xbl: 'XBL',
  steam: 'Steam',
};

const drillRosterSeed = [
  { rank: 'Junior Associate', name: 'Begoshi' },
  { rank: 'Junior Associate', name: 'Cailen' },
  { rank: 'Junior Associate', name: 'Frank' },
  { rank: 'Junior Associate', name: 'Jordan Adey' },
  { rank: 'Junior Associate', name: 'Moses' },
  { rank: 'Junior Associate', name: 'Yeemons' },
  { rank: 'Support Officer', name: 'Luke' },
  { rank: 'Support Officer', name: 'Arno' },
  { rank: 'Support Officer', name: 'Anonymous' },
  { rank: 'Senior Support Officer', name: 'Brad' },
  { rank: 'Senior Support Officer', name: 'Xmas' },
  { rank: 'Senior Support Officer', name: 'Bughl' },
  { rank: 'Lead Support Officer', name: 'Tony' },
  { rank: 'Operations Coordinator', name: 'N_orthh' },
  { rank: 'Operations Coordinator', name: 'arr' },
  { rank: 'Senior Operations Coordinator', name: 'BennyB' },
  { rank: 'Team Lead', name: 'Ashton' },
  { rank: 'Team Lead', name: 'Jay Jay' },
  { rank: 'Team Lead', name: 'Scouse' },
];

function formatRosterSeedForInput() {
  return drillRosterSeed
    .map((entry, index) => `${index + 1} ${entry.rank}    ${entry.name}`)
    .join('\n');
}

const baseChecks = {
  'T-MOD': [
    'Report-first enforcement',
    '2-minute clip requirement',
    'No RDM baseline',
    'Valid RP reason checks',
    'NLR awareness',
    'FearRP / value life standard',
    'Powergaming detection',
    'Metagaming awareness',
    'Combat logging handling',
    'VDM / vehicle abuse checks',
    'Mass RDM escalation',
    'Bias-free case review',
    'Second-opinion escalation',
    'Respectful support tone',
    'New-player onboarding flow',
    'Rule ignorance response',
    'Evidence timeline checks',
    'Punishment consistency',
    'Chain-of-command escalation',
  ],
  'MOD': ['Money Logs', 'Death Logs', 'Join Logs', 'Leave Logs', 'Org Join Logs', 'Org Leave Logs', 'Org Create Logs'],
  'S-MOD': ['Conflict Handling', 'Trainer Shadowing', 'Escalation Flow', 'Evidence Review'],
  'ADMIN': ['Case Leadership', 'Complex Reports', 'Staff Coaching', 'Duty Oversight'],
  'S-ADMIN': ['Promotion Review', 'Staff Management', 'Department Standards', 'Performance Audits'],
  'HEAD-ADMIN': ['Final Approval', 'Leadership Review', 'Disciplinary Sign-off', 'Strategy Planning'],
};

const coreValues = [
  'Respectful with community',
  'Respectful with staff',
  'Upholds the rules',
  'Applies same standards',
  'Follows chain of command',
  'Monitors trap talk',
  'Motivated to learn',
  'Socializes with staff',
  'Shows initiative',
  'Completes staff duties',
  'Educates community members',
  'No recent rule breaks',
];

const quickLinks = [
  { label: 'Server Rules', href: 'https://store.drill-uk.com/rules', icon: Gavel },
  { label: 'Commands', href: 'https://store.drill-uk.com/commands', icon: MessageSquareWarning },
  { label: 'FAQ', href: 'https://store.drill-uk.com/faq', icon: BookOpen },
  { label: 'Keybinds', href: 'https://store.drill-uk.com/keybinds', icon: Radio },
  { label: 'Meet The Team', href: 'https://store.drill-uk.com/meettheteam', icon: Users },
  { label: 'Discord', href: 'https://discord.com', icon: LifeBuoy },
];

const siteSignals = [
  {
    title: 'Season 2 awareness',
    text: 'Staff should understand the current gameplay loop: crafting, house robberies, structured heists, redzone arena matches, and skill trees.',
  },
  {
    title: 'Support expectation',
    text: 'The public site pushes 24/7 support and fast help, so staff training should reinforce responsiveness and clarity in reports and tickets.',
  },
  {
    title: 'Community standard',
    text: 'The site brand leans hard into long-term characters, structured gameplay, family values, and stability. Staff should protect that tone consistently.',
  },
  {
    title: 'Public-facing staff image',
    text: 'The Meet the Team page gives staff a visible identity, so internal tracking should also log strengths, coaching areas, and role readiness cleanly.',
  },
];

const ruleQuizMap = {
  'Bring Player': {
    question: 'When is using Bring Player appropriate?',
    answer: 'After a player has been reported and you have checked what they are doing. Bring player is only to be used if and when you know what a player is doing.',
    category: 'Permissions',
  },
  'Community Service (Offline)': {
    question: 'When is comminity service ofline to be used?',
    answer: 'When a player is ofline and you have enough evidence to support the sanction. It should be used consistently with similar cases and explained clearly to the player.',
    category: 'Reports',
  },
  'Community Service (Online)': {
    question: 'What are the steps of serving someone online community service?',
    answer: 'Explain the reason for the sanction clearly to the player, apply the appropriate duration based on server standards, and ensure the player understands how to complete the service.',
    category: 'Reports',
  },
  'Freeze Player': {
    question: 'How should Freeze Player be used safely?',
    answer: 'Only to stabilize live moderation situations. Never as punishment or for personal disputes.',
    category: 'Permissions',
  },
  'Kick': {
    question: 'What must come before kicking a player?',
    answer: 'A documented reason tied to policy and a proportional action path.',
    category: 'Enforcement',
  },
  'Player Info': {
    question: 'What is the do/don\'t for Player Info?',
    answer: 'Do use it for active case context. Do not access personal info out of curiosity.',
    category: 'Permissions',
  },
  'Revive': {
    question: 'When should a staff revive be approved?',
    answer: 'Only when server policy and evidence context support intervention. or by the events team',
    category: 'Permissions',
  },
  'Saved Locations': {
    question: 'When are saved locations useful?',
    answer: 'So when someone is stuck or you need to get to a passive location quickly for support. They should not be used for non-staff purposes.',
    category: 'Training',
  },
  'Teleport Marker': {
    question: 'What is the correct use of Teleport Marker?',
    answer: 'To get to specific locations quickly for support purposes.',
    category: 'Permissions',
  },
  'Teleport To Player': {
    question: 'What is the do/don\'t for Teleport To Player?',
    answer: 'Do use it for moderation and support. Don\'t use it to interfere with RP without reason.',
    category: 'Permissions',
  },
  'Death Logs': {
    question: 'What evidence standard should staff ask for in reports?',
    answer: 'A 2-minute clip tied to the reported incident. Logs is there to support after a clip',
    category: 'Evidence',
  },
  'Leave Logs': {
    question: 'What is leave logs used for?',
    answer: 'Judging whether or not someone is to be offline community served.',
    category: 'Review',
  },
  'Conflict Handling': {
    question: 'How should disputes be reviewed?',
    answer: 'With fairness, multiple opinions when needed, and evidence rather than emotion.',
    category: 'Leadership',
  },
  'Trainer Shadowing': {
    question: 'What should a trainer actively teach besides buttons?',
    answer: 'Rules knowledge, support tone, evidence standards, and how to use official Drill UK resources.',
    category: 'Coaching',
  },
  'Escalation Flow': {
    question: 'When a case is unclear, what is the safer route?',
    answer: 'Escalate and get another opinion rather than rushing a biased decision.',
    category: 'Escalation',
  },
  'Evidence Review': {
    question: 'What is the core evidence baseline for player reports?',
    answer: 'A /report supported by a 2-minute incident clip.',
    category: 'Evidence',
  },
  'Case Leadership': {
    question: 'What should leaders preserve in moderation outcomes?',
    answer: 'Consistency, fairness, and the server identity of structured semi-serious roleplay.',
    category: 'Leadership',
  },
  'Complex Reports': {
    question: 'What is a reliable first filter for a complex report?',
    answer: 'Check whether the report exists, whether the clip exists, and whether there was valid RP reason for force.',
    category: 'Process',
  },
  'Staff Coaching': {
    question: 'What message should senior staff reinforce to trainees?',
    answer: 'Be respectful, know the rules, stay unbiased, and help players through official resources.',
    category: 'Coaching',
  },
  'Duty Oversight': {
    question: 'Why should admin understand public-facing pages too?',
    answer: 'Because the website sets player expectations for support, professionalism, and community tone.',
    category: 'Operations',
  },
  'Promotion Review': {
    question: 'What should promotion decisions consider beyond checkbox completion?',
    answer: 'How well the staff member reflects Drill UK standards, fairness, support quality, and rule knowledge.',
    category: 'Promotions',
  },
  'Staff Management': {
    question: 'What should management track in a better system?',
    answer: 'Readiness, coaching notes, rule understanding, support quality, and progression history.',
    category: 'Management',
  },
  'Department Standards': {
    question: 'What is the clearest standards baseline from the rules page?',
    answer: 'Staff final say, report-based action, fair reviews, and no tolerance for rule ignorance.',
    category: 'Standards',
  },
  'Performance Audits': {
    question: 'What public promise should audits compare against?',
    answer: 'Consistent support, fast help, and a stable structured city experience.',
    category: 'Quality',
  },
  'Final Approval': {
    question: 'What should final approval protect above all?',
    answer: 'Fairness, consistency, and the core Drill UK server identity.',
    category: 'Approval',
  },
  'Leadership Review': {
    question: 'What public-facing staff lesson comes from the team page?',
    answer: 'Leadership is visible, so staff culture and role progression should be deliberate and polished.',
    category: 'Leadership',
  },
  'Disciplinary Sign-off': {
    question: 'What should sign-off never ignore?',
    answer: 'Evidence, process, and whether the decision matches written standards.',
    category: 'Discipline',
  },
  'Strategy Planning': {
    question: 'What should future staff tooling support?',
    answer: 'Training, coaching, resource links, evidence standards, and progression across every Drill UK rank.',
    category: 'Planning',
  },
};

const extraRuleQuizMap = {
  'Report-first enforcement': {
    question: 'What is the safe first step before acting on most incidents?',
    answer: 'Ensure there is an in-city report and enough context before enforcement.',
    category: 'Process',
  },
  '2-minute clip requirement': {
    question: 'What evidence standard should staff ask for in most report reviews?',
    answer: 'A clear clip around the incident (commonly 2 minutes) plus report context.',
    category: 'Evidence',
  },
  'No RDM baseline': {
    question: 'What is a core violence rule reminder for trainees?',
    answer: 'No random deathmatch behavior; force must be roleplay-justified.',
    category: 'Rules',
  },
  'Valid RP reason checks': {
    question: 'Before approving force, what must be verified?',
    answer: 'There was a valid roleplay reason and timeline for the action.',
    category: 'RP Standard',
  },
  'NLR awareness': {
    question: 'What should staff check after a player death return?',
    answer: 'Whether no-longer-relevant-memory expectations were respected.',
    category: 'Rules',
  },
  'FearRP / value life standard': {
    question: 'How should trainees explain FearRP quickly?',
    answer: 'Players should value character life and react realistically to danger.',
    category: 'RP Standard',
  },
  'Powergaming detection': {
    question: 'What is powergaming in report terms?',
    answer: 'Forcing outcomes or unrealistic actions that deny fair roleplay response.',
    category: 'Abuse',
  },
  'Metagaming awareness': {
    question: 'What should be checked when outside info seems used in-city?',
    answer: 'Whether out-of-character information was used for in-character advantage.',
    category: 'Abuse',
  },
  'Combat logging handling': {
    question: 'What is the moderation priority when a player logs during conflict?',
    answer: 'Preserve timeline/evidence first, then apply process consistently.',
    category: 'Enforcement',
  },
  'VDM / vehicle abuse checks': {
    question: 'How should vehicle-based harm incidents be reviewed?',
    answer: 'Verify RP context, intent, and whether it matches server standards.',
    category: 'Rules',
  },
  'Mass RDM escalation': {
    question: 'What should staff do on larger multi-player violence incidents?',
    answer: 'Escalate early, gather evidence, and avoid solo rushed judgment.',
    category: 'Escalation',
  },
  'Bias-free case review': {
    question: 'What principle protects trust in staff decisions?',
    answer: 'Review evidence without favoritism and apply equal standards.',
    category: 'Fairness',
  },
  'Second-opinion escalation': {
    question: 'When should a second opinion be requested?',
    answer: 'When the case is unclear, high impact, or potentially biased.',
    category: 'Escalation',
  },
  'Respectful support tone': {
    question: 'What tone should all support interactions keep?',
    answer: 'Calm, respectful, and clear even when players are frustrated.',
    category: 'Support',
  },
  'New-player onboarding flow': {
    question: 'How should confused players be helped quickly?',
    answer: 'Direct them to rules, FAQ, keybinds, and commands with clear guidance.',
    category: 'Onboarding',
  },
  'Rule ignorance response': {
    question: 'What should staff remind players about rule knowledge?',
    answer: 'Not knowing rules is not accepted as a defense.',
    category: 'Rules',
  },
  'Evidence timeline checks': {
    question: 'What should be verified first in disputed clips?',
    answer: 'Timeline order, provocations, and context before deciding outcomes.',
    category: 'Evidence',
  },
  'Punishment consistency': {
    question: 'What matters when choosing an action level?',
    answer: 'Consistency with existing standards and similar prior cases.',
    category: 'Enforcement',
  },
  'Chain-of-command escalation': {
    question: 'When a case exceeds your confidence, what is correct?',
    answer: 'Escalate through chain of command and document the handoff clearly.',
    category: 'Escalation',
  },
};

const permissionActions = [
  'Bring Player',
  'Teleport To Player',
  'Teleport Marker',
  'Freeze Player',
  'Revive',
  'Kick',
  'Player Info',
  'Community Service (Offline)',
  'Community Service (Online)',
  'Saved Locations',
  'Money Logs',
  'Death Logs',
];

const permissionQuizMap = {
  'Bring Player': {
    question: 'Do: bring only when needed for active moderation context.',
    answer: "Don't use brings for convenience or personal disputes.",
    category: 'Permissions',
  },
  'Teleport To Player': {
    question: 'Do: teleport discreetly for evidence review or support.',
    answer: "Don't disrupt live roleplay without moderation cause.",
    category: 'Permissions',
  },
  'Teleport Marker': {
    question: 'Do: use marker teleport for quick support and routing.',
    answer: "Don't skip communication when moving into active incidents.",
    category: 'Permissions',
  },
  'Freeze Player': {
    question: 'Do: freeze to stabilize a situation safely.',
    answer: "Don't freeze as punishment or intimidation.",
    category: 'Permissions',
  },
  'Revive': {
    question: 'Do: revive when policy permits and context is verified.',
    answer: "Don't bypass RP outcomes without proper review.",
    category: 'Permissions',
  },
  'Kick': {
    question: 'Do: kick with clear documented reason tied to standards.',
    answer: "Don't kick emotionally or without log notes.",
    category: 'Permissions',
  },
  'Player Info': {
    question: 'Do: use player info strictly for case handling.',
    answer: "Don't access info out of curiosity.",
    category: 'Permissions',
  },
  'Community Service (Offline)': {
    question: 'Do: apply sanctions consistently with evidence.',
    answer: "Don't over-penalize when severity doesn't match.",
    category: 'Permissions',
  },
  'Community Service (Online)': {
    question: 'Do: explain sanction reason clearly to player.',
    answer: "Don't leave a sanction unexplained.",
    category: 'Permissions',
  },
  'Saved Locations': {
    question: 'Do: use saved locations to improve support speed.',
    answer: "Don't use location tools for non-staff purposes.",
    category: 'Permissions',
  },
  'Money Logs': {
    question: 'Do: use logs for evidence-led investigation only.',
    answer: "Don't treat logs as proof without context.",
    category: 'Logs',
  },
  'Death Logs': {
    question: 'Do: corroborate death logs with clip and timeline.',
    answer: "Don't issue action from a single data point.",
    category: 'Logs',
  },
};

const allRuleQuizMap = { ...ruleQuizMap, ...extraRuleQuizMap };

function makeRoleChecks(role, overrides = {}) {
  return Object.fromEntries((baseChecks[role] || []).map(item => [item, Boolean(overrides[item])]));
}

function makePermissionChecks(overrides = {}) {
  return Object.fromEntries(permissionActions.map(item => [item, Boolean(overrides[item])]));
}

const valueGuidance = {
  'Respectful with community': 'Matches the public-facing expectation that staff keep the server calm and helpful.',
  'Respectful with staff': 'Supports the team-first, family-value tone shown on the site.',
  'Upholds the rules': 'Staff should know the rules well enough to teach them, not just enforce them.',
  'Applies same standards': 'Reviewed situations should stay unbiased and fair.',
  'Follows chain of command': 'Escalate unclear cases instead of freelancing decisions.',
  'Monitors trap talk': 'Protect the structured semi-serious environment from needless escalation.',
  'Motivated to learn': 'Season 2 systems mean staff need current gameplay awareness, not just moderation tools.',
  'Socializes with staff': 'Meet the Team shows staff are visible and community-facing, not faceless admins.',
  'Shows initiative': 'Knows where to point players: rules, FAQ, commands, keybinds, support.',
  'Completes staff duties': 'Public support promises only work if the team follows through consistently.',
  'Educates community members': 'Good staff help players understand rules and expectations clearly.',
  'No recent rule breaks': 'Credibility matters when enforcing standards.',
};

function buildDefaultCheckboxCatalog() {
  const roleItems = roles.flatMap(role =>
    (baseChecks[role] || []).map(title => ({
      id: `role-${role}-${title}`,
      category: 'role',
      role,
      title,
      question: (allRuleQuizMap[title]?.question || ''),
      answer: (allRuleQuizMap[title]?.answer || ''),
    }))
  );

  const coreItems = coreValues.map(title => ({
    id: `core-${title}`,
    category: 'core',
    role: '',
    title,
    question: `How should staff apply: ${title}?`,
    answer: valueGuidance[title] || '',
  }));

  const permissionItems = permissionActions.map(title => ({
    id: `perm-${title}`,
    category: 'permission',
    role: '',
    title,
    question: permissionQuizMap[title]?.question || '',
    answer: permissionQuizMap[title]?.answer || '',
  }));

  return [...roleItems, ...coreItems, ...permissionItems];
}

const teamCardShowcase = [
  {
    name: 'Malia',
    role: 'T-MOD',
    rarity: 'Rare',
    cardArt: '/assets/cards/malia-card.webp',
    stats: { support: 82, reviews: 74, leadership: 67 },
  },
  {
    name: 'MB',
    role: 'ADMIN',
    rarity: 'Legendary',
    cardArt: '/assets/cards/mb-card.webp',
    stats: { support: 91, reviews: 95, leadership: 93 },
  },
  {
    name: 'Loco',
    role: 'MOD',
    rarity: 'Epic',
    cardArt: '/assets/cards/loco-card.webp',
    stats: { support: 88, reviews: 90, leadership: 84 },
  },
];

const initialStaff = [
  {
    id: 1,
    name: 'Malia',
    role: 'T-MOD',
    trainer: 'MB',
    profileImage: '/assets/cards/malia-card.webp',
    status: 'In Training',
    strongSides: 'Strong player communication and calm responses in reports',
    attentionPoints: 'Needs quicker escalation on edge-case incidents',
    signedOff: false,
    staffSince: '2026-02-11',
    modSince: 'N/A',
    promotion: 'MOD',
    checks: makeRoleChecks('T-MOD', {
      'Bring Player': true,
      'Community Service (Offline)': true,
      'Community Service (Online)': true,
      'Freeze Player': true,
      'Kick': true,
      'Player Info': true,
      'Revive': true,
      'Teleport To Player': true,
      'Report-first enforcement': true,
      '2-minute clip requirement': true,
      'No RDM baseline': true,
      'Valid RP reason checks': true,
      'Bias-free case review': true,
      'Respectful support tone': true,
      'Rule ignorance response': true,
    }),
    permissions: makePermissionChecks({
      'Bring Player': true,
      'Teleport To Player': true,
      'Freeze Player': true,
      'Revive': true,
      'Kick': true,
      'Player Info': true,
    }),
    values: {
      'Respectful with community': true,
      'Respectful with staff': true,
      'Upholds the rules': true,
      'Applies same standards': true,
      'Follows chain of command': true,
      'Monitors trap talk': true,
      'Motivated to learn': true,
      'Socializes with staff': true,
      'Shows initiative': true,
      'Completes staff duties': true,
      'Educates community members': true,
      'No recent rule breaks': true,
    },
    disciplinary: { warnings: 0, actions: 0, logs: [] },
    notes: 'Made-up sample stats: Support 82, Reviews 74, Leadership 67.',
  },
  {
    id: 2,
    name: 'MB',
    role: 'ADMIN',
    trainer: 'Head Team',
    profileImage: '/assets/cards/mb-card.webp',
    status: 'Active',
    strongSides: 'Consistent command decisions and clear coaching standards',
    attentionPoints: 'Can delegate more follow-up reviews to senior moderators',
    signedOff: true,
    staffSince: '2025-04-20',
    modSince: '2025-05-16',
    promotion: 'S-ADMIN',
    checks: makeRoleChecks('ADMIN', {
      'Case Leadership': true,
      'Complex Reports': true,
      'Staff Coaching': true,
      'Duty Oversight': true,
    }),
    permissions: makePermissionChecks(Object.fromEntries(permissionActions.map(item => [item, true]))),
    values: Object.fromEntries(coreValues.map(v => [v, true])),
    disciplinary: { warnings: 0, actions: 0, logs: [] },
    notes: 'Made-up sample stats: Support 91, Reviews 95, Leadership 93.',
  },
  {
    id: 3,
    name: 'Loco',
    role: 'MOD',
    trainer: 'MB',
    profileImage: '/assets/cards/loco-card.webp',
    status: 'Reviewing Others',
    strongSides: 'Fast triage of reports and strong fairness in decisions',
    attentionPoints: 'Could document case outcomes with more detail',
    signedOff: true,
    staffSince: '2025-09-14',
    modSince: '2025-10-01',
    promotion: 'S-MOD',
    checks: makeRoleChecks('MOD', {
      'Money Logs': true,
      'Death Logs': true,
      'Join Logs': true,
      'Leave Logs': true,
      'Org Join Logs': true,
      'Org Leave Logs': false,
      'Org Create Logs': true,
    }),
    permissions: makePermissionChecks({
      'Bring Player': true,
      'Teleport To Player': true,
      'Teleport Marker': true,
      'Freeze Player': true,
      'Revive': true,
      'Kick': true,
      'Player Info': true,
      'Community Service (Offline)': true,
      'Community Service (Online)': true,
      'Saved Locations': true,
      'Money Logs': true,
      'Death Logs': true,
    }),
    values: {
      ...Object.fromEntries(coreValues.map(v => [v, true])),
      'No recent rule breaks': true,
    },
    disciplinary: { warnings: 1, actions: 0, logs: [{ id: 1, type: 'Warning', reason: 'Late report closure without escalation note.', issuer: 'Head Team', date: '2026-02-28' }] },
    notes: 'Made-up sample stats: Support 88, Reviews 90, Leadership 84.',
  },
];

function normalizeReviewStatus(status) {
  if (status === 'reviewed' || status === 'approved') return 'approved';
  if (status === 'failed_review' || status === 'needs_retake') return 'needs_retake';
  return 'pending';
}

function toDatabaseReviewStatus(status) {
  if (status === 'approved') return 'reviewed';
  if (status === 'needs_retake') return 'failed_review';
  return 'pending';
}

function buildReviewSummary(requiredDefinitions, member, getProgress, getAttemptSummary) {
  if (!member) {
    return { total: 0, completed: 0, approved: 0, pending: 0, retake: 0, readiness: 0 };
  }
  const summaries = requiredDefinitions.map(definition => {
    const progress = getProgress(definition, member);
    const attemptSummary = getAttemptSummary(member, definition.key);
    const reviewStatus = normalizeReviewStatus(attemptSummary.latest?.reviewStatus);
    return {
      key: definition.key,
      progressPercent: progress.percent,
      passed: Boolean(attemptSummary.latest?.passed),
      reviewStatus,
    };
  });
  const completed = summaries.filter(item => item.progressPercent >= 100).length;
  const approved = summaries.filter(item => item.reviewStatus === 'approved').length;
  const pending = summaries.filter(item => item.passed && item.reviewStatus === 'pending').length;
  const retake = summaries.filter(item => item.reviewStatus === 'needs_retake').length;
  const readiness = summaries.length
    ? Math.round(summaries.reduce((sum, item) => sum + item.progressPercent, 0) / summaries.length)
    : 0;
  return {
    total: summaries.length,
    completed,
    approved,
    pending,
    retake,
    readiness,
  };
}

function getTrainingRecommendation(member, summary) {
  if (!member) return 'Select a staff member to review their current training state.';
  if (!summary.total) return 'assign baseline quizzes to ' + member.name + ' before planning promotion.';
  if (summary.retake > 0) return 'coach ' + member.name + ' on failed quiz areas and assign a retake.';
  if (summary.pending > 0) return 'review ' + member.name + "'s pending quiz attempts before progressing them.";
  if (summary.approved < summary.total) return 'approve ' + member.name + "'s completed quiz attempts or add trainer notes.";
  if (!member.signedOff) return 'sign off ' + member.name + ' once coaching notes are complete.';
  return 'review ' + member.name + ' for ' + member.promotion + '.';
}

function statusColor(status) {
  if (status === 'Active') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (status === 'Reviewing Others') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  return 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30';
}

function roleColor(role) {
  if (role === 'T-MOD') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  if (role === 'MOD') return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
  if (role === 'S-MOD') return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
  if (role === 'ADMIN') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  if (role === 'S-ADMIN') return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
  return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
}

function nameSizeClass(name = '') {
  if (name.length > 20) return 'text-xs';
  if (name.length > 14) return 'text-sm';
  return 'text-lg';
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function startOfCurrentWeek(date = new Date()) {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() + diff);
  return value;
}

function isOnOrAfterDate(iso, cutoff) {
  if (!iso) return false;
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return false;
  return value.getTime() >= cutoff.getTime();
}

function formatLastSeen(iso) {
  if (!iso) return 'Unknown';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function parseRankScope(roleValue) {
  if (!roleValue) return [];
  const aliasMap = {
    TMOD: 'T-MOD',
    'T MOD': 'T-MOD',
    SMOD: 'S-MOD',
    'S MOD': 'S-MOD',
    SADMIN: 'S-ADMIN',
    'S ADMIN': 'S-ADMIN',
    HEADADMIN: 'HEAD-ADMIN',
    'HEAD ADMIN': 'HEAD-ADMIN',
  };
  const normalize = (raw) => {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return '';
    const upper = trimmed.toUpperCase().replace(/[_-]/g, ' ');
    const collapsed = upper.replace(/\s+/g, ' ').trim();
    if (roles.includes(collapsed.replace(/ /g, '-'))) return collapsed.replace(/ /g, '-');
    if (aliasMap[collapsed]) return aliasMap[collapsed];
    return trimmed.toUpperCase();
  };

  return String(roleValue)
    .split(',')
    .map(v => normalize(v))
    .filter(Boolean);
}

function sortRankScope(ranks = []) {
  const roleOrder = new Map(roles.map((role, index) => [role, index]));
  return [...new Set(ranks)].sort((a, b) => {
    const aIndex = roleOrder.get(a) ?? 999;
    const bIndex = roleOrder.get(b) ?? 999;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.localeCompare(b);
  });
}

function serializeRankScope(ranks) {
  return (ranks || []).filter(Boolean).join(',');
}

function parseAnswerList(answer) {
  if (!answer) return [''];
  const lines = String(answer)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  return lines.length ? lines : [''];
}

function parseQuizPayload(answerValue) {
  if (!answerValue) return { correct: [], wrong: [], bracket: null, manual: false };
  const raw = String(answerValue).trim();
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      return {
        correct: Array.isArray(parsed.correct) ? parsed.correct : [],
        wrong: Array.isArray(parsed.wrong) ? parsed.wrong : [],
        bracket: typeof parsed.bracket === 'string' ? parsed.bracket : null,
        manual: Boolean(parsed.manual),
      };
    } catch {
      return { correct: parseAnswerList(answerValue), wrong: [], bracket: null, manual: false };
    }
  }
  return { correct: parseAnswerList(answerValue), wrong: [], bracket: null, manual: false };
}

function buildQuizPayload(correctAnswers, wrongAnswers, bracket = null, manual = false) {
  return JSON.stringify({
    correct: (correctAnswers || []).map(v => v.trim()).filter(Boolean),
    wrong: (wrongAnswers || []).map(v => v.trim()).filter(Boolean),
    bracket: bracket || null,
    manual: Boolean(manual),
  });
}

const RULE_FALSE_OPTION_BANKS = [
  {
    tag: 'Evidence / Clip Standard',
    keys: ['2-minute clip', '2 minute clip', 'clip requirement', 'evidence standard', '/report with a clip', 'report reviews'],
    wrong: [
      'A written explanation is enough without clip context.',
      'Any old clip is valid even if it does not cover the incident window.',
      'Evidence is optional when both players agree on the outcome.',
    ],
  },
  {
    tag: 'RDM / Initiation',
    keys: ['rdm', 'random deathmatch', 'initiation', 'threats/demands', 'valid rp reason', 'revenge rdm'],
    wrong: [
      'Force is allowed without RP initiation if tensions are high.',
      'Revenge RDM is fine if you were attacked first.',
      'You can skip threats/demands before killing in fast situations.',
    ],
  },
  {
    tag: 'TOS / Hate Speech',
    keys: ['racial', 'homophobic', 'transphobic', 'disabilities', 'hate speech', 'slurs'],
    wrong: [
      'Slurs are allowed if players claim it is roleplay banter.',
      'Identity-based insults only matter if someone clips it.',
      'Disability remarks are acceptable if no direct threat is made.',
    ],
  },
  {
    tag: 'EMS Protection',
    keys: ['ems', 'no crimes against ems', 'ambulance', 'medical'],
    wrong: [
      'EMS can be robbed if they are alone and off duty.',
      'Stealing EMS vehicles is allowed during active chases.',
      'Kidnapping EMS is acceptable if no one is revived yet.',
    ],
  },
  {
    tag: 'NLR / New Life Rule',
    keys: ['nlr', 'new life', 'return to the place you died', 'forget everything', 'revenge kill'],
    wrong: [
      'After respawn, players can return to the death scene immediately.',
      'NLR only applies if the player was executed, not downed.',
      'Players may use old-life memory to continue the same conflict.',
    ],
  },
  {
    tag: 'OOC Conduct',
    keys: ['ooc', 'irl threats', 'doxxing', 'suicide threats', 'mentioning rules during active rp'],
    wrong: [
      'IRL threats are allowed if both players are angry in OOC chat.',
      'Rules can be argued mid-scene as long as RP continues.',
      'Doxxing warnings only apply when personal info is posted publicly.',
    ],
  },
  {
    tag: 'Server Basics',
    keys: ['microphone', 'default character', 'combat logging', 'stream sniping', 'advertising', 'soliciting'],
    wrong: [
      'Combat logging is acceptable when internet stability is poor.',
      'Default characters are fine until a player decides to roleplay seriously.',
      'Advertising other servers is allowed in private conversations.',
    ],
  },
  {
    tag: 'VDM',
    keys: ['vdm', 'vehicle deathmatch', 'running people over', 'ramming'],
    wrong: [
      'Running someone over is fine if they stand in the road.',
      'Repeated ramming is allowed to start roleplay quickly.',
      'VDM only applies if the victim dies instantly.',
    ],
  },
  {
    tag: 'Fail RP',
    keys: ['fail rp', 'destroy rp', 'break character'],
    wrong: [
      'Breaking character is allowed when explaining rules in scene.',
      'Fail RP only applies if staff are already spectating.',
      'Destroying RP is acceptable if it speeds up conflict resolution.',
    ],
  },
  {
    tag: 'Cop Baiting',
    keys: ['cop bait', 'cop baiting', 'police chase', 'initiate roleplay with police', 'police for 2 minutes'],
    wrong: [
      'Intentional police chases are allowed if no shots are fired.',
      'Police roleplay can start after fleeing for several minutes.',
      'Verbal initiation with police is optional in traffic incidents.',
    ],
  },
  {
    tag: 'Metagaming',
    keys: ['metagaming', 'meta gaming', 'discord calls', 'ooc info in rp', 'talking while dead', 'outside info'],
    wrong: [
      'Using Discord info is acceptable if it helps scene quality.',
      'Talking while dead is fine when giving teammates directions.',
      'OOC information may be used in RP if no one reports it.',
    ],
  },
  {
    tag: 'Powergaming / Exploits',
    keys: ['powergaming', 'blindfire', 'q-peeking', 'animation exploits', 'greenzones', 'camping', 'baiting'],
    wrong: [
      'Powergaming is acceptable when your character has higher status.',
      'Blindfire/Q-peeking is allowed if both sides are armed.',
      'Animation exploits are fine if used only once per scene.',
    ],
  },
  {
    tag: 'KOS / Redzone',
    keys: ['kos', 'redzone', 'gang turf', 'automatic 2 min initiation', 'rdm is allowed'],
    wrong: [
      'KOS is allowed in any downtown area if gangs are present.',
      'KOS can be used at Pillbox as long as the conflict is heated.',
      'KOS is valid anywhere after one verbal warning.',
    ],
  },
  {
    tag: 'Robberies / Hostages',
    keys: ['robber', 'hostage', 'outside shooters', 'bank', 'jewelry', 'store', 'gas station', 'museum'],
    wrong: [
      'Outside shooters are allowed on every robbery type by default.',
      'Compliant hostages can be killed if negotiations take too long.',
      'Fake hostages are allowed when police numbers are high.',
    ],
  },
  {
    tag: 'Tax / Drug Wash',
    keys: ['tax', 'money wash', 'drug', 'afk farming', 'location'],
    wrong: [
      'Multiple gangs can tax the same location if they split timings.',
      'Killing is allowed immediately if someone refuses tax.',
      'AFK farming is acceptable when no enemies are nearby.',
    ],
  },
  {
    tag: 'Identity / Cuffed / Commands',
    keys: ['impersonating police', 'impersonating ems', 'radios while cuffed', '/dv', '/me', 'cuffed'],
    wrong: [
      'Players may use radio comms while cuffed if speaking quietly.',
      'Impersonating Police/EMS is okay for social RP moments.',
      'Command abuse only matters if it directly causes player death.',
    ],
  },
  {
    tag: 'Tebex / Purchases',
    keys: ['tebex', 'refund', 'digital', 'resold', 'transferred', 'gifted'],
    wrong: [
      'Banned players can always claim partial Tebex refunds.',
      'Digital Tebex items may be traded if both players agree.',
      'Lost Tebex items are automatically reimbursed by default.',
    ],
  },
];

const infoCalloutClass = 'cursor-default select-none rounded-2xl border border-white/10 bg-gradient-to-r from-zinc-900/95 to-black/70 px-4 py-3 text-sm leading-relaxed text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]';
const subtleInfoCalloutClass = 'cursor-default select-none rounded-xl border border-white/10 bg-gradient-to-r from-zinc-900/90 to-black/65 px-3 py-3 text-xs leading-relaxed text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]';

function detectRuleBracket({ title = '', question = '', correct = '' }) {
  const keywordSource = `${title} ${question} ${correct}`.toLowerCase();
  const bank = RULE_FALSE_OPTION_BANKS.find(entry => entry.keys.some(key => keywordSource.includes(key)));
  return bank?.tag || 'General Policy';
}

function buildRuleAlignedFalseAnswers({ title = '', question = '', correct = '', existingWrong = [], bracketTag = null }) {
  const keywordSource = `${title} ${question} ${correct}`.toLowerCase();
  const deprecatedWrong = new Set([
    'Rule checks can be skipped if the player has no prior punishments.',
    'Niche rules only apply during staff-led events.',
    'FearRP and memory rules are optional in high-pressure moments.',
    'Act first and document later.',
    'Ignore policy wording if the outcome feels right.',
    'Use personal judgment without checking server standards.',
  ]);
  const cleanExistingWrong = (existingWrong || [])
    .map(v => String(v || '').trim())
    .filter(Boolean)
    .filter(v => !deprecatedWrong.has(v));

  const pickedBank = bracketTag
    ? RULE_FALSE_OPTION_BANKS.find(bank => bank.tag === bracketTag)
    : RULE_FALSE_OPTION_BANKS.find(bank => bank.keys.some(key => keywordSource.includes(key)));
  const generic = keywordSource.includes('where') && keywordSource.includes('allowed')
    ? [
      'Everywhere in the city as long as players agree.',
      'Only near police stations and Pillbox.',
      'Anywhere outside safezones without extra rules.',
    ]
    : [
      'Skip policy checks if the scene feels clear.',
      'Rely on assumptions instead of verified evidence.',
      'Apply the rule loosely based on personal opinion.',
    ];

  const candidates = [
    ...(pickedBank ? pickedBank.wrong : []),
    ...cleanExistingWrong,
    ...generic,
  ]
    .map(v => String(v || '').trim())
    .filter(Boolean)
    .filter(v => v.toLowerCase() !== String(correct || '').trim().toLowerCase());

  const unique = [...new Set(candidates)];
  const selected = unique.slice(0, 3);
  while (selected.length < 3) {
    selected.push(generic[selected.length]);
  }
  return selected;
}

function sameStringArray(a = [], b = []) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (String(a[i] || '').trim() !== String(b[i] || '').trim()) return false;
  }
  return true;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function accountRoleLabel(role) {
  if (role === 'viewer') return 'Guest';
  if (role === 'staff_in_training') return 'Staff In Training';
  if (role === 'head_admin') return 'Head Admin';
  if (role === 'admin') return 'Admin';
  if (role === 'trainer') return 'Trainer';
  return role || 'Guest';
}

function accountRoleColor(role) {
  if (role === 'head_admin') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  if (role === 'admin') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  if (role === 'trainer') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  if (role === 'staff_in_training') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
}

function accountRoleSortValue(role) {
  if (role === 'head_admin') return 0;
  if (role === 'admin') return 1;
  if (role === 'trainer') return 2;
  if (role === 'staff_in_training') return 3;
  return 4;
}

function inferAuditTab(action) {
  const normalized = String(action || '').toLowerCase();
  if (normalized.includes('checkbox')) return 'Checkboxes';
  if (normalized.includes('rank_display')) return 'Rank Display';
  if (normalized.includes('user.') || normalized.includes('god_key') || normalized.includes('profile.')) return 'Management';
  if (normalized.includes('disciplin') || normalized.includes('warning')) return 'Discipline';
  if (normalized.includes('session') || normalized.includes('quiz')) return 'Training Session';
  if (normalized.includes('staff.')) return 'Tracker';
  return 'General';
}

function formatAuditAction(action) {
  return String(action || '')
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function readAuditObjectValue(value, key) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value[key] : undefined;
}
function getAuditTargetPresentation(log, staffRecords = [], managementUsers = []) {
  const targetId = log?.target_id == null ? '' : String(log.target_id);
  const afterName = readAuditObjectValue(log?.after_value, 'name');
  const beforeName = readAuditObjectValue(log?.before_value, 'name');
  const afterUsername = readAuditObjectValue(log?.after_value, 'username');
  const beforeUsername = readAuditObjectValue(log?.before_value, 'username');
  const afterTitle = readAuditObjectValue(log?.after_value, 'title');
  const beforeTitle = readAuditObjectValue(log?.before_value, 'title');
  const afterRole = readAuditObjectValue(log?.after_value, 'role');
  const beforeRole = readAuditObjectValue(log?.before_value, 'role');
  const matchedStaff = staffRecords.find(member => String(member.id) === targetId);
  const matchedUser = managementUsers.find(user => String(user.id) === targetId);
  const label = afterName
    || beforeName
    || matchedStaff?.name
    || afterUsername
    || beforeUsername
    || matchedUser?.username
    || afterTitle
    || beforeTitle
    || targetId
    || '-';
  const meta = matchedStaff?.role
    || afterRole
    || beforeRole
    || (matchedUser?.role ? accountRoleLabel(matchedUser.role) : '')
    || '';
  return {
    label,
    meta,
    rawId: targetId || '',
  };
}

function buildAuditTabActionOrFilter(tab) {
  if (tab === 'Management') return 'action.ilike.user.%,action.ilike.god_key.%,action.ilike.profile.%';
  if (tab === 'Checkboxes') return 'action.ilike.checkbox_catalog.%';
  if (tab === 'Rank Display') return 'action.ilike.rank_display.%';
  if (tab === 'Discipline') return 'action.ilike.staff.disciplinary.%';
  if (tab === 'Training Session') return 'action.ilike.staff.session.%,action.ilike.quiz.%';
  if (tab === 'Tracker') return 'action.ilike.staff.%';
  return '';
}

const AUDIT_TAB_FILTER_OPTIONS = ['All', 'Tracker', 'Training Session', 'Discipline', 'Management', 'Checkboxes', 'Rank Display'];
const KNOWN_AUDIT_ACTIONS = [
  'staff.update',
  'staff.session.update',
  'staff.delete',
  'staff.disciplinary',
  'staff.create',
  'staff.roster_sync',
  'staff.linked_role.update',
  'staff.restore_demo',
  'quiz.submit',
  'user.role.update',
  'user.active.update',
  'user.delete',
  'user.avatar.update',
  'user.god_key.update',
  'god_key.force_head_admin',
  'profile.update',
  'checkbox_catalog.save',
  'checkbox_catalog.delete',
  'checkbox_catalog.repair_false_answers',
  'rank_display.update',
];

function mapRosterRankToRole(rankLabel) {
  const rank = String(rankLabel || '').trim().toLowerCase();
  if (rank.includes('junior associate')) return 'T-MOD';
  if (rank.includes('support officer') && !rank.includes('senior') && !rank.includes('lead')) return 'MOD';
  if (rank.includes('senior support officer')) return 'S-MOD';
  if (rank.includes('lead support officer')) return 'ADMIN';
  if (rank.includes('operations coordinator') && !rank.includes('senior')) return 'S-ADMIN';
  if (rank.includes('senior operations coordinator')) return 'HEAD-ADMIN';
  if (rank.includes('team lead')) return 'HEAD-ADMIN';
  return 'T-MOD';
}

function parseRosterInputText(inputText) {
  const lines = String(inputText || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const parsed = [];
  lines.forEach(line => {
    let rank = '';
    let name = '';
    const numbered = line.match(/^\d+\s+(.+?)\s{2,}(.+)$/);
    const plain = line.match(/^(.+?)\s{2,}(.+)$/);
    const dashed = line.match(/^(.+?)\s*-\s*(.+)$/);

    if (numbered) {
      rank = numbered[1];
      name = numbered[2];
    } else if (plain) {
      rank = plain[1];
      name = plain[2];
    } else if (dashed) {
      rank = dashed[1];
      name = dashed[2];
    }

    if (!name || !rank) return;
    parsed.push({ rank: rank.trim(), name: name.trim() });
  });

  const seen = new Set();
  return parsed.filter(entry => {
    const key = entry.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function QuizHint({ item, answer, category }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-2">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-fuchsia-200">
          <HelpCircle className="h-3.5 w-3.5" />
          Quiz check {category ? ` - ${category}` : ''}
        </div>
        <span className="text-[11px] text-zinc-400">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-sm">
          <div className="text-zinc-200">{item}</div>
          <div className="whitespace-pre-line rounded-lg border border-white/10 bg-black/30 p-2 text-zinc-300">{answer}</div>
        </div>
      )}
    </div>
  );
}

export default function DrillUKStaffTrackerPrototype({ authUser, profile, onSignOut, dbReady, onProfileRefresh }) {
  const [viewAsRole, setViewAsRole] = useState('');
  const [viewAsStaffId, setViewAsStaffId] = useState(null);
  const canUseViewAs = profile?.role === 'head_admin';
  const effectiveRole = canUseViewAs && viewAsRole ? viewAsRole : (profile?.role || 'viewer');
  const isTestingViewMode = canUseViewAs && Boolean(viewAsRole);
  const canEdit = ['head_admin', 'admin', 'trainer'].includes(effectiveRole);
  const canManageUsers = isTestingViewMode
    ? effectiveRole === 'head_admin'
    : (effectiveRole === 'head_admin' || Boolean(profile?.god_key_enabled));
  const canViewPresence = effectiveRole === 'head_admin';
  const canManageCheckboxes = canManageUsers || effectiveRole === 'admin';
  const canDeleteStaff = ['head_admin', 'admin'].includes(effectiveRole);
  const canManageInterviews = effectiveRole === 'head_admin' || Boolean(profile?.god_key_enabled);
  const canManageEssentials = effectiveRole === 'head_admin' || Boolean(profile?.god_key_enabled);
  const isStaffInTraining = effectiveRole === 'staff_in_training';
  const canAccessExperimentalQuiz = profile?.role === 'head_admin' || Boolean(profile?.experimental_quiz_enabled);
  const [activeMainTab, setActiveMainTab] = useState(isStaffInTraining ? 'myprogress' : 'employee');
  const [managementView, setManagementView] = useState('directory');
  const [managementQuery, setManagementQuery] = useState('');
  const [selectedKnowledgeQuizKey, setSelectedKnowledgeQuizKey] = useState('mandatory-general');
  const [assignQuizOpen, setAssignQuizOpen] = useState(false);
  const [employeeQuickView, setEmployeeQuickView] = useState('');
  const [deletingStaffId, setDeletingStaffId] = useState(null);
  const [removeStaffOpen, setRemoveStaffOpen] = useState(false);
  const [removeStaffTargetId, setRemoveStaffTargetId] = useState(null);
  const [removeStaffReason, setRemoveStaffReason] = useState('');
  const [removeStaffNotes, setRemoveStaffNotes] = useState('');
  const [removedStaffOpen, setRemovedStaffOpen] = useState(false);
  const [interviewApplications, setInterviewApplications] = useState([]);
  const [interviewQuestionBank, setInterviewQuestionBank] = useState(normalizeInterviewTemplate(DEFAULT_INTERVIEW_TEMPLATE));
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState('');
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const [interviewQuery, setInterviewQuery] = useState('');
  const [interviewReviewNotes, setInterviewReviewNotes] = useState('');

  const [staff, setStaff] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [addStaffCardFile, setAddStaffCardFile] = useState(null);
  const [addStaffForm, setAddStaffForm] = useState({
    name: '',
    role: 'T-MOD',
    trainer: 'Unassigned',
    avatar: '',
    staffSince: todayIsoDate(),
    modSince: todayIsoDate(),
  });
  const [disciplineOpen, setDisciplineOpen] = useState(false);
  const [disciplineType, setDisciplineType] = useState('Warning');
  const [disciplineReason, setDisciplineReason] = useState('');
  const [disciplineIssuer, setDisciplineIssuer] = useState('');
  const [sessionRankFilter, setSessionRankFilter] = useState('All');
  const [sessionUserQuery, setSessionUserQuery] = useState('');
  const [sessionTargetId, setSessionTargetId] = useState(null);
  const [sessionNotesOpen, setSessionNotesOpen] = useState(false);
  const [sessionActionsOpen, setSessionActionsOpen] = useState(false);
  const [sessionNotesDraft, setSessionNotesDraft] = useState({ strongSides: '', attentionPoints: '', notes: '' });
  const [sessionActionsDraft, setSessionActionsDraft] = useState({ trainer: '', status: 'In Training' });
  const [disciplineRankFilter, setDisciplineRankFilter] = useState('All');
  const [disciplineUserQuery, setDisciplineUserQuery] = useState('');
  const [disciplineTargetId, setDisciplineTargetId] = useState(null);
  const profileFileInputRef = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterRole, setFilterRole] = useState('All');
  const [filterTrainerOnly, setFilterTrainerOnly] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [filterWarningOnly, setFilterWarningOnly] = useState(false);
  const [managementUsers, setManagementUsers] = useState([]);
  const [managementIdentifiersOpenId, setManagementIdentifiersOpenId] = useState(null);
  const [managementIdentifierDrafts, setManagementIdentifierDrafts] = useState({});
  const [managementIdentifierPasteDrafts, setManagementIdentifierPasteDrafts] = useState({});
  const [managementLoading, setManagementLoading] = useState(false);
  const [managementError, setManagementError] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditQuery, setAuditQuery] = useState('');
  const [auditTabFilter, setAuditTabFilter] = useState('All');
  const [auditActorFilter, setAuditActorFilter] = useState('All');
  const [auditActionFilter, setAuditActionFilter] = useState('All');
  const [auditDateFilter, setAuditDateFilter] = useState('All');
  const [auditRequireChanges, setAuditRequireChanges] = useState(false);
  const [auditFieldQuery, setAuditFieldQuery] = useState('');
  const [latestInviteToken, setLatestInviteToken] = useState('');
  const [inviteTokenCreating, setInviteTokenCreating] = useState(false);
  const [checkboxCatalog, setCheckboxCatalog] = useState(buildDefaultCheckboxCatalog());
  const [checkboxCatalogLoading, setCheckboxCatalogLoading] = useState(false);
  const [checkboxMenu, setCheckboxMenu] = useState('role');
  const [checkboxFilterOpen, setCheckboxFilterOpen] = useState(false);
  const [checkboxQuery, setCheckboxQuery] = useState('');
  const [checkboxRankFilter, setCheckboxRankFilter] = useState('All');
  const [checkboxEditorOpen, setCheckboxEditorOpen] = useState(false);
  const [checkboxDraft, setCheckboxDraft] = useState(null);
  const [managedQuizQuestions, setManagedQuizQuestions] = useState([]);
  const [managedQuizLoading, setManagedQuizLoading] = useState(false);
  const [managedQuizEditorOpen, setManagedQuizEditorOpen] = useState(false);
  const [managedQuizDraft, setManagedQuizDraft] = useState(null);
  const [videoQuizzes, setVideoQuizzes] = useState([]);
  const [videoQuizEditorOpen, setVideoQuizEditorOpen] = useState(false);
  const [videoQuizDraft, setVideoQuizDraft] = useState(null);
  const [videoQuizTableAvailable, setVideoQuizTableAvailable] = useState(true);
  const [staffEssentials, setStaffEssentials] = useState([]);
  const [selectedEssentialSlug, setSelectedEssentialSlug] = useState('');
  const [staffEssentialsTableAvailable, setStaffEssentialsTableAvailable] = useState(true);
  const [unifiedQuizzes, setUnifiedQuizzes] = useState([]);
  const [unifiedQuizQuestions, setUnifiedQuizQuestions] = useState([]);
  const [unifiedQuizAssignments, setUnifiedQuizAssignments] = useState([]);
  const [unifiedQuizAttempts, setUnifiedQuizAttempts] = useState([]);
  const [unifiedQuizAttemptAnswers, setUnifiedQuizAttemptAnswers] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(profile?.username || '');
  const [profileAvatar, setProfileAvatar] = useState(profile?.avatar_url || '');
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [staffToolForm, setStaffToolForm] = useState({
    license: '',
    discordId: '',
    reason: '',
    clipLink: '',
  });
  const [staffToolsSection, setStaffToolsSection] = useState('');
  const [staffToolsPunishSection, setStaffToolsPunishSection] = useState('');
  const [staffToolsExperimentalSection, setStaffToolsExperimentalSection] = useState('');
  const [staffToolCopiedOpen, setStaffToolCopiedOpen] = useState(false);
  const ownProfileFileInputRef = useRef(null);
  const [activeUsersOpen, setActiveUsersOpen] = useState(false);
  const [offlineUsersOpen, setOfflineUsersOpen] = useState(false);
  const [weeklyStaffOpen, setWeeklyStaffOpen] = useState(false);
  const [weeklyQuizOpen, setWeeklyQuizOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [trainingLogDraft, setTrainingLogDraft] = useState({ bracket: 'General Policy', note: '' });
  const lastLocalStaffEditRef = useRef(0);
  const staffSaveQueueRef = useRef(new Map());
  const removalColumnsAvailableRef = useRef(false);
  const quizShellBackfillBusyRef = useRef(false);
  const isOwnerSession = (authUser?.email || '').toLowerCase() === SITE_OWNER_EMAIL;
  const [rosterSyncOpen, setRosterSyncOpen] = useState(false);
  const [rosterSyncText, setRosterSyncText] = useState(formatRosterSeedForInput());
  const [rankDisplayNames, setRankDisplayNames] = useState(defaultRankDisplayNames);
  const [rankDrafts, setRankDrafts] = useState(defaultRankDisplayNames);
  const [rankDisplayLoading, setRankDisplayLoading] = useState(false);
  const [syncPausedByEdit, setSyncPausedByEdit] = useState(false);
  const [inputEditingActive, setInputEditingActive] = useState(false);
  const [pendingSyncFlags, setPendingSyncFlags] = useState({
    staff: false,
    profiles: false,
    checkbox: false,
    ranks: false,
    audit: false,
    managedQuiz: false,
  });
  const syncPauseTimerRef = useRef(null);
  const syncLockedRef = useRef(false);
  const pendingSyncRef = useRef({
    staff: false,
    profiles: false,
    checkbox: false,
    ranks: false,
    audit: false,
    managedQuiz: false,
  });

  const deferredQuery = useDeferredValue(query);
  const deferredSessionUserQuery = useDeferredValue(sessionUserQuery);
  const deferredDisciplineUserQuery = useDeferredValue(disciplineUserQuery);
  const deferredCheckboxQuery = useDeferredValue(checkboxQuery);
  const deferredAuditQuery = useDeferredValue(auditQuery);
  const deferredAuditFieldQuery = useDeferredValue(auditFieldQuery);
  const isEditOverlayOpen = managedQuizEditorOpen || videoQuizEditorOpen || checkboxEditorOpen || addStaffOpen || rosterSyncOpen || profileOpen || disciplineOpen || sessionNotesOpen || sessionActionsOpen || Boolean(employeeQuickView);
  const isSyncLocked = syncPausedByEdit || inputEditingActive || isEditOverlayOpen;
  const hasQueuedSync = pendingSyncFlags.staff || pendingSyncFlags.profiles || pendingSyncFlags.checkbox || pendingSyncFlags.ranks || pendingSyncFlags.audit || pendingSyncFlags.managedQuiz;
  const ruleBracketOptions = useMemo(() => ['General Policy', ...new Set(RULE_FALSE_OPTION_BANKS.map(item => item.tag))], []);

  function holdRealtimeSync(ms = 2500) {
    setSyncPausedByEdit(true);
    if (syncPauseTimerRef.current) clearTimeout(syncPauseTimerRef.current);
    syncPauseTimerRef.current = setTimeout(() => {
      setSyncPausedByEdit(false);
      syncPauseTimerRef.current = null;
    }, ms);
  }

  function isEditableTarget(node) {
    if (!node || !(node instanceof Element)) return false;
    const inputNode = node.closest('input, textarea, [contenteditable="true"], [role="textbox"]');
    if (!inputNode) return false;
    if (inputNode.tagName.toLowerCase() === 'textarea') return true;
    if (inputNode.tagName.toLowerCase() === 'input') {
      const type = String(inputNode.getAttribute('type') || 'text').toLowerCase();
      if (['checkbox', 'radio', 'submit', 'button', 'hidden', 'file', 'range', 'color'].includes(type)) return false;
      if (inputNode.hasAttribute('readonly') || inputNode.hasAttribute('disabled')) return false;
      return true;
    }
    return true;
  }

  useEffect(() => {
    setProfileName(profile?.username || '');
    setProfileAvatar(profile?.avatar_url || '');
    setProfileAvatarFile(null);
  }, [profile]);

  useEffect(() => {
    function onFocusIn(event) {
      setInputEditingActive(isEditableTarget(event.target));
    }

    function onFocusOut() {
      setTimeout(() => setInputEditingActive(isEditableTarget(document.activeElement)), 0);
    }

    window.addEventListener('focusin', onFocusIn, true);
    window.addEventListener('focusout', onFocusOut, true);
    return () => {
      window.removeEventListener('focusin', onFocusIn, true);
      window.removeEventListener('focusout', onFocusOut, true);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (syncPauseTimerRef.current) clearTimeout(syncPauseTimerRef.current);
    };
  }, []);

  const rankLabel = (role) => rankDisplayNames[role] || role;

  useEffect(() => {
    if (!dbReady || !supabase || !authUser?.id) return;

    const channel = supabase.channel('dashboard_online_presence', {
      config: { presence: { key: authUser.id } },
    });

    const syncActiveUsers = () => {
      const state = channel.presenceState();
      const rows = Object.entries(state).map(([id, metas]) => {
        const latest = metas[metas.length - 1] || {};
        return {
          id,
          username: latest.username || latest.email?.split('@')?.[0] || 'Guest',
          email: latest.email || '',
          role: latest.role || 'Guest',
          avatar_url: latest.avatar_url || null,
          last_seen_at: latest.at || null,
        };
      });
      rows.sort((a, b) => new Date(b.last_seen_at || 0).getTime() - new Date(a.last_seen_at || 0).getTime());
      setActiveUsers(rows);
    };

    let heartbeat;
    channel
      .on('presence', { event: 'sync' }, syncActiveUsers)
      .on('presence', { event: 'join' }, syncActiveUsers)
      .on('presence', { event: 'leave' }, syncActiveUsers)
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        await supabase.rpc('touch_last_seen');
        await channel.track({
          id: authUser.id,
          username: profile?.username || authUser.email?.split('@')[0] || 'Guest',
          email: authUser.email || '',
          role: accountRoleLabel(profile?.role),
          avatar_url: profile?.avatar_url || null,
          at: new Date().toISOString(),
        });
        heartbeat = setInterval(() => {
          supabase.rpc('touch_last_seen');
          channel.track({
            id: authUser.id,
            username: profile?.username || authUser.email?.split('@')[0] || 'Guest',
            email: authUser.email || '',
            role: accountRoleLabel(profile?.role),
            avatar_url: profile?.avatar_url || null,
            at: new Date().toISOString(),
          });
        }, 30000);
      });

    return () => {
      if (heartbeat) clearInterval(heartbeat);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [dbReady, authUser?.id, authUser?.email, profile?.username, profile?.role, profile?.avatar_url]);

  const offlineUsers = useMemo(() => {
    if (!canViewPresence) return [];
    const activeIds = new Set(activeUsers.map(user => user.id));
    return (managementUsers || [])
      .filter(user => !activeIds.has(user.id))
      .sort((a, b) => new Date(b.last_seen_at || 0).getTime() - new Date(a.last_seen_at || 0).getTime());
  }, [canViewPresence, activeUsers, managementUsers]);

  useEffect(() => {
    if (canViewPresence) return;
    setActiveUsersOpen(false);
    setOfflineUsersOpen(false);
  }, [canViewPresence]);

  async function refreshStaffFromDb() {
    if (!dbReady || !supabase) return;
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error || !data?.length) return false;
    let mapped = data.map(row => ({
      id: row.id,
      name: row.name,
      role: row.role,
      trainer: row.trainer,
      traineeUserId: row.trainee_user_id || null,
      profileImage: row.profile_image || '',
      status: row.status,
      strongSides: row.strong_sides || '',
      attentionPoints: row.attention_points || '',
      signedOff: Boolean(row.signed_off),
      staffSince: row.staff_since || 'N/A',
      modSince: row.role_since || 'N/A',
      promotion: row.promotion || roles[Math.min(roles.indexOf(row.role) + 1, roles.length - 1)],
      checks: row.checks || Object.fromEntries((baseChecksByRole[row.role] || []).map(item => [item, false])),
      permissions: row.permissions || Object.fromEntries(dynamicPermissions.map(item => [item.title, false])),
      values: row.values || Object.fromEntries(dynamicCoreValues.map(item => [item.title, false])),
      disciplinary: row.disciplinary || { warnings: 0, actions: 0, logs: [] },
      quizHistory: Array.isArray(row.quiz_history) ? row.quiz_history : [],
      trainingLogs: Array.isArray(row.training_logs) ? row.training_logs : [],
      assignedQuizKeys: Array.isArray(row.assigned_quiz_keys) ? row.assigned_quiz_keys : [],
      notes: row.notes || '',
      isRemoved: Boolean(row.is_removed),
      removedAt: row.removed_at || null,
      removedBy: row.removed_by || null,
      removalReason: row.removal_reason || '',
      removalNotes: row.removal_notes || '',
    }));
    const shouldPreserveLocalSelected = Date.now() - lastLocalStaffEditRef.current < 1400;
    if (shouldPreserveLocalSelected && selectedId) {
      const localSelected = staff.find(member => member.id === selectedId);
      if (localSelected) {
        mapped = mapped.map(member => (member.id === selectedId ? { ...member, ...localSelected } : member));
      }
    }
    setStaff(mapped);
    setSelectedId(prev => (mapped.some(s => s.id === prev) ? prev : mapped[0]?.id ?? null));
    return true;
  }

  function normalizeProfileIdentifiers(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entry]) => [String(key || '').trim().toLowerCase(), String(entry || '').trim()])
        .filter(([key, entry]) => key && entry)
    );
  }

  function countProfileIdentifiers(value) {
    return Object.values(normalizeProfileIdentifiers(value)).filter(Boolean).length;
  }

  function formatProfileIdentifierLabel(key) {
    if (PROFILE_IDENTIFIER_LABELS[key]) return PROFILE_IDENTIFIER_LABELS[key];
    return String(key || '')
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function getManagementIdentifierDraft(user) {
    return managementIdentifierDrafts[user.id] || normalizeProfileIdentifiers(user.identifiers);
  }

  function parseProfileIdentifierBlock(rawText, base = {}) {
    const next = { ...normalizeProfileIdentifiers(base) };
    String(rawText || '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .forEach(line => {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex <= 0) return;
        const key = line.slice(0, separatorIndex).trim().toLowerCase();
        const value = line.slice(separatorIndex + 1).trim();
        if (!key || !value) return;
        next[key] = value;
      });
    return next;
  }

  function updateManagementIdentifierDraft(userId, key, value) {
    setManagementIdentifierDrafts(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [key]: value,
      },
    }));
  }

  function applyManagementIdentifierPaste(userId) {
    const rawText = managementIdentifierPasteDrafts[userId] || '';
    const current = managementIdentifierDrafts[userId] || normalizeProfileIdentifiers(managementUsers.find(user => user.id === userId)?.identifiers);
    const parsed = parseProfileIdentifierBlock(rawText, current);
    setManagementIdentifierDrafts(prev => ({ ...prev, [userId]: parsed }));
  }

  async function pasteManagementIdentifiersFromClipboard(userId) {
    try {
      const text = await navigator.clipboard.readText();
      setManagementIdentifierPasteDrafts(prev => ({ ...prev, [userId]: text }));
      const current = managementIdentifierDrafts[userId] || normalizeProfileIdentifiers(managementUsers.find(user => user.id === userId)?.identifiers);
      const parsed = parseProfileIdentifierBlock(text, current);
      setManagementIdentifierDrafts(prev => ({ ...prev, [userId]: parsed }));
    } catch (error) {
      window.alert('Clipboard paste failed. Paste the identifier block into the raw box manually.');
    }
  }

  async function refreshManagementUsersFromDb() {
    if (!dbReady || !supabase || !canManageUsers) return;
    setManagementLoading(true);
    setManagementError('');
    try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, is_active, avatar_url, god_key_enabled, experimental_quiz_enabled, last_seen_at, identifiers')
      .order('username', { ascending: true });

      if (error?.code === '42703' || error?.code === 'PGRST204') {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .select('id, username, role, is_active')
          .order('username', { ascending: true });
        if (fallbackError) {
          setManagementUsers([]);
          setManagementError(fallbackError.message || 'Failed to load users.');
          return;
        }
        setManagementUsers((fallbackData || []).map(u => ({
          ...u,
          avatar_url: null,
          god_key_enabled: false,
          last_seen_at: null,
          identifiers: {},
          is_developer: isOwnerSession && u.id === authUser?.id,
        })).sort((a, b) => {
          const rankDiff = accountRoleSortValue(a.role) - accountRoleSortValue(b.role);
          if (rankDiff !== 0) return rankDiff;
          return String(a.username || '').localeCompare(String(b.username || ''));
        }));
        return;
      }

      if (error) {
        setManagementUsers([]);
        setManagementError(error.message || 'Failed to load users.');
        return;
      }

      setManagementUsers((data || []).map(u => ({
        ...u,
        identifiers: normalizeProfileIdentifiers(u.identifiers),
        is_developer: isOwnerSession && u.id === authUser?.id,
      })).sort((a, b) => {
        const rankDiff = accountRoleSortValue(a.role) - accountRoleSortValue(b.role);
        if (rankDiff !== 0) return rankDiff;
        return String(a.username || '').localeCompare(String(b.username || ''));
      }));
    } finally {
      setManagementLoading(false);
    }
  }

  async function refreshInterviewQuestionBankFromDb() {
    if (!dbReady || !supabase || !canManageInterviews) return;
    const { data, error } = await supabase
      .from('interview_question_bank')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      if (error.code !== 'PGRST116' && error.code !== '42P01') {
        setInterviewError(error.message || 'Failed to load interview question bank.');
      }
      setInterviewQuestionBank(normalizeInterviewTemplate(DEFAULT_INTERVIEW_TEMPLATE));
      return;
    }

    const normalized = normalizeInterviewTemplate(data);
    setInterviewQuestionBank(normalized.length ? normalized : normalizeInterviewTemplate(DEFAULT_INTERVIEW_TEMPLATE));
  }

  async function saveInterviewScorecard(application, scorecard, totals) {
    if (!application?.id || !supabase || !canManageInterviews) return;
    const payload = {
      interview_scores: scorecard,
      interview_total_score: Number(totals?.total || 0),
      interview_max_score: Number(totals?.max || 0),
      interview_started_by: application.interview_started_by || authUser?.id || null,
      interview_started_at: application.interview_started_at || new Date().toISOString(),
      interview_completed_at: new Date().toISOString(),
      review_notes: reviewNotesForInterview(application.id),
    };
    const { error } = await supabase.from('interview_applications').update(payload).eq('id', application.id);
    if (error) {
      alert(error.message || 'Failed to save interview scorecard.');
      return;
    }
    await refreshInterviewApplicationsFromDb();
  }

  function reviewNotesForInterview(applicationId) {
    if (selectedInterviewId === applicationId) return interviewReviewNotes || '';
    const target = interviewApplications.find((item) => item.id === applicationId);
    return target?.review_notes || '';
  }

  async function saveInterviewTemplateQuestion(question) {
    if (!isOwnerSession || !supabase) return;
    const payload = {
      id: question.id || undefined,
      section: question.section,
      question: question.question,
      max_score: Number(question.maxScore || 5),
      sort_order: Number(question.sortOrder || 10),
      good_answer_example: question.goodAnswerExample || '',
      bad_answer_example: question.badAnswerExample || '',
      is_active: true,
      updated_by: authUser?.id || null,
    };
    const { error } = await supabase.from('interview_question_bank').upsert(payload);
    if (error) {
      alert(error.message || 'Failed to save interview template question.');
      return;
    }
    await refreshInterviewQuestionBankFromDb();
  }

  async function deleteInterviewTemplateQuestion(question) {
    if (!isOwnerSession || !supabase || !question?.id) return;
    const { error } = await supabase.from('interview_question_bank').delete().eq('id', question.id);
    if (error) {
      alert(error.message || 'Failed to delete interview template question.');
      return;
    }
    await refreshInterviewQuestionBankFromDb();
  }

  async function refreshInterviewApplicationsFromDb() {
    if (!dbReady || !supabase || !canManageInterviews) return;
    setInterviewLoading(true);
    setInterviewError('');
    try {
      const { data, error } = await supabase
        .from('interview_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setInterviewApplications([]);
        setInterviewError(error.message || 'Failed to load interview applications.');
        return;
      }

      const next = (data || []).map(item => ({
        ...item,
        interview_scores: Array.isArray(item.interview_scores) ? item.interview_scores : [],
      }));
      setInterviewApplications(next);
      setSelectedInterviewId(prev => (next.some(item => item.id === prev) ? prev : next[0]?.id ?? null));
      setInterviewReviewNotes(current => {
        const currentTarget = next.find(item => item.id === selectedInterviewId) || next[0] || null;
        return currentTarget?.review_notes || current || '';
      });
    } finally {
      setInterviewLoading(false);
    }
  }

  async function updateInterviewApplicationStatus(application, status) {
    if (!application?.id || !supabase || !canManageInterviews) return;
    const payload = {
      status,
      review_notes: interviewReviewNotes || '',
      reviewed_by: authUser?.id || null,
      reviewed_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('interview_applications')
      .update(payload)
      .eq('id', application.id);
    if (error) {
      alert(error.message || 'Failed to update interview application.');
      return;
    }
    await refreshInterviewApplicationsFromDb();
  }

  async function refreshAuditLogsFromDb() {
    if (!dbReady || !supabase || !canManageUsers) return;
    setAuditLoading(true);
    setAuditError('');
    try {
      const now = Date.now();
      const cutoffIso = auditDateFilter === '24h'
        ? new Date(now - 24 * 60 * 60 * 1000).toISOString()
        : auditDateFilter === '7d'
          ? new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
          : auditDateFilter === '30d'
            ? new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
            : null;

      const baseSelect = 'id, actor_id, action, target_id, before_value, after_value, created_at';
      const pageSize = 1000;
      let from = 0;
      let allRows = [];

      while (true) {
        let query = supabase
          .from('audit_logs')
          .select(baseSelect)
          .order('created_at', { ascending: false });

        if (auditActorFilter !== 'All') query = query.eq('actor_id', auditActorFilter);
        if (auditActionFilter !== 'All') query = query.eq('action', auditActionFilter);
        if (cutoffIso) query = query.gte('created_at', cutoffIso);
        if (auditRequireChanges) query = query.not('after_value', 'is', null);
        if (auditQuery.trim()) {
          const q = auditQuery.trim();
          query = query.or(`action.ilike.%${q}%,target_id.ilike.%${q}%`);
        }
        if (auditTabFilter !== 'All') {
          const tabFilter = buildAuditTabActionOrFilter(auditTabFilter);
          if (tabFilter) query = query.or(tabFilter);
        }

        const { data, error } = await query.range(from, from + pageSize - 1);
        if (error) {
          setAuditLogs([]);
          setAuditError(error.message || 'Failed to load audit logs.');
          return;
        }

        const chunk = data || [];
        allRows = allRows.concat(chunk);
        if (chunk.length < pageSize) break;
        from += pageSize;
      }

      setAuditLogs(allRows);
    } finally {
      setAuditLoading(false);
    }
  }

  async function refreshCheckboxCatalogFromDb() {
    if (!dbReady || !supabase) return;
    setCheckboxCatalogLoading(true);
    const { data, error } = await supabase
      .from('checkbox_catalog')
      .select('*')
      .order('category', { ascending: true });

    if (!error) {
      const defaults = buildDefaultCheckboxCatalog();
      const dbRows = (data || []).map(item => ({
        id: item.id,
        category: item.category,
        role: item.role || '',
        ranks: parseRankScope(item.role),
        title: item.title,
        question: item.question || '',
        answer: item.answer || '',
      }));

      const mergedById = new Map(defaults.map(item => [item.id, item]));
      dbRows.forEach(item => {
        const existing = mergedById.get(item.id);
        mergedById.set(item.id, existing ? { ...existing, ...item } : item);
      });
      const merged = Array.from(mergedById.values()).sort((a, b) => {
        const categoryDiff = String(a.category).localeCompare(String(b.category));
        if (categoryDiff !== 0) return categoryDiff;
        return String(a.title).localeCompare(String(b.title));
      });
      setCheckboxCatalog(merged);
    }
    setCheckboxCatalogLoading(false);
  }

  async function refreshManagedQuizQuestionsFromDb() {
    if (!dbReady || !supabase) return;
    setManagedQuizLoading(true);
    const { data, error } = await supabase
      .from('managed_quiz_questions')
      .select('*')
      .order('quiz_key', { ascending: true })
      .order('question_order', { ascending: true })
      .order('updated_at', { ascending: true });

    if (!error) {
      setManagedQuizQuestions(
        (data || []).map(row => ({
          id: row.id,
          quizKey: row.quiz_key,
          quizTitle: row.quiz_title,
          quizDescription: row.quiz_description || '',
          quizKind: row.quiz_kind || 'managed',
          rankKey: row.rank_key || '',
          passScore: Number(row.pass_score || 80),
          questionOrder: Number(row.question_order || 0),
          category: row.category || 'General Rules',
          question: row.question || '',
          correctAnswer: row.correct_answer || '',
          wrongAnswers: Array.isArray(row.wrong_answers) ? row.wrong_answers.map(value => String(value || '')).filter(Boolean).slice(0, 3) : [],
        }))
      );
    }
    setManagedQuizLoading(false);
  }

  function isMissingVideoQuizzesTableError(error) {
    const message = String(error?.message || error?.details || '');
    return error?.code === 'PGRST205' || error?.code === '42P01' || /video_quizzes/i.test(message) && /(not found|does not exist|Could not find the table|relation)/i.test(message);
  }

  function isMissingStaffEssentialsTableError(error) {
    const message = String(error?.message || error?.details || '');
    return error?.code === 'PGRST205' || error?.code === '42P01' || /staff_essentials/i.test(message) && /(not found|does not exist|Could not find the table|relation)/i.test(message);
  }

  function buildStaffEssentialModule(index = 0) {
    return {
      id: 'module-' + Date.now() + '-' + index,
      type: 'chapter',
      title: 'Module ' + (index + 1),
      body: '',
      videoUrl: '',
      resourceLabel: '',
      resourceUrl: '',
      checklist: [],
    };
  }

  function normalizeStaffEssentialModule(module, index = 0) {
    return {
      id: module?.id || 'module-' + (index + 1),
      type: String(module?.type || 'chapter').trim() || 'chapter',
      title: String(module?.title || 'Module ' + (index + 1)).trim(),
      body: String(module?.body || '').trim(),
      videoUrl: String(module?.videoUrl || '').trim(),
      resourceLabel: String(module?.resourceLabel || '').trim(),
      resourceUrl: String(module?.resourceUrl || '').trim(),
      checklist: Array.isArray(module?.checklist) ? module.checklist.map(value => String(value || '').trim()).filter(Boolean) : [],
    };
  }

  function normalizeStaffEssentialRecord(row) {
    return {
      id: row.id,
      slug: row.slug,
      section: row.section || 'General',
      title: row.title || 'Untitled essential',
      summary: row.summary || '',
      coverVideoUrl: row.cover_video_url || '',
      tags: Array.isArray(row.tags) ? row.tags.map(value => String(value || '').trim()).filter(Boolean) : [],
      modules: Array.isArray(row.modules) && row.modules.length
        ? row.modules.map((module, index) => normalizeStaffEssentialModule(module, index))
        : [buildStaffEssentialModule(0)],
      sortOrder: Number(row.sort_order || 0),
      isActive: row.is_active !== false,
      updatedAt: row.updated_at || null,
    };
  }

  function buildVideoQuizSceneDraft(index = 0) {
    return {
      id: 'scene-' + Date.now() + '-' + index,
      title: 'Scene ' + (index + 1),
      videoUrl: '',
      watchPointsText: '',
      notePromptsText: 'List the rule breaks you identified.\nList the staff warning signs in the clip.',
    };
  }

  function normalizeVideoQuizScene(scene, index = 0) {
    return {
      id: scene?.id || 'scene-' + (index + 1),
      title: String(scene?.title || 'Scene ' + (index + 1)).trim(),
      videoUrl: String(scene?.videoUrl || '').trim(),
      watchPoints: Array.isArray(scene?.watchPoints) ? scene.watchPoints.map(value => String(value || '').trim()).filter(Boolean) : [],
      notePrompts: Array.isArray(scene?.notePrompts) ? scene.notePrompts.map(value => String(value || '').trim()).filter(Boolean) : [],
    };
  }

  function normalizeVideoQuizRecord(row) {
    const rawScenes = Array.isArray(row?.scenes) && row.scenes.length
      ? row.scenes
      : [{
          id: row?.id ? row.id + '-scene-1' : 'scene-1',
          title: row?.title || 'Scene 1',
          videoUrl: row?.video_url || '',
          watchPoints: Array.isArray(row?.watch_points) ? row.watch_points : [],
          notePrompts: Array.isArray(row?.note_prompts) ? row.note_prompts : [],
        }];
    const scenes = rawScenes.map((scene, index) => normalizeVideoQuizScene(scene, index)).filter(scene => scene.videoUrl || scene.watchPoints.length || scene.notePrompts.length || scene.title);
    return {
      id: row.id,
      quizKey: row.quiz_key,
      title: row.title,
      description: row.description || '',
      rankKey: row.rank_key || '',
      scenes,
      isActive: row.is_active !== false,
    };
  }

  async function refreshVideoQuizzesFromDb() {
    if (!dbReady || !supabase) return;
    const { data, error } = await supabase
      .from('video_quizzes')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      if (isMissingVideoQuizzesTableError(error)) {
        setVideoQuizTableAvailable(false);
        setVideoQuizzes([]);
        return;
      }
      return;
    }
    setVideoQuizTableAvailable(true);
    setVideoQuizzes((data || []).map(normalizeVideoQuizRecord));
  }

  async function refreshStaffEssentialsFromDb() {
    if (!dbReady || !supabase) return;
    const { data, error } = await supabase
      .from('staff_essentials')
      .select('*')
      .order('section', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error) {
      if (isMissingStaffEssentialsTableError(error)) {
        setStaffEssentialsTableAvailable(false);
        setStaffEssentials([]);
        return;
      }
      return;
    }

    setStaffEssentialsTableAvailable(true);
    setStaffEssentials((data || []).map(normalizeStaffEssentialRecord));
  }

  async function refreshUnifiedQuizModelFromDb() {
    if (!dbReady || !supabase) return;
    const [quizzesResult, questionsResult, assignmentsResult, attemptsResult, attemptAnswersResult] = await Promise.all([
      supabase
        .from('quizzes')
        .select('id, quiz_key, title, description, quiz_kind, quiz_category, rank_scope, pass_score, is_active, sort_order, source_type')
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true }),
      supabase
        .from('quiz_questions')
        .select('id, quiz_id, legacy_source_id, question_order, category, question, correct_answers, wrong_answers, explanation, updated_at')
        .order('question_order', { ascending: true })
        .order('updated_at', { ascending: true }),
      supabase
        .from('quiz_assignments')
        .select('id, quiz_id, staff_member_id, status, assigned_at')
        .order('assigned_at', { ascending: false }),
      supabase
        .from('quiz_attempts')
        .select('id, legacy_attempt_id, quiz_id, staff_member_id, profile_id, score, passed, submitted_at, review_status, review_note, reviewed_by, reviewed_at')
        .order('submitted_at', { ascending: false }),
      supabase
        .from('quiz_attempt_answers')
        .select('id, attempt_id, question_order, question_prompt, selected_answer, correct_answer, is_correct')
        .order('question_order', { ascending: true }),
    ]);

    if (!quizzesResult.error) setUnifiedQuizzes(quizzesResult.data || []);
    if (!questionsResult.error) setUnifiedQuizQuestions(questionsResult.data || []);
    if (!assignmentsResult.error) setUnifiedQuizAssignments(assignmentsResult.data || []);
    if (!attemptsResult.error) setUnifiedQuizAttempts(attemptsResult.data || []);
    if (!attemptAnswersResult.error) setUnifiedQuizAttemptAnswers(attemptAnswersResult.data || []);
  }

  async function refreshRankDisplayNamesFromDb() {
    if (!dbReady || !supabase) return;
    setRankDisplayLoading(true);
    const { data, error } = await supabase
      .from('rank_display_names')
      .select('rank_key, display_name');

    if (!error) {
      const merged = { ...defaultRankDisplayNames };
      (data || []).forEach(row => {
        if (row.rank_key && roles.includes(row.rank_key)) {
          merged[row.rank_key] = row.display_name || row.rank_key;
        }
      });
      setRankDisplayNames(merged);
      setRankDrafts(merged);
    }
    setRankDisplayLoading(false);
  }

  function setPendingSync(key, value) {
    pendingSyncRef.current[key] = value;
    setPendingSyncFlags(prev => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }

  async function requestRefresh(key) {
    if (syncLockedRef.current) {
      setPendingSync(key, true);
      return;
    }

    if (key === 'staff') await refreshStaffFromDb();
    if (key === 'profiles') await refreshManagementUsersFromDb();
    if (key === 'checkbox') await refreshCheckboxCatalogFromDb();
    if (key === 'ranks') await refreshRankDisplayNamesFromDb();
    if (key === 'audit') await refreshAuditLogsFromDb();
    if (key === 'managedQuiz') await refreshManagedQuizQuestionsFromDb();
    setPendingSync(key, false);
  }

  async function flushPendingRefreshes() {
    const pending = pendingSyncRef.current;
    if (pending.staff) await requestRefresh('staff');
    if (pending.profiles) await requestRefresh('profiles');
    if (pending.checkbox) await requestRefresh('checkbox');
    if (pending.ranks) await requestRefresh('ranks');
    if (pending.audit) await requestRefresh('audit');
    if (pending.managedQuiz) await requestRefresh('managedQuiz');
  }

  useEffect(() => {
    syncLockedRef.current = isSyncLocked;
    if (!isSyncLocked) flushPendingRefreshes();
  }, [isSyncLocked]);

  useEffect(() => {
    if (!dbReady || !supabase) {
      setStaff(initialStaff);
      setSelectedId(initialStaff[0]?.id ?? null);
      return;
    }

    let active = true;

    refreshStaffFromDb().then((loaded) => {
      if (!active) return;
      if (!loaded) {
        setStaff(initialStaff);
        setSelectedId(initialStaff[0]?.id ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, [dbReady]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    const channel = supabase
      .channel('staff_members_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_members' }, (payload) => {
        if (payload?.eventType === 'UPDATE' && payload?.new?.updated_by === authUser?.id) return;
        requestRefresh('staff');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbReady]);

  useEffect(() => {
    if (!dbReady || !supabase || !canManageUsers) return;
    refreshManagementUsersFromDb();
  }, [dbReady, canManageUsers]);
  useEffect(() => {
    if (!dbReady || !supabase || !canManageUsers || !managementUsers.length || !staff.length) return;
    let cancelled = false;

    const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const run = async () => {
      for (const user of managementUsers) {
        if (cancelled) return;
        if (!user?.id || !user?.username) continue;
        const alreadyLinked = staff.some(member => member.traineeUserId === user.id);
        if (alreadyLinked) continue;
        const match = staff.find(member => !member.traineeUserId && normalize(member.name) === normalize(user.username));
        if (!match) continue;
        await supabase.from('staff_members').update({ trainee_user_id: user.id }).eq('id', match.id);
        setStaff(prev => prev.map(member => (member.id === match.id ? { ...member, traineeUserId: user.id } : member)));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [dbReady, canManageUsers, managementUsers, staff]);

  useEffect(() => {
    if (!dbReady || !supabase || !canManageUsers) return;
    const timer = setTimeout(() => {
      refreshAuditLogsFromDb();
    }, 250);
    return () => clearTimeout(timer);
  }, [dbReady, canManageUsers, deferredAuditQuery, auditActorFilter, auditActionFilter, auditDateFilter, auditRequireChanges, auditTabFilter]);

  useEffect(() => {
    if (!dbReady || !supabase || !canManageUsers) return;
    const channel = supabase
      .channel('profiles_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        requestRefresh('profiles');
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbReady, canManageUsers]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    refreshCheckboxCatalogFromDb();
  }, [dbReady, authUser?.id]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    const channel = supabase
      .channel('checkbox_catalog_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkbox_catalog' }, (payload) => {
        if (payload?.eventType === 'UPDATE' && payload?.new?.updated_by === authUser?.id) return;
        requestRefresh('checkbox');
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbReady, authUser?.id]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    refreshRankDisplayNamesFromDb();
  }, [dbReady, authUser?.id]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    refreshManagedQuizQuestionsFromDb();
  }, [dbReady, authUser?.id]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    refreshVideoQuizzesFromDb();
  }, [dbReady, authUser?.id]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    refreshStaffEssentialsFromDb();
  }, [dbReady, authUser?.id]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    refreshUnifiedQuizModelFromDb();
  }, [dbReady, authUser?.id]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    const channel = supabase
      .channel('rank_display_names_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rank_display_names' }, () => {
        requestRefresh('ranks');
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbReady, authUser?.id]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    const channel = supabase
      .channel('managed_quiz_questions_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'managed_quiz_questions' }, (payload) => {
        if (payload?.eventType === 'UPDATE' && payload?.new?.updated_by === authUser?.id) return;
        requestRefresh('managedQuiz');
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbReady, authUser?.id]);

  useEffect(() => {
    if (!dbReady || !supabase) return;
    const channel = supabase
      .channel('unified_quiz_model_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, () => { refreshUnifiedQuizModelFromDb(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_questions' }, () => { refreshUnifiedQuizModelFromDb(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_assignments' }, () => { refreshUnifiedQuizModelFromDb(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_attempts' }, () => { refreshUnifiedQuizModelFromDb(); })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbReady, authUser?.id]);

  useEffect(() => {
    if (!dbReady || !supabase || !canManageUsers) return;
    const channel = supabase
      .channel('audit_logs_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
        requestRefresh('audit');
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbReady, canManageUsers]);

  const baseChecksByRole = useMemo(() => {
    const map = Object.fromEntries(roles.map(role => [role, []]));
    checkboxCatalog
      .filter(item => item.category === 'role')
      .forEach(item => {
        const scopedRanks = parseRankScope(item.role);
        const targets = scopedRanks.length ? scopedRanks : roles;
        targets.forEach(rank => {
          if (map[rank]) map[rank].push(item.title);
        });
      });
    return map;
  }, [checkboxCatalog]);

  const dynamicCoreValues = useMemo(() => checkboxCatalog.filter(item => item.category === 'core'), [checkboxCatalog]);

  const dynamicPermissions = useMemo(() => checkboxCatalog.filter(item => item.category === 'permission'), [checkboxCatalog]);

  const dynamicQuizMap = useMemo(
    () => Object.fromEntries(checkboxCatalog.map(item => {
      const payload = parseQuizPayload(item.answer);
      return [
        item.title,
        {
          question: item.question,
          answer: payload.correct.join('\n'),
          category: item.category === 'role' ? item.role || 'Role' : item.category === 'core' ? 'Core Value' : 'Permission',
        },
      ];
    })),
    [checkboxCatalog]
  );

  const manualCheckedByTitle = useMemo(
    () => Object.fromEntries(checkboxCatalog.map(item => [item.title, Boolean(parseQuizPayload(item.answer).manual)])),
    [checkboxCatalog]
  );

  const filteredCheckboxItems = useMemo(() => {
    const roleOrder = new Map(roles.map((role, index) => [role, index]));
    const q = deferredCheckboxQuery.trim().toLowerCase();
    return checkboxCatalog
      .filter(item => item.category === checkboxMenu)
      .filter(item => {
        if (!q) return true;
        const haystack = [item.title, item.question, item.answer].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .filter(item => {
        if (checkboxRankFilter === 'All') return true;
        const scopedRanks = parseRankScope(item.role);
        if (!scopedRanks.length) return true;
        return scopedRanks.includes(checkboxRankFilter);
      })
      .sort((a, b) => {
        const aRanks = sortRankScope(parseRankScope(a.role));
        const bRanks = sortRankScope(parseRankScope(b.role));

        const aIsAllRanks = aRanks.length === 0;
        const bIsAllRanks = bRanks.length === 0;
        if (aIsAllRanks && !bIsAllRanks) return -1;
        if (!aIsAllRanks && bIsAllRanks) return 1;

        const aRankIndex = aIsAllRanks ? -1 : (roleOrder.get(aRanks[0]) ?? 999);
        const bRankIndex = bIsAllRanks ? -1 : (roleOrder.get(bRanks[0]) ?? 999);
        if (aRankIndex !== bRankIndex) return aRankIndex - bRankIndex;

        const aScopeCount = aRanks.length;
        const bScopeCount = bRanks.length;
        if (aScopeCount !== bScopeCount) return bScopeCount - aScopeCount;

        return a.title.localeCompare(b.title);
      });
  }, [checkboxCatalog, checkboxMenu, deferredCheckboxQuery, checkboxRankFilter]);

  const checkboxRowsWithDividers = useMemo(() => {
    const rows = [];
    let lastGroupKey = null;
    filteredCheckboxItems.forEach(item => {
      const ranks = sortRankScope(parseRankScope(item.role));
      const groupKey = ranks.length ? ranks[0] : 'ALL';
      if (groupKey !== lastGroupKey) {
        rows.push({ type: 'divider', key: `divider-${groupKey}`, groupKey });
        lastGroupKey = groupKey;
      }
      rows.push({ type: 'item', item });
    });
    return rows;
  }, [filteredCheckboxItems]);

  function itemMatchesRank(item, rank) {
    const scopedRanks = parseRankScope(item.role);
    if (!scopedRanks.length) return true;
    return scopedRanks.includes(rank);
  }

  const unifiedQuizMap = useMemo(
    () => new Map((unifiedQuizzes || []).map(item => [item.id, item])),
    [unifiedQuizzes]
  );

  const unifiedAssignedQuizKeysByStaff = useMemo(() => {
    const map = new Map();
    (unifiedQuizAssignments || []).forEach(item => {
      if (!item || item.status === 'revoked') return;
      const quiz = unifiedQuizMap.get(item.quiz_id);
      if (!quiz?.quiz_key || !item.staff_member_id) return;
      if (!map.has(item.staff_member_id)) map.set(item.staff_member_id, new Set());
      map.get(item.staff_member_id).add(quiz.quiz_key);
    });
    return map;
  }, [unifiedQuizAssignments, unifiedQuizMap]);

  const unifiedQuizHistoryByStaff = useMemo(() => {
    const answersByAttempt = new Map();
    (unifiedQuizAttemptAnswers || []).forEach(row => {
      if (!row?.attempt_id) return;
      if (!answersByAttempt.has(row.attempt_id)) answersByAttempt.set(row.attempt_id, []);
      answersByAttempt.get(row.attempt_id).push({
        id: row.id,
        title: row.question_prompt || 'Question',
        selected: row.selected_answer,
        correct: row.correct_answer,
        isCorrect: Boolean(row.is_correct),
      });
    });

    const map = new Map();
    (unifiedQuizAttempts || []).forEach(item => {
      if (!item?.staff_member_id) return;
      const quiz = unifiedQuizMap.get(item.quiz_id);
      const attempt = {
        id: item.legacy_attempt_id || item.id,
        at: item.submitted_at,
        quizKey: quiz?.quiz_key || 'unknown',
        title: quiz?.title || quiz?.quiz_key || 'Quiz attempt',
        category: quiz?.quiz_category || 'quiz',
        score: Number(item.score || 0),
        passed: Boolean(item.passed),
        reviewStatus: normalizeReviewStatus(item.review_status || 'pending'),
        reviewNote: item.review_note || '',
        reviewedBy: item.reviewed_by || null,
        reviewedAt: item.reviewed_at || null,
        items: answersByAttempt.get(item.id) || [],
      };
      if (!map.has(item.staff_member_id)) map.set(item.staff_member_id, []);
      map.get(item.staff_member_id).push(attempt);
    });
    map.forEach(value => value.sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()));
    return map;
  }, [unifiedQuizAttemptAnswers, unifiedQuizAttempts, unifiedQuizMap]);

  const staffRecords = useMemo(() => {
    return staff.map(member => {
      const assignedFromUnified = unifiedAssignedQuizKeysByStaff.get(member.id);
      const historyFromUnified = unifiedQuizHistoryByStaff.get(member.id) || [];
      const legacyHistory = Array.isArray(member.quizHistory) ? member.quizHistory : [];
      const mergedHistory = [...historyFromUnified];
      const seenAttemptIds = new Set(historyFromUnified.map(item => String(item?.id || '')));
      legacyHistory.forEach(item => {
        const key = String(item?.id || '');
        if (key && seenAttemptIds.has(key)) return;
        mergedHistory.push(item);
      });
      mergedHistory.sort((a, b) => new Date(b?.at || 0).getTime() - new Date(a?.at || 0).getTime());
      return {
        ...member,
        assignedQuizKeys: assignedFromUnified
          ? Array.from(new Set([...(member.assignedQuizKeys || []), ...Array.from(assignedFromUnified)])).sort((a, b) => a.localeCompare(b))
          : Array.isArray(member.assignedQuizKeys)
            ? [...member.assignedQuizKeys].sort((a, b) => a.localeCompare(b))
            : [],
        quizHistory: mergedHistory,
      };
    });
  }, [staff, unifiedAssignedQuizKeysByStaff, unifiedQuizHistoryByStaff]);

  const activeStaffRecords = useMemo(() => staffRecords.filter(member => !member.isRemoved), [staffRecords]);
  const removedStaffRecords = useMemo(() => staffRecords.filter(member => member.isRemoved).sort((a, b) => new Date(b.removedAt || 0).getTime() - new Date(a.removedAt || 0).getTime()), [staffRecords]);

  const filtered = useMemo(() => {
    const trainerNames = new Set(
      activeStaffRecords
        .map(s => s.trainer)
        .filter(name => name && name !== 'Unassigned' && name !== 'Head Team')
    );
    const roleOrder = new Map(roles.map((role, index) => [role, index]));
    const list = activeStaffRecords.filter(s =>
      (s.name.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      s.status.toLowerCase().includes(deferredQuery.toLowerCase())) &&
      (filterRole === 'All' || s.role === filterRole) &&
      (!filterTrainerOnly || trainerNames.has(s.name)) &&
      (!filterActiveOnly || s.status === 'Active') &&
      (!filterWarningOnly || (s.disciplinary?.warnings || 0) > 0 || (s.disciplinary?.actions || 0) > 0)
    );
    return list.sort((a, b) => {
      const rankDiff = (roleOrder.get(a.role) ?? 999) - (roleOrder.get(b.role) ?? 999);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name);
    });
  }, [activeStaffRecords, deferredQuery, filterRole, filterTrainerOnly, filterActiveOnly, filterWarningOnly]);

  const traineeRecord = (canUseViewAs && viewAsRole === 'staff_in_training')
    ? (activeStaffRecords.find(s => s.id === viewAsStaffId) || activeStaffRecords.find(s => s.id === selectedId) || activeStaffRecords[0] || null)
    : (activeStaffRecords.find(s => s.traineeUserId === authUser?.id) || null);
  const selected = isStaffInTraining ? traineeRecord : (activeStaffRecords.find(s => s.id === selectedId) || activeStaffRecords[0] || null);
  const sessionCandidates = useMemo(() => {
    const q = deferredSessionUserQuery.trim().toLowerCase();
    return activeStaffRecords
      .filter(member => sessionRankFilter === 'All' || member.role === sessionRankFilter)
      .filter(member => {
        if (!q) return true;
        const haystack = [member.name, member.role, member.status, member.trainer].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeStaffRecords, sessionRankFilter, deferredSessionUserQuery]);
  const sessionTarget = activeStaffRecords.find(member => member.id === sessionTargetId) || sessionCandidates[0] || null;
  const disciplineCandidates = useMemo(() => {
    const q = deferredDisciplineUserQuery.trim().toLowerCase();
    return activeStaffRecords
      .filter(member => disciplineRankFilter === 'All' || member.role === disciplineRankFilter)
      .filter(member => {
        if (!q) return true;
        const haystack = [member.name, member.role, member.status, member.trainer].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeStaffRecords, disciplineRankFilter, deferredDisciplineUserQuery]);
  const disciplineTarget = activeStaffRecords.find(member => member.id === disciplineTargetId) || disciplineCandidates[0] || null;
  const auditActionOptions = useMemo(
    () => [...new Set([...KNOWN_AUDIT_ACTIONS, ...(auditLogs || []).map(log => String(log.action || '')).filter(Boolean)])].sort((a, b) => a.localeCompare(b)),
    [auditLogs]
  );
  const auditTabOptions = AUDIT_TAB_FILTER_OPTIONS;
  const auditActorOptions = useMemo(() => {
    return (managementUsers || [])
      .map(user => ({ id: user.id || '', label: user.username || user.id || 'Unknown' }))
      .filter(option => option.id)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [managementUsers]);
  const filteredAuditLogs = useMemo(() => {
    const q = deferredAuditQuery.trim().toLowerCase();
    const fieldNeedle = deferredAuditFieldQuery.trim().toLowerCase();
    const now = Date.now();
    const cutoff = auditDateFilter === '24h'
      ? now - 24 * 60 * 60 * 1000
      : auditDateFilter === '7d'
        ? now - 7 * 24 * 60 * 60 * 1000
        : auditDateFilter === '30d'
          ? now - 30 * 24 * 60 * 60 * 1000
          : null;

    return (auditLogs || [])
      .filter(log => log.action !== 'staff.toggle')
      .filter(log => (auditTabFilter === 'All' ? true : inferAuditTab(log.action) === auditTabFilter))
      .filter(log => (auditActorFilter === 'All' ? true : log.actor_id === auditActorFilter))
      .filter(log => (auditActionFilter === 'All' ? true : String(log.action || '') === auditActionFilter))
      .filter(log => {
        if (!cutoff) return true;
        const ts = new Date(log.created_at || 0).getTime();
        return Number.isFinite(ts) && ts >= cutoff;
      })
      .filter(log => {
        const changedFields = log.after_value && typeof log.after_value === 'object' && !Array.isArray(log.after_value)
          ? Object.keys(log.after_value)
          : [];
        if (auditRequireChanges && !changedFields.length) return false;
        if (!fieldNeedle) return true;
        return changedFields.some(field => field.toLowerCase().includes(fieldNeedle));
      })
      .filter(log => {
        if (!q) return true;
        const actor = managementUsers.find(user => user.id === log.actor_id);
        const target = getAuditTargetPresentation(log, staffRecords, managementUsers);
        const haystack = [
          log.action,
          inferAuditTab(log.action),
          log.target_id,
          target.label,
          target.meta,
          actor?.username,
          log.actor_id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [auditLogs, auditTabFilter, auditActorFilter, auditActionFilter, auditDateFilter, auditRequireChanges, deferredAuditFieldQuery, deferredAuditQuery, managementUsers, staffRecords]);

  useEffect(() => {
    if (!(canUseViewAs && viewAsRole === 'staff_in_training')) return;
    if (!staffRecords.length) {
      setViewAsStaffId(null);
      return;
    }
    const exists = viewAsStaffId !== null && staffRecords.some(member => member.id === viewAsStaffId);
    if (!exists) setViewAsStaffId(selectedId ?? staffRecords[0].id);
  }, [canUseViewAs, viewAsRole, viewAsStaffId, staffRecords, selectedId]);

  useEffect(() => {
    if (!staffRecords.length) {
      setSessionTargetId(null);
      setDisciplineTargetId(null);
      return;
    }
    const sessionTargetStillExists = sessionTargetId !== null && staffRecords.some(member => member.id === sessionTargetId);
    if (!sessionTargetStillExists) {
      setSessionTargetId(selected?.id ?? staffRecords[0].id);
    }
    const targetStillExists = disciplineTargetId !== null && staffRecords.some(member => member.id === disciplineTargetId);
    if (targetStillExists) return;
    setDisciplineTargetId(selected?.id ?? staffRecords[0].id);
  }, [staffRecords, selected?.id, disciplineTargetId, sessionTargetId]);

  useEffect(() => {
    setTrainingLogDraft(prev => ({ ...prev, note: '' }));
  }, [sessionTargetId]);

  useEffect(() => {
    const traineeTabs = ['myprogress', 'essentials', 'stafftools'];
    const staffTabs = ['employee', 'quizknowledge', 'essentials', 'stafftools', 'management', 'tracker', 'session', 'progression', 'discipline', 'audit', 'ranks', 'checkboxes', ...(canManageInterviews ? ['interviews'] : [])];
    const allowed = isStaffInTraining ? traineeTabs : staffTabs;
    const fallback = isStaffInTraining ? 'myprogress' : 'employee';
    if (!allowed.includes(activeMainTab)) setActiveMainTab(fallback);
  }, [isStaffInTraining, activeMainTab, canManageInterviews]);

  useEffect(() => {
    if (activeMainTab === 'interviews') {
      refreshInterviewQuestionBankFromDb();
      refreshInterviewApplicationsFromDb();
    }
  }, [activeMainTab]);

  useEffect(() => {
    if (!isStaffInTraining && activeMainTab === 'myprogress') {
      setActiveMainTab('employee');
    }
  }, [isStaffInTraining, activeMainTab]);

  useEffect(() => {
    if (!sessionTarget) return;
    setSessionNotesDraft({
      strongSides: sessionTarget.strongSides || '',
      attentionPoints: sessionTarget.attentionPoints || '',
      notes: sessionTarget.notes || '',
    });
    setSessionActionsDraft({
      trainer: sessionTarget.trainer || 'Unassigned',
      status: sessionTarget.status || 'In Training',
    });
  }, [sessionTarget?.id, sessionTarget?.strongSides, sessionTarget?.attentionPoints, sessionTarget?.notes, sessionTarget?.trainer, sessionTarget?.status]);

  const currentChecks = selected ? (baseChecksByRole[selected.role] || []) : [];
  const currentCoreValues = selected
    ? dynamicCoreValues.filter(item => itemMatchesRank(item, selected.role)).map(item => item.title)
    : [];
  const currentPermissions = selected
    ? dynamicPermissions.filter(item => itemMatchesRank(item, selected.role)).map(item => item.title)
    : [];

  function syncOperationalTargets(memberId) {
    if (memberId === null || memberId === undefined) return;
    setSessionTargetId(memberId);
    setDisciplineTargetId(memberId);
  }

  function checklistPercent(keys, source) {
    if (!keys.length) return 0;
    const done = keys.filter(key => Boolean(source?.[key])).length;
    return Math.round((done / keys.length) * 100);
  }
  function getKnowledgeQuizSortMeta(definition) {
    if (definition.kind === 'mandatory') return { group: 0, rank: -1, category: 0 };
    if (definition.kind === 'pack') {
      const categoryMap = { 'Entry Quiz': 0, 'Core Values Quiz': 1, 'Staff Menu Quiz': 2 };
      return {
        group: 1,
        rank: roles.indexOf(definition.rankKey || ''),
        category: categoryMap[definition.badge] ?? 9,
      };
    }
    if (definition.kind === 'video') {
      return {
        group: 2,
        rank: definition.rankKey ? roles.indexOf(definition.rankKey) : 99,
        category: 0,
      };
    }
    return {
      group: 3,
      rank: definition.rankKey ? roles.indexOf(definition.rankKey) : 99,
      category: 9,
    };
  }

  function getQuizAttemptSummary(member, quizKey) {
    const attempts = (member?.quizHistory || []).filter(item => item.quizKey === quizKey || item.quiz_key === quizKey);
    const latest = attempts[0] || null;
    return {
      latest,
      count: attempts.length,
      passed: Boolean(latest?.passed),
      score: latest?.score ?? null,
    };
  }

  function getKnowledgeQuizProgress(definition, member) {
    if (!member || !definition) return { percent: 0, label: 'Not started' };
    const summary = getQuizAttemptSummary(member, definition.key);
    if (summary.latest) {
      if (definition.kind === 'video') {
        const reviewStatus = normalizeReviewStatus(summary.latest.reviewStatus);
        return {
          percent: 100,
          label: reviewStatus === 'approved' ? 'Approved video review' : reviewStatus === 'needs_retake' ? 'Retake required' : 'Submitted for review',
        };
      }
      return {
        percent: summary.passed ? 100 : Math.max(Number(summary.score || 0), 0),
        label: summary.passed ? 'Passed ' + summary.score + '%' : 'Latest ' + summary.score + '%',
      };
    }
    if (definition.kind === 'pack') {
      const titles = (definition.sourceItems || []).map(item => item.sourceCheckbox?.title).filter(Boolean);
      const source = definition.key.endsWith('|role')
        ? member.checks
        : definition.key.endsWith('|core')
          ? member.values
          : member.permissions;
      const percent = checklistPercent(titles, source);
      return { percent, label: percent + '% complete' };
    }
    return { percent: 0, label: 'Not attempted' };
  }

  function isQuizVisibleForMember(definition, member) {
    if (!definition || !member) return false;
    if (definition.kind === 'mandatory') return true;
    if ((member.assignedQuizKeys || []).includes(definition.key)) return true;
    return definition.rankKey === member.role;
  }


  const knowledgeQuizDefinitions = useMemo(() => {
    const categoryLabels = {
      role: 'Entry Quiz',
      core: 'Core Values Quiz',
      permission: 'Staff Menu Quiz',
    };

    if (unifiedQuizzes.length && unifiedQuizQuestions.length) {
      const questionsByQuiz = new Map();
      (unifiedQuizQuestions || []).forEach(item => {
        if (!item?.quiz_id) return;
        if (!questionsByQuiz.has(item.quiz_id)) questionsByQuiz.set(item.quiz_id, []);
        questionsByQuiz.get(item.quiz_id).push(item);
      });

      const definitions = (unifiedQuizzes || [])
        .filter(item => item?.is_active !== false)
        .map(quiz => {
          const sortedQuestions = [...(questionsByQuiz.get(quiz.id) || [])].sort((a, b) => Number(a.question_order || 0) - Number(b.question_order || 0));
          const rankScope = Array.isArray(quiz.rank_scope) ? quiz.rank_scope.map(value => String(value || '')).filter(Boolean) : [];
          const rankKey = rankScope[0] || '';
          const badge = quiz.quiz_category === 'entry'
            ? 'Entry Quiz'
            : quiz.quiz_category === 'core_values'
              ? 'Core Values Quiz'
              : quiz.quiz_category === 'staff_menu'
                ? 'Staff Menu Quiz'
                : quiz.quiz_kind === 'mandatory'
                  ? 'Mandatory'
                  : 'Managed Quiz';
          const kind = quiz.quiz_kind === 'rank_pack'
            ? 'pack'
            : quiz.quiz_kind === 'mandatory'
              ? 'mandatory'
              : 'managed';
          const sourceType = quiz.source_type === 'legacy_checkbox' ? 'checkbox' : 'managed';
          const sourceItems = sortedQuestions.map(item => {
            const sourceCheckbox = sourceType === 'checkbox'
              ? checkboxCatalog.find(entry => String(entry.id) === String(item.legacy_source_id)) || null
              : null;
            const checkboxPayload = sourceCheckbox ? parseQuizPayload(sourceCheckbox.answer) : null;
            const fallbackCorrectAnswer = Array.isArray(item.correct_answers) ? String(item.correct_answers[0] || '') : '';
            const fallbackWrongAnswers = Array.isArray(item.wrong_answers) ? item.wrong_answers.map(value => String(value || '')).filter(Boolean).slice(0, 3) : [];
            const correctAnswer = checkboxPayload?.correct?.length
              ? String(checkboxPayload.correct[0] || '')
              : fallbackCorrectAnswer;
            const wrongAnswers = checkboxPayload
              ? (checkboxPayload.manual
                  ? (checkboxPayload.wrong || []).map(value => String(value || '').trim()).filter(Boolean).slice(0, 3)
                  : buildRuleAlignedFalseAnswers({
                      title: sourceCheckbox?.title || item.question || 'Question',
                      question: sourceCheckbox?.question || item.question || '',
                      correct: correctAnswer,
                      existingWrong: checkboxPayload.wrong,
                      bracketTag: checkboxPayload.bracket,
                    }))
              : fallbackWrongAnswers;
            return {
              id: item.id,
              legacySourceId: item.legacy_source_id || null,
              category: checkboxPayload?.bracket || sourceCheckbox?.title || item.category || 'General Rules',
              question: sourceCheckbox?.question || item.question || sourceCheckbox?.title || 'Question',
              correctAnswer,
              wrongAnswers,
              sourceCheckbox,
              quizKey: quiz.quiz_key,
              quizTitle: quiz.title,
              quizDescription: quiz.description || '',
              rankKey,
              passScore: Number(quiz.pass_score || 80),
              questionOrder: Number(item.question_order || 0),
            };
          });

          return {
            key: quiz.quiz_key,
            title: quiz.title,
            description: quiz.description || 'Knowledge quiz.',
            badge,
            kind,
            rankLabel: rankKey ? rankLabel(rankKey) : null,
            rankKey,
            passScore: Number(quiz.pass_score || 80),
            sourceType,
            sourceItems,
            questions: sourceItems.map(item => {
              const options = shuffleArray([item.correctAnswer, ...(item.wrongAnswers || [])].filter(Boolean));
              return {
                category: item.category || 'General Rules',
                question: item.question,
                options,
                answer: Math.max(options.indexOf(item.correctAnswer), 0),
              };
            }),
          };
        })
        .filter(definition => definition.questions.length);

      const normalizedUnified = definitions
        .map(definition => {
          const sortMeta = getKnowledgeQuizSortMeta(definition);
          return {
            ...definition,
            sortLabel: definition.kind === 'pack'
              ? `${rankLabel(definition.rankKey)} ${definition.badge}`
              : definition.kind === 'mandatory'
                ? 'All trainees'
                : definition.rankKey
                  ? `${rankLabel(definition.rankKey)} Additional`
                  : 'Additional quiz',
            sortWeight: sortMeta,
          };
        });

      const unifiedKeys = new Set(normalizedUnified.map(item => item.key));
      const fallbackPackDefinitions = [];
      const fallbackGrouped = new Map();

      checkboxCatalog.forEach(item => {
        if (!['role', 'core', 'permission'].includes(item.category)) return;
        const payload = parseQuizPayload(item.answer);
        const primaryCorrect = payload.correct?.[0];
        if (!primaryCorrect) return;
        const wrongAnswers = payload.manual
          ? (payload.wrong || []).map(v => String(v || '').trim()).filter(Boolean).slice(0, 3)
          : buildRuleAlignedFalseAnswers({
              title: item.title,
              question: item.question,
              correct: primaryCorrect,
              existingWrong: payload.wrong,
              bracketTag: payload.bracket,
            });
        const scope = sortRankScope(item.ranks || parseRankScope(item.role) || []);
        (scope.length ? scope : roles).forEach(rank => {
          const key = `${rank}|${item.category}`;
          if (unifiedKeys.has(key)) return;
          if (!fallbackGrouped.has(key)) {
            fallbackGrouped.set(key, {
              key,
              title: `${rankLabel(rank)} ${categoryLabels[item.category]}`,
              description: `${rankLabel(rank)} ${categoryLabels[item.category].toLowerCase()} built from the current knowledge catalog.`,
              badge: categoryLabels[item.category],
              kind: 'pack',
              rankLabel: rankLabel(rank),
              rankKey: rank,
              passScore: 90,
              sourceType: 'checkbox',
              sourceItems: [],
              questions: [],
            });
          }
          const definition = fallbackGrouped.get(key);
          const options = shuffleArray([primaryCorrect, ...wrongAnswers].filter(Boolean));
          definition.sourceItems.push({
            id: item.id,
            category: payload.bracket || categoryLabels[item.category],
            question: item.question || item.title,
            correctAnswer: primaryCorrect,
            wrongAnswers,
            sourceCheckbox: item,
          });
          definition.questions.push({
            category: payload.bracket || categoryLabels[item.category],
            question: item.question || item.title,
            options,
            answer: Math.max(options.indexOf(primaryCorrect), 0),
          });
        });
      });

      fallbackPackDefinitions.push(...Array.from(fallbackGrouped.values()).filter(definition => definition.questions.length));

      const normalizedVideoDefinitions = videoQuizzes
        .filter(item => item.isActive !== false)
        .map(item => {
          const definition = {
            id: item.id,
            key: item.quizKey,
            title: item.title,
            description: item.description || 'Watch the training clips and submit your notes for review.',
            badge: 'Video Quiz',
            kind: 'video',
            rankLabel: item.rankKey ? rankLabel(item.rankKey) : null,
            rankKey: item.rankKey || '',
            passScore: 100,
            sourceType: 'video',
            scenes: item.scenes || [],
            sourceItems: [],
            questions: [],
          };
          const sortMeta = getKnowledgeQuizSortMeta(definition);
          return {
            ...definition,
            sortLabel: definition.rankKey ? rankLabel(definition.rankKey) + ' Video Quiz' : 'Video quiz',
            sortWeight: sortMeta,
          };
        });

      return [...normalizedUnified, ...fallbackPackDefinitions, ...normalizedVideoDefinitions]
        .sort((a, b) => {
          if (a.sortWeight?.group !== undefined && b.sortWeight?.group !== undefined && a.sortWeight.group !== b.sortWeight.group) return a.sortWeight.group - b.sortWeight.group;
          const aMeta = a.sortWeight || getKnowledgeQuizSortMeta(a);
          const bMeta = b.sortWeight || getKnowledgeQuizSortMeta(b);
          if (aMeta.group !== bMeta.group) return aMeta.group - bMeta.group;
          if (aMeta.rank !== bMeta.rank) return aMeta.rank - bMeta.rank;
          if (aMeta.category !== bMeta.category) return aMeta.category - bMeta.category;
          return a.title.localeCompare(b.title);
        });
    }

    const managedByQuizKey = new Map();
    managedQuizQuestions.forEach(item => {
      if (!managedByQuizKey.has(item.quizKey)) managedByQuizKey.set(item.quizKey, []);
      managedByQuizKey.get(item.quizKey).push(item);
    });

    const mandatoryManaged = (managedByQuizKey.get('mandatory-general') || []).sort((a, b) => Number(a.questionOrder || 0) - Number(b.questionOrder || 0));
    const mandatorySourceItems = mandatoryManaged.length
      ? mandatoryManaged
      : EXPERIMENTAL_QUIZ_QUESTIONS.map((item, index) => ({
          id: `seed-${index + 1}`,
          quizKey: 'mandatory-general',
          quizTitle: 'Mandatory Quiz - General Rules',
          quizDescription: 'General rules, reporting, RP standards, and enforcement baseline.',
          quizKind: 'mandatory',
          rankKey: '',
          passScore: 80,
          questionOrder: index + 1,
          category: item.category || 'General Rules',
          question: item.question,
          correctAnswer: item.options?.[item.answer] || '',
          wrongAnswers: (item.options || []).filter((_, optionIndex) => optionIndex !== item.answer).slice(0, 3),
        }));

    const definitions = [
      {
        key: 'mandatory-general',
        title: 'Mandatory Quiz - General Rules',
        description: 'General rules, reporting, RP standards, and enforcement baseline.',
        badge: 'Mandatory',
        kind: 'mandatory',
        rankLabel: null,
        rankKey: '',
        passScore: 80,
        sourceType: 'managed',
        sourceItems: mandatorySourceItems,
        questions: mandatorySourceItems.map(item => {
          const options = shuffleArray([item.correctAnswer, ...(item.wrongAnswers || [])].filter(Boolean));
          return {
            category: item.category || 'General Rules',
            question: item.question,
            options,
            answer: Math.max(options.indexOf(item.correctAnswer), 0),
          };
        }),
      },
    ];

    Array.from(managedByQuizKey.entries())
      .filter(([quizKey]) => quizKey !== 'mandatory-general')
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .forEach(([quizKey, rows]) => {
        const sortedRows = [...rows].sort((a, b) => Number(a.questionOrder || 0) - Number(b.questionOrder || 0));
        const sample = sortedRows[0];
        definitions.push({
          key: quizKey,
          title: sample.quizTitle || quizKey,
          description: sample.quizDescription || 'Managed knowledge quiz.',
          badge: 'Managed Quiz',
          kind: 'managed',
          rankLabel: sample.rankKey ? rankLabel(sample.rankKey) : null,
          rankKey: sample.rankKey || '',
          passScore: Number(sample.passScore || 80),
          sourceType: 'managed',
          sourceItems: sortedRows,
          questions: sortedRows.map(item => {
            const options = shuffleArray([item.correctAnswer, ...(item.wrongAnswers || [])].filter(Boolean));
            return {
              category: item.category || 'General Rules',
              question: item.question,
              options,
              answer: Math.max(options.indexOf(item.correctAnswer), 0),
            };
          }),
        });
      });

    videoQuizzes
      .filter(item => item.isActive !== false)
      .forEach(item => {
        definitions.push({
          id: item.id,
          key: item.quizKey,
          title: item.title,
          description: item.description || 'Watch the training clips and submit your notes for review.',
          badge: 'Video Quiz',
          kind: 'video',
          rankLabel: item.rankKey ? rankLabel(item.rankKey) : null,
          rankKey: item.rankKey || '',
          passScore: 100,
          sourceType: 'video',
          scenes: item.scenes || [],
          sourceItems: [],
          questions: [],
        });
      });

    const grouped = new Map();

    checkboxCatalog.forEach(item => {
      if (!['role', 'core', 'permission'].includes(item.category)) return;
      const payload = parseQuizPayload(item.answer);
      const primaryCorrect = payload.correct?.[0];
      if (!primaryCorrect) return;
      const wrongAnswers = payload.manual
        ? (payload.wrong || []).map(v => String(v || '').trim()).filter(Boolean).slice(0, 3)
        : buildRuleAlignedFalseAnswers({
            title: item.title,
            question: item.question,
            correct: primaryCorrect,
            existingWrong: payload.wrong,
            bracketTag: payload.bracket,
          });
      const scope = sortRankScope(item.ranks || parseRankScope(item.role) || []);
      (scope.length ? scope : roles).forEach(rank => {
        const key = `${rank}|${item.category}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            key,
            title: `${rankLabel(rank)} ${categoryLabels[item.category]}`,
            description: `${rankLabel(rank)} ${categoryLabels[item.category].toLowerCase()} built from the current knowledge catalog.`,
            badge: categoryLabels[item.category],
            kind: 'pack',
            rankLabel: rankLabel(rank),
            rankKey: rank,
            passScore: 90,
            sourceType: 'checkbox',
            sourceItems: [],
            questions: [],
          });
        }
        const definition = grouped.get(key);
        const options = shuffleArray([primaryCorrect, ...wrongAnswers].filter(Boolean));
        definition.sourceItems.push({
          id: item.id,
          category: payload.bracket || categoryLabels[item.category],
          question: item.question || item.title,
          correctAnswer: primaryCorrect,
          wrongAnswers,
          sourceCheckbox: item,
        });
        definition.questions.push({
          category: payload.bracket || categoryLabels[item.category],
          question: item.question || item.title,
          options,
          answer: Math.max(options.indexOf(primaryCorrect), 0),
        });
      });
    });

    definitions.push(
      ...Array.from(grouped.values()).filter(definition => definition.questions.length)
    );

    return definitions
      .map(definition => {
        const sortMeta = getKnowledgeQuizSortMeta(definition);
        return {
          ...definition,
          sortLabel: definition.kind === 'pack'
            ? `${rankLabel(definition.rankKey)} ${definition.badge}`
            : definition.kind === 'mandatory'
              ? 'All trainees'
              : definition.rankKey
                ? `${rankLabel(definition.rankKey)} Additional`
                : 'Additional quiz',
          sortWeight: sortMeta,
        };
      })
      .sort((a, b) => {
        if (a.sortWeight.group !== b.sortWeight.group) return a.sortWeight.group - b.sortWeight.group;
        if (a.sortWeight.rank !== b.sortWeight.rank) return a.sortWeight.rank - b.sortWeight.rank;
        if (a.sortWeight.category !== b.sortWeight.category) return a.sortWeight.category - b.sortWeight.category;
        return a.title.localeCompare(b.title);
      });
  }, [checkboxCatalog, managedQuizQuestions, unifiedQuizzes, unifiedQuizQuestions, videoQuizzes, roles, rankLabel]);
  const displayedKnowledgeQuizDefinitions = useMemo(() => {
    const source = isStaffInTraining
      ? knowledgeQuizDefinitions.filter(definition => isQuizVisibleForMember(definition, selected))
      : knowledgeQuizDefinitions;
    return source.map(definition => ({
      ...definition,
      progressLabel: isStaffInTraining ? getKnowledgeQuizProgress(definition, selected).label : null,
      progressPercent: isStaffInTraining ? getKnowledgeQuizProgress(definition, selected).percent : null,
    }));
  }, [isStaffInTraining, knowledgeQuizDefinitions, selected]);

  const displayedStaffEssentials = useMemo(() => (
    (canManageEssentials ? staffEssentials : staffEssentials.filter(item => item.isActive !== false))
      .slice()
      .sort((a, b) => {
        if (a.section !== b.section) return String(a.section).localeCompare(String(b.section));
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return String(a.title).localeCompare(String(b.title));
      })
  ), [staffEssentials, canManageEssentials]);

  const selectedStaffQuizDefinitions = useMemo(() => {
    if (!selected) return [];
    return knowledgeQuizDefinitions
      .filter(definition => isQuizVisibleForMember(definition, selected))
      .map(definition => {
        const attemptSummary = getQuizAttemptSummary(selected, definition.key);
        return {
          ...definition,
          progress: getKnowledgeQuizProgress(definition, selected),
          attemptSummary,
          reviewStatus: normalizeReviewStatus(attemptSummary.latest?.reviewStatus),
        };
      });
  }, [knowledgeQuizDefinitions, selected]);

  const getRequiredQuizDefinitions = useCallback((member) => {
    if (!member) return [];
    return knowledgeQuizDefinitions.filter(definition => isQuizVisibleForMember(definition, member));
  }, [knowledgeQuizDefinitions]);

  const getMemberTrainingSummary = useCallback((member) => {
    const requiredDefinitions = getRequiredQuizDefinitions(member);
    return buildReviewSummary(requiredDefinitions, member, getKnowledgeQuizProgress, getQuizAttemptSummary);
  }, [getRequiredQuizDefinitions]);

  const completionPercent = useCallback((member) => {
    if (!member) return 0;
    return getMemberTrainingSummary(member).readiness;
  }, [getMemberTrainingSummary]);

  const totals = {
    total: staffRecords.length,
    inTraining: staffRecords.filter(s => s.status === 'In Training').length,
    promotionReady: staffRecords.filter(s => {
      const summary = getMemberTrainingSummary(s);
      return summary.total > 0 && summary.approved === summary.total && s.signedOff;
    }).length,
    signedOff: staffRecords.filter(s => s.signedOff).length,
  };

  const currentWeekStart = useMemo(() => startOfCurrentWeek(), []);

  const weeklyStaffJoiners = useMemo(
    () => activeStaffRecords
      .filter(member => isOnOrAfterDate(member.staffSince, currentWeekStart))
      .sort((a, b) => new Date(b.staffSince || 0).getTime() - new Date(a.staffSince || 0).getTime()),
    [activeStaffRecords, currentWeekStart]
  );

  const weeklyStaffLeavers = useMemo(
    () => removedStaffRecords
      .filter(member => isOnOrAfterDate(member.removedAt, currentWeekStart))
      .sort((a, b) => new Date(b.removedAt || 0).getTime() - new Date(a.removedAt || 0).getTime()),
    [removedStaffRecords, currentWeekStart]
  );

  const allCompletedQuizAttempts = useMemo(
    () => staffRecords
      .flatMap(member => (Array.isArray(member.quizHistory) ? member.quizHistory : []).map(attempt => ({
        ...attempt,
        staffId: member.id,
        staffName: member.name,
        staffRole: member.role,
      })))
      .filter(attempt => attempt?.at)
      .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()),
    [staffRecords]
  );

  const weeklyCompletedQuizAttempts = useMemo(
    () => allCompletedQuizAttempts.filter(attempt => isOnOrAfterDate(attempt.at, currentWeekStart)),
    [allCompletedQuizAttempts, currentWeekStart]
  );

  const manualCompletedQuizAttempts = useMemo(
    () => allCompletedQuizAttempts.filter(attempt => /staff team overview/i.test(String(attempt.reviewNote || ''))),
    [allCompletedQuizAttempts]
  );

  const headerSummaryCards = [
    { label: 'Total Staff', value: totals.total, icon: Users },
    { label: 'In Training', value: totals.inTraining, icon: GraduationCap },
    { label: 'Promo Ready', value: totals.promotionReady, icon: ArrowUpRight },
    { label: 'Signed Off', value: totals.signedOff, icon: CheckCircle2 },
    { label: 'New Staff This Week', value: weeklyStaffJoiners.length, icon: Plus, onClick: () => setWeeklyStaffOpen(true) },
    { label: 'Quizzes This Week', value: weeklyCompletedQuizAttempts.length, icon: ClipboardList, onClick: () => setWeeklyQuizOpen(true) },
  ];

  const selectedKnowledgeQuiz = useMemo(
    () => displayedKnowledgeQuizDefinitions.find(item => item.key === selectedKnowledgeQuizKey) || displayedKnowledgeQuizDefinitions[0] || null,
    [displayedKnowledgeQuizDefinitions, selectedKnowledgeQuizKey]
  );

  const selectedTrainingSummary = useMemo(() => getMemberTrainingSummary(selected), [selected, getMemberTrainingSummary]);
  const sessionTargetTrainingSummary = useMemo(() => getMemberTrainingSummary(sessionTarget), [sessionTarget, getMemberTrainingSummary]);

  useEffect(() => {
    if (displayedKnowledgeQuizDefinitions.some(item => item.key === selectedKnowledgeQuizKey)) return;
    setSelectedKnowledgeQuizKey(displayedKnowledgeQuizDefinitions[0]?.key || 'mandatory-general');
  }, [displayedKnowledgeQuizDefinitions, selectedKnowledgeQuizKey]);

  useEffect(() => {
    if (!dbReady || !supabase || !canManageCheckboxes || isStaffInTraining || quizShellBackfillBusyRef.current) return;
    const existingKeys = new Set((unifiedQuizzes || []).map(item => item.quiz_key));
    const missingDefinitions = knowledgeQuizDefinitions.filter(definition => definition.kind !== 'video' && !existingKeys.has(definition.key));
    if (!missingDefinitions.length) return;

    quizShellBackfillBusyRef.current = true;
    void (async () => {
      try {
        for (const definition of missingDefinitions) {
          await resolveUnifiedQuizRow(definition.key, definition);
        }
        await refreshUnifiedQuizModelFromDb();
      } catch (error) {
        console.error('Failed to backfill unified quiz shells', error);
      } finally {
        quizShellBackfillBusyRef.current = false;
      }
    })();
  }, [dbReady, supabase, canManageCheckboxes, isStaffInTraining, knowledgeQuizDefinitions, unifiedQuizzes]);

  useEffect(() => {
    if (displayedStaffEssentials.some(item => item.slug === selectedEssentialSlug)) return;
    setSelectedEssentialSlug(displayedStaffEssentials[0]?.slug || '');
  }, [displayedStaffEssentials, selectedEssentialSlug]);

  const filteredManagementUsers = useMemo(() => {
    const needle = managementQuery.trim().toLowerCase();
    return (managementUsers || [])
      .filter(user => {
        if (managementView === 'applicants') return !user.is_active;
        if (managementView === 'head_admins') return user.role === 'head_admin';
        return true;
      })
      .filter(user => {
        if (!needle) return true;
        const haystack = [user.username, user.id, user.role].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(needle);
      });
  }, [managementUsers, managementQuery, managementView]);

  useEffect(() => {
    setReviewDrafts({});
  }, [selected?.id]);

  function stripRemovalFields(payload) {
    const next = { ...payload };
    delete next.is_removed;
    delete next.removed_at;
    delete next.removed_by;
    delete next.removal_reason;
    delete next.removal_notes;
    return next;
  }

  async function saveStaffMember(member) {
    if (!dbReady || !supabase) return;
    const memberId = member?.id;
    if (!memberId) return;

    const previous = staffSaveQueueRef.current.get(memberId) || Promise.resolve();
    const next = previous.catch(() => {}).then(async () => {
      lastLocalStaffEditRef.current = Date.now();
      holdRealtimeSync(2600);

      const payload = {
        id: member.id,
        name: member.name,
        role: member.role,
        trainer: member.trainer,
        trainee_user_id: member.traineeUserId || null,
        profile_image: member.profileImage || null,
        status: member.status,
        strong_sides: member.strongSides || '',
        attention_points: member.attentionPoints || '',
        signed_off: Boolean(member.signedOff),
        staff_since: member.staffSince || 'N/A',
        role_since: member.modSince || 'N/A',
        promotion: member.promotion || null,
        checks: member.checks || {},
        values: member.values || {},
        permissions: member.permissions || {},
        disciplinary: member.disciplinary || { warnings: 0, actions: 0, logs: [] },
        quiz_history: Array.isArray(member.quizHistory) ? member.quizHistory : [],
        assigned_quiz_keys: Array.isArray(member.assignedQuizKeys) ? member.assignedQuizKeys : [],
        training_logs: Array.isArray(member.trainingLogs) ? member.trainingLogs : [],
        notes: member.notes || '',
        is_removed: Boolean(member.isRemoved),
        removed_at: member.removedAt || null,
        removed_by: member.removedBy || null,
        removal_reason: member.removalReason || null,
        removal_notes: member.removalNotes || null,
        updated_by: authUser?.id || null,
      };

      const safePayload = removalColumnsAvailableRef.current ? payload : stripRemovalFields(payload);
      const { error } = await supabase.from('staff_members').upsert(safePayload);
      if (!error) return;
      const fallback = stripRemovalFields(payload);
      const { error: fallbackError } = await supabase.from('staff_members').upsert(fallback);
      if (fallbackError) throw fallbackError;
      removalColumnsAvailableRef.current = false;
    });

    staffSaveQueueRef.current.set(memberId, next);
    try {
      await next;
    } finally {
      if (staffSaveQueueRef.current.get(memberId) === next) {
        staffSaveQueueRef.current.delete(memberId);
      }
    }
  }

  async function removeStaffMemberFromDb(staffId, removal) {
    if (!dbReady || !supabase) {
      throw new Error('Database is not ready yet.');
    }
    const payload = {
      is_removed: true,
      status: 'Removed',
      removed_at: new Date().toISOString(),
      removed_by: profile?.username || authUser?.email?.split('@')[0] || 'Unknown',
      removal_reason: removal?.reason || null,
      removal_notes: removal?.notes || null,
      updated_by: authUser?.id || null,
    };
    const { error, data } = await supabase
      .from('staff_members')
      .update(payload)
      .eq('id', staffId)
      .select('id')
      .maybeSingle();
    if (error) {
      if (String(error.message || '').match(/is_removed|removed_at|removed_by|removal_reason|removal_notes/i) || error.code === 'PGRST204') {
        removalColumnsAvailableRef.current = false;
        throw new Error('Removal tracking columns are missing in Supabase. Run the latest SQL block first.');
      }
      throw error;
    }
    if (!data?.id) {
      throw new Error('Staff member could not be removed.');
    }
    return payload;
  }

  async function writeAudit(action, targetId, beforeValue, afterValue) {
    if (!dbReady || !supabase || !authUser?.id) return;
    if (action === 'staff.toggle') return;
    await supabase.from('audit_logs').insert({
      actor_id: authUser.id,
      action,
      target_id: String(targetId),
      before_value: beforeValue || null,
      after_value: afterValue || null,
    });
  }

  async function resolveUnifiedQuizRow(quizKey, quizDefinition = null) {
    if (!dbReady || !supabase || !quizKey) return null;
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, quiz_key')
      .eq('quiz_key', quizKey)
      .maybeSingle();
    if (data?.id) return data;
    if (error || !quizDefinition) return null;

    const quizCategory = quizDefinition.kind === 'mandatory'
      ? 'mandatory'
      : quizDefinition.badge === 'Entry Quiz'
        ? 'entry'
        : quizDefinition.badge === 'Core Values Quiz'
          ? 'core_values'
          : quizDefinition.badge === 'Staff Menu Quiz'
            ? 'staff_menu'
            : 'custom';
    const quizKind = quizDefinition.kind === 'mandatory'
      ? 'mandatory'
      : quizDefinition.kind === 'pack'
        ? 'rank_pack'
        : quizDefinition.sourceType === 'managed'
          ? 'managed'
          : 'custom';
    const rankScope = quizDefinition.rankKey ? [quizDefinition.rankKey] : [];
    const { data: createdRow, error: createError } = await supabase
      .from('quizzes')
      .upsert({
        quiz_key: quizKey,
        title: quizDefinition.title || quizKey,
        description: quizDefinition.description || '',
        quiz_kind: quizKind,
        quiz_category: quizCategory,
        rank_scope: rankScope,
        pass_score: Number(quizDefinition.recommendedPass || 80),
        source_type: quizDefinition.sourceType === 'checkbox'
          ? 'legacy_checkbox'
          : quizDefinition.kind === 'video'
          ? 'video'
          : quizDefinition.sourceType === 'managed'
            ? 'legacy_managed'
            : 'native',
        updated_by: authUser?.id || null,
      })
      .select('id, quiz_key')
      .single();
    if (createError) return null;
    return createdRow || null;
  }

  async function syncManagedQuestionToUnifiedModel(item) {
    if (!dbReady || !supabase || !item?.quizKey) return;
    const rankScope = item.rankKey ? [item.rankKey] : [];
    const quizKind = item.quizKey === 'mandatory-general' ? 'mandatory' : 'managed';
    const quizCategory = item.quizKey === 'mandatory-general' ? 'mandatory' : 'custom';
    const { data: quizRow, error: quizError } = await supabase
      .from('quizzes')
      .upsert({
        quiz_key: item.quizKey,
        title: item.quizTitle,
        description: item.quizDescription || '',
        quiz_kind: quizKind,
        quiz_category: quizCategory,
        rank_scope: rankScope,
        pass_score: Number(item.passScore || 80),
        source_type: 'native',
        updated_by: authUser?.id || null,
      })
      .select('id')
      .single();
    if (quizError || !quizRow?.id) return;

    await supabase
      .from('quiz_questions')
      .upsert({
        quiz_id: quizRow.id,
        legacy_source_id: item.id || null,
        question_order: Number(item.questionOrder || 0),
        category: item.category || 'General Rules',
        question: item.question || '',
        correct_answers: [item.correctAnswer || ''],
        wrong_answers: (item.wrongAnswers || []).filter(Boolean),
        updated_by: authUser?.id || null,
      });
  }

  async function removeManagedQuestionFromUnifiedModel(itemId, quizKey) {
    if (!dbReady || !supabase) return;
    let quizId = null;
    if (quizKey) {
      const quizRow = await resolveUnifiedQuizRow(quizKey);
      quizId = quizRow?.id || null;
    }
    if (quizId && itemId) {
      await supabase.from('quiz_questions').delete().eq('quiz_id', quizId).eq('legacy_source_id', itemId);
      const { count } = await supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', quizId);
      if (!count) {
        await supabase.from('quizzes').delete().eq('id', quizId);
      }
    }
  }



  async function syncQuizAttemptToUnifiedModel(staffMember, quizDefinition, attempt) {
    if (!dbReady || !supabase || !staffMember?.id || !quizDefinition?.key || !attempt?.id) return;
    const quizRow = await resolveUnifiedQuizRow(quizDefinition.key, quizDefinition);
    if (!quizRow?.id) return;

    const { data: attemptRow, error: attemptError } = await supabase
      .from('quiz_attempts')
      .upsert({
        legacy_attempt_id: attempt.id,
        quiz_id: quizRow.id,
        staff_member_id: staffMember.id,
        profile_id: staffMember.traineeUserId || null,
        score: Number(attempt.score || 0),
        passed: Boolean(attempt.passed),
        submitted_at: attempt.at || new Date().toISOString(),
        review_status: toDatabaseReviewStatus(attempt.reviewStatus || 'pending'),
        review_note: attempt.reviewNote || null,
        reviewed_by: attempt.reviewedBy || null,
        reviewed_at: attempt.reviewedAt || null,
      })
      .select('id')
      .single();
    if (attemptError || !attemptRow?.id) return;

    await supabase.from('quiz_attempt_answers').delete().eq('attempt_id', attemptRow.id);
    const answerRows = (attempt.items || []).map((item, index) => ({
      attempt_id: attemptRow.id,
      question_order: index + 1,
      question_prompt: item.title || ('Question ' + (index + 1)),
      selected_answer: item.selected === null || item.selected === undefined ? null : String(item.selected),
      correct_answer: item.correct || null,
      is_correct: Boolean(item.isCorrect),
    }));
    if (answerRows.length) {
      await supabase.from('quiz_attempt_answers').insert(answerRows);
    }
  }

  async function syncQuizAttemptReviewToUnifiedModel(attemptId, patch) {
    if (!dbReady || !supabase || !attemptId) return;
    const payload = {
      review_status: toDatabaseReviewStatus(patch.reviewStatus || 'pending'),
      review_note: patch.reviewNote || null,
      reviewed_by: patch.reviewedBy || null,
      reviewed_at: patch.reviewedAt || null,
    };
    const { data: found } = await supabase.from('quiz_attempts').select('id').eq('legacy_attempt_id', attemptId).limit(1);
    if (found?.length) {
      await supabase.from('quiz_attempts').update(payload).eq('legacy_attempt_id', attemptId);
      return;
    }
    await supabase.from('quiz_attempts').update(payload).eq('id', attemptId);
  }

  function updateSelected(patch) {
    if (!selected || (!canEdit && !isStaffInTraining)) return;
    let updated = null;
    setStaff(prev => prev.map(s => {
      if (s.id !== selected.id) return s;
      updated = { ...s, ...patch };
      return updated;
    }));
    if (updated) {
      saveStaffMember(updated);
      writeAudit('staff.update', updated.id, null, patch);
    }
  }

  function toggleQuizAssignment(quizDefinition) {
    if (!selected || !canEdit || !quizDefinition) return;
    const current = new Set(selected.assignedQuizKeys || []);
    const assigning = !current.has(quizDefinition.key);
    if (assigning) current.add(quizDefinition.key);
    else current.delete(quizDefinition.key);
    const nextAssignedQuizKeys = [...current].sort((a, b) => a.localeCompare(b));
    updateSelected({ assignedQuizKeys: nextAssignedQuizKeys });
    void syncQuizAssignmentToUnifiedModel(selected.id, quizDefinition.key, assigning);
    writeAudit('staff.quiz_assignment', selected.id, null, { quizKey: quizDefinition.key, assigned: assigning });
  }

  function handleKnowledgeQuizComplete(quizDefinition, result) {
    if (!selected || !quizDefinition) return;
    const answeredItems = Array.isArray(result?.answers) ? result.answers : [];
    const attempt = {
      id: `${Date.now()}-${quizDefinition.key}`,
      at: new Date().toISOString(),
      quizKey: quizDefinition.key,
      title: quizDefinition.title,
      category: quizDefinition.badge,
      score: Number(result?.scorePercent || 0),
      passed: Boolean(result?.passed),
      reviewStatus: 'pending',
      reviewNote: '',
      reviewedBy: null,
      reviewedAt: null,
      items: answeredItems.map((item, index) => ({
        id: `${quizDefinition.key}-${index + 1}`,
        title: item.question,
        selected: item.selectedAnswer ?? (item.selectedIndex === null || item.selectedIndex === undefined ? null : item.selectedIndex),
        correct: item.correctAnswer,
        isCorrect: Boolean(item.correct),
      })),
    };

    let updatedMember = null;
    setStaff(prev => prev.map(member => {
      if (member.id !== selected.id) return member;
      const quizHistory = [attempt, ...(Array.isArray(member.quizHistory) ? member.quizHistory : [])].slice(0, 200);
      const patch = { quizHistory };

      if (attempt.passed && quizDefinition.kind === 'pack') {
        const sourceTitles = (quizDefinition.sourceItems || []).map(item => item.sourceCheckbox?.title).filter(Boolean);
        if (quizDefinition.key.endsWith('|role')) {
          patch.checks = { ...(member.checks || {}), ...Object.fromEntries(sourceTitles.map(title => [title, true])) };
        } else if (quizDefinition.key.endsWith('|core')) {
          patch.values = { ...(member.values || {}), ...Object.fromEntries(sourceTitles.map(title => [title, true])) };
        } else {
          patch.permissions = { ...(member.permissions || {}), ...Object.fromEntries(sourceTitles.map(title => [title, true])) };
        }
      }

      updatedMember = { ...member, ...patch };
      return updatedMember;
    }));

    if (updatedMember) {
      void (async () => {
        try {
          await saveStaffMember(updatedMember);
          await syncQuizAttemptToUnifiedModel(updatedMember, quizDefinition, attempt);
          await refreshUnifiedQuizModelFromDb();
        } catch (error) {
          console.error('Quiz completion save failed', error);
          window.alert(`Quiz save failed: ${error?.message || 'Unknown error'}`);
        }
      })();
      writeAudit('quiz.submit', updatedMember.id, null, { quizKey: quizDefinition.key, score: attempt.score, passed: attempt.passed });
    }
  }
  async function setSelectedQuizManualState(quizDefinition, status) {
    if (!selected || !canEdit || !quizDefinition) return;
    const now = new Date().toISOString();
    const reviewerName = profile?.username || authUser?.email?.split('@')[0] || 'Reviewer';
    const targetId = selected.id;
    const summary = getQuizAttemptSummary(selected, quizDefinition.key);
    const latest = summary.latest;
    const baseItems = latest?.items?.length
      ? latest.items
      : (quizDefinition.questions || []).map((question, index) => ({
          id: quizDefinition.key + '-' + (index + 1),
          title: question.question,
          selected: null,
          correct: question.correctAnswer,
          isCorrect: status === 'approved',
        }));

    const nextAttempt = latest
      ? { ...latest }
      : {
          id: 'manual-' + Date.now() + '-' + quizDefinition.key,
          at: now,
          quizKey: quizDefinition.key,
          title: quizDefinition.title,
          category: quizDefinition.badge,
          score: 0,
          passed: false,
          reviewStatus: 'pending',
          reviewNote: '',
          reviewedBy: null,
          reviewedAt: null,
          items: baseItems,
        };

    if (status === 'approved') {
      nextAttempt.passed = true;
      nextAttempt.score = 100;
      nextAttempt.reviewStatus = 'approved';
      nextAttempt.reviewNote = 'Marked 100% complete from Staff Team Overview.';
      nextAttempt.reviewedBy = reviewerName;
      nextAttempt.reviewedAt = now;
      nextAttempt.items = baseItems.map(item => ({ ...item, selected: item.correct, isCorrect: true }));
    } else if (status === 'needs_retake') {
      nextAttempt.passed = false;
      nextAttempt.score = Math.min(Number(nextAttempt.score || 0), 99);
      nextAttempt.reviewStatus = 'needs_retake';
      nextAttempt.reviewNote = 'Manually marked for retake from Staff Team Overview.';
      nextAttempt.reviewedBy = reviewerName;
      nextAttempt.reviewedAt = now;
    } else if (status === 'pending') {
      nextAttempt.reviewStatus = 'pending';
      nextAttempt.reviewNote = 'Marked pending review from Staff Team Overview.';
      nextAttempt.reviewedBy = reviewerName;
      nextAttempt.reviewedAt = now;
    } else if (status === 'reset') {
      nextAttempt.passed = false;
      nextAttempt.score = 0;
      nextAttempt.reviewStatus = 'pending';
      nextAttempt.reviewNote = 'Progress reset from Staff Team Overview.';
      nextAttempt.reviewedBy = reviewerName;
      nextAttempt.reviewedAt = now;
      nextAttempt.items = [];
    }

    const nextHistory = [
      nextAttempt,
      ...(selected.quizHistory || []).filter(attempt => attempt.id !== nextAttempt.id),
    ].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()).slice(0, 200);

    const nextMember = { ...selected, quizHistory: nextHistory };
    setStaff(prev => prev.map(member => (member.id === targetId ? { ...member, quizHistory: nextHistory } : member)));

    try {
      await saveStaffMember(nextMember);
      await syncQuizAttemptToUnifiedModel(nextMember, quizDefinition, nextAttempt);
      await writeAudit('staff.quiz_review_override', selected.id, null, {
        quizKey: quizDefinition.key,
        status,
        score: nextAttempt.score,
        passed: nextAttempt.passed,
      });
    } catch (error) {
      window.alert('Quiz override failed: ' + (error?.message || 'Unknown error'));
    }
  }

  function buildResetProgressForRole(nextRole) {
    return {
      checks: Object.fromEntries((baseChecksByRole[nextRole] || []).map(item => [item, false])),
      values: Object.fromEntries(
        dynamicCoreValues
          .filter(item => itemMatchesRank(item, nextRole))
          .map(item => [item.title, false])
      ),
      permissions: Object.fromEntries(
        dynamicPermissions
          .filter(item => itemMatchesRank(item, nextRole))
          .map(item => [item.title, false])
      ),
      signedOff: false,
    };
  }

  function updateSessionTarget(patch) {
    if (!sessionTarget || !canEdit) return;
    let updated = null;
    setStaff(prev => prev.map(s => {
      if (s.id !== sessionTarget.id) return s;
      updated = { ...s, ...patch };
      return updated;
    }));
    if (updated) {
      saveStaffMember(updated);
      writeAudit('staff.session.update', updated.id, null, patch);
    }
  }

  function promoteSessionTarget() {
    if (!sessionTarget || !canEdit) return;
    const currentIndex = roles.indexOf(sessionTarget.role);
    if (currentIndex >= roles.length - 1) return;
    const nextRole = roles[currentIndex + 1];
    const today = new Date().toISOString().slice(0, 10);
    const resetProgress = buildResetProgressForRole(nextRole);
    updateSessionTarget({
      role: nextRole,
      promotion: roles[Math.min(currentIndex + 2, roles.length - 1)],
      ...resetProgress,
      modSince: today,
    });
  }

  function demoteSessionTarget() {
    if (!sessionTarget || !canEdit) return;
    const currentIndex = roles.indexOf(sessionTarget.role);
    if (currentIndex <= 0) return;
    const nextRole = roles[currentIndex - 1];
    const today = new Date().toISOString().slice(0, 10);
    const resetProgress = buildResetProgressForRole(nextRole);
    updateSessionTarget({
      role: nextRole,
      promotion: roles[currentIndex],
      ...resetProgress,
      modSince: today,
    });
  }

  function openRemoveStaffModal(targetId) {
    if (!targetId) return;
    setRemoveStaffTargetId(targetId);
    setRemoveStaffReason('');
    setRemoveStaffNotes('');
    setRemoveStaffOpen(true);
  }

  async function confirmRemoveStaff() {
    const target = staffRecords.find(member => member.id === removeStaffTargetId);
    if (!target || !canDeleteStaff || deletingStaffId) return;
    const reason = removeStaffReason.trim();
    const notes = removeStaffNotes.trim();
    if (!reason) {
      window.alert('Removal reason is required.');
      return;
    }

    setDeletingStaffId(target.id);
    try {
      const removalPayload = await removeStaffMemberFromDb(target.id, { reason, notes });
      const updatedTarget = {
        ...target,
        isRemoved: true,
        status: 'Removed',
        removedAt: removalPayload.removed_at,
        removedBy: removalPayload.removed_by,
        removalReason: reason,
        removalNotes: notes,
      };
      const nextStaff = staff.map(member => (member.id === target.id ? updatedTarget : member));
      setStaff(nextStaff);
      const nextActive = nextStaff.filter(member => !member.isRemoved);
      setSelectedId(nextActive[0]?.id || null);
      setSessionTargetId(nextActive[0]?.id || null);
      setDisciplineTargetId(nextActive[0]?.id || null);
      setRemoveStaffOpen(false);
      setSessionActionsOpen(false);
      await writeAudit('staff.delete', target.id, target, { reason, notes, removedAt: removalPayload.removed_at, removedBy: removalPayload.removed_by });
    } catch (error) {
      window.alert(`Delete failed: ${error.message}`);
    } finally {
      setDeletingStaffId(null);
    }
  }

  async function removeSessionTargetStaff() {
    if (!sessionTarget || !canDeleteStaff || activeStaffRecords.length <= 1 || deletingStaffId) return;
    openRemoveStaffModal(sessionTarget.id);
  }

  function toggleCheck(key, category) {
    if (!selected || !canEdit) return;
    let updated = null;
    setStaff(prev =>
      prev.map(s => {
        if (s.id !== selected.id) return s;
        if (category === 'checks') {
          updated = { ...s, checks: { ...s.checks, [key]: !s.checks[key] } };
          return updated;
        }
        if (category === 'permissions') {
          updated = { ...s, permissions: { ...s.permissions, [key]: !s.permissions[key] } };
          return updated;
        }
        updated = { ...s, values: { ...s.values, [key]: !s.values[key] } };
        return updated;
      })
    );
    if (updated) {
      saveStaffMember(updated);
      writeAudit('staff.toggle', updated.id, null, { category, key });
    }
  }

  function applyDisciplinary(type) {
    if (!disciplineTarget || !canEdit || !disciplineReason.trim()) return;
    const today = new Date().toISOString().slice(0, 10);

    let updated = null;
    setStaff(prev =>
      prev.map(s => {
        if (s.id !== disciplineTarget.id) return s;
        const current = s.disciplinary || { warnings: 0, actions: 0, logs: [] };
        const nextWarnings = type === 'Warning' ? current.warnings + 1 : current.warnings;
        const nextActions = type === 'Disciplinary Action' ? current.actions + 1 : current.actions;
        const nextLog = {
          id: Date.now(),
          type,
          reason: disciplineReason.trim(),
          issuer: disciplineIssuer.trim() || 'Unassigned',
          date: today,
        };

        updated = {
          ...s,
          disciplinary: {
            warnings: nextWarnings,
            actions: nextActions,
            logs: [nextLog, ...(current.logs || [])],
          },
        };
        return updated;
      })
    );
    if (updated) {
      saveStaffMember(updated);
      writeAudit('staff.disciplinary', updated.id, null, { type, reason: disciplineReason.trim() });
    }

    setDisciplineOpen(false);
    setDisciplineReason('');
    setDisciplineIssuer('');
  }

  function promoteSelected() {
    if (!selected || !canEdit) return;
    const currentIndex = roles.indexOf(selected.role);
    if (currentIndex >= roles.length - 1) return;
    const nextRole = roles[currentIndex + 1];
    const today = new Date().toISOString().slice(0, 10);
    const resetProgress = buildResetProgressForRole(nextRole);
    updateSelected({
      role: nextRole,
      promotion: roles[Math.min(currentIndex + 2, roles.length - 1)],
      ...resetProgress,
      modSince: today,
    });
  }

  function demoteSelected() {
    if (!selected || !canEdit) return;
    const currentIndex = roles.indexOf(selected.role);
    if (currentIndex <= 0) return;
    const nextRole = roles[currentIndex - 1];
    const today = new Date().toISOString().slice(0, 10);
    const resetProgress = buildResetProgressForRole(nextRole);
    updateSelected({
      role: nextRole,
      promotion: roles[currentIndex],
      ...resetProgress,
      modSince: today,
    });
  }

  async function removeSelectedStaff() {
    if (!selected || !canDeleteStaff || activeStaffRecords.length <= 1 || deletingStaffId) return;
    openRemoveStaffModal(selected.id);
  }

  async function fileToDataUrl(file) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }

  async function uploadStaffProfileImage(file, staffId) {
    if (!dbReady || !supabase) return await fileToDataUrl(file);

    const extRaw = (file.name?.split('.').pop() || 'png').toLowerCase();
    const safeExt = extRaw.replace(/[^a-z0-9]/g, '') || 'png';
    const path = `staff/${staffId}/${Date.now()}.${safeExt}`;

    const { error } = await supabase.storage
      .from('staff-cards')
      .upload(path, file, { upsert: true, contentType: file.type || 'image/png' });

    if (error) {
      return await fileToDataUrl(file);
    }

    const { data } = supabase.storage.from('staff-cards').getPublicUrl(path);
    return data?.publicUrl || (await fileToDataUrl(file));
  }

  async function handleProfileFile(file) {
    if (!file || !canEdit || !selected) return;
    const persistedUrl = await uploadStaffProfileImage(file, selected.id);
    updateSelected({ profileImage: persistedUrl });
  }

  function openAddStaffModal() {
    setAddStaffForm({
      name: '',
      role: 'T-MOD',
      trainer: 'Unassigned',
      avatar: '',
      staffSince: todayIsoDate(),
      modSince: todayIsoDate(),
    });
    setAddStaffCardFile(null);
    setAddStaffOpen(true);
  }

  function updateQuizReview(attemptId, patch) {
    if (!sessionTarget || !canEdit) return;
    const nextHistory = (sessionTarget.quizHistory || []).map(attempt =>
      attempt.id === attemptId ? { ...attempt, ...patch } : attempt
    );
    updateSessionTarget({ quizHistory: nextHistory });
    void syncQuizAttemptReviewToUnifiedModel(attemptId, patch);
  }

  function applyQuizReview(attemptId, status) {
    const reviewerName = profile?.username || authUser?.email?.split('@')[0] || 'Reviewer';
    const note = reviewDrafts[attemptId] ?? '';
    updateQuizReview(attemptId, {
      reviewStatus: status,
      reviewNote: note.trim(),
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
    });
  }

  function addTrainingLogEntry() {
    if (!sessionTarget || !canEdit) return;
    const note = String(trainingLogDraft.note || '').trim();
    if (!note) return;
    const trainerName = profile?.username || authUser?.email?.split('@')[0] || 'Trainer';
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      bracket: trainingLogDraft.bracket || 'General Policy',
      note,
      trainerName,
      trainerId: authUser?.id || null,
    };
    const nextLogs = [entry, ...(sessionTarget.trainingLogs || [])].slice(0, 500);
    updateSessionTarget({ trainingLogs: nextLogs });
    writeAudit('staff.training_log.add', sessionTarget.id, null, { bracket: entry.bracket, note: entry.note });
    setTrainingLogDraft(prev => ({ ...prev, note: '' }));
  }

  function saveSessionNotesDraft() {
    if (!sessionTarget || !canEdit) return;
    updateSessionTarget({
      strongSides: sessionNotesDraft.strongSides,
      attentionPoints: sessionNotesDraft.attentionPoints,
      notes: sessionNotesDraft.notes,
    });
    setSessionNotesOpen(false);
  }

  function saveSessionActionsDraft() {
    if (!sessionTarget || !canEdit) return;
    updateSessionTarget({
      trainer: sessionActionsDraft.trainer,
      status: sessionActionsDraft.status,
    });
    setSessionActionsOpen(false);
  }

  async function copyStaffToolFormat() {
    const payload = [
      '```ini',
      `[License]: ${staffToolForm.license || ''}`,
      `[Discord ID]: ${staffToolForm.discordId || ''}`,
      `[Reason]: ${staffToolForm.reason || ''}`,
      `[Clip Link]: ${staffToolForm.clipLink || ''}`,
      '```',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
      setStaffToolCopiedOpen(true);
    } catch (_) {
      window.alert('Copy failed. Clipboard permission was denied.');
    }
  }

  async function addStaff() {
    if (!canEdit || !addStaffForm.name.trim()) return;
    const roleChecks = Object.fromEntries((baseChecksByRole[addStaffForm.role] || []).map(item => [item, false]));
    const valueChecks = Object.fromEntries(
      dynamicCoreValues
        .filter(item => itemMatchesRank(item, addStaffForm.role))
        .map(item => [item.title, false])
    );
    const nextId = Date.now();
    let resolvedProfileImage = addStaffForm.avatar.trim() || '';
    if (addStaffCardFile) {
      resolvedProfileImage = await uploadStaffProfileImage(addStaffCardFile, nextId);
    }
    const next = {
      id: nextId,
      name: addStaffForm.name.trim(),
      role: addStaffForm.role,
      trainer: addStaffForm.trainer.trim() || 'Unassigned',
      profileImage: resolvedProfileImage,
      status: 'In Training',
      strongSides: '',
      attentionPoints: '',
      signedOff: false,
      staffSince: addStaffForm.staffSince || todayIsoDate(),
      modSince: addStaffForm.modSince || todayIsoDate(),
      promotion: roles[Math.min(roles.indexOf(addStaffForm.role) + 1, roles.length - 1)],
      checks: roleChecks,
      permissions: Object.fromEntries(
        dynamicPermissions
          .filter(item => itemMatchesRank(item, addStaffForm.role))
          .map(item => [item.title, false])
      ),
      values: valueChecks,
      disciplinary: { warnings: 0, actions: 0, logs: [] },
      quizHistory: [],
      trainingLogs: [],
      notes: '',
    };
    setStaff(prev => [next, ...prev]);
    setSelectedId(next.id);
    setAddStaffOpen(false);
    setAddStaffCardFile(null);
    saveStaffMember(next);
    writeAudit('staff.create', next.id, null, next);
  }

  async function syncMissingRosterProfiles() {
    if (!canManageUsers) return;
    const rosterRows = parseRosterInputText(rosterSyncText);
    if (!rosterRows.length) {
      window.alert('No valid roster rows found. Paste lines like: "1 Junior Associate    Begoshi"');
      return;
    }
    const existingNames = new Set(staff.map(member => String(member.name || '').trim().toLowerCase()));
    const missing = rosterRows.filter(entry => !existingNames.has(String(entry.name || '').trim().toLowerCase()));
    if (!missing.length) {
      window.alert('All listed roster members already have tracker profiles.');
      return;
    }

    const baseId = Date.now();
    const additions = missing.map((entry, index) => {
      const role = mapRosterRankToRole(entry.rank);
      const roleChecks = Object.fromEntries((baseChecksByRole[role] || []).map(item => [item, false]));
      const valueChecks = Object.fromEntries(
        dynamicCoreValues
          .filter(item => itemMatchesRank(item, role))
          .map(item => [item.title, false])
      );
      const permissionChecks = Object.fromEntries(
        dynamicPermissions
          .filter(item => itemMatchesRank(item, role))
          .map(item => [item.title, false])
      );
      return {
        id: baseId + index + 1,
        name: entry.name,
        role,
        trainer: 'Unassigned',
        profileImage: '',
        status: 'In Training',
        strongSides: '',
        attentionPoints: '',
        signedOff: false,
        staffSince: todayIsoDate(),
        modSince: todayIsoDate(),
        promotion: roles[Math.min(roles.indexOf(role) + 1, roles.length - 1)],
        checks: roleChecks,
        permissions: permissionChecks,
        values: valueChecks,
        disciplinary: { warnings: 0, actions: 0, logs: [] },
        quizHistory: [],
        trainingLogs: [],
        notes: `Auto-created from roster seed (${entry.rank}).`,
      };
    });

    setStaff(prev => [...prev, ...additions]);
    await Promise.all(additions.map(member => saveStaffMember(member)));
    await writeAudit('staff.roster_sync', 'bulk', null, { added: additions.map(m => ({ name: m.name, role: m.role })) });
    window.alert(`Added ${additions.length} missing roster profile(s).`);
    setRosterSyncOpen(false);
  }

  async function updateUserRole(userId, nextRole) {
    if (!canManageUsers || !dbReady || !supabase) return;
    await supabase.from('profiles').update({ role: nextRole }).eq('id', userId);
    setManagementUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: nextRole } : u)));
    await writeAudit('user.role.update', userId, null, { role: nextRole });
  }

  async function toggleUserActive(userId, isActive) {
    if (!canManageUsers || !dbReady || !supabase) return;
    await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId);
    setManagementUsers(prev => prev.map(u => (u.id === userId ? { ...u, is_active: isActive } : u)));
    await writeAudit('user.active.update', userId, null, { is_active: isActive });
  }

  async function deleteManagedUser(userId) {
    if (!canManageUsers || !dbReady || !supabase) return;
    const target = managementUsers.find(u => u.id === userId);
    if (target?.is_developer) {
      window.alert('Developer account is protected and cannot be deleted.');
      return;
    }
    if (userId === profile?.id) {
      window.alert('You cannot delete your own account from this screen.');
      return;
    }
    const confirmed = window.confirm('Permanently delete this dashboard account? This removes login access, email/password auth, and profile data.');
    if (!confirmed) return;

    const { error } = await supabase.rpc('admin_delete_user', { target_user: userId });
    if (error) {
      window.alert(`Delete failed: ${error.message}`);
      return;
    }
    setManagementUsers(prev => prev.filter(u => u.id !== userId));
    setStaff(prev => prev.map(member => (member.traineeUserId === userId ? { ...member, traineeUserId: null } : member)));
    await writeAudit('user.delete', userId, null, { deleted: true });
  }

  async function updateUserAvatar(userId, avatarUrl) {
    if (!canManageUsers || !dbReady || !supabase) return;
    await supabase.from('profiles').update({ avatar_url: avatarUrl || null }).eq('id', userId);
    setManagementUsers(prev => prev.map(u => (u.id === userId ? { ...u, avatar_url: avatarUrl || null } : u)));
    if (profile?.id === userId) {
      window.location.reload();
    }
    await writeAudit('user.avatar.update', userId, null, { avatar_url: avatarUrl || null });
  }

  async function handleManagementAvatarFile(userId, file) {
    if (!file || !canManageUsers) return;
    const avatarUrl = await uploadStaffProfileImage(file, `profile-${userId}`);
    await updateUserAvatar(userId, avatarUrl);
  }

  async function toggleGodKey(userId, enabled) {
    if (!canManageUsers || !dbReady || !supabase) return;
    await supabase.from('profiles').update({ god_key_enabled: enabled }).eq('id', userId);
    setManagementUsers(prev => prev.map(u => (u.id === userId ? { ...u, god_key_enabled: enabled } : u)));
    await writeAudit('user.god_key.update', userId, null, { god_key_enabled: enabled });
    if (profile?.id === userId) onProfileRefresh?.();
  }

  async function toggleExperimentalQuizAccess(userId, enabled) {
    if (effectiveRole !== 'head_admin' || !dbReady || !supabase) return;
    await supabase.from('profiles').update({ experimental_quiz_enabled: enabled }).eq('id', userId);
    setManagementUsers(prev => prev.map(u => (u.id === userId ? { ...u, experimental_quiz_enabled: enabled } : u)));
    await writeAudit('user.experimental_quiz.update', userId, null, { experimental_quiz_enabled: enabled });
    if (profile?.id === userId) onProfileRefresh?.();
  }

  async function saveUserIdentifiers(userId) {
    if (!canManageUsers || !dbReady || !supabase) return;
    const target = managementUsers.find(user => user.id === userId);
    const identifiers = normalizeProfileIdentifiers(managementIdentifierDrafts[userId] || target?.identifiers);
    const { error } = await supabase.from('profiles').update({ identifiers }).eq('id', userId);
    if (error) {
      if (error.code === '42703' || error.code === 'PGRST204' || /identifiers/i.test(String(error.message || error.details || ''))) {
        window.alert('Identifiers are not enabled in Supabase yet. Run the latest SQL block first.');
        return;
      }
      window.alert('Identifier save failed: ' + (error.message || 'Unknown error'));
      return;
    }
    setManagementUsers(prev => prev.map(user => (user.id === userId ? { ...user, identifiers } : user)));
    await writeAudit('user.identifiers.update', userId, null, { identifiers });
  }

  async function forceHeadAdminReset() {
    if (!profile?.god_key_enabled || !dbReady || !supabase || !authUser?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'head_admin', is_active: true })
      .eq('id', authUser.id);
    if (error) {
      window.alert(`God Key reset failed: ${error.message}`);
      return;
    }
    await writeAudit('god_key.force_head_admin', authUser.id, null, { role: 'head_admin', is_active: true });
    onProfileRefresh?.();
    setTimeout(() => window.location.reload(), 400);
  }

  async function assignUserToStaff(userId, staffId) {
    if (!canManageUsers || !dbReady || !supabase) return;
    await supabase.from('staff_members').update({ trainee_user_id: null }).eq('trainee_user_id', userId);
    if (staffId === 'none') {
      setStaff(prev => prev.map(member => (member.traineeUserId === userId ? { ...member, traineeUserId: null } : member)));
      return;
    }
    const numericId = Number(staffId);
    await supabase.from('staff_members').update({ trainee_user_id: userId }).eq('id', numericId);
    setStaff(prev => prev.map(member => {
      if (member.id === numericId) return { ...member, traineeUserId: userId };
      if (member.traineeUserId === userId) return { ...member, traineeUserId: null };
      return member;
    }));
  }

  async function updateLinkedStaffRank(userId, nextRole) {
    if (!canManageUsers || !dbReady || !supabase) return;
    const linked = staff.find(member => member.traineeUserId === userId);
    if (!linked) return;
    const today = new Date().toISOString().slice(0, 10);
    const nextIndex = roles.indexOf(nextRole);
    const resetProgress = buildResetProgressForRole(nextRole);
    const updatePayload = {
      role: nextRole,
      role_since: today,
      promotion: roles[Math.min(nextIndex + 1, roles.length - 1)],
      checks: resetProgress.checks,
      values: resetProgress.values,
      permissions: resetProgress.permissions,
      signed_off: false,
    };
    await supabase.from('staff_members').update(updatePayload).eq('id', linked.id);
    setStaff(prev => prev.map(member => (
      member.id === linked.id
        ? {
          ...member,
          role: nextRole,
          modSince: today,
          promotion: roles[Math.min(nextIndex + 1, roles.length - 1)],
          checks: resetProgress.checks,
          values: resetProgress.values,
          permissions: resetProgress.permissions,
          signedOff: false,
        }
        : member
    )));
    await writeAudit('staff.linked_role.update', linked.id, null, { role: nextRole, user_id: userId });
  }

  async function restoreDemoStaff() {
    if (!canManageUsers || !dbReady || !supabase) return;

    const demoRows = [
      {
        id: 1,
        name: 'Malia',
        role: 'T-MOD',
        trainer: 'MB',
        profile_image: '/assets/cards/malia-card.webp',
        status: 'In Training',
        strong_sides: 'Strong player communication and calm responses in reports',
        attention_points: 'Needs quicker escalation on edge-case incidents',
        signed_off: false,
        staff_since: '2026-02-11',
        role_since: 'N/A',
        promotion: 'MOD',
        checks: makeRoleChecks('T-MOD', {
          'Report-first enforcement': true,
          '2-minute clip requirement': true,
          'No RDM baseline': true,
          'Valid RP reason checks': true,
          'Bias-free case review': true,
          'Respectful support tone': true,
          'Rule ignorance response': true,
        }),
        values: {
          'Respectful with community': true,
          'Respectful with staff': true,
          'Upholds the rules': true,
          'Applies same standards': true,
          'Follows chain of command': true,
          'Monitors trap talk': true,
          'Motivated to learn': true,
          'Socializes with staff': true,
          'Shows initiative': true,
          'Completes staff duties': true,
          'Educates community members': true,
          'No recent rule breaks': true,
        },
        permissions: makePermissionChecks({
          'Bring Player': true,
          'Teleport To Player': true,
          'Freeze Player': true,
          'Revive': true,
          'Kick': true,
          'Player Info': true,
        }),
        disciplinary: { warnings: 0, actions: 0, logs: [] },
        notes: 'Restored demo staff profile.',
        updated_by: authUser?.id || null,
      },
      {
        id: 2,
        name: 'MB',
        role: 'ADMIN',
        trainer: 'Head Team',
        profile_image: '/assets/cards/mb-card.webp',
        status: 'Active',
        strong_sides: 'Consistent command decisions and clear coaching standards',
        attention_points: 'Can delegate more follow-up reviews to senior moderators',
        signed_off: true,
        staff_since: '2025-04-20',
        role_since: '2025-05-16',
        promotion: 'S-ADMIN',
        checks: makeRoleChecks('ADMIN', {
          'Case Leadership': true,
          'Complex Reports': true,
          'Staff Coaching': true,
          'Duty Oversight': true,
        }),
        values: Object.fromEntries(coreValues.map(v => [v, true])),
        permissions: makePermissionChecks(Object.fromEntries(permissionActions.map(item => [item, true]))),
        disciplinary: { warnings: 0, actions: 0, logs: [] },
        notes: 'Restored demo staff profile.',
        updated_by: authUser?.id || null,
      },
      {
        id: 3,
        name: 'Loco',
        role: 'MOD',
        trainer: 'MB',
        profile_image: '/assets/cards/loco-card.webp',
        status: 'Reviewing Others',
        strong_sides: 'Fast triage of reports and strong fairness in decisions',
        attention_points: 'Could document case outcomes with more detail',
        signed_off: true,
        staff_since: '2025-09-14',
        role_since: '2025-10-01',
        promotion: 'S-MOD',
        checks: makeRoleChecks('MOD', {
          'Money Logs': true,
          'Death Logs': true,
          'Join Logs': true,
          'Leave Logs': true,
          'Org Join Logs': true,
          'Org Leave Logs': false,
          'Org Create Logs': true,
        }),
        values: {
          ...Object.fromEntries(coreValues.map(v => [v, true])),
          'No recent rule breaks': true,
        },
        permissions: makePermissionChecks({
          'Bring Player': true,
          'Teleport To Player': true,
          'Teleport Marker': true,
          'Freeze Player': true,
          'Revive': true,
          'Kick': true,
          'Player Info': true,
          'Community Service (Offline)': true,
          'Community Service (Online)': true,
          'Saved Locations': true,
          'Money Logs': true,
          'Death Logs': true,
        }),
        disciplinary: { warnings: 1, actions: 0, logs: [{ id: 1, type: 'Warning', reason: 'Late report closure without escalation note.', issuer: 'Head Team', date: '2026-02-28' }] },
        notes: 'Restored demo staff profile.',
        updated_by: authUser?.id || null,
      },
    ];

    await supabase.from('staff_members').upsert(demoRows);
    await writeAudit('staff.restore_demo', 'demo', null, { rows: [1, 2, 3] });
    await refreshStaffFromDb();
  }

  async function saveOwnProfile() {
    if (!dbReady || !supabase || !profile?.id) return;

    let nextAvatar = profileAvatar || null;
    if (profileAvatarFile) {
      const extRaw = (profileAvatarFile.name?.split('.').pop() || 'png').toLowerCase();
      const safeExt = extRaw.replace(/[^a-z0-9]/g, '') || 'png';
      const path = `profiles/${profile.id}/${Date.now()}.${safeExt}`;
      const { error } = await supabase.storage
        .from('staff-cards')
        .upload(path, profileAvatarFile, { upsert: true, contentType: profileAvatarFile.type || 'image/png' });

      if (!error) {
        const { data } = supabase.storage.from('staff-cards').getPublicUrl(path);
        nextAvatar = data?.publicUrl || nextAvatar;
      }
    }

    await supabase
      .from('profiles')
      .update({ username: profileName || null, avatar_url: nextAvatar || null })
      .eq('id', profile.id);
    await writeAudit('profile.update', profile.id, null, { username: profileName || null, avatar_url: nextAvatar || null });
    setProfileAvatar(nextAvatar || '');
    setProfileAvatarFile(null);
    setProfileOpen(false);
    onProfileRefresh?.();
  }

  async function createInviteToken() {
    if (!canManageUsers || !dbReady || !supabase) return;
    setInviteTokenCreating(true);
    const { data, error } = await supabase.rpc('create_signup_token', { valid_for_hours: 168 });
    setInviteTokenCreating(false);
    if (error) {
      window.alert(`Token generation failed: ${error.message}`);
      return;
    }
    setLatestInviteToken(data || '');
  }

  async function saveManagedQuizQuestion(item) {
    if (!canManageCheckboxes) return null;
    const normalizedWrong = (item.wrongAnswers || [])
      .map(value => String(value || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    const payload = {
      id: item.id || undefined,
      quiz_key: item.quizKey,
      quiz_title: item.quizTitle,
      quiz_description: item.quizDescription || '',
      quiz_kind: item.quizKind || 'managed',
      rank_key: item.rankKey || null,
      pass_score: Number(item.passScore || 80),
      question_order: Number(item.questionOrder || 0),
      category: item.category || 'General Rules',
      question: item.question || '',
      correct_answer: item.correctAnswer || '',
      wrong_answers: normalizedWrong,
      updated_by: authUser?.id || null,
      updated_at: new Date().toISOString(),
    };

    if (!dbReady || !supabase) return payload;
    const { data, error } = await supabase
      .from('managed_quiz_questions')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      setManagedQuizDraft(item);
      throw error;
    }

    setManagedQuizQuestions(prev => {
      const next = prev.filter(entry => entry.id !== data.id);
      next.push({
        id: data.id,
        quizKey: data.quiz_key,
        quizTitle: data.quiz_title,
        quizDescription: data.quiz_description || '',
        quizKind: data.quiz_kind || 'managed',
        rankKey: data.rank_key || '',
        passScore: Number(data.pass_score || 80),
        questionOrder: Number(data.question_order || 0),
        category: data.category || 'General Rules',
        question: data.question || '',
        correctAnswer: data.correct_answer || '',
        wrongAnswers: Array.isArray(data.wrong_answers) ? data.wrong_answers.map(value => String(value || '')).filter(Boolean).slice(0, 3) : [],
      });
      return next.sort((a, b) => String(a.quizKey).localeCompare(String(b.quizKey)) || Number(a.questionOrder || 0) - Number(b.questionOrder || 0) || String(a.question).localeCompare(String(b.question)));
    });
    await syncManagedQuestionToUnifiedModel({
      id: data.id,
      quizKey: data.quiz_key,
      quizTitle: data.quiz_title,
      quizDescription: data.quiz_description || '',
      rankKey: data.rank_key || '',
      passScore: Number(data.pass_score || 80),
      questionOrder: Number(data.question_order || 0),
      category: data.category || 'General Rules',
      question: data.question || '',
      correctAnswer: data.correct_answer || '',
      wrongAnswers: Array.isArray(data.wrong_answers) ? data.wrong_answers : [],
    });
    await writeAudit('managed_quiz_questions.save', payload.quiz_key, null, payload);
    return data;
  }

  async function deleteManagedQuizQuestion(itemId) {
    if (!canManageCheckboxes || !itemId) return;
    setManagedQuizQuestions(prev => prev.filter(item => item.id !== itemId));
    if (dbReady && supabase) {
      const existing = managedQuizQuestions.find(item => item.id === itemId);
      await supabase.from('managed_quiz_questions').delete().eq('id', itemId);
      await removeManagedQuestionFromUnifiedModel(itemId, existing?.quizKey || null);
      await writeAudit('managed_quiz_questions.delete', itemId, null, null);
    }
  }

  function openManagedQuizEditor(quizDefinition, item = null) {
    const sourceItems = quizDefinition?.sourceItems || [];
    const nextOrder = sourceItems.length ? Math.max(...sourceItems.map(entry => Number(entry.questionOrder || 0))) + 1 : 1;
    setManagedQuizDraft(item ? {
      id: item.id || null,
      quizKey: item.quizKey || quizDefinition.key,
      quizTitle: item.quizTitle || quizDefinition.title,
      quizDescription: item.quizDescription || quizDefinition.description || '',
      quizKind: item.quizKind || (quizDefinition.kind === 'mandatory' ? 'mandatory' : 'managed'),
      rankKey: item.rankKey || quizDefinition.rankKey || '',
      passScore: Number(item.passScore || quizDefinition.passScore || 80),
      questionOrder: Number(item.questionOrder || nextOrder),
      category: item.category || 'General Rules',
      question: item.question || '',
      correctAnswer: item.correctAnswer || item.correct || '',
      wrongAnswers: (item.wrongAnswers || []).length ? [...item.wrongAnswers] : ['', '', ''],
    } : {
      id: null,
      quizKey: quizDefinition.key,
      quizTitle: quizDefinition.title,
      quizDescription: quizDefinition.description || '',
      quizKind: quizDefinition.kind === 'mandatory' ? 'mandatory' : 'managed',
      rankKey: quizDefinition.rankKey || '',
      passScore: Number(quizDefinition.passScore || 80),
      questionOrder: nextOrder,
      category: quizDefinition.rankLabel || 'General Rules',
      question: '',
      correctAnswer: '',
      wrongAnswers: ['', '', ''],
    });
    setManagedQuizEditorOpen(true);
  }

  function closeManagedQuizEditor() {
    setManagedQuizEditorOpen(false);
    setManagedQuizDraft(null);
  }

  async function saveManagedQuizDraft() {
    if (!managedQuizDraft) return;
    const normalized = {
      ...managedQuizDraft,
      wrongAnswers: (managedQuizDraft.wrongAnswers || []).map(value => String(value || '').trim()).filter(Boolean).slice(0, 3),
    };
    while (normalized.wrongAnswers.length < 3) normalized.wrongAnswers.push('');
    await saveManagedQuizQuestion(normalized);
    closeManagedQuizEditor();
  }

  function openNewManagedQuiz() {
    openManagedQuizEditor({
      key: `managed-${Date.now()}`,
      title: 'New Managed Quiz',
      description: 'Custom quiz for rank-based or assigned training.',
      kind: 'managed',
      rankKey: '',
      passScore: 90,
      sourceItems: [],
    }, null);
  }

  function addManagedQuizQuestion(quizKey) {
    if (!quizKey) {
      openNewManagedQuiz();
      return;
    }
    const definition = knowledgeQuizDefinitions.find(item => item.key === quizKey);
    if (!definition) return;
    openManagedQuizEditor(definition, null);
  }

  function openVideoQuizEditor(definition = null) {
    const draftScenes = Array.isArray(definition?.scenes) && definition.scenes.length
      ? definition.scenes.map((scene, index) => ({
          id: scene.id || 'scene-' + (index + 1),
          title: scene.title || 'Scene ' + (index + 1),
          videoUrl: scene.videoUrl || '',
          watchPointsText: (scene.watchPoints || []).join('\n'),
          notePromptsText: (scene.notePrompts || []).join('\n'),
        }))
      : [buildVideoQuizSceneDraft(0)];
    setVideoQuizDraft(definition ? {
      id: definition.id || null,
      quizKey: definition.quizKey || definition.key,
      title: definition.title || 'New Video Quiz',
      description: definition.description || 'Watch the clips and submit staff-facing notes.',
      rankKey: definition.rankKey || '',
      scenes: draftScenes,
      isActive: definition.isActive !== false,
    } : {
      id: null,
      quizKey: 'video-' + Date.now(),
      title: 'New Video Quiz',
      description: 'Watch the clips and submit staff-facing notes.',
      rankKey: '',
      scenes: [buildVideoQuizSceneDraft(0)],
      isActive: true,
    });
    setVideoQuizEditorOpen(true);
  }

  function closeVideoQuizEditor() {
    setVideoQuizEditorOpen(false);
    setVideoQuizDraft(null);
  }

  function patchVideoQuizScene(index, patch) {
    setVideoQuizDraft(prev => ({
      ...prev,
      scenes: (prev?.scenes || []).map((scene, sceneIndex) => sceneIndex === index ? { ...scene, ...patch } : scene),
    }));
  }

  function addVideoQuizScene() {
    setVideoQuizDraft(prev => ({
      ...prev,
      scenes: [...(prev?.scenes || []), buildVideoQuizSceneDraft((prev?.scenes || []).length)],
    }));
  }

  function removeVideoQuizScene(index) {
    setVideoQuizDraft(prev => {
      const nextScenes = (prev?.scenes || []).filter((_, sceneIndex) => sceneIndex !== index);
      return {
        ...prev,
        scenes: nextScenes.length ? nextScenes : [buildVideoQuizSceneDraft(0)],
      };
    });
  }

  async function saveVideoQuizDraft() {
    if (!videoQuizDraft || !dbReady || !supabase || !canManageCheckboxes) return;
    const quizKey = String(videoQuizDraft.quizKey || '').trim().toLowerCase().replace(/[^a-z0-9-|]/g, '-');
    const scenes = (videoQuizDraft.scenes || []).map((scene, index) => ({
      id: scene.id || 'scene-' + (index + 1),
      title: String(scene.title || 'Scene ' + (index + 1)).trim(),
      videoUrl: String(scene.videoUrl || '').trim(),
      watchPoints: String(scene.watchPointsText || '').split('\n').map(value => value.trim()).filter(Boolean),
      notePrompts: String(scene.notePromptsText || '').split('\n').map(value => value.trim()).filter(Boolean),
    })).filter(scene => scene.videoUrl || scene.watchPoints.length || scene.notePrompts.length || scene.title);
    if (!quizKey) {
      alert('Video quiz key is required.');
      return;
    }
    if (!String(videoQuizDraft.title || '').trim()) {
      alert('Video quiz title is required.');
      return;
    }
    if (!scenes.length) {
      alert('Add at least one video scene before saving.');
      return;
    }
    const firstScene = scenes[0] || { videoUrl: '', watchPoints: [], notePrompts: [] };
    const payload = {
      id: videoQuizDraft.id || undefined,
      quiz_key: quizKey,
      title: String(videoQuizDraft.title || '').trim(),
      description: String(videoQuizDraft.description || '').trim(),
      rank_key: videoQuizDraft.rankKey || null,
      scenes,
      video_url: firstScene.videoUrl || '',
      watch_points: firstScene.watchPoints || [],
      note_prompts: firstScene.notePrompts || [],
      is_active: videoQuizDraft.isActive !== false,
      updated_by: authUser?.id || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('video_quizzes').upsert(payload, { onConflict: 'quiz_key' });
    if (error) {
      if (isMissingVideoQuizzesTableError(error)) {
        setVideoQuizTableAvailable(false);
        alert('Video quizzes are not enabled in Supabase yet. Run the latest SQL block first.');
        return;
      }
      alert(error.message || 'Video quiz could not be saved.');
      return;
    }
    setVideoQuizTableAvailable(true);
    setVideoQuizzes(prev => {
      const nextItem = normalizeVideoQuizRecord({
        id: videoQuizDraft.id || 'local-' + quizKey,
        quiz_key: quizKey,
        title: payload.title,
        description: payload.description,
        rank_key: payload.rank_key,
        scenes: payload.scenes,
        video_url: payload.video_url,
        watch_points: payload.watch_points,
        note_prompts: payload.note_prompts,
        is_active: payload.is_active,
      });
      return [nextItem, ...prev.filter(item => item.quizKey !== quizKey)];
    });
    setSelectedKnowledgeQuizKey(quizKey);
    await writeAudit('video_quizzes.save', quizKey, null, payload);
    closeVideoQuizEditor();
    void refreshVideoQuizzesFromDb();
  }

  async function deleteVideoQuizDraft() {
    if (!videoQuizDraft?.id || !dbReady || !supabase || !canManageCheckboxes) return;
    const { error } = await supabase.from('video_quizzes').delete().eq('id', videoQuizDraft.id);
    if (error) {
      if (isMissingVideoQuizzesTableError(error)) {
        setVideoQuizTableAvailable(false);
        alert('Video quizzes are not enabled in Supabase yet. Run the latest SQL block first.');
        return;
      }
      alert(error.message || 'Video quiz could not be deleted.');
      return;
    }
    setVideoQuizTableAvailable(true);
    setVideoQuizzes(prev => prev.filter(item => item.id !== videoQuizDraft.id && item.quizKey !== videoQuizDraft.quizKey));
    await writeAudit('video_quizzes.delete', videoQuizDraft.id, null, null);
    closeVideoQuizEditor();
    void refreshVideoQuizzesFromDb();
  }


  async function deleteVideoQuizDefinition(definition) {
    if (!definition || !canManageCheckboxes) return;
    const confirmed = window.confirm(`Delete video quiz "${definition.title}"?`);
    if (!confirmed) return;
    setVideoQuizDraft({ id: definition.id, quizKey: definition.quizKey || definition.key });
    if (!dbReady || !supabase) return;
    const targetId = definition.id || null;
    const targetKey = definition.quizKey || definition.key;
    if (targetId) {
      const { error } = await supabase.from('video_quizzes').delete().eq('id', targetId);
      if (error) {
        alert(error.message || 'Video quiz could not be deleted.');
        return;
      }
    } else if (targetKey) {
      const { error } = await supabase.from('video_quizzes').delete().eq('quiz_key', targetKey);
      if (error) {
        alert(error.message || 'Video quiz could not be deleted.');
        return;
      }
    }
    setVideoQuizzes(prev => prev.filter(item => item.id !== targetId && item.quizKey !== targetKey));
    if (selectedKnowledgeQuizKey === targetKey) setSelectedKnowledgeQuizKey('mandatory-general');
    await writeAudit('video_quizzes.delete', targetId || targetKey, null, null);
    void refreshVideoQuizzesFromDb();
  }

  async function saveStaffEssential(draft) {
    if (!draft || !dbReady || !supabase || !canManageEssentials) return false;
    const slug = String(draft.slug || draft.title || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) {
      alert('Staff essential slug is required.');
      return false;
    }
    if (!String(draft.title || '').trim()) {
      alert('Staff essential title is required.');
      return false;
    }

    const modules = (draft.modules || []).map((module, index) => ({
      id: module.id || 'module-' + (index + 1),
      type: String(module.type || 'chapter').trim() || 'chapter',
      title: String(module.title || 'Module ' + (index + 1)).trim(),
      body: String(module.body || '').trim(),
      videoUrl: String(module.videoUrl || '').trim(),
      resourceLabel: String(module.resourceLabel || '').trim(),
      resourceUrl: String(module.resourceUrl || '').trim(),
      checklist: String(module.checklistText || '').split(/\r?\n/).map(value => value.trim()).filter(Boolean),
    })).filter(module => module.title || module.body || module.videoUrl || module.resourceLabel || module.resourceUrl || module.checklist.length);

    if (!modules.length) {
      alert('Add at least one module before saving Staff Essentials.');
      return false;
    }

    const payload = {
      id: draft.id || undefined,
      slug,
      section: String(draft.section || 'General').trim() || 'General',
      title: String(draft.title || '').trim(),
      summary: String(draft.summary || '').trim(),
      cover_video_url: String(draft.coverVideoUrl || '').trim(),
      tags: String(draft.tagsText || '').split(/[\n,]/).map(value => value.trim()).filter(Boolean),
      modules,
      sort_order: Number(draft.sortOrder || 0),
      is_active: draft.isActive !== false,
      updated_by: authUser?.id || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('staff_essentials').upsert(payload, { onConflict: 'slug' });
    if (error) {
      if (isMissingStaffEssentialsTableError(error)) {
        setStaffEssentialsTableAvailable(false);
        alert('Staff Essentials is not enabled in Supabase yet. Run the latest SQL block first.');
        return false;
      }
      alert(error.message || 'Staff essential could not be saved.');
      return false;
    }

    setStaffEssentialsTableAvailable(true);
    setStaffEssentials(prev => [normalizeStaffEssentialRecord(payload), ...prev.filter(item => item.slug !== slug)]);
    setSelectedEssentialSlug(slug);
    await writeAudit('staff_essentials.save', slug, null, payload);
    void refreshStaffEssentialsFromDb();
    return slug;
  }

  async function deleteStaffEssential(item) {
    if (!item || !dbReady || !supabase || !canManageEssentials) return false;
    const { error } = await supabase.from('staff_essentials').delete().eq('slug', item.slug);
    if (error) {
      if (isMissingStaffEssentialsTableError(error)) {
        setStaffEssentialsTableAvailable(false);
        alert('Staff Essentials is not enabled in Supabase yet. Run the latest SQL block first.');
        return false;
      }
      alert(error.message || 'Staff essential could not be deleted.');
      return false;
    }

    setStaffEssentialsTableAvailable(true);
    setStaffEssentials(prev => prev.filter(entry => entry.slug !== item.slug));
    await writeAudit('staff_essentials.delete', item.slug, item, null);
    void refreshStaffEssentialsFromDb();
    return true;
  }

  async function saveCheckboxItem(item) {
    if (!canManageCheckboxes || !dbReady || !supabase) return;
    holdRealtimeSync(2600);
    const payload = {
      id: item.id,
      category: item.category,
      role: serializeRankScope(item.ranks || parseRankScope(item.role)) || null,
      title: item.title,
      question: item.question || null,
      answer: item.answer || null,
      updated_by: authUser?.id || null,
    };
    await supabase.from('checkbox_catalog').upsert(payload);
    await writeAudit('checkbox_catalog.save', item.id, null, payload);
  }

  async function saveRankDisplayName(rankKey) {
    if (!dbReady || !supabase) return;
    holdRealtimeSync(2000);
    const nextName = (rankDrafts[rankKey] || rankKey).trim() || rankKey;
    await supabase.from('rank_display_names').upsert({
      rank_key: rankKey,
      display_name: nextName,
      updated_by: authUser?.id || null,
    });
    setRankDisplayNames(prev => ({ ...prev, [rankKey]: nextName }));
    setRankDrafts(prev => ({ ...prev, [rankKey]: nextName }));
    await writeAudit('rank_display.update', rankKey, null, { display_name: nextName });
  }

  async function repairWeakFalseOptionsAcrossCatalog() {
    if (!dbReady || !supabase || !canManageCheckboxes) return;
    const updates = [];
    const nextCatalog = checkboxCatalog.map(item => {
      const payload = parseQuizPayload(item.answer);
      if (payload.manual) return item;
      const correct = payload.correct[0] || '';
      if (!correct) return item;
      const repairedWrong = buildRuleAlignedFalseAnswers({
        title: item.title,
        question: item.question,
        correct,
        existingWrong: payload.wrong,
        bracketTag: payload.bracket,
      });
      if (sameStringArray(payload.wrong, repairedWrong)) return item;
      const nextAnswer = buildQuizPayload(payload.correct, repairedWrong, payload.bracket, payload.manual);
      updates.push({
        id: item.id,
        category: item.category,
        role: serializeRankScope(item.ranks || parseRankScope(item.role)) || null,
        title: item.title,
        question: item.question || null,
        answer: nextAnswer,
        updated_by: authUser?.id || null,
      });
      return { ...item, answer: nextAnswer };
    });

    if (!updates.length) return;
    setCheckboxCatalog(nextCatalog);
    await Promise.all(updates.map(payload => supabase.from('checkbox_catalog').upsert(payload)));
    await writeAudit('checkbox_catalog.repair_false_answers', 'bulk', null, { updated_count: updates.length });
  }

  async function deleteCheckboxItem(itemId) {
    if (!canManageCheckboxes) return;
    setCheckboxCatalog(prev => prev.filter(item => item.id !== itemId));
    if (dbReady && supabase) {
      await supabase.from('checkbox_catalog').delete().eq('id', itemId);
      await writeAudit('checkbox_catalog.delete', itemId, null, null);
    }
  }

  function patchCheckboxItem(itemId, patch) {
    setCheckboxCatalog(prev => prev.map(item => (item.id === itemId ? { ...item, ...patch } : item)));
  }

  function addCheckboxItem(category = 'role', role = 'T-MOD') {
    if (!canManageCheckboxes) return;
    const id = `custom-${Date.now()}`;
    const created = {
      id,
      category,
      role: category === 'role' ? role : '',
      ranks: category === 'role' ? [role] : [],
      title: 'New Checklist Item',
      question: 'New quiz question',
      answer: 'New quiz answer',
    };
    setCheckboxCatalog(prev => [
      ...prev,
      created,
    ]);
    return created;
  }

  function openCheckboxEditor(item) {
    const payload = parseQuizPayload(item.answer);
    const primaryCorrect = payload.correct[0] || '';
    const normalizedFalse = payload.manual
      ? (payload.wrong.length ? payload.wrong : [''])
      : buildRuleAlignedFalseAnswers({
        title: item.title,
        question: item.question,
        correct: primaryCorrect,
        existingWrong: payload.wrong,
        bracketTag: payload.bracket,
      });
    const normalizedRanks = sortRankScope(item.ranks || parseRankScope(item.role));
    setCheckboxDraft({
      ...item,
      ranks: normalizedRanks,
      answers: payload.correct.length ? payload.correct : [''],
      falseAnswers: normalizedFalse,
      ruleBracket: payload.bracket || '',
      manualChecked: Boolean(payload.manual),
    });
    setCheckboxEditorOpen(true);
  }

  function closeCheckboxEditor() {
    setCheckboxEditorOpen(false);
    setCheckboxDraft(null);
  }

  async function saveCheckboxDraft() {
    if (!checkboxDraft) return;
    const primaryCorrect = (checkboxDraft.answers || []).find(answer => String(answer || '').trim()) || '';
    const normalizedFalse = (checkboxDraft.falseAnswers || [])
      .map(v => String(v || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    while (normalizedFalse.length < 3) normalizedFalse.push('');
    const normalizedRanks = sortRankScope(checkboxDraft.ranks || []);
    const normalized = {
      ...checkboxDraft,
      ranks: normalizedRanks,
      role: serializeRankScope(normalizedRanks),
      answer: buildQuizPayload(checkboxDraft.answers || [], normalizedFalse, checkboxDraft.ruleBracket || null, true),
      falseAnswers: normalizedFalse,
      manualChecked: true,
    };
    patchCheckboxItem(normalized.id, normalized);
    await saveCheckboxItem(normalized);
    closeCheckboxEditor();
  }

  if (!selected) {
    if (isStaffInTraining) {
      return (
        <div className="min-h-screen bg-[#07070b] p-6 text-zinc-200">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            Your dashboard account is not linked to a staff profile yet. Ask Head Admin to link your account from the Management tab.
          </div>
          {profile?.god_key_enabled && (
            <button
              type="button"
              onClick={forceHeadAdminReset}
              title="God Key recovery: force role back to Head Admin"
              className="fixed bottom-6 right-6 rounded-2xl border border-emerald-400/45 bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.3)] hover:from-emerald-500 hover:to-green-400"
            >
              God Key Reset
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#07070b] p-6 text-zinc-200">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">No staff records found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(140,33,255,0.22),transparent_35%),radial-gradient(circle_at_right,rgba(164,52,235,0.16),transparent_25%)]" />
      <div className="relative p-6 md:p-8">
        <div className="pointer-events-none absolute bottom-6 left-6 hidden opacity-[0.15] md:block">
          <img src="/assets/logos/drilluk-logo.png" alt="" className="h-8 w-8 rounded-lg mix-blend-screen" />
        </div>
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-1.5">
                <Shield className="h-5 w-5 text-fuchsia-300" />
              </div>
              <img src="/assets/logos/drilluk-logo.png" alt="Drill UK logo" className="h-8 w-8 rounded-lg border border-white/10 bg-black/20 object-cover mix-blend-screen" />
              <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/10">Drill UK Staff System</Badge>
              <Badge className="border-white/10 bg-white/10 px-2 text-[10px] text-zinc-200">
                {accountRoleLabel(effectiveRole)}
              </Badge>
              {canUseViewAs && viewAsRole && (
                <Badge className="border-amber-500/30 bg-amber-500/10 px-2 text-[10px] text-amber-200">
                  Viewing As: {accountRoleLabel(viewAsRole)}
                </Badge>
              )}
              <Badge
                className="border-white/10 bg-white/10 px-2 text-[10px] text-zinc-200"
                title={profile?.username || authUser?.email?.split('@')[0] || 'Guest'}
              >
                {profile?.username || authUser?.email?.split('@')[0] || 'Guest'}
              </Badge>
            </div>
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              {quickLinks.map(link => {
                const LinkIcon = link.icon;
                return (
                  <a
                    key={`header-link-${link.label}`}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-zinc-200 transition hover:border-fuchsia-400/35 hover:bg-white/10 hover:text-white"
                    title={`Open ${link.label}`}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
            {canUseViewAs && (
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-black/25 px-2 py-1.5 text-[11px]">
                <span className="text-zinc-400">View dashboard as</span>
                <Select
                  value={viewAsRole || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setViewAsRole('');
                      return;
                    }
                    setViewAsRole(value);
                    if (value === 'staff_in_training') {
                      setViewAsStaffId(selectedId || staff[0]?.id || null);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-[220px] border-white/10 bg-black/35 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Real role ({accountRoleLabel(profile?.role)})</SelectItem>
                    <SelectItem value="viewer">Guest</SelectItem>
                    <SelectItem value="staff_in_training">Staff In Training</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="head_admin">Head Admin</SelectItem>
                  </SelectContent>
                </Select>
                {viewAsRole === 'staff_in_training' && (
                  <Select
                    value={viewAsStaffId ? String(viewAsStaffId) : 'none'}
                    onValueChange={(value) => setViewAsStaffId(value === 'none' ? null : Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[220px] border-white/10 bg-black/35 text-white">
                      <SelectValue placeholder="Pick trainee profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No profile</SelectItem>
                      {staff.map(member => (
                        <SelectItem key={`viewas-trainee-${member.id}`} value={String(member.id)}>
                          {member.name} ({rankLabel(member.role)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {!!viewAsRole && (
                  <Button
                    type="button"
                    onClick={() => setViewAsRole('')}
                    className="h-8 rounded-lg border border-white/15 bg-black/30 px-3 text-xs text-zinc-100 hover:bg-white/10"
                  >
                    Exit View Mode
                  </Button>
                )}
              </div>
            )}
            <div className="text-base font-semibold tracking-tight text-white md:text-lg">Drill UK Staff Dashboard</div>
          </div>
          <div className="flex items-start gap-2 md:w-[560px] md:justify-end">
            <div className="space-y-1.5 md:w-[390px]">
              <div className="grid grid-cols-3 gap-2">
                {headerSummaryCards.map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    {item.onClick ? (
                      <button type="button" onClick={item.onClick} className="block w-full text-left">
                        <Card className="border-white/10 bg-white/5 backdrop-blur-xl transition hover:border-fuchsia-400/25 hover:bg-white/8">
                          <CardContent className="flex items-center justify-between px-3 py-2.5">
                            <div>
                              <div className="text-[9px] uppercase tracking-[0.16em] text-zinc-500">{item.label}</div>
                              <div className="mt-0.5 text-lg font-bold">{item.value}</div>
                            </div>
                            <item.icon className="h-4 w-4 text-fuchsia-300" />
                          </CardContent>
                        </Card>
                      </button>
                    ) : (
                      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                        <CardContent className="flex items-center justify-between px-3 py-2.5">
                          <div>
                            <div className="text-[9px] uppercase tracking-[0.16em] text-zinc-500">{item.label}</div>
                            <div className="mt-0.5 text-lg font-bold">{item.value}</div>
                          </div>
                          <item.icon className="h-4 w-4 text-fuchsia-300" />
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </div>
              {canViewPresence && (
                <div className="flex items-center gap-2">
                  <Badge className="border-white/10 bg-white/10 px-2 text-[10px] text-zinc-300">HA only</Badge>
                  <button
                    type="button"
                    onClick={() => setActiveUsersOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active {activeUsers.length}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfflineUsersOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-500/35 bg-zinc-500/12 px-2.5 py-1 text-[11px] text-zinc-200 hover:bg-zinc-500/20"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                    Offline {offlineUsers.length}
                  </button>
                </div>
              )}
            </div>
            <div className="flex w-[72px] flex-col items-stretch gap-1.5">
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="rounded-xl border border-white/15 bg-black/25 p-0 transition hover:border-fuchsia-500/40"
                title="Open profile"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Account logo"
                    className="h-[62px] w-[62px] rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-[62px] w-[62px] items-center justify-center rounded-xl text-lg font-bold text-zinc-200">
                    {(profile?.username?.[0] || authUser?.email?.[0] || 'G').toUpperCase()}
                  </div>
                )}
              </button>
              <button onClick={onSignOut} className="rounded-lg border border-white/15 bg-black/25 px-2 py-1 text-[11px] text-zinc-200 hover:bg-white/10">
                Sign Out
              </button>
              {profile?.god_key_enabled && (
                <button
                  type="button"
                  onClick={forceHeadAdminReset}
                  className="rounded-lg border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-green-500 px-2 py-1 text-[11px] text-white hover:from-emerald-500 hover:to-green-400"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
        {!canEdit && (
          <div className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-200">
            Read-only mode: your account role can view data but cannot edit staff records.
          </div>
        )}
        {isTestingViewMode && (
          <div className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-100">
            View Mode active. You are previewing permissions/layout as <span className="font-semibold">{accountRoleLabel(effectiveRole)}</span>.
          </div>
        )}
        {isSyncLocked && hasQueuedSync && (
          <div className="mb-4 rounded-xl border border-cyan-500/35 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            Live updates paused while you edit. Pending changes from other users will sync once you finish.
          </div>
        )}

        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-4">
          <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-white/5 p-2 h-auto">
            {isStaffInTraining ? (
              <>
                <TabsTrigger value="myprogress">My Progress</TabsTrigger>
                <TabsTrigger value="essentials">Staff Essentials</TabsTrigger>
                <TabsTrigger value="stafftools">Staff Tools</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="employee">Staff Team Overview</TabsTrigger>
                <TabsTrigger value="quizknowledge">Quizzes & Knowledge</TabsTrigger>
                <TabsTrigger value="essentials">Staff Essentials</TabsTrigger>
                <TabsTrigger value="stafftools">Staff Tools</TabsTrigger>
                <TabsTrigger value="management">Management</TabsTrigger>
                {canManageInterviews && <TabsTrigger value="interviews">Interviews</TabsTrigger>}
              </>
            )}
          </TabsList>

          {['tracker', 'session', 'progression', 'discipline'].includes(activeMainTab) && (
            <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-white/10 bg-gradient-to-r from-black/35 via-fuchsia-950/20 to-cyan-950/20 p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
              <Button type="button" onClick={() => setActiveMainTab('employee')} className="rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100 hover:bg-fuchsia-500/18">Back to Staff Team Overview</Button>
              <Button type="button" onClick={() => setActiveMainTab('tracker')} className="rounded-2xl border border-cyan-400/35 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18">Tracker</Button>
              <Button type="button" onClick={() => setActiveMainTab('session')} className="rounded-2xl border border-emerald-400/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18">Training Session</Button>
              <Button type="button" onClick={() => setActiveMainTab('progression')} className="rounded-2xl border border-amber-400/35 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18">Progression</Button>
              <Button type="button" onClick={() => setActiveMainTab('discipline')} className="rounded-2xl border border-red-400/35 bg-red-500/12 text-red-100 hover:bg-red-500/18">Discipline</Button>
            </div>
          )}

          {['audit', 'ranks', 'checkboxes'].includes(activeMainTab) && (
            <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-white/10 bg-gradient-to-r from-black/35 via-fuchsia-950/20 to-cyan-950/20 p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
              <Button type="button" onClick={() => setActiveMainTab(activeMainTab === 'checkboxes' ? 'quizknowledge' : 'management')} className="rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100 hover:bg-fuchsia-500/18">Back</Button>
              <Button type="button" onClick={() => setActiveMainTab('checkboxes')} className="rounded-2xl border border-cyan-400/35 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18">Quiz Builder</Button>
              <Button type="button" onClick={() => setActiveMainTab('audit')} className="rounded-2xl border border-amber-400/35 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18">Audit Log</Button>
              <Button type="button" onClick={() => setActiveMainTab('ranks')} className="rounded-2xl border border-emerald-400/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18">Rank Display</Button>
            </div>
          )}

          <TabsContent value="employee">
            <EmployeeHub
              filtered={filtered}
              selected={selected}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              query={query}
              setQuery={setQuery}
              filterOpen={filterOpen}
              setFilterOpen={setFilterOpen}
              filterRole={filterRole}
              setFilterRole={setFilterRole}
              filterTrainerOnly={filterTrainerOnly}
              setFilterTrainerOnly={setFilterTrainerOnly}
              filterActiveOnly={filterActiveOnly}
              setFilterActiveOnly={setFilterActiveOnly}
              filterWarningOnly={filterWarningOnly}
              setFilterWarningOnly={setFilterWarningOnly}
              roles={roles}
              rankLabel={rankLabel}
              roleColor={roleColor}
              statusColor={statusColor}
              nameSizeClass={nameSizeClass}
              openAddStaffModal={openAddStaffModal}
              canEdit={canEdit}
              onSelectProfileImage={handleProfileFile}
              readinessPercent={completionPercent(selected)}
              trainingSummary={selectedTrainingSummary}
              activeQuizSummaries={selectedStaffQuizDefinitions}
              quizHistory={selected?.quizHistory || []}
              getReadinessPercent={completionPercent}
              onOpenTracker={() => { syncOperationalTargets(selected?.id); setEmployeeQuickView('tracker'); }}
              onOpenSession={() => { syncOperationalTargets(selected?.id); setEmployeeQuickView('session'); }}
              onOpenProgression={() => { syncOperationalTargets(selected?.id); setEmployeeQuickView('progression'); }}
              onWarning={() => {
                setDisciplineType('Warning');
                setDisciplineTargetId(selected?.id || null);
                setDisciplineOpen(true);
              }}
              onDiscipline={() => {
                setDisciplineType('Disciplinary Action');
                setDisciplineTargetId(selected?.id || null);
                setDisciplineOpen(true);
              }}
              onAssignQuiz={() => setAssignQuizOpen(true)}
              onRemoveStaff={removeSelectedStaff}
              onQuizStatusChange={setSelectedQuizManualState}
              canDeleteStaff={canDeleteStaff}
              deletingStaff={deletingStaffId === selected?.id}
            />
          </TabsContent>

          <TabsContent value="quizknowledge">
            <QuizKnowledgeHub
              quizDefinitions={displayedKnowledgeQuizDefinitions}
              selectedQuizKey={selectedKnowledgeQuizKey}
              setSelectedQuizKey={setSelectedKnowledgeQuizKey}
              selectedQuiz={selectedKnowledgeQuiz}
              canManageCheckboxes={canManageCheckboxes}
              onOpenBuilder={() => setActiveMainTab('checkboxes')}
              onEditQuizQuestion={(quizDefinition, item) => {
                if (quizDefinition?.sourceType === 'checkbox') openCheckboxEditor(item.sourceCheckbox || item);
                else openManagedQuizEditor(quizDefinition, item);
              }}
              onAddManagedQuestion={addManagedQuizQuestion}
              onAddVideoQuiz={openVideoQuizEditor}
              onEditVideoQuiz={openVideoQuizEditor}
              onDeleteVideoQuiz={deleteVideoQuizDefinition}
              defaultName={profile?.username || authUser?.email?.split('@')[0] || ''}
              rankBadgeClass={roleColor}
              selectedStaff={!isStaffInTraining ? selected : null}
              isAssignedToSelected={Boolean(selectedKnowledgeQuiz && (selected?.assignedQuizKeys || []).includes(selectedKnowledgeQuiz.key))}
              onToggleAssignment={toggleQuizAssignment}
              onQuizComplete={handleKnowledgeQuizComplete}
            />
          </TabsContent>


          <TabsContent value="essentials">
            <StaffEssentialsHub
              essentials={displayedStaffEssentials}
              selectedEssentialSlug={selectedEssentialSlug}
              setSelectedEssentialSlug={setSelectedEssentialSlug}
              canManageEssentials={canManageEssentials}
              tableAvailable={staffEssentialsTableAvailable}
              onRefresh={refreshStaffEssentialsFromDb}
              onSaveEssential={saveStaffEssential}
              onDeleteEssential={deleteStaffEssential}
            />
          </TabsContent>

          <TabsContent value="interviews">
            <div className="space-y-4">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Interview Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-3">
                    <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">Head Admin review only</Badge>
                    <Badge className="border-white/10 bg-white/10 text-zinc-200">Public applications and live scored interviews</Badge>
                    {interviewLoading && <Badge className="border-amber-400/35 bg-amber-500/12 text-amber-100">Loading...</Badge>}
                    {interviewError && <Badge className="border-red-400/35 bg-red-500/12 text-red-100">{interviewError}</Badge>}
                  </div>
                </CardContent>
              </Card>
              <InterviewHub
                interviews={interviewApplications}
                selectedInterviewId={selectedInterviewId}
                setSelectedInterviewId={setSelectedInterviewId}
                reviewNotes={interviewReviewNotes}
                setReviewNotes={setInterviewReviewNotes}
                interviewQuery={interviewQuery}
                setInterviewQuery={setInterviewQuery}
                questionBank={interviewQuestionBank}
                canEditTemplate={isOwnerSession}
                onRefresh={() => { refreshInterviewQuestionBankFromDb(); refreshInterviewApplicationsFromDb(); }}
                onUpdateStatus={updateInterviewApplicationStatus}
                onSaveInterviewScorecard={saveInterviewScorecard}
                onSaveTemplateQuestion={saveInterviewTemplateQuestion}
                onDeleteTemplateQuestion={deleteInterviewTemplateQuestion}
              />
            </div>
          </TabsContent>

          <TabsContent value="myprogress">
            <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>My Staff Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      {selected.profileImage ? (
                        <img src={selected.profileImage} alt={`${selected.name} profile`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">No img</div>
                      )}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">{selected.name}</div>
                      <div className="mt-1 text-sm text-zinc-400">{rankLabel(selected.role)}</div>
                      <div className="mt-1 text-xs text-zinc-500">Trainer: {selected.trainer}</div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Available quizzes</div>
                      <div className="mt-1 text-2xl font-semibold text-white">{displayedKnowledgeQuizDefinitions.length}</div>
                      <div className="mt-1 text-xs text-zinc-500">Rank-matched or directly assigned to you</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Completed quizzes</div>
                      <div className="mt-1 text-2xl font-semibold text-white">{displayedKnowledgeQuizDefinitions.filter(definition => getKnowledgeQuizProgress(definition, selected).percent >= 100).length}</div>
                      <div className="mt-1 text-xs text-zinc-500">Passed or fully signed off</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Overall readiness</div>
                      <div className="mt-1 text-2xl font-semibold text-white">{completionPercent(selected)}%</div>
                      <div className="mt-2"><Progress value={completionPercent(selected)} className="h-2.5 bg-white/10" /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <QuizKnowledgeHub
                  quizDefinitions={displayedKnowledgeQuizDefinitions}
                  selectedQuizKey={selectedKnowledgeQuizKey}
                  setSelectedQuizKey={setSelectedKnowledgeQuizKey}
                  selectedQuiz={selectedKnowledgeQuiz}
                  canManageCheckboxes={false}
                  onOpenBuilder={() => setActiveMainTab('quizknowledge')}
                  onAddVideoQuiz={openVideoQuizEditor}
                  onEditVideoQuiz={openVideoQuizEditor}
                  onDeleteVideoQuiz={deleteVideoQuizDefinition}
                  defaultName={profile?.username || authUser?.email?.split('@')[0] || ''}
                  rankBadgeClass={roleColor}
                  onQuizComplete={handleKnowledgeQuizComplete}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tracker">
            <div className="grid items-start gap-4 xl:grid-cols-[380px,1fr]">
              <Card className="border-white/10 bg-white/5 xl:sticky xl:top-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Staff records</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFilterOpen(v => !v)}
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-1 text-xs text-zinc-300 hover:bg-white/10"
                      >
                        Filters
                      </button>
                      <Badge className="border-white/10 bg-white/10 text-zinc-200">{filtered.length} shown</Badge>
                    </div>
                  </CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, role, or status..." className="border-white/10 bg-black/30 pl-9 text-white placeholder:text-zinc-500" />
                  </div>
                  {filterOpen && (
                    <div className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div>
                        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Rank</div>
                        <Select value={filterRole} onValueChange={setFilterRole}>
                          <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All ranks</SelectItem>
                            {roles.map(role => <SelectItem key={role} value={role}>{rankLabel(role)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
                        Is trainer
                        <Checkbox checked={filterTrainerOnly} onCheckedChange={(v) => setFilterTrainerOnly(!!v)} />
                      </label>
                      <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
                        Active only
                        <Checkbox checked={filterActiveOnly} onCheckedChange={(v) => setFilterActiveOnly(!!v)} />
                      </label>
                      <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
                        Has warning/action
                        <Checkbox checked={filterWarningOnly} onCheckedChange={(v) => setFilterWarningOnly(!!v)} />
                      </label>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex min-h-0 flex-col space-y-3">
                  <Button disabled={!canEdit} onClick={openAddStaffModal} className="w-full rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500">
                    <Plus className="mr-2 h-4 w-4" /> Add staff
                  </Button>
                  <div className="min-h-[420px] max-h-[calc(100vh-320px)] space-y-3 overflow-y-scroll pr-1">
                    {filtered.map(member => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedId(member.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === member.id ? 'border-fuchsia-500/50 bg-fuchsia-500/10' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="h-11 w-11 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                              {member.profileImage ? (
                                <img src={member.profileImage} alt={`${member.name} profile`} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">No img</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <div
                                  className={`${nameSizeClass(member.name)} min-w-0 max-w-[120px] truncate font-semibold`}
                                  title={member.name}
                                >
                                  {member.name}
                                </div>
                              </div>
                              <div className="mt-1 text-sm text-zinc-400">Trainer: {member.trainer}</div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <Badge className={`${roleColor(member.role)} px-2 text-[10px]`}>{rankLabel(member.role)}</Badge>
                                <Badge className={`${statusColor(member.status)} px-2 text-[10px]`}>{member.status}</Badge>
                                {member.disciplinary?.warnings > 0 && (
                                  <Badge className="border-red-500/40 bg-red-500/15 px-2 text-[10px] text-red-300">Warning - {member.disciplinary.warnings}</Badge>
                                )}
                                {member.disciplinary?.actions > 0 && (
                                  <Badge className="border-red-600/50 bg-red-600/20 px-2 text-[10px] text-red-200">Disciplinary Action - {member.disciplinary.actions}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-400">
                            <span>Completion</span>
                            <span>{completionPercent(member)}%</span>
                          </div>
                          <Progress value={completionPercent(member)} className="h-2 bg-white/10" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-white/10 bg-white/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="max-w-[340px] truncate text-2xl font-bold" title={selected.name}>{selected.name}</h2>
                          <Badge className={roleColor(selected.role)}>{rankLabel(selected.role)}</Badge>
                          <Badge className={statusColor(selected.status)}>{selected.status}</Badge>
                          {selected.disciplinary?.warnings > 0 && (
                            <Badge className="border-red-500/40 bg-red-500/15 text-red-300">Warning - {selected.disciplinary.warnings}</Badge>
                          )}
                          {selected.disciplinary?.actions > 0 && (
                            <Badge className="border-red-600/50 bg-red-600/20 text-red-200">Disciplinary Action - {selected.disciplinary.actions}</Badge>
                          )}
                        </div>
                        <p className="mt-2 text-zinc-400">Promotion target: <span className="text-white">{selected.promotion}</span></p>
                      </div>
                      <div>
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => profileFileInputRef.current?.click()}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-zinc-300 transition hover:border-fuchsia-500/40 hover:text-fuchsia-200"
                          title="Choose profile image"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <input
                          ref={profileFileInputRef}
                          type="file"
                          accept="image/png,image/webp,image/jpeg"
                          onChange={(e) => {
                            handleProfileFile(e.target.files?.[0]);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-[240px,1fr]">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        {selected.profileImage ? (
                          <img src={selected.profileImage} alt={`${selected.name} profile`} className="h-[251px] w-full object-cover" />
                        ) : (
                          <div className="flex h-[251px] items-center justify-center text-sm text-zinc-500">No character image yet</div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="grid items-stretch gap-3 md:grid-cols-[3fr,1fr]">
                          <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-blue-500/10 p-4">
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-zinc-300">Readiness score</div>
                                <div className="mt-1 text-4xl font-bold leading-none text-white">{completionPercent(selected)}%</div>
                              </div>
                              <Badge className="border-white/15 bg-white/10 text-zinc-100">
                                Target: {selected.promotion}
                              </Badge>
                            </div>
                            <Progress value={completionPercent(selected)} className="mt-3 h-2.5 bg-white/10" />
                          </div>
                          <div className="rounded-2xl border border-red-500/35 bg-red-500/12 p-4">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-red-200">Disciplinary</div>
                            <div className="mt-3 space-y-2">
                              <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-2 py-1.5 text-xs text-red-200">Warning: {selected.disciplinary?.warnings || 0}</div>
                              <div className="rounded-lg border border-red-600/45 bg-red-600/15 px-2 py-1.5 text-xs text-red-100">Action: {selected.disciplinary?.actions || 0}</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            ['Trainer', selected.trainer],
                            ['Staff Since', selected.staffSince],
                            [`${rankLabel(selected.role)} Since`, selected.modSince],
                            ['Signed Off', selected.signedOff ? 'Yes' : 'No'],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
                              <div className="mt-1 text-sm font-medium text-white">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-fuchsia-300" /> Manual checklist controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className={infoCalloutClass}>
                        Unified quiz attempts and trainer reviews now drive readiness. These checklist rows remain available as manual sign-off and compatibility controls.
                      </div>
                      {currentChecks.map(item => {
                        const quiz = dynamicQuizMap[item] || allRuleQuizMap[item];
                        return (
                          <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <label className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2 text-sm text-zinc-100">
                                {item}
                                {manualCheckedByTitle[item] && (
                                  <Badge className="border-orange-500/40 bg-orange-500/15 px-1.5 text-[10px] text-orange-200">Manually checked</Badge>
                                )}
                                {!manualCheckedByTitle[item] && (
                                  <Badge className="border-cyan-500/35 bg-cyan-500/12 px-1.5 text-[10px] text-cyan-200">Auto generated by xJv LLM AI</Badge>
                                )}
                              </span>
                              <Checkbox disabled={!canEdit} checked={!!selected.checks[item]} onCheckedChange={() => toggleCheck(item, 'checks')} />
                            </label>
                            {quiz && <QuizHint item={quiz.question} answer={quiz.answer} category={quiz.category} />}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-fuchsia-300" /> Manual core values controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className={infoCalloutClass}>
                        Unified quiz attempts and trainer reviews now drive readiness. These checklist rows remain available as manual sign-off and compatibility controls.
                      </div>
                      {currentCoreValues.map(item => (
                        <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <label className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm text-zinc-100">
                              {item}
                              {manualCheckedByTitle[item] && (
                                <Badge className="border-orange-500/40 bg-orange-500/15 px-1.5 text-[10px] text-orange-200">Manually checked</Badge>
                              )}
                              {!manualCheckedByTitle[item] && (
                                <Badge className="border-cyan-500/35 bg-cyan-500/12 px-1.5 text-[10px] text-cyan-200">Auto generated by xJv LLM AI</Badge>
                              )}
                            </span>
                            <Checkbox disabled={!canEdit} checked={!!selected.values[item]} onCheckedChange={() => toggleCheck(item, 'values')} />
                          </label>
                          <div className="mt-2 text-xs text-zinc-400">{dynamicQuizMap[item]?.answer || valueGuidance[item]}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-fuchsia-300" /> Manual permissions controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className={infoCalloutClass}>
                        Unified quiz attempts and trainer reviews now drive readiness. These checklist rows remain available as manual sign-off and compatibility controls.
                      </div>
                      {currentPermissions.map(item => {
                        const quiz = dynamicQuizMap[item] || permissionQuizMap[item];
                        return (
                          <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <label className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2 text-sm text-zinc-100">
                                {item}
                                {manualCheckedByTitle[item] && (
                                  <Badge className="border-orange-500/40 bg-orange-500/15 px-1.5 text-[10px] text-orange-200">Manually checked</Badge>
                                )}
                                {!manualCheckedByTitle[item] && (
                                  <Badge className="border-cyan-500/35 bg-cyan-500/12 px-1.5 text-[10px] text-cyan-200">Auto generated by xJv LLM AI</Badge>
                                )}
                              </span>
                              <Checkbox disabled={!canEdit} checked={!!selected.permissions?.[item]} onCheckedChange={() => toggleCheck(item, 'permissions')} />
                            </label>
                            {quiz && <QuizHint item={quiz.question} answer={quiz.answer} category={quiz.category} />}
                          </div>
                        );
                      })}
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-red-200">Recent disciplinary logs</div>
                        <div className="mt-3 space-y-2">
                          {(selected.disciplinary?.logs || []).slice(0, 3).map(log => (
                            <div key={log.id} className="rounded-lg border border-white/10 bg-black/25 p-2 text-xs text-zinc-300">
                              <div className="font-medium text-white">{log.type} - {log.date}</div>
                              <div className="mt-1">{log.reason}</div>
                            </div>
                          ))}
                          {!(selected.disciplinary?.logs || []).length && (
                            <div className="rounded-lg border border-white/10 bg-black/25 p-2 text-xs text-zinc-400">No disciplinary logs yet.</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-fuchsia-300" /> Training logbook history</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className={infoCalloutClass}>
                        Unified quiz attempts and trainer reviews now drive readiness. These checklist rows remain available as manual sign-off and compatibility controls.
                      </div>
                      {!(selected.trainingLogs || []).length && (
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
                          No shared training log entries yet.
                        </div>
                      )}
                      {(selected.trainingLogs || []).slice(0, 8).map(entry => (
                        <div key={`tracker-training-log-${entry.id}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="border-white/10 bg-white/10 text-zinc-200">{entry.trainerName || 'Trainer'}</Badge>
                              <Badge className="border-cyan-500/35 bg-cyan-500/12 text-cyan-200">{entry.bracket || 'General Policy'}</Badge>
                            </div>
                            <div className="text-xs text-zinc-500">{entry.at ? new Date(entry.at).toLocaleString() : '-'}</div>
                          </div>
                          <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{entry.note}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="session">
            <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <Card className="border-white/10 bg-white/5">
                <CardHeader><CardTitle>Training Session Control</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Select rank</div>
                      <Select value={sessionRankFilter} onValueChange={setSessionRankFilter}>
                        <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All ranks</SelectItem>
                          {roles.map(role => (
                            <SelectItem key={`session-rank-${role}`} value={role}>{rankLabel(role)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Search user</div>
                      <Input
                        value={sessionUserQuery}
                        onChange={(e) => setSessionUserQuery(e.target.value)}
                        placeholder="Search name, role, trainer..."
                        className="border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Select user</div>
                    <Select
                      value={sessionTarget ? String(sessionTarget.id) : 'none'}
                      onValueChange={(value) => setSessionTargetId(value === 'none' ? null : Number(value))}
                    >
                      <SelectTrigger className="border-white/10 bg-black/30 text-white">
                        <SelectValue placeholder="Select a staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {sessionCandidates.map(member => (
                          <SelectItem key={`session-target-${member.id}`} value={String(member.id)}>
                            {member.name} ({rankLabel(member.role)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 text-xs text-zinc-500">{sessionCandidates.length} user(s) match current filters.</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{sessionTarget?.name || 'No staff selected'}</div>
                        <div className="mt-1 text-xs text-zinc-400">{sessionTarget ? `${sessionTarget.role} - Trainer: ${sessionTarget.trainer}` : 'Select a staff member to start a training session.'}</div>
                      </div>
                      {sessionTarget && (
                        <Badge className={`${statusColor(sessionTarget.status)} px-2 text-[10px]`}>{sessionTarget.status}</Badge>
                      )}
                    </div>
                    {sessionTarget && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
                            <span>Readiness</span>
                            <span>{completionPercent(sessionTarget)}%</span>
                          </div>
                          <Progress value={completionPercent(sessionTarget)} className="h-2 bg-white/10" />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button disabled={!canEdit || !sessionTarget} onClick={() => { syncOperationalTargets(selected?.id); setSessionNotesOpen(true); }} className="rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500">
                            Open Notes
                          </Button>
                          <Button disabled={!canEdit || !sessionTarget} onClick={() => { syncOperationalTargets(selected?.id); setSessionActionsOpen(true); }} className="rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-500 hover:to-green-400">
                            Open Actions
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-white/10 bg-white/5">
                  <CardHeader><CardTitle>Quiz Review History</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {!sessionTarget && (
                    <div className={infoCalloutClass}>
                      Select a staff member to review quiz attempts.
                    </div>
                    )}
                    {sessionTarget && !(sessionTarget.quizHistory || []).length && (
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
                        No quiz attempts recorded yet.
                      </div>
                    )}
                    {(sessionTarget?.quizHistory || []).slice(0, 12).map(attempt => (
                      <div key={attempt.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-white">
                            {attempt.category?.toUpperCase?.() || 'QUIZ'} - {new Date(attempt.at).toLocaleString()}
                          </div>
                          <Badge className={attempt.passed ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200' : 'border-red-500/35 bg-red-500/15 text-red-200'}>
                            {attempt.score}% {attempt.passed ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <Badge className={
                            attempt.reviewStatus === 'approved'
                              ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200'
                              : attempt.reviewStatus === 'needs_retake'
                                ? 'border-amber-500/35 bg-amber-500/15 text-amber-200'
                                : 'border-white/10 bg-white/10 text-zinc-300'
                          }>
                            Review: {attempt.reviewStatus || 'pending'}
                          </Badge>
                          {attempt.reviewedBy && (
                            <span className="text-zinc-500">By {attempt.reviewedBy}{attempt.reviewedAt ? ` - ${new Date(attempt.reviewedAt).toLocaleString()}` : ''}</span>
                          )}
                        </div>
                        <div className="mt-3 space-y-2">
                          {(attempt.items || []).map(item => (
                            <div key={`${attempt.id}-${item.id}`} className="rounded-lg border border-white/10 bg-black/25 p-2 text-xs">
                              <div className="font-medium text-zinc-100">{item.title}</div>
                              <div className="mt-1 text-zinc-400">Selected: <span className={item.isCorrect ? 'text-emerald-300' : 'text-red-300'}>{item.selected || 'No answer'}</span></div>
                              <div className="text-zinc-400">Correct: <span className={item.isCorrect ? 'text-emerald-300' : 'text-red-300'}>{item.correct || 'No answer set'}</span></div>
                            </div>
                          ))}
                        </div>
                        {canEdit && (
                          <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-black/25 p-2">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Trainer Review Note</div>
                            <Textarea
                              value={reviewDrafts[attempt.id] ?? attempt.reviewNote ?? ''}
                              onChange={(e) => setReviewDrafts(prev => ({ ...prev, [attempt.id]: e.target.value }))}
                              className="min-h-[72px] border-white/10 bg-black/30 text-white"
                              placeholder="Add review note, coaching points, or retake reason..."
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                onClick={() => applyQuizReview(attempt.id, 'approved')}
                                className="rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-500 hover:to-green-400"
                              >
                                Approve Attempt
                              </Button>
                              <Button
                                type="button"
                                onClick={() => applyQuizReview(attempt.id, 'needs_retake')}
                                className="rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-600 to-orange-500 text-white hover:from-amber-500 hover:to-orange-400"
                              >
                                Mark Retake
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5">
                  <CardHeader><CardTitle>Training Logbook</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2 md:grid-cols-[1fr,130px]">
                      <Textarea
                        value={trainingLogDraft.note}
                        onChange={(e) => setTrainingLogDraft(prev => ({ ...prev, note: e.target.value }))}
                        className="min-h-[88px] border-white/10 bg-black/30 text-white"
                        placeholder="Add session notes, coaching points, and progress observations..."
                        disabled={!canEdit || !sessionTarget}
                      />
                      <div className="space-y-2">
                        <Select
                          value={trainingLogDraft.bracket}
                          onValueChange={(value) => setTrainingLogDraft(prev => ({ ...prev, bracket: value }))}
                          disabled={!canEdit || !sessionTarget}
                        >
                          <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ruleBracketOptions.map(bracket => (
                              <SelectItem key={`training-log-bracket-${bracket}`} value={bracket}>{bracket}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={addTrainingLogEntry}
                          disabled={!canEdit || !sessionTarget || !trainingLogDraft.note.trim()}
                          className="w-full rounded-xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500"
                        >
                          Add Log Entry
                        </Button>
                      </div>
                    </div>
                    {sessionTarget && !(sessionTarget.trainingLogs || []).length && (
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
                        No training log entries yet.
                      </div>
                    )}
                    {(sessionTarget?.trainingLogs || []).slice(0, 40).map(entry => (
                      <div key={entry.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-white/10 bg-white/10 text-zinc-200">{entry.trainerName || 'Trainer'}</Badge>
                            <Badge className="border-cyan-500/35 bg-cyan-500/12 text-cyan-200">{entry.bracket || 'General Policy'}</Badge>
                          </div>
                          <div className="text-xs text-zinc-500">{entry.at ? new Date(entry.at).toLocaleString() : '-'}</div>
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{entry.note}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progression">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Role progression pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-6">
                  {roles.map(role => {
                    const inRole = staff.filter(member => member.role === role);
                    return (
                      <div key={role} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="font-semibold">{rankLabel(role)}</div>
                          <Badge className="border-white/10 bg-white/10 text-zinc-200">{inRole.length}</Badge>
                        </div>
                        <div className="space-y-3">
                          {inRole.length ? inRole.map(member => (
                            <div key={member.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                              <div className="font-medium">{member.name}</div>
                              <div className="mt-1 text-xs text-zinc-400">Next: {member.promotion}</div>
                              <Progress value={completionPercent(member)} className="mt-3 h-2 bg-white/10" />
                            </div>
                          )) : <div className="text-sm text-zinc-500">No staff in this role.</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hub">
            <div className="grid items-start gap-4 xl:grid-cols-[1.18fr,0.82fr]">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Overview & Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      'One record per staff member instead of one crowded worksheet tab',
                      'Checkboxes for training checks and values replace manual ticks',
                      'Quiz prompts are tied directly to checks for live testing',
                      'Fast filtering, trainer assignment, and progression tracking',
                    ].map(text => (
                      <div key={text} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-200">
                        {text}
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {quickLinks.map(link => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group rounded-xl border border-white/10 bg-black/25 p-3 transition hover:border-fuchsia-500/30 hover:bg-fuchsia-500/10"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-1.5">
                              <link.icon className="h-3.5 w-3.5 text-fuchsia-300" />
                            </div>
                            <div className="text-sm font-medium text-white">{link.label}</div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-zinc-500 transition group-hover:text-fuchsia-300" />
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Design Language</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm text-zinc-300">
                  <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-3">Dark black base with Drill UK purple glow accents.</div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">Card-based layout for quick scanning during training.</div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">Aligned to live Drill UK support, rules, and training flow.</div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Live Server Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {siteSignals.slice(0, 3).map(signal => (
                    <div key={signal.title} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="mb-1 text-sm font-semibold text-white">{signal.title}</div>
                      <div className="text-sm text-zinc-300">{signal.text}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Rule Training Pack</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {[
                    { title: 'Reports first', text: 'Use report-first workflow with clip review in moderation sessions.', icon: FileVideo },
                    { title: 'No RDM / valid RP reason', text: 'Keep this as a recurring quiz topic for force incidents.', icon: Swords },
                    { title: 'Unbiased reviews', text: 'Require second opinions on messy or disputed cases.', icon: Gavel },
                  ].map(item => (
                    <div key={item.title} className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-3">
                      <div className="mb-1.5 flex items-center gap-2 text-fuchsia-200">
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <div className="text-sm text-zinc-300">{item.text}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 xl:col-span-2">
                <CardHeader>
                  <CardTitle>Meet The Team Showcase</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  {teamCardShowcase.map(member => (
                    <div key={member.name} className="overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-black/30">
                      <img src={member.cardArt} alt={`${member.name} staff card`} className="h-[230px] w-full object-cover object-top" loading="lazy" />
                      <div className="space-y-2 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-white">{member.name}</div>
                          <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200">{member.rarity}</Badge>
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">{rankLabel(member.role)}</div>
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          <div className="rounded-lg border border-white/10 bg-black/40 p-1.5 text-center">
                            <div className="text-zinc-400">Support</div>
                            <div className="font-semibold text-white">{member.stats.support}</div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/40 p-1.5 text-center">
                            <div className="text-zinc-400">Reviews</div>
                            <div className="font-semibold text-white">{member.stats.reviews}</div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/40 p-1.5 text-center">
                            <div className="text-zinc-400">Lead</div>
                            <div className="font-semibold text-white">{member.stats.leadership}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stafftools">
            <div className="space-y-4">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Staff Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStaffToolsSection('punish');
                        setStaffToolsPunishSection('');
                        setStaffToolsExperimentalSection('');
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        staffToolsSection === 'punish'
                          ? 'border-fuchsia-500/40 bg-fuchsia-500/18 text-fuchsia-200'
                          : 'border-white/10 bg-black/25 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      Punish
                    </button>
                    {effectiveRole === 'head_admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setStaffToolsSection('experimental');
                          setStaffToolsPunishSection('');
                          setStaffToolsExperimentalSection('');
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          staffToolsSection === 'experimental'
                            ? 'border-amber-500/40 bg-amber-500/16 text-amber-100'
                            : 'border-white/10 bg-black/25 text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        Experimental
                      </button>
                    )}
                  </div>
                  {staffToolsSection === 'punish' && (
                    <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => setStaffToolsPunishSection('review-form')}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          staffToolsPunishSection === 'review-form'
                            ? 'border-cyan-500/35 bg-cyan-500/14 text-cyan-200'
                            : 'border-white/10 bg-black/25 text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        Review Form
                      </button>
                    </div>
                  )}
                  {staffToolsSection === 'experimental' && effectiveRole === 'head_admin' && (
                    <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => setStaffToolsExperimentalSection('quiz-access')}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          staffToolsExperimentalSection === 'quiz-access'
                            ? 'border-amber-500/40 bg-amber-500/16 text-amber-100'
                            : 'border-white/10 bg-black/25 text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        Quiz Access
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {!staffToolsSection && (
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle>Select a Tool</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={infoCalloutClass}>
                      Choose a tool category first. Nothing opens until you explicitly select it.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStaffToolsSection('punish');
                        setStaffToolsPunishSection('');
                        setStaffToolsExperimentalSection('');
                      }}
                      className="w-full rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/10 to-indigo-500/10 p-4 text-left transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/12"
                    >
                      <div className="text-sm font-semibold text-white">Punish</div>
                      <div className="mt-1 text-xs text-zinc-400">Discord review forms and punishment formatting tools.</div>
                    </button>
                    {effectiveRole === 'head_admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setStaffToolsSection('experimental');
                          setStaffToolsPunishSection('');
                          setStaffToolsExperimentalSection('');
                        }}
                        className="w-full rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 text-left transition hover:border-amber-400/40 hover:bg-amber-500/12"
                      >
                        <div className="text-sm font-semibold text-white">Experimental</div>
                        <div className="mt-1 text-xs text-zinc-400">Enable or revoke access to the imported quiz for specific dashboard users.</div>
                      </button>
                    )}
                  </CardContent>
                </Card>
              )}

              {staffToolsSection === 'punish' && !staffToolsPunishSection && (
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle>Punish Tools</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={infoCalloutClass}>
                      Select the exact punish tool you want to open.
                    </div>
                    <button
                      type="button"
                      onClick={() => setStaffToolsPunishSection('review-form')}
                      className="w-full rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-sky-500/10 p-4 text-left transition hover:border-cyan-400/40 hover:bg-cyan-500/12"
                    >
                      <div className="text-sm font-semibold text-white">Review Form</div>
                      <div className="mt-1 text-xs text-zinc-400">Generate a Discord-ready report block with license, Discord ID, reason, and clip link.</div>
                    </button>
                  </CardContent>
                </Card>
              )}

              {staffToolsSection === 'experimental' && !staffToolsExperimentalSection && effectiveRole === 'head_admin' && (
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle>Experimental Tools</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={infoCalloutClass}>
                      Experimental tools stay gated here until you explicitly enable them per user.
                    </div>
                    <button
                      type="button"
                      onClick={() => setStaffToolsExperimentalSection('quiz-access')}
                      className="w-full rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 text-left transition hover:border-amber-400/40 hover:bg-amber-500/12"
                    >
                      <div className="text-sm font-semibold text-white">Quiz Access</div>
                      <div className="mt-1 text-xs text-zinc-400">Choose exactly which dashboard users can see the experimental quiz tab.</div>
                    </button>
                  </CardContent>
                </Card>
              )}

              {staffToolsSection === 'experimental' && staffToolsExperimentalSection === 'quiz-access' && effectiveRole === 'head_admin' && (
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle>Experimental Quiz Access</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={subtleInfoCalloutClass}>
                      Head Admin only. Turning this on adds the <span className="font-semibold text-white">Quiz</span> tab to that account. Existing access for your own account is automatic as Head Admin.
                    </div>
                    <div className="space-y-3">
                      {managementUsers.map(user => (
                        <div key={`quiz-access-${user.id}`} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="truncate text-sm font-semibold text-white">{user.username || user.id}</div>
                              <Badge className={`${accountRoleColor(user.role)} px-1.5 text-[10px]`}>{accountRoleLabel(user.role)}</Badge>
                              {user.experimental_quiz_enabled && (
                                <Badge className="border-amber-500/40 bg-amber-500/16 px-1.5 text-[10px] text-amber-100">Quiz Enabled</Badge>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">{user.id}</div>
                          </div>
                          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-200 md:min-w-[220px]">
                            Grant quiz tab
                            <Checkbox
                              checked={Boolean(user.experimental_quiz_enabled) || user.role === 'head_admin'}
                              disabled={user.role === 'head_admin'}
                              onCheckedChange={(checked) => toggleExperimentalQuizAccess(user.id, Boolean(checked))}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {staffToolsSection === 'punish' && staffToolsPunishSection === 'review-form' && (
                <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
                  <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle>Discord Staff Formatter</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className={infoCalloutClass}>
                        Fill the fields and copy a clean Discord-ready block. This tool is available to all dashboard users.
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">License</div>
                          <Input
                            value={staffToolForm.license}
                            onChange={(e) => setStaffToolForm(prev => ({ ...prev, license: e.target.value }))}
                            placeholder="rockstar license / player license"
                            className="border-white/10 bg-black/30 text-white"
                          />
                        </div>
                        <div>
                          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Discord ID</div>
                          <Input
                            value={staffToolForm.discordId}
                            onChange={(e) => setStaffToolForm(prev => ({ ...prev, discordId: e.target.value }))}
                            placeholder="user id / mention"
                            className="border-white/10 bg-black/30 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Reason</div>
                        <Textarea
                          value={staffToolForm.reason}
                          onChange={(e) => setStaffToolForm(prev => ({ ...prev, reason: e.target.value }))}
                          className="min-h-[110px] border-white/10 bg-black/30 text-white"
                          placeholder="brief case summary / enforcement reason"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Clip Link</div>
                        <Input
                          value={staffToolForm.clipLink}
                          onChange={(e) => setStaffToolForm(prev => ({ ...prev, clipLink: e.target.value }))}
                          placeholder="https://..."
                          className="border-white/10 bg-black/30 text-white"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={copyStaffToolFormat} className="rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500">
                          Copy Discord Format
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setStaffToolForm({ license: '', discordId: '', reason: '', clipLink: '' })}
                          className="rounded-2xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10"
                        >
                          Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge className="border-cyan-500/35 bg-cyan-500/12 text-cyan-200">Discord</Badge>
                          <Badge className="border-white/10 bg-white/10 text-zinc-200">```ini``` ready</Badge>
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/35 p-4 text-sm text-zinc-200">{`[License]: ${staffToolForm.license || ''}
[Discord ID]: ${staffToolForm.discordId || ''}
[Reason]: ${staffToolForm.reason || ''}
[Clip Link]: ${staffToolForm.clipLink || ''}`}</pre>
                      </div>
                      <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/14 to-orange-500/10 p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge className="border-amber-400/35 bg-amber-500/15 text-amber-100">Post It Here</Badge>
                          <Badge className="border-white/10 bg-white/10 text-zinc-100">Required next step</Badge>
                        </div>
                        <div className="text-sm text-zinc-200">
                          After copying, post the formatted block in this Discord channel:
                        </div>
                        <a
                          href="https://discord.com/channels/1033780064996827227/1481342607652032685"
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block rounded-xl border border-fuchsia-500/30 bg-black/35 px-3 py-3 text-sm font-medium text-fuchsia-200 hover:bg-black/50 hover:text-fuchsia-100"
                        >
                          Go to: Punishment Review channel
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="experimentalquiz">
            <ExperimentalStaffQuiz defaultName={profile?.username || authUser?.email?.split('@')[0] || ''} />
          </TabsContent>

          <TabsContent value="management">
            <div className="space-y-4">
              <ManagementHub
                managementView={managementView}
                setManagementView={setManagementView}
                managementQuery={managementQuery}
                setManagementQuery={setManagementQuery}
                filteredCount={filteredManagementUsers.length}
                onOpenAudit={() => setActiveMainTab('audit')}
                onOpenRanks={() => setActiveMainTab('ranks')}
                onOpenQuizBuilder={() => setActiveMainTab('checkboxes')}
                onOpenDirectory={() => setActiveMainTab('management')}
              />
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Management Sub Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!canManageUsers && (
                  <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-4 text-sm text-red-200">
                    Head-admin access required for role and account management.
                  </div>
                )}
                {canManageUsers && (
                  <>
                    <div className={`${subtleInfoCalloutClass} flex flex-col gap-3 md:flex-row md:items-center md:justify-between`}>
                      <span>Manage trainer/admin access here. All changes are protected and audit logged.</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          onClick={createInviteToken}
                          disabled={inviteTokenCreating}
                          className="rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60"
                        >
                          <KeyRound className="mr-1.5 h-4 w-4" />
                          {inviteTokenCreating ? 'Generating...' : 'Create Token'}
                        </Button>
                        <Button onClick={() => setRosterSyncOpen(true)} className="rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-600 to-sky-600 px-4 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:from-cyan-500 hover:to-sky-500">
                          Sync Missing Roster
                        </Button>
                        <Button onClick={restoreDemoStaff} className="rounded-xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:from-fuchsia-500 hover:to-indigo-500">
                          Restore Demo Staff
                        </Button>
                      </div>
                    </div>
                    {latestInviteToken && (
                      <div className="flex flex-col gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3 text-xs text-emerald-100 md:flex-row md:items-center md:justify-between">
                        <div className="font-mono text-[13px] tracking-[0.08em] text-emerald-200">
                          One-time signup token: {latestInviteToken}
                        </div>
                        <Button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(latestInviteToken);
                            } catch (_) {
                              window.alert('Copy failed. Copy token manually.');
                            }
                          }}
                          className="h-8 rounded-xl border border-white/20 bg-black/30 px-3 text-xs text-zinc-100 hover:bg-white/10"
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copy token
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
                      <span>God Key (Head Admin): allow emergency self-reset to Head Admin after role testing.</span>
                      <Button
                        type="button"
                        onClick={() => toggleGodKey(profile?.id, !profile?.god_key_enabled)}
                        className={profile?.god_key_enabled
                          ? 'rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-500 hover:to-green-400'
                          : 'rounded-xl border border-white/15 bg-black/30 text-zinc-100 hover:bg-white/10'}
                      >
                        {profile?.god_key_enabled ? 'God Key Enabled' : 'Enable God Key'}
                      </Button>
                    </div>
                    {managementLoading ? (
                      <div className="text-sm text-zinc-400">Loading users...</div>
                    ) : (
                      <div className="space-y-3">
                        {managementError && (
                          <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200">
                            {managementError}
                          </div>
                        )}
                        {!managementError && !filteredManagementUsers.length && (
                          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
                            No users returned from profiles yet.
                          </div>
                        )}
                        {filteredManagementUsers.map(user => {
                          const linkedStaff = staff.find(member => member.traineeUserId === user.id) || null;
                          const identifierDraft = getManagementIdentifierDraft(user);
                          const additionalIdentifiers = Object.entries(identifierDraft).filter(([key]) => !KNOWN_PROFILE_IDENTIFIER_KEYS.includes(key));
                          return (
                          <div key={user.id} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
                            <div className="grid gap-2 md:grid-cols-[1.35fr,0.95fr,1fr,1.9fr,0.78fr,220px] md:items-center">
                            <div className="flex items-start gap-3">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={`${user.username || 'user'} avatar`} className="h-10 w-10 rounded-xl border border-white/10 object-cover" />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-sm font-semibold text-zinc-200">
                                  {(user.username?.[0] || 'G').toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold text-white">{user.username || user.id}</div>
                                  <Badge className={`${accountRoleColor(user.role)} px-1.5 text-[10px]`}>
                                    {accountRoleLabel(user.role)}
                                  </Badge>
                                  {user.god_key_enabled && (
                                    <Badge className="border-emerald-500/40 bg-emerald-500/15 px-1.5 text-[10px] text-emerald-200">
                                      God Key
                                    </Badge>
                                  )}
                                  {user.is_developer && (
                                    <Badge className="border-zinc-400/40 bg-zinc-500/15 px-1.5 text-[10px] text-zinc-200">
                                      Developer
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-zinc-500">{user.id}</div>
                              </div>
                            </div>
                            <Select value={user.role} onValueChange={(value) => updateUserRole(user.id, value)}>
                              <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">viewer</SelectItem>
                                <SelectItem value="staff_in_training">staff_in_training</SelectItem>
                                <SelectItem value="trainer">trainer</SelectItem>
                                <SelectItem value="admin">admin</SelectItem>
                                <SelectItem value="head_admin">head_admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                onClick={() => document.getElementById(`mgmt-avatar-${user.id}`)?.click()}
                                className="rounded-xl border border-white/15 bg-black/30 px-3 text-xs text-zinc-100 hover:bg-white/10"
                              >
                                Edit profile picture
                              </Button>
                              <input
                                id={`mgmt-avatar-${user.id}`}
                                type="file"
                                accept="image/png,image/webp,image/jpeg"
                                className="hidden"
                                onChange={(e) => {
                                  handleManagementAvatarFile(user.id, e.target.files?.[0]);
                                  e.target.value = '';
                                }}
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  setManagementIdentifiersOpenId(prev => prev === user.id ? null : user.id);
                                  setManagementIdentifierDrafts(prev => ({ ...prev, [user.id]: prev[user.id] || normalizeProfileIdentifiers(user.identifiers) }));
                                  setManagementIdentifierPasteDrafts(prev => ({ ...prev, [user.id]: prev[user.id] || '' }));
                                }}
                                className="rounded-xl border border-cyan-400/35 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(14,116,144,0.18),rgba(8,47,73,0.24))] px-3 text-xs text-white hover:bg-[linear-gradient(135deg,rgba(10,16,28,0.98),rgba(14,116,144,0.24),rgba(8,47,73,0.30))]"
                              >
                                {managementIdentifiersOpenId === user.id ? 'Close Identifiers' : 'Identifiers (' + countProfileIdentifiers(identifierDraft) + ')'}
                              </Button>
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              <div>
                                <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Current rank</div>
                                <Select
                                  value={linkedStaff?.role || 'none'}
                                  onValueChange={(value) => {
                                    if (value === 'none') return;
                                    updateLinkedStaffRank(user.id, value);
                                  }}
                                  disabled={!linkedStaff}
                                >
                                  <SelectTrigger className="h-9 border-white/10 bg-black/30 text-white">
                                    <SelectValue placeholder="No linked profile" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No linked profile</SelectItem>
                                    {roles.map(role => (
                                      <SelectItem key={`linked-rank-${user.id}-${role}`} value={role}>
                                        {rankLabel(role)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Profile</div>
                                <Select
                                  value={linkedStaff?.id?.toString() || 'none'}
                                  onValueChange={(value) => assignUserToStaff(user.id, value)}
                                >
                                  <SelectTrigger className="h-9 border-white/10 bg-black/30 text-white"><SelectValue placeholder="Linked staff profile" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No linked staff</SelectItem>
                                    {staff.map(member => (
                                      <SelectItem key={`link-${member.id}`} value={String(member.id)}>
                                        {member.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-200">
                              Grant God Key
                              <Checkbox
                                checked={Boolean(user.god_key_enabled)}
                                onCheckedChange={(checked) => toggleGodKey(user.id, Boolean(checked))}
                              />
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                onClick={() => toggleUserActive(user.id, !user.is_active)}
                                className={user.is_active
                                  ? 'rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-green-500 px-3 text-white hover:from-emerald-500 hover:to-green-400'
                                  : 'rounded-xl border border-red-400/40 bg-gradient-to-r from-red-700 to-red-600 px-3 text-white hover:from-red-600 hover:to-red-500'}
                              >
                                {user.is_active ? 'Active' : 'Disabled'}
                              </Button>
                              <Button
                                onClick={() => deleteManagedUser(user.id)}
                                disabled={Boolean(user.is_developer)}
                                className="rounded-xl border border-red-500/45 bg-gradient-to-r from-red-700 to-red-600 px-3 text-white hover:from-red-600 hover:to-red-500 disabled:cursor-not-allowed disabled:border-zinc-500/40 disabled:from-zinc-700 disabled:to-zinc-600 disabled:text-zinc-300"
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" /> {user.is_developer ? 'Protected' : 'Delete'}
                              </Button>
                            </div>
                            </div>
                            {managementIdentifiersOpenId === user.id && (
                              <div className="rounded-2xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(5,10,20,0.92),rgba(8,47,73,0.28),rgba(8,145,178,0.08))] p-4">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <div className="text-sm font-semibold text-white">Shared Identifiers</div>
                                    <div className="mt-1 text-xs text-zinc-400">Visible to all head admins. Paste a raw identifier block or fill the boxes manually.</div>
                                  </div>
                                  <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">{countProfileIdentifiers(identifierDraft)} saved</Badge>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                  {KNOWN_PROFILE_IDENTIFIER_KEYS.map((key) => (
                                    <div key={user.id + '-identifier-' + key}>
                                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">{formatProfileIdentifierLabel(key)}</div>
                                      <Input
                                        value={identifierDraft[key] || ''}
                                        onChange={(event) => updateManagementIdentifierDraft(user.id, key, event.target.value)}
                                        placeholder={key + ':...'}
                                        className="border-white/10 bg-black/30 text-white"
                                      />
                                    </div>
                                  ))}
                                  {additionalIdentifiers.map(([key, value]) => (
                                    <div key={user.id + '-identifier-extra-' + key}>
                                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">{formatProfileIdentifierLabel(key)}</div>
                                      <Input
                                        value={value || ''}
                                        onChange={(event) => updateManagementIdentifierDraft(user.id, key, event.target.value)}
                                        placeholder={key + ':...'}
                                        className="border-white/10 bg-black/30 text-white"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
                                  <div>
                                    <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Raw identifier block</div>
                                    <Textarea
                                      value={managementIdentifierPasteDrafts[user.id] || ''}
                                      onChange={(event) => setManagementIdentifierPasteDrafts(prev => ({ ...prev, [user.id]: event.target.value }))}
                                      className="min-h-[170px] border-white/10 bg-black/30 text-white"
                                      placeholder={`discord:1277690839812014120\nfivem:13012825\nlicense:...\nlicense2:...\nlive:...\nxbl:...\nsteam:...`}
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs leading-6 text-zinc-300">
                                      Paste the full block exactly as copied. Each line with <span className="font-semibold text-white">type:value</span> is parsed into the right box automatically.
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        onClick={() => pasteManagementIdentifiersFromClipboard(user.id)}
                                        className="rounded-xl border border-cyan-400/35 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(14,116,144,0.18),rgba(8,47,73,0.24))] px-3 text-xs text-white hover:bg-[linear-gradient(135deg,rgba(10,16,28,0.98),rgba(14,116,144,0.24),rgba(8,47,73,0.30))]"
                                      >
                                        Paste From Clipboard
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => applyManagementIdentifierPaste(user.id)}
                                        className="rounded-xl px-3 text-xs"
                                      >
                                        Apply Raw Block
                                      </Button>
                                      <Button
                                        type="button"
                                        onClick={() => saveUserIdentifiers(user.id)}
                                        className="rounded-xl border border-fuchsia-400/35 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(8,145,178,0.16),rgba(88,28,135,0.18))] px-3 text-xs text-white hover:bg-[linear-gradient(135deg,rgba(10,16,28,0.98),rgba(8,145,178,0.22),rgba(88,28,135,0.24))]"
                                      >
                                        Save Identifiers
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )})}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Management Audit Log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!canManageUsers && (
                  <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-4 text-sm text-red-200">
                    Head-admin access required for audit log visibility.
                  </div>
                )}
                {canManageUsers && (
                  <>
                    <div className={subtleInfoCalloutClass}>
                      Tracks who changed what, where it was changed, and when.
                    </div>
                    <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        <Input
                          value={auditQuery}
                          onChange={(e) => setAuditQuery(e.target.value)}
                          placeholder="Search action, tab, actor, target..."
                          className="border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
                        />
                        <Select value={auditActorFilter} onValueChange={setAuditActorFilter}>
                          <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue placeholder="Actor" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All actors</SelectItem>
                            {auditActorOptions.map(option => (
                              <SelectItem key={`audit-actor-${option.id}`} value={option.id}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                          <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue placeholder="Action" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All actions</SelectItem>
                            {auditActionOptions.map(action => (
                              <SelectItem key={`audit-action-${action}`} value={action}>{formatAuditAction(action)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={auditDateFilter} onValueChange={setAuditDateFilter}>
                          <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue placeholder="Date window" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All time</SelectItem>
                            <SelectItem value="24h">Last 24h</SelectItem>
                            <SelectItem value="7d">Last 7d</SelectItem>
                            <SelectItem value="30d">Last 30d</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {auditTabOptions.map(tab => (
                          <button
                            key={`audit-tab-${tab}`}
                            type="button"
                            onClick={() => setAuditTabFilter(tab)}
                            className={`rounded-full border px-3 py-1 text-[11px] ${
                              auditTabFilter === tab
                                ? 'border-fuchsia-500/40 bg-fuchsia-500/18 text-fuchsia-200'
                                : 'border-white/12 bg-black/30 text-zinc-300 hover:bg-white/10'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                        <label className="ml-2 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] text-zinc-300">
                          <Checkbox checked={auditRequireChanges} onCheckedChange={(checked) => setAuditRequireChanges(Boolean(checked))} />
                          Has changed fields
                        </label>
                        <Input
                          value={auditFieldQuery}
                          onChange={(e) => setAuditFieldQuery(e.target.value)}
                          placeholder="Changed field contains..."
                          className="h-8 w-[220px] border-white/10 bg-black/30 text-xs text-white placeholder:text-zinc-500"
                        />
                        <Badge className="border-white/10 bg-white/10 text-zinc-200">
                          {filteredAuditLogs.length} results
                        </Badge>
                        <Button
                          type="button"
                          onClick={() => {
                            setAuditQuery('');
                            setAuditTabFilter('All');
                            setAuditActorFilter('All');
                            setAuditActionFilter('All');
                            setAuditDateFilter('All');
                            setAuditRequireChanges(false);
                            setAuditFieldQuery('');
                          }}
                          className="h-8 rounded-full border border-white/12 bg-black/30 px-3 text-xs text-zinc-200 hover:bg-white/10"
                        >
                          Clear filters
                        </Button>
                      </div>
                    </div>
                    {auditLoading && <div className="text-sm text-zinc-400">Loading audit entries...</div>}
                    {auditError && (
                      <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200">
                        {auditError}
                      </div>
                    )}
                    {!auditLoading && !auditError && !filteredAuditLogs.length && (
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
                        No audit entries match current filters.
                      </div>
                    )}
                    {!auditError && filteredAuditLogs.length > 0 && (
                      <div className="space-y-2">
                        {filteredAuditLogs.map(log => {
                          const actor = managementUsers.find(user => user.id === log.actor_id);
                          const target = getAuditTargetPresentation(log, staffRecords, managementUsers);
                          const changedFields = log.after_value && typeof log.after_value === 'object' && !Array.isArray(log.after_value)
                            ? Object.keys(log.after_value).slice(0, 5)
                            : [];
                          return (
                            <div key={log.id} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1.2fr,0.8fr,1.2fr,1fr,0.9fr] md:items-center">
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Actor</div>
                                <div className="truncate text-sm font-semibold text-white">{actor?.username || log.actor_id || 'Unknown'}</div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Tab</div>
                                <Badge className="border-fuchsia-500/30 bg-fuchsia-500/12 text-fuchsia-200">{inferAuditTab(log.action)}</Badge>
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Action</div>
                                <div className="truncate text-sm text-zinc-200">{formatAuditAction(log.action)}</div>
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Target</div>
                                <div className="truncate text-sm font-medium text-zinc-100">{target.label}</div>
                                {(target.meta || target.rawId) && (
                                  <div className="truncate text-[11px] text-zinc-500">
                                    {[target.meta, target.rawId && target.rawId !== target.label ? 'ID: ' + target.rawId : ''].filter(Boolean).join(' | ')}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">When</div>
                                <div className="text-sm text-zinc-300">{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</div>
                              </div>
                              {!!changedFields.length && (
                                <div className="md:col-span-5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Changed</span>
                                    {changedFields.map(field => (
                                      <Badge key={`${log.id}-${field}`} className="border-white/10 bg-white/10 text-[10px] text-zinc-200">
                                        {field}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ranks">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Rank Display Names</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={subtleInfoCalloutClass}>
                  Rename how ranks are shown across the dashboard. Internal rank keys stay the same.
                </div>
                {rankDisplayLoading && (
                  <div className="text-sm text-zinc-400">Loading rank display settings...</div>
                )}
                <div className="space-y-2">
                  {roles.map(role => (
                    <div key={`rank-display-${role}`} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-[160px,1fr,120px] md:items-center">
                      <Badge className={`${roleColor(role)} w-fit px-2 text-[10px]`}>{role}</Badge>
                      <Input
                        value={rankDrafts[role] ?? rankLabel(role)}
                        onChange={(e) => setRankDrafts(prev => ({ ...prev, [role]: e.target.value }))}
                        placeholder={role}
                        className="border-white/10 bg-black/30 text-white"
                      />
                      <Button
                        type="button"
                        onClick={() => saveRankDisplayName(role)}
                        className="rounded-xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500"
                      >
                        Save
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discipline">
            <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Disciplinary Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Select rank</div>
                      <Select value={disciplineRankFilter} onValueChange={setDisciplineRankFilter}>
                        <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All ranks</SelectItem>
                          {roles.map(role => (
                            <SelectItem key={`discipline-rank-${role}`} value={role}>{rankLabel(role)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Search user</div>
                      <Input
                        value={disciplineUserQuery}
                        onChange={(e) => setDisciplineUserQuery(e.target.value)}
                        placeholder="Search name, role, trainer..."
                        className="border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Select user</div>
                    <Select
                      value={disciplineTarget ? String(disciplineTarget.id) : 'none'}
                      onValueChange={(value) => setDisciplineTargetId(value === 'none' ? null : Number(value))}
                    >
                      <SelectTrigger className="border-white/10 bg-black/30 text-white">
                        <SelectValue placeholder="Select a staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No selection</SelectItem>
                        {disciplineCandidates.map(member => (
                          <SelectItem key={`discipline-target-${member.id}`} value={String(member.id)}>
                            {member.name} ({rankLabel(member.role)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 text-xs text-zinc-500">{disciplineCandidates.length} user(s) match current filters.</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                    Selected staff: <span className="font-semibold text-white">{disciplineTarget?.name || 'None selected'}</span>{disciplineTarget ? ` (${disciplineTarget.role})` : ''}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      disabled={!canEdit || !disciplineTarget}
                      onClick={() => {
                        setDisciplineType('Warning');
                        setDisciplineOpen(true);
                      }}
                      className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-500 hover:to-orange-400"
                    >
                      Issue Warning
                    </Button>
                    <Button
                      disabled={!canEdit || !disciplineTarget}
                      onClick={() => {
                        setDisciplineType('Disciplinary Action');
                        setDisciplineOpen(true);
                      }}
                      className="rounded-2xl border border-red-600/45 bg-gradient-to-r from-red-800 to-red-600 text-white hover:from-red-700 hover:to-red-500"
                    >
                      Disciplinary Action
                    </Button>
                  </div>
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                    All actions are logged and visible in staff review history.
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Disciplinary Log</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!disciplineTarget && (
                    <div className={infoCalloutClass}>
                      Select a staff member to review disciplinary history.
                    </div>
                  )}
                  {disciplineTarget && (disciplineTarget.disciplinary?.logs || []).length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
                      No disciplinary entries for this staff member.
                    </div>
                  )}
                  {(disciplineTarget?.disciplinary?.logs || []).map(log => (
                    <div key={log.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">{log.type}</div>
                        <div className="text-xs text-zinc-500">{log.date}</div>
                      </div>
                      <div className="mt-2 text-sm text-zinc-300">{log.reason}</div>
                      <div className="mt-2 text-xs text-zinc-500">Issued by: {log.issuer || 'Unassigned'}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="checkboxes">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Checkbox / Quiz Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {!canManageCheckboxes && (
                  <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-4 text-sm text-red-200">
                    Admin or head-admin role required to edit checkbox definitions.
                  </div>
                )}
                {canManageCheckboxes && (
                  <>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
                      Pick a list, click a checkbox item to edit details, add multiple answers, and control which ranks can see it.
                    </div>
                    {checkboxCatalogLoading ? (
                      <div className="text-sm text-zinc-400">Loading checkbox catalog...</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {[
                            { id: 'role', label: 'Role Checklist', badge: 'border-blue-400/40 bg-blue-500/10 text-blue-200' },
                            { id: 'core', label: 'Core Values', badge: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' },
                            { id: 'permission', label: 'Permissions', badge: 'border-amber-400/40 bg-amber-500/10 text-amber-200' },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setCheckboxMenu(tab.id)}
                              className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                                checkboxMenu === tab.id
                                  ? 'border-fuchsia-500/45 bg-fuchsia-500/15 text-fuchsia-100'
                                  : 'border-white/10 bg-black/30 text-zinc-300 hover:bg-white/10'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                          <div className="ml-auto">
                            <button
                              type="button"
                              onClick={() => setCheckboxFilterOpen(v => !v)}
                              className="mr-2 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
                            >
                              Filters
                            </button>
                            <Button
                              onClick={() => {
                                const created = addCheckboxItem(checkboxMenu, 'T-MOD');
                                if (created) openCheckboxEditor(created);
                              }}
                              className="h-8 rounded-xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-3 text-xs text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:from-fuchsia-500 hover:to-indigo-500"
                            >
                              Add Checkbox
                            </Button>
                          </div>
                        </div>

                        {checkboxFilterOpen && (
                          <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 md:grid-cols-[1fr,180px,120px]">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                              <Input
                                value={checkboxQuery}
                                onChange={(e) => setCheckboxQuery(e.target.value)}
                                placeholder="Search title, question, or answers..."
                                className="border-white/10 bg-black/30 pl-9 text-white placeholder:text-zinc-500"
                              />
                            </div>
                            <Select value={checkboxRankFilter} onValueChange={setCheckboxRankFilter}>
                              <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="All">All ranks</SelectItem>
                                {roles.map(role => <SelectItem key={`cb-rank-${role}`} value={role}>{rankLabel(role)}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Badge className="justify-center border-white/10 bg-white/10 text-zinc-200">{filteredCheckboxItems.length} shown</Badge>
                          </div>
                        )}

                        <div className="space-y-2">
                          {checkboxRowsWithDividers.map(row => {
                            if (row.type === 'divider') {
                              const dividerLabel = row.groupKey === 'ALL' ? 'All ranks' : rankLabel(row.groupKey);
                              const dividerClass = row.groupKey === 'ALL'
                                ? 'border-white/15 bg-white/10 text-zinc-200'
                                : `${roleColor(row.groupKey)} text-[11px]`;
                              return (
                                <div key={row.key} className="flex items-center gap-2 px-1">
                                  <Badge className={`${dividerClass} px-2 py-0.5 uppercase tracking-[0.14em]`}>{dividerLabel}</Badge>
                                  <div className="h-px flex-1 bg-white/10" />
                                </div>
                              );
                            }
                            const item = row.item;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => openCheckboxEditor(item)}
                                className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-fuchsia-500/35 hover:bg-fuchsia-500/10"
                              >
                                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                  <span>{item.title}</span>
                                  {parseQuizPayload(item.answer).manual && (
                                    <Badge className="border-orange-500/40 bg-orange-500/15 px-1.5 text-[10px] text-orange-200">Manually checked</Badge>
                                  )}
                                  {!parseQuizPayload(item.answer).manual && (
                                    <Badge className="border-cyan-500/35 bg-cyan-500/12 px-1.5 text-[10px] text-cyan-200">Auto generated by xJv LLM AI</Badge>
                                  )}
                                </div>
                                <div className="mt-1 max-h-8 overflow-hidden text-xs text-zinc-400">{item.question || 'No question yet'}</div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {sortRankScope(parseRankScope(item.role)).length ? sortRankScope(parseRankScope(item.role)).map(rank => (
                                    <Badge key={rank} className="border-white/10 bg-white/10 px-2 text-[10px] text-zinc-200">{rankLabel(rank)}</Badge>
                                  )) : (
                                    <Badge className="border-white/10 bg-white/10 px-2 text-[10px] text-zinc-200">All ranks</Badge>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                          {!filteredCheckboxItems.length && (
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-500">No items in this list yet.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {employeeQuickView && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-white/15 bg-zinc-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold text-white">
                      {employeeQuickView === 'tracker' ? 'Staff Tracker Snapshot' : employeeQuickView === 'session' ? 'Training Session Snapshot' : 'Progression Snapshot'} - {selected.name}
                    </div>
                    <Badge className={roleColor(selected.role)}>{rankLabel(selected.role)}</Badge>
                    <Badge className={statusColor(selected.status)}>{selected.status}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {employeeQuickView === 'tracker'
                      ? 'Compact staff overview without leaving the main dashboard.'
                      : employeeQuickView === 'session'
                        ? 'Quick trainer review, notes, and attempt history.'
                        : 'Progress checkpoints, sign-off state, and readiness.'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      syncOperationalTargets(selected?.id);
                      setActiveMainTab(employeeQuickView);
                      setEmployeeQuickView('');
                    }}
                    className="rounded-2xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10"
                  >
                    Open Full Page
                  </Button>
                  <button type="button" onClick={() => setEmployeeQuickView('')} className="text-sm text-zinc-400 hover:text-white">Close</button>
                </div>
              </div>

              {employeeQuickView === 'tracker' && (
                <div className="grid gap-4 xl:grid-cols-[280px,1fr]">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      {selected.profileImage ? (
                        <img src={selected.profileImage} alt={`${selected.name} profile`} className="h-[320px] w-full object-cover" />
                      ) : (
                        <div className="flex h-[320px] items-center justify-center text-sm text-zinc-500">No card image</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Trainer</div><div className="mt-2 text-sm text-white">{selected.trainer}</div></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Staff Since</div><div className="mt-2 text-sm text-white">{selected.staffSince}</div></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{rankLabel(selected.role)} Since</div><div className="mt-2 text-sm text-white">{selected.modSince}</div></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Readiness</div><div className="mt-2 text-sm text-white">{completionPercent(selected)}%</div></div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-4">
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">Approved</div>
                        <div className="mt-2 text-3xl font-semibold text-white">{selectedTrainingSummary.approved}</div>
                        <div className="mt-2 text-xs text-zinc-400">of {selectedTrainingSummary.total || 0} required quizzes</div>
                      </div>
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-amber-200">Pending Review</div>
                        <div className="mt-2 text-3xl font-semibold text-white">{selectedTrainingSummary.pending}</div>
                        <div className="mt-2 text-xs text-zinc-400">passed attempts awaiting trainer sign-off</div>
                      </div>
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-red-200">Retake Required</div>
                        <div className="mt-2 text-3xl font-semibold text-white">{selectedTrainingSummary.retake}</div>
                        <div className="mt-2 text-xs text-zinc-400">attempts flagged for another run</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Signed Off</div>
                        <div className="mt-2 text-3xl font-semibold text-white">{selected.signedOff ? 'Yes' : 'No'}</div>
                        <div className="mt-2 text-xs text-zinc-400">trainer progression sign-off state</div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent training logbook</div>
                      <div className="mt-3 space-y-2">
                        {(selected.trainingLogs || []).slice(0, 4).map(entry => (
                          <div key={`employee-qv-log-${entry.id}`} className="rounded-xl border border-white/10 bg-black/25 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="border-white/10 bg-white/10 text-zinc-200">{entry.trainerName || 'Trainer'}</Badge>
                                <Badge className="border-cyan-500/35 bg-cyan-500/12 text-cyan-200">{entry.bracket || 'General Policy'}</Badge>
                              </div>
                              <div className="text-xs text-zinc-500">{entry.at ? new Date(entry.at).toLocaleString() : '-'}</div>
                            </div>
                            <div className="mt-2 text-sm text-zinc-200">{entry.note}</div>
                          </div>
                        ))}
                        {!(selected.trainingLogs || []).length && <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-zinc-400">No training log entries yet.</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {employeeQuickView === 'session' && (
                <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
                        <span>Readiness</span>
                        <span>{completionPercent(selected)}%</span>
                      </div>
                      <Progress value={completionPercent(selected)} className="h-2.5 bg-white/10" />
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <Button disabled={!canEdit} onClick={() => { syncOperationalTargets(selected?.id); setSessionNotesOpen(true); }} className="rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500">Open Notes</Button>
                        <Button disabled={!canEdit} onClick={() => { syncOperationalTargets(selected?.id); setSessionActionsOpen(true); }} className="rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-500 hover:to-green-400">Open Actions</Button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Session notes snapshot</div>
                      <div className="mt-3 space-y-3 text-sm text-zinc-300">
                        <div><span className="text-zinc-500">Strong sides:</span> {selected.strongSides || '-'}</div>
                        <div><span className="text-zinc-500">Attention points:</span> {selected.attentionPoints || '-'}</div>
                        <div><span className="text-zinc-500">General notes:</span> {selected.notes || '-'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent quiz review history</div>
                    <div className="mt-3 space-y-3">
                      {(selected.quizHistory || []).slice(0, 8).map(attempt => (
                        <div key={`employee-qv-attempt-${attempt.id}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-white">{attempt.title || attempt.quizKey || attempt.category}</div>
                              <div className="mt-1 text-xs text-zinc-500">{attempt.at ? new Date(attempt.at).toLocaleString() : ''}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={attempt.passed ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-100' : 'border-red-500/35 bg-red-500/12 text-red-100'}>{attempt.score}%</Badge>
                              {normalizeReviewStatus(attempt.reviewStatus) === 'approved' && <Badge className="border-emerald-500/35 bg-emerald-500/12 text-emerald-100">Approved</Badge>}
                              {normalizeReviewStatus(attempt.reviewStatus) === 'pending' && attempt.passed && <Badge className="border-amber-500/35 bg-amber-500/12 text-amber-100">Pending Review</Badge>}
                              {normalizeReviewStatus(attempt.reviewStatus) === 'needs_retake' && <Badge className="border-red-500/35 bg-red-500/12 text-red-100">Retake</Badge>}
                            </div>
                          </div>
                          {attempt.reviewNote && <div className="mt-2 text-sm text-zinc-300">{attempt.reviewNote}</div>}
                        </div>
                      ))}
                      {!(selected.quizHistory || []).length && <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">No quiz attempts logged yet.</div>}
                    </div>
                  </div>
                </div>
              )}

              {employeeQuickView === 'progression' && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-blue-500/10 p-5">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-300">Readiness score</div>
                        <div className="mt-1 text-5xl font-bold leading-none text-white">{completionPercent(selected)}%</div>
                      </div>
                      <Badge className="border-white/15 bg-white/10 text-zinc-100">Target: {selected.promotion}</Badge>
                    </div>
                    <Progress value={completionPercent(selected)} className="mt-4 h-2.5 bg-white/10" />
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Signed off</div><div className="mt-2 text-lg font-semibold text-white">{selected.signedOff ? 'Yes' : 'No'}</div></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Promotion target</div><div className="mt-2 text-lg font-semibold text-white">{selected.promotion || '-'}</div></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Warnings</div><div className="mt-2 text-lg font-semibold text-white">{selected.disciplinary?.warnings || 0}</div></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Actions</div><div className="mt-2 text-lg font-semibold text-white">{selected.disciplinary?.actions || 0}</div></div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-5 lg:col-span-2">
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Progress breakdown</div>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4"><div className="text-sm font-medium text-emerald-200">Approved</div><div className="mt-1 text-3xl font-semibold text-white">{selectedTrainingSummary.approved}</div></div>
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4"><div className="text-sm font-medium text-amber-200">Pending Review</div><div className="mt-1 text-3xl font-semibold text-white">{selectedTrainingSummary.pending}</div></div>
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-4"><div className="text-sm font-medium text-red-200">Retake Required</div><div className="mt-1 text-3xl font-semibold text-white">{selectedTrainingSummary.retake}</div></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-sm font-medium text-white">Required Quizzes</div><div className="mt-1 text-3xl font-semibold text-white">{selectedTrainingSummary.total}</div></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {removeStaffOpen && (() => {
          const removeTarget = staffRecords.find(member => member.id === removeStaffTargetId);
          return removeTarget ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-2xl rounded-[28px] border border-white/12 bg-[#09090d] shadow-[0_25px_90px_rgba(0,0,0,0.55)]">
                <div className="border-b border-white/10 bg-gradient-to-r from-red-950/40 via-black to-orange-950/30 px-6 py-5">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-red-200/80">Staff Removal</div>
                  <div className="mt-2 text-2xl font-semibold text-white">Remove {removeTarget.name} from staff records</div>
                  <div className="mt-2 text-sm text-zinc-400">This stores the removal reason and notes instead of deleting the history blindly.</div>
                </div>
                <div className="space-y-4 px-6 py-6">
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Reason</div>
                    <Input value={removeStaffReason} onChange={(e) => setRemoveStaffReason(e.target.value)} placeholder="Required reason for removal..." className="border-red-400/25 bg-black/35 text-white placeholder:text-zinc-500" />
                  </div>
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Notes</div>
                    <Textarea value={removeStaffNotes} onChange={(e) => setRemoveStaffNotes(e.target.value)} className="min-h-[150px] border-white/10 bg-black/30 text-white" placeholder="Write context, timeline, and any supporting notes..." />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
                  <Button type="button" onClick={() => setRemoveStaffOpen(false)} className="rounded-2xl border border-white/15 bg-black/30 text-zinc-100 hover:bg-white/10">Cancel</Button>
                  <Button type="button" disabled={!removeStaffReason.trim() || deletingStaffId === removeTarget.id} onClick={confirmRemoveStaff} className="rounded-2xl border border-red-500/45 bg-red-600/15 text-red-100 hover:bg-red-600/22 disabled:opacity-50">{deletingStaffId === removeTarget.id ? 'Removing staff...' : 'Confirm removal'}</Button>
                </div>
              </div>
            </div>
          ) : null;
        })()}
        {removedStaffOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-5xl rounded-[28px] border border-white/12 bg-[#09090d] shadow-[0_25px_90px_rgba(0,0,0,0.55)]">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-black via-fuchsia-950/20 to-cyan-950/20 px-6 py-5">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">Removed Staff</div>
                  <div className="mt-2 text-2xl font-semibold text-white">Removed staff members</div>
                  <div className="mt-2 text-sm text-zinc-400">Logged removals stay here with their recorded reason and notes.</div>
                </div>
                <Button type="button" onClick={() => setRemovedStaffOpen(false)} className="rounded-2xl border border-white/15 bg-black/30 text-zinc-100 hover:bg-white/10">Close</Button>
              </div>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-6">
                {!removedStaffRecords.length && (
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">No removed staff members logged yet.</div>
                )}
                {removedStaffRecords.map(member => (
                  <div key={member.id} className="rounded-3xl border border-white/10 bg-black/25 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold text-white">{member.name}</div>
                      <Badge className={roleColor(member.role) + ' px-2.5 text-[10px]'}>{rankLabel(member.role)}</Badge>
                      <Badge className="border-red-500/35 bg-red-500/12 text-red-100">Removed</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Removed by</div><div className="mt-2 text-sm text-white">{member.removedBy || 'Unknown'}</div></div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Removed at</div><div className="mt-2 text-sm text-white">{member.removedAt ? new Date(member.removedAt).toLocaleString() : 'Unknown'}</div></div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Trainer</div><div className="mt-2 text-sm text-white">{member.trainer || 'Unassigned'}</div></div>
                    </div>
                    <div className="mt-4 grid gap-3 xl:grid-cols-2">
                      <div className="rounded-2xl border border-red-500/25 bg-red-500/8 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-red-200">Removal reason</div><div className="mt-3 whitespace-pre-line text-sm leading-6 text-white">{member.removalReason || 'No reason recorded.'}</div></div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Removal notes</div><div className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-200">{member.removalNotes || 'No notes recorded.'}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {assignQuizOpen && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">Assign Quiz - {selected.name}</div>
                  <div className="mt-1 text-sm text-zinc-400">Assigned quizzes appear in My Progress. Rank-matched quizzes already show automatically.</div>
                </div>
                <button type="button" onClick={() => setAssignQuizOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {knowledgeQuizDefinitions.map(definition => {
                  const assigned = (selected.assignedQuizKeys || []).includes(definition.key);
                  const rankMatched = definition.kind === 'mandatory' || definition.rankKey === selected.role;
                  return (
                    <button
                      key={`assign-${definition.key}`}
                      type="button"
                      onClick={() => toggleQuizAssignment(definition)}
                      className={`rounded-2xl border p-4 text-left transition ${assigned ? 'border-cyan-400/45 bg-cyan-500/12' : 'border-white/10 bg-black/25 hover:bg-white/5'}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={definition.kind === 'mandatory' ? 'border-amber-500/35 bg-amber-500/12 text-amber-100' : 'border-cyan-500/35 bg-cyan-500/12 text-cyan-100'}>{definition.badge}</Badge>
                        {definition.rankLabel && <Badge className={roleColor(definition.rankKey)}>{definition.rankLabel}</Badge>}
                        {assigned && <Badge className="border-cyan-500/35 bg-cyan-500/12 text-cyan-100">Assigned</Badge>}
                        {rankMatched && <Badge className="border-emerald-500/35 bg-emerald-500/12 text-emerald-100">Active by rank</Badge>}
                      </div>
                      <div className="mt-3 text-sm font-semibold text-white">{definition.title}</div>
                      <div className="mt-1 text-xs text-zinc-400">{definition.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {rosterSyncOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-cyan-500/35 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Sync Missing Roster Profiles</div>
                <button type="button" onClick={() => setRosterSyncOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-300">
                  Copy and paste your current staff list here. This only adds names missing from tracker.
                </div>
                <Textarea
                  value={rosterSyncText}
                  onChange={(e) => setRosterSyncText(e.target.value)}
                  className="min-h-[260px] border-white/10 bg-black/30 text-white"
                  placeholder="1 Junior Associate    Begoshi"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setRosterSyncOpen(false)} className="rounded-2xl">Cancel</Button>
                  <Button onClick={syncMissingRosterProfiles} className="rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-600 to-sky-600 text-white hover:from-cyan-500 hover:to-sky-500">
                    Sync Missing Profiles
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {addStaffOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Add Staff Member</div>
                <button type="button" onClick={() => setAddStaffOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Staff name</div>
                  <Input
                    value={addStaffForm.name}
                    onChange={(e) => setAddStaffForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Staff display name"
                    className="border-white/10 bg-black/30 text-white"
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Rank</div>
                  <Select value={addStaffForm.role} onValueChange={(value) => setAddStaffForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                    {roles.map(role => <SelectItem key={role} value={role}>{rankLabel(role)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Assigned trainer</div>
                  <Input
                    value={addStaffForm.trainer}
                    onChange={(e) => setAddStaffForm(prev => ({ ...prev, trainer: e.target.value }))}
                    placeholder="Trainer name"
                    className="border-white/10 bg-black/30 text-white"
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Staff since</div>
                  <Input
                    type="date"
                    value={addStaffForm.staffSince}
                    onChange={(e) => setAddStaffForm(prev => ({ ...prev, staffSince: e.target.value }))}
                    className="border-white/10 bg-black/30 text-white"
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Rank since</div>
                  <Input
                    type="date"
                    value={addStaffForm.modSince}
                    onChange={(e) => setAddStaffForm(prev => ({ ...prev, modSince: e.target.value }))}
                    className="border-white/10 bg-black/30 text-white"
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Card / profile image</div>
                  <Input
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    onChange={(e) => setAddStaffCardFile(e.target.files?.[0] || null)}
                    className="border-white/10 bg-black/30 text-white file:mr-3 file:rounded-md file:border-0 file:bg-fuchsia-600 file:px-2 file:py-1 file:text-xs file:text-white hover:file:bg-fuchsia-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Image URL (optional override)</div>
                  <Input
                    value={addStaffForm.avatar}
                    onChange={(e) => setAddStaffForm(prev => ({ ...prev, avatar: e.target.value }))}
                    placeholder="/assets/cards/name.webp or https://..."
                    className="border-white/10 bg-black/30 text-white"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setAddStaffOpen(false)} className="rounded-2xl">Cancel</Button>
                <Button onClick={addStaff} className="rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500">Create Staff Member</Button>
              </div>
            </div>
          </div>
        )}


        {videoQuizEditorOpen && videoQuizDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">{videoQuizDraft.id ? 'Edit Video Quiz' : 'Create Video Quiz'}</div>
                  <div className="mt-1 text-sm text-zinc-400">Build one scenario quiz with multiple clips, watchouts, and answer prompts.</div>
                </div>
                <button type="button" onClick={closeVideoQuizEditor} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Quiz title</div>
                  <Input
                    value={videoQuizDraft.title || ''}
                    onChange={(e) => setVideoQuizDraft(prev => ({ ...prev, title: e.target.value }))}
                    className="border-white/10 bg-black/30 text-white"
                    placeholder="Scenario review title"
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Quiz key</div>
                  <Input
                    value={videoQuizDraft.quizKey || ''}
                    onChange={(e) => setVideoQuizDraft(prev => ({ ...prev, quizKey: e.target.value.toLowerCase().replace(/[^a-z0-9-|]/g, '-') }))}
                    className="border-white/10 bg-black/30 text-white"
                    placeholder="video-tmod-scenario-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Description</div>
                  <Textarea
                    value={videoQuizDraft.description || ''}
                    onChange={(e) => setVideoQuizDraft(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[80px] border-white/10 bg-black/30 text-white"
                    placeholder="What should staff watch for across the whole scenario?"
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Rank scope</div>
                  <Select value={videoQuizDraft.rankKey || 'none'} onValueChange={(value) => setVideoQuizDraft(prev => ({ ...prev, rankKey: value === 'none' ? '' : value }))}>
                    <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No rank badge</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={'video-rank-' + role} value={role}>{rankLabel(role)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={addVideoQuizScene} className="rounded-2xl border border-red-400/40 bg-gradient-to-r from-red-700 to-rose-600 text-white hover:from-red-600 hover:to-rose-500">
                    Add Clip
                  </Button>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {(videoQuizDraft.scenes || []).map((scene, index) => (
                  <div key={scene.id || 'draft-scene-' + index} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className="border-red-400/35 bg-red-500/12 text-red-100">Clip {index + 1}</Badge>
                        <div className="text-sm font-semibold text-white">{scene.title || ('Scene ' + (index + 1))}</div>
                      </div>
                      <Button
                        onClick={() => removeVideoQuizScene(index)}
                        className="rounded-2xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10"
                        disabled={(videoQuizDraft.scenes || []).length <= 1}
                      >
                        Remove Clip
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Clip title</div>
                        <Input
                          value={scene.title || ''}
                          onChange={(e) => patchVideoQuizScene(index, { title: e.target.value })}
                          className="border-white/10 bg-black/30 text-white"
                          placeholder="Traffic stop escalation"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Video URL</div>
                        <Input
                          value={scene.videoUrl || ''}
                          onChange={(e) => patchVideoQuizScene(index, { videoUrl: e.target.value })}
                          className="border-white/10 bg-black/30 text-white"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Things to watch for</div>
                        <Textarea
                          value={scene.watchPointsText || ''}
                          onChange={(e) => patchVideoQuizScene(index, { watchPointsText: e.target.value })}
                          className="min-h-[140px] border-white/10 bg-black/30 text-white"
                          placeholder="One watch point per line"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Answer prompts</div>
                        <Textarea
                          value={scene.notePromptsText || ''}
                          onChange={(e) => patchVideoQuizScene(index, { notePromptsText: e.target.value })}
                          className="min-h-[140px] border-white/10 bg-black/30 text-white"
                          placeholder="One response prompt per line"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-between gap-2">
                <Button
                  onClick={deleteVideoQuizDraft}
                  disabled={!videoQuizDraft.id}
                  className="rounded-2xl border border-red-400/40 bg-gradient-to-r from-red-700 to-red-600 text-white hover:from-red-600 hover:to-red-500 disabled:opacity-50"
                >
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={closeVideoQuizEditor} className="rounded-2xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10">Cancel</Button>
                  <Button onClick={saveVideoQuizDraft} className="rounded-2xl border border-red-400/40 bg-gradient-to-r from-red-700 to-rose-600 text-white hover:from-red-600 hover:to-rose-500">Save Video Quiz</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {managedQuizEditorOpen && managedQuizDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">{managedQuizDraft.id ? 'Edit Quiz Question' : 'Add Quiz Question'}</div>
                <button type="button" onClick={closeManagedQuizEditor} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Quiz title</div>
                  <Input
                    value={managedQuizDraft.quizTitle || ''}
                    onChange={(e) => setManagedQuizDraft(prev => ({ ...prev, quizTitle: e.target.value }))}
                    className="border-white/10 bg-black/30 text-white"
                    placeholder="Quiz title"
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Quiz key</div>
                  <Input
                    value={managedQuizDraft.quizKey || ''}
                    onChange={(e) => setManagedQuizDraft(prev => ({ ...prev, quizKey: e.target.value.toLowerCase().replace(/[^a-z0-9-|]/g, '-') }))}
                    className="border-white/10 bg-black/30 text-white"
                    placeholder="mandatory-general"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Quiz description</div>
                  <Textarea
                    value={managedQuizDraft.quizDescription || ''}
                    onChange={(e) => setManagedQuizDraft(prev => ({ ...prev, quizDescription: e.target.value }))}
                    className="min-h-[80px] border-white/10 bg-black/30 text-white"
                    placeholder="Short quiz summary"
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Rank scope</div>
                  <Select value={managedQuizDraft.rankKey || 'none'} onValueChange={(value) => setManagedQuizDraft(prev => ({ ...prev, rankKey: value === 'none' ? '' : value }))}>
                    <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No rank badge</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={`managed-rank-${role}`} value={role}>{rankLabel(role)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Pass score</div>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={managedQuizDraft.passScore ?? 80}
                      onChange={(e) => setManagedQuizDraft(prev => ({ ...prev, passScore: Number(e.target.value || 80) }))}
                      className="border-white/10 bg-black/30 text-white"
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Question order</div>
                    <Input
                      type="number"
                      min={1}
                      value={managedQuizDraft.questionOrder ?? 1}
                      onChange={(e) => setManagedQuizDraft(prev => ({ ...prev, questionOrder: Number(e.target.value || 1) }))}
                      className="border-white/10 bg-black/30 text-white"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Category</div>
                  <Input
                    value={managedQuizDraft.category || ''}
                    onChange={(e) => setManagedQuizDraft(prev => ({ ...prev, category: e.target.value }))}
                    className="border-white/10 bg-black/30 text-white"
                    placeholder="General Rules"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Question</div>
                  <Textarea
                    value={managedQuizDraft.question || ''}
                    onChange={(e) => setManagedQuizDraft(prev => ({ ...prev, question: e.target.value }))}
                    className="min-h-[100px] border-white/10 bg-black/30 text-white"
                    placeholder="Question text"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Correct answer</div>
                  <Input
                    value={managedQuizDraft.correctAnswer || ''}
                    onChange={(e) => setManagedQuizDraft(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    className="border-white/10 bg-black/30 text-white"
                    placeholder="Correct answer"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">False options</div>
                  <div className="space-y-2">
                    {(managedQuizDraft.wrongAnswers || ['', '', '']).map((answer, idx) => (
                      <Input
                        key={`managed-wrong-${idx}`}
                        value={answer}
                        onChange={(e) => setManagedQuizDraft(prev => {
                          const next = [...(prev.wrongAnswers || ['', '', ''])];
                          next[idx] = e.target.value;
                          return { ...prev, wrongAnswers: next };
                        })}
                        className="border-white/10 bg-black/30 text-white"
                        placeholder={`False option ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-between gap-2">
                <Button
                  onClick={async () => { await deleteManagedQuizQuestion(managedQuizDraft.id); closeManagedQuizEditor(); }}
                  disabled={!managedQuizDraft.id}
                  className="rounded-2xl border border-red-400/40 bg-gradient-to-r from-red-700 to-red-600 text-white hover:from-red-600 hover:to-red-500 disabled:opacity-50"
                >
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={closeManagedQuizEditor} className="rounded-2xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10">Cancel</Button>
                  <Button onClick={saveManagedQuizDraft} className="rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500">Save</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {checkboxEditorOpen && checkboxDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Edit Checkbox</div>
                <button type="button" onClick={closeCheckboxEditor} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Category</div>
                  <Select value={checkboxDraft.category} onValueChange={(value) => setCheckboxDraft(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">Role Checklist</SelectItem>
                      <SelectItem value="core">Core Values</SelectItem>
                      <SelectItem value="permission">Permissions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Title</div>
                  <Input
                    value={checkboxDraft.title || ''}
                    onChange={(e) => setCheckboxDraft(prev => ({ ...prev, title: e.target.value }))}
                    className="border-white/10 bg-black/30 text-white"
                    placeholder="Checkbox title"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Question</div>
                  <Textarea
                    value={checkboxDraft.question || ''}
                    onChange={(e) => setCheckboxDraft(prev => ({ ...prev, question: e.target.value }))}
                    className="min-h-[95px] border-white/10 bg-black/30 text-white"
                    placeholder="Question shown in tracker"
                  />
                  <div className="mt-2 grid gap-2 md:grid-cols-[220px,1fr] md:items-center">
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Answer bracket</div>
                    <Select
                      value={checkboxDraft.ruleBracket || 'auto'}
                      onValueChange={(value) => setCheckboxDraft(prev => ({ ...prev, ruleBracket: value === 'auto' ? '' : value }))}
                    >
                      <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto detect</SelectItem>
                        {RULE_FALSE_OPTION_BANKS.map(bank => (
                          <SelectItem key={`bracket-${bank.tag}`} value={bank.tag}>{bank.tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-2">
                    <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                      Active bracket: {checkboxDraft.ruleBracket || detectRuleBracket({
                        title: checkboxDraft.title || '',
                        question: checkboxDraft.question || '',
                        correct: (checkboxDraft.answers || [])[0] || '',
                      })}
                    </Badge>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Answers</div>
                  <div className="space-y-2">
                    {(checkboxDraft.answers || ['']).map((answer, idx) => (
                      <div key={`${checkboxDraft.id}-ans-${idx}`} className="flex gap-2">
                        <Input
                          value={answer}
                          onChange={(e) =>
                            setCheckboxDraft(prev => {
                              const next = [...(prev.answers || [''])];
                              next[idx] = e.target.value;
                              return { ...prev, answers: next };
                            })
                          }
                          className="border-white/10 bg-black/30 text-white"
                          placeholder={`Answer ${idx + 1}`}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-xl border border-red-500/35 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                          onClick={() =>
                            setCheckboxDraft(prev => {
                              const next = [...(prev.answers || [''])];
                              if (next.length <= 1) return prev;
                              next.splice(idx, 1);
                              return { ...prev, answers: next };
                            })
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-xl border border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20"
                      onClick={() => setCheckboxDraft(prev => ({ ...prev, answers: [...(prev.answers || ['']), ''] }))}
                    >
                      Add Answer
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">False options</div>
                  <div className="space-y-2">
                    {(checkboxDraft.falseAnswers || ['']).map((answer, idx) => (
                      <div key={`${checkboxDraft.id}-false-${idx}`} className="flex gap-2">
                        <Input
                          value={answer}
                          onChange={(e) =>
                            setCheckboxDraft(prev => {
                              const next = [...(prev.falseAnswers || [''])];
                              next[idx] = e.target.value;
                              return { ...prev, falseAnswers: next };
                            })
                          }
                          className="border-white/10 bg-black/30 text-white"
                          placeholder={`False option ${idx + 1}`}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-xl border border-red-500/35 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                          onClick={() =>
                            setCheckboxDraft(prev => {
                              const next = [...(prev.falseAnswers || [''])];
                              if (next.length <= 1) return prev;
                              next.splice(idx, 1);
                              return { ...prev, falseAnswers: next };
                            })
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-xl border border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20"
                      onClick={() => setCheckboxDraft(prev => ({ ...prev, falseAnswers: [...(prev.falseAnswers || ['']), ''] }))}
                    >
                      Add False Option
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Visible for ranks</div>
                  <div className="mb-2">
                    <label className="flex items-center justify-between rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2 text-sm text-fuchsia-100">
                      All ranks
                      <Checkbox
                        checked={!(checkboxDraft.ranks || []).length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCheckboxDraft(prev => ({ ...prev, ranks: [] }));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {roles.map(role => (
                      <label key={`${checkboxDraft.id}-${role}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
                        {rankLabel(role)}
                        <Checkbox
                          checked={(checkboxDraft.ranks || []).includes(role)}
                          onCheckedChange={(checked) =>
                            setCheckboxDraft(prev => {
                              const current = new Set(prev.ranks || []);
                              if (checked) current.add(role);
                              else current.delete(role);
                              return { ...prev, ranks: [...current] };
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">No rank selected means this checkbox is shown to all ranks.</div>
                </div>
              </div>
              <div className="mt-5 flex justify-between gap-2">
                <Button onClick={async () => { await deleteCheckboxItem(checkboxDraft.id); closeCheckboxEditor(); }} className="rounded-2xl border border-red-400/40 bg-gradient-to-r from-red-700 to-red-600 text-white hover:from-red-600 hover:to-red-500">Delete</Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={closeCheckboxEditor} className="rounded-2xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10">Cancel</Button>
                  <Button onClick={saveCheckboxDraft} className="rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500">Save</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {sessionNotesOpen && sessionTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-fuchsia-500/35 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Session Notes - {sessionTarget.name}</div>
                <button type="button" onClick={() => setSessionNotesOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-sm text-zinc-400">Strong sides</div>
                  <Textarea
                    value={sessionNotesDraft.strongSides}
                    onChange={(e) => setSessionNotesDraft(prev => ({ ...prev, strongSides: e.target.value }))}
                    className="min-h-[110px] border-white/10 bg-black/20 text-white"
                  />
                </div>
                <div>
                  <div className="mb-2 text-sm text-zinc-400">Attention points</div>
                  <Textarea
                    value={sessionNotesDraft.attentionPoints}
                    onChange={(e) => setSessionNotesDraft(prev => ({ ...prev, attentionPoints: e.target.value }))}
                    className="min-h-[110px] border-white/10 bg-black/20 text-white"
                  />
                </div>
                <div>
                  <div className="mb-2 text-sm text-zinc-400">General notes</div>
                  <Textarea
                    value={sessionNotesDraft.notes}
                    onChange={(e) => setSessionNotesDraft(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-[130px] border-white/10 bg-black/20 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setSessionNotesOpen(false)} className="rounded-2xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10">Cancel</Button>
                  <Button type="button" onClick={saveSessionNotesDraft} className="rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500">Save Notes</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {sessionActionsOpen && sessionTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-emerald-500/35 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Session Actions - {sessionTarget.name}</div>
                <button type="button" onClick={() => setSessionActionsOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Update trainer</div>
                  <Input disabled={!canEdit} value={sessionActionsDraft.trainer} onChange={(e) => setSessionActionsDraft(prev => ({ ...prev, trainer: e.target.value }))} className="border-white/10 bg-black/30 text-white" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Set status</div>
                  <Select value={sessionActionsDraft.status} onValueChange={(value) => setSessionActionsDraft(prev => ({ ...prev, status: value }))} disabled={!canEdit}>
                    <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Training">In Training</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Reviewing Others">Reviewing Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Sign-off</div>
                  <Button disabled={!canEdit} variant={sessionTarget.signedOff ? 'secondary' : 'default'} onClick={() => updateSessionTarget({ signedOff: !sessionTarget.signedOff })} className={sessionTarget.signedOff ? 'w-full rounded-2xl' : 'w-full rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500'}>
                    {sessionTarget.signedOff ? 'Remove sign-off' : 'Mark as signed off'}
                  </Button>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Rank actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button disabled={!canEdit} onClick={promoteSessionTarget} className="w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500">Promote</Button>
                    <Button disabled={!canEdit} onClick={demoteSessionTarget} className="w-full rounded-2xl bg-red-600 text-white hover:bg-red-500">Demote</Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-red-200">Remove from tracker</div>
                  <Button disabled={!canDeleteStaff || deletingStaffId === sessionTarget?.id} onClick={removeSessionTargetStaff} className="w-full rounded-2xl bg-red-700/80 text-white hover:bg-red-700 disabled:opacity-50">{deletingStaffId === sessionTarget?.id ? 'Deleting staff...' : 'Remove staff member'}</Button>
                </div>
                <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-100">
                  Suggested next step: {getTrainingRecommendation(sessionTarget, sessionTargetTrainingSummary)}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setSessionActionsOpen(false)} className="rounded-2xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10">Cancel</Button>
                  <Button type="button" onClick={saveSessionActionsDraft} className="rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-500 hover:to-green-400">Save Actions</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {disciplineOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-red-500/40 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">{disciplineType} report</div>
                <button type="button" onClick={() => setDisciplineOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                  Staff member: <span className="font-semibold text-white">{disciplineTarget?.name || 'None selected'}</span>{disciplineTarget ? ` (${disciplineTarget.role})` : ''}
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Issued by</div>
                  <Input value={disciplineIssuer} onChange={(e) => setDisciplineIssuer(e.target.value)} className="border-white/10 bg-black/30 text-white" placeholder="Issuer name / rank" />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Reason / evidence summary</div>
                  <Textarea value={disciplineReason} onChange={(e) => setDisciplineReason(e.target.value)} className="min-h-[130px] border-white/10 bg-black/30 text-white" placeholder="Write the reason, timeline, and policy reference..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setDisciplineOpen(false)} className="rounded-2xl">Cancel</Button>
                  <Button disabled={!disciplineTarget} onClick={() => applyDisciplinary(disciplineType)} className="rounded-2xl bg-red-600 text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40">Submit {disciplineType}</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {profileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">My Profile</div>
                <button type="button" onClick={() => setProfileOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt="Profile avatar" className="h-14 w-14 rounded-xl border border-white/10 object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-xl font-bold text-zinc-200">
                      {(profileName?.[0] || authUser?.email?.[0] || 'G').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">{profileName || authUser?.email}</div>
                    <div className="text-xs text-zinc-500">{accountRoleLabel(profile?.role)}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Display name</div>
                  <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="border-white/10 bg-black/30 text-white" placeholder="Your display name" />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Profile image</div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => ownProfileFileInputRef.current?.click()}
                      className="rounded-xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10"
                    >
                      Select image
                    </Button>
                    <span className="text-xs text-zinc-500">
                      {profileAvatarFile ? profileAvatarFile.name : 'No file selected'}
                    </span>
                  </div>
                  <input
                    ref={ownProfileFileInputRef}
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    onChange={(e) => setProfileAvatarFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setProfileOpen(false)} className="rounded-2xl">Cancel</Button>
                  <Button onClick={saveOwnProfile} className="rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500">Save Profile</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {staffToolCopiedOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-fuchsia-500/35 bg-zinc-950 p-5">
              <div className="text-lg font-semibold text-white">Copied to clipboard</div>
              <div className="mt-2 text-sm text-zinc-400">
                Post the copied block in the designated Discord channel.
              </div>
              <div className="mt-4 rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/14 to-orange-500/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge className="border-amber-400/35 bg-amber-500/15 text-amber-100">Post It Here</Badge>
                  <Badge className="border-white/10 bg-white/10 text-zinc-100">Discord target</Badge>
                </div>
                <a
                  href="https://discord.com/channels/1033780064996827227/1481342607652032685"
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-fuchsia-500/30 bg-black/35 px-3 py-3 text-sm font-medium text-fuchsia-200 hover:bg-black/50 hover:text-fuchsia-100"
                >
                  Go to: Punishment Review channel
                </a>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStaffToolCopiedOpen(false)}
                  className="rounded-2xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {weeklyStaffOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-zinc-950">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-950/95 px-5 py-4 backdrop-blur">
                <div>
                  <div className="text-lg font-semibold text-white">Staff Movement This Week</div>
                  <div className="text-[11px] text-zinc-500">Joined and removed staff profiles for the current week.</div>
                </div>
                <button type="button" onClick={() => setWeeklyStaffOpen(false)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-300 hover:bg-white/10 hover:text-white">Close</button>
              </div>
              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Joined this week</div><div className="mt-2 text-2xl font-semibold text-white">{weeklyStaffJoiners.length}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Left this week</div><div className="mt-2 text-2xl font-semibold text-white">{weeklyStaffLeavers.length}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Current staff</div><div className="mt-2 text-2xl font-semibold text-white">{activeStaffRecords.length}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Removed total</div><div className="mt-2 text-2xl font-semibold text-white">{removedStaffRecords.length}</div></div>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Joined This Week</div>
                    <div className="mt-3 space-y-3">
                      {!weeklyStaffJoiners.length && <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">No new staff profiles this week.</div>}
                      {weeklyStaffJoiners.map(member => (
                        <div key={['join', member.id].join('-')} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">{member.name}</div>
                              <div className="text-xs text-zinc-400">{member.role} ? {member.trainer || 'Unassigned'}</div>
                            </div>
                            <Badge className="border-emerald-500/35 bg-emerald-500/12 text-emerald-100">{member.staffSince}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">Left This Week</div>
                    <div className="mt-3 space-y-3">
                      {!weeklyStaffLeavers.length && <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">No staff removals this week.</div>}
                      {weeklyStaffLeavers.map(member => (
                        <div key={['leave', member.id].join('-')} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">{member.name}</div>
                              <div className="text-xs text-zinc-400">{member.role} ? {member.removalReason || 'No reason logged'}</div>
                            </div>
                            <Badge className="border-red-500/35 bg-red-500/12 text-red-100">{member.removedAt ? new Date(member.removedAt).toLocaleDateString() : 'Unknown'}</Badge>
                          </div>
                          {member.removalNotes && <div className="mt-2 text-sm text-zinc-300">{member.removalNotes}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {weeklyQuizOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-zinc-950">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-950/95 px-5 py-4 backdrop-blur">
                <div>
                  <div className="text-lg font-semibold text-white">Quiz Completions</div>
                  <div className="text-[11px] text-zinc-500">Weekly completions and all-time completion history, including manual 100% sign-offs.</div>
                </div>
                <button type="button" onClick={() => setWeeklyQuizOpen(false)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-300 hover:bg-white/10 hover:text-white">Close</button>
              </div>
              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Completed this week</div><div className="mt-2 text-2xl font-semibold text-white">{weeklyCompletedQuizAttempts.length}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Completed ever</div><div className="mt-2 text-2xl font-semibold text-white">{allCompletedQuizAttempts.length}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Manual 100% total</div><div className="mt-2 text-2xl font-semibold text-white">{manualCompletedQuizAttempts.length}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Passed attempts</div><div className="mt-2 text-2xl font-semibold text-white">{allCompletedQuizAttempts.filter(attempt => attempt.passed).length}</div></div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Latest completions</div>
                  <div className="mt-3 space-y-3">
                    {!allCompletedQuizAttempts.length && <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">No quiz completions logged yet.</div>}
                    {allCompletedQuizAttempts.map(attempt => (
                      <div key={[attempt.staffId, attempt.id].join('-')} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{attempt.title || attempt.quizKey || 'Quiz attempt'}</div>
                            <div className="text-xs text-zinc-400">{attempt.staffName} ? {attempt.staffRole}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-white/10 bg-white/10 text-zinc-200">{attempt.at ? new Date(attempt.at).toLocaleString() : 'Unknown time'}</Badge>
                            <Badge className={attempt.passed ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-100' : 'border-amber-500/35 bg-amber-500/12 text-amber-100'}>{Number(attempt.score || 0)}%</Badge>
                            {String(attempt.reviewNote || '').match(/staff team overview/i) && <Badge className="border-fuchsia-500/35 bg-fuchsia-500/12 text-fuchsia-100">Manual 100%</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {canViewPresence && activeUsersOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-emerald-500/30 bg-zinc-950">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-950/95 px-5 py-4 backdrop-blur">
                <div>
                  <div className="text-lg font-semibold text-white">Active Users</div>
                  <div className="text-[11px] text-zinc-500">Visible to Head Admin only.</div>
                </div>
                <button type="button" onClick={() => setActiveUsersOpen(false)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-300 hover:bg-white/10 hover:text-white">Close</button>
              </div>
              <div className="space-y-2 overflow-y-auto px-5 py-4">
                {!activeUsers.length && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">No active users detected.</div>
                )}
                {activeUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={`${user.username} avatar`} className="h-9 w-9 rounded-lg border border-white/10 object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-sm font-semibold text-zinc-200">
                          {(user.username?.[0] || 'G').toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{user.username}</div>
                        <div className="truncate text-xs text-zinc-500">{user.email || user.id}</div>
                        <div className="mt-0.5 text-[11px] text-zinc-500">Last seen: {formatLastSeen(user.last_seen_at)}</div>
                      </div>
                    </div>
                    <Badge className="border-emerald-500/35 bg-emerald-500/15 text-emerald-200">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {canViewPresence && offlineUsersOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-500/30 bg-zinc-950">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-950/95 px-5 py-4 backdrop-blur">
                <div>
                  <div className="text-lg font-semibold text-white">Offline Users</div>
                  <div className="text-[11px] text-zinc-500">Visible to Head Admin only.</div>
                </div>
                <button type="button" onClick={() => setOfflineUsersOpen(false)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-300 hover:bg-white/10 hover:text-white">Close</button>
              </div>
              <div className="space-y-2 overflow-y-auto px-5 py-4">
                {!offlineUsers.length && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">No offline users detected.</div>
                )}
                {offlineUsers.map(user => (
                  <div key={`offline-${user.id}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={`${user.username} avatar`} className="h-9 w-9 rounded-lg border border-white/10 object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-sm font-semibold text-zinc-200">
                          {(user.username?.[0] || 'G').toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{user.username || 'Unknown'}</div>
                        <div className="truncate text-xs text-zinc-500">{user.id}</div>
                        <div className="mt-0.5 text-[11px] text-zinc-500">Last seen: {formatLastSeen(user.last_seen_at)}</div>
                      </div>
                    </div>
                    <Badge className="border-zinc-500/35 bg-zinc-500/15 text-zinc-200">{user.role || 'viewer'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {profile?.god_key_enabled && (
          <button
            type="button"
            onClick={forceHeadAdminReset}
            title="God Key recovery: force role back to Head Admin"
            className="fixed bottom-6 right-6 z-40 rounded-2xl border border-emerald-400/45 bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.3)] hover:from-emerald-500 hover:to-green-400"
          >
            God Key Reset
          </button>
        )}
      </div>
    </div>
  );
}


