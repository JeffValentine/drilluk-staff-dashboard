import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Shield, GraduationCap, CheckCircle2, Users, ArrowUpRight, ClipboardList, Star, HelpCircle, ExternalLink, BookOpen, MessageSquareWarning, Gavel, Swords, FileVideo, Radio, LifeBuoy, ShieldAlert, Upload, Trash2 } from 'lucide-react';
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

const roles = ['T-MOD', 'MOD', 'S-MOD', 'ADMIN', 'S-ADMIN', 'HEAD-ADMIN'];
const SITE_OWNER_EMAIL = 'justappletje@gmail.com';
const defaultRankDisplayNames = Object.fromEntries(roles.map(role => [role, role]));

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

function completionPercent(record) {
  const checkValues = Object.values(record.checks || {});
  const valueValues = Object.values(record.values || {});
  const permissionValues = Object.values(record.permissions || {});
  const total = checkValues.length + valueValues.length + permissionValues.length;
  const done = [...checkValues, ...valueValues, ...permissionValues].filter(Boolean).length;
  return total ? Math.round((done / total) * 100) : 0;
}

function emptyManualChecks() {
  return { checks: {}, values: {}, permissions: {} };
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
          Quiz check {category ? `· ${category}` : ''}
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
  const canEdit = ['head_admin', 'admin', 'trainer'].includes(profile?.role || '');
  const canManageUsers = profile?.role === 'head_admin' || Boolean(profile?.god_key_enabled);
  const canViewPresence = profile?.role === 'head_admin';
  const canManageCheckboxes = canManageUsers || profile?.role === 'admin';
  const canDeleteStaff = ['head_admin', 'admin'].includes(profile?.role || '');
  const isStaffInTraining = profile?.role === 'staff_in_training';

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
  const [managementLoading, setManagementLoading] = useState(false);
  const [managementError, setManagementError] = useState('');
  const [checkboxCatalog, setCheckboxCatalog] = useState(buildDefaultCheckboxCatalog());
  const [checkboxCatalogLoading, setCheckboxCatalogLoading] = useState(false);
  const [checkboxMenu, setCheckboxMenu] = useState('role');
  const [checkboxFilterOpen, setCheckboxFilterOpen] = useState(false);
  const [checkboxQuery, setCheckboxQuery] = useState('');
  const [checkboxRankFilter, setCheckboxRankFilter] = useState('All');
  const [checkboxEditorOpen, setCheckboxEditorOpen] = useState(false);
  const [checkboxDraft, setCheckboxDraft] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(profile?.username || '');
  const [profileAvatar, setProfileAvatar] = useState(profile?.avatar_url || '');
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const ownProfileFileInputRef = useRef(null);
  const [activeUsersOpen, setActiveUsersOpen] = useState(false);
  const [offlineUsersOpen, setOfflineUsersOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const lastLocalStaffEditRef = useRef(0);
  const isOwnerSession = (authUser?.email || '').toLowerCase() === SITE_OWNER_EMAIL;
  const [rankDisplayNames, setRankDisplayNames] = useState(defaultRankDisplayNames);
  const [rankDrafts, setRankDrafts] = useState(defaultRankDisplayNames);
  const [rankDisplayLoading, setRankDisplayLoading] = useState(false);
  const [quizState, setQuizState] = useState({
    role: { started: false, score: null, answers: {} },
    core: { started: false, score: null, answers: {} },
    permission: { started: false, score: null, answers: {} },
  });

  useEffect(() => {
    setProfileName(profile?.username || '');
    setProfileAvatar(profile?.avatar_url || '');
    setProfileAvatarFile(null);
  }, [profile]);

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
      notes: row.notes || '',
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

  async function refreshManagementUsersFromDb() {
    if (!dbReady || !supabase || !canManageUsers) return;
    setManagementLoading(true);
    setManagementError('');
    try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, is_active, avatar_url, god_key_enabled, last_seen_at')
      .order('username', { ascending: true });

      if (error?.code === '42703') {
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
          is_developer: isOwnerSession && u.id === authUser?.id,
        })));
        return;
      }

      if (error) {
        setManagementUsers([]);
        setManagementError(error.message || 'Failed to load users.');
        return;
      }

      setManagementUsers((data || []).map(u => ({
        ...u,
        is_developer: isOwnerSession && u.id === authUser?.id,
      })));
    } finally {
      setManagementLoading(false);
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
        refreshStaffFromDb();
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
    if (!dbReady || !supabase || !canManageUsers) return;
    const channel = supabase
      .channel('profiles_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refreshManagementUsersFromDb();
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
        refreshCheckboxCatalogFromDb();
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
    const channel = supabase
      .channel('rank_display_names_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rank_display_names' }, () => {
        refreshRankDisplayNamesFromDb();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbReady, authUser?.id]);

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
    const q = checkboxQuery.trim().toLowerCase();
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
  }, [checkboxCatalog, checkboxMenu, checkboxQuery, checkboxRankFilter]);

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

  const filtered = useMemo(() => {
    const trainerNames = new Set(
      staff
        .map(s => s.trainer)
        .filter(name => name && name !== 'Unassigned' && name !== 'Head Team')
    );
    const roleOrder = new Map(roles.map((role, index) => [role, index]));
    const list = staff.filter(s =>
      (s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.role.toLowerCase().includes(query.toLowerCase()) ||
      s.status.toLowerCase().includes(query.toLowerCase())) &&
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
  }, [staff, query, filterRole, filterTrainerOnly, filterActiveOnly, filterWarningOnly]);

  const traineeRecord = staff.find(s => s.traineeUserId === authUser?.id) || null;
  const selected = isStaffInTraining ? traineeRecord : (staff.find(s => s.id === selectedId) || staff[0] || null);
  const sessionCandidates = useMemo(() => {
    const q = sessionUserQuery.trim().toLowerCase();
    return staff
      .filter(member => sessionRankFilter === 'All' || member.role === sessionRankFilter)
      .filter(member => {
        if (!q) return true;
        const haystack = [member.name, member.role, member.status, member.trainer].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staff, sessionRankFilter, sessionUserQuery]);
  const sessionTarget = staff.find(member => member.id === sessionTargetId) || sessionCandidates[0] || null;
  const disciplineCandidates = useMemo(() => {
    const q = disciplineUserQuery.trim().toLowerCase();
    return staff
      .filter(member => disciplineRankFilter === 'All' || member.role === disciplineRankFilter)
      .filter(member => {
        if (!q) return true;
        const haystack = [member.name, member.role, member.status, member.trainer].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staff, disciplineRankFilter, disciplineUserQuery]);
  const disciplineTarget = staff.find(member => member.id === disciplineTargetId) || disciplineCandidates[0] || null;

  useEffect(() => {
    if (!staff.length) {
      setSessionTargetId(null);
      setDisciplineTargetId(null);
      return;
    }
    const sessionTargetStillExists = sessionTargetId !== null && staff.some(member => member.id === sessionTargetId);
    if (!sessionTargetStillExists) {
      setSessionTargetId(selected?.id ?? staff[0].id);
    }
    const targetStillExists = disciplineTargetId !== null && staff.some(member => member.id === disciplineTargetId);
    if (targetStillExists) return;
    setDisciplineTargetId(selected?.id ?? staff[0].id);
  }, [staff, selected?.id, disciplineTargetId, sessionTargetId]);

  const totals = {
    total: staff.length,
    inTraining: staff.filter(s => s.status === 'In Training').length,
    promotionReady: staff.filter(s => completionPercent(s) >= 90).length,
    signedOff: staff.filter(s => s.signedOff).length,
  };

  const currentChecks = selected ? (baseChecksByRole[selected.role] || []) : [];
  const currentCoreValues = selected
    ? dynamicCoreValues.filter(item => itemMatchesRank(item, selected.role)).map(item => item.title)
    : [];
  const currentPermissions = selected
    ? dynamicPermissions.filter(item => itemMatchesRank(item, selected.role)).map(item => item.title)
    : [];

  function checklistPercent(keys, source) {
    if (!keys.length) return 0;
    const done = keys.filter(key => Boolean(source?.[key])).length;
    return Math.round((done / keys.length) * 100);
  }

  const quizItemsByCategory = useMemo(() => {
    if (!selected) return { role: [], core: [], permission: [] };
    const build = (category) =>
      checkboxCatalog
        .filter(item => item.category === category && itemMatchesRank(item, selected.role))
        .map(item => {
          const payload = parseQuizPayload(item.answer);
          const primaryCorrect = payload.correct[0] || '';
          const falseOptions = payload.manual
            ? (payload.wrong || []).map(v => String(v || '').trim()).filter(Boolean).slice(0, 3)
            : buildRuleAlignedFalseAnswers({
              title: item.title,
              question: item.question,
              correct: primaryCorrect,
              existingWrong: payload.wrong,
              bracketTag: payload.bracket,
            });
          const options = shuffleArray([primaryCorrect, ...falseOptions].filter(Boolean));
          return {
            id: item.id,
            title: item.title,
            question: item.question || item.title,
            correct: primaryCorrect,
            options,
          };
        })
        .filter(item => item.correct);

    return {
      role: build('role'),
      core: build('core'),
      permission: build('permission'),
    };
  }, [checkboxCatalog, selected]);

  useEffect(() => {
    setQuizState({
      role: { started: false, score: null, answers: {} },
      core: { started: false, score: null, answers: {} },
      permission: { started: false, score: null, answers: {} },
    });
    setReviewDrafts({});
  }, [selected?.id]);

  async function saveStaffMember(member) {
    if (!dbReady || !supabase) return;
    lastLocalStaffEditRef.current = Date.now();

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
      notes: member.notes || '',
      updated_by: authUser?.id || null,
    };

    await supabase.from('staff_members').upsert(payload);
  }

  async function removeStaffMemberFromDb(staffId) {
    if (!dbReady || !supabase) return;
    await supabase.from('staff_members').delete().eq('id', staffId);
  }

  async function writeAudit(action, targetId, beforeValue, afterValue) {
    if (!dbReady || !supabase || !authUser?.id) return;
    await supabase.from('audit_logs').insert({
      actor_id: authUser.id,
      action,
      target_id: String(targetId),
      before_value: beforeValue || null,
      after_value: afterValue || null,
    });
  }

  function updateSelected(patch) {
    if (!selected || !canEdit) return;
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

  function removeSessionTargetStaff() {
    if (!sessionTarget || !canDeleteStaff || staff.length <= 1) return;
    const confirmed = window.confirm(`Remove ${sessionTarget.name} from staff records? This cannot be undone.`);
    if (!confirmed) return;

    const remaining = staff.filter(s => s.id !== sessionTarget.id);
    setStaff(remaining);
    setSelectedId(remaining[0].id);
    setSessionTargetId(remaining[0].id);
    removeStaffMemberFromDb(sessionTarget.id);
    writeAudit('staff.delete', sessionTarget.id, sessionTarget, null);
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

  function removeSelectedStaff() {
    if (!selected || !canDeleteStaff || staff.length <= 1) return;
    const confirmed = window.confirm(`Remove ${selected.name} from staff records? This cannot be undone.`);
    if (!confirmed) return;

    const remaining = staff.filter(s => s.id !== selected.id);
    setStaff(remaining);
    setSelectedId(remaining[0].id);
    removeStaffMemberFromDb(selected.id);
    writeAudit('staff.delete', selected.id, selected, null);
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

  function startQuiz(category) {
    setQuizState(prev => ({
      ...prev,
      [category]: { started: true, score: null, answers: {} },
    }));
  }

  function setQuizAnswer(category, itemId, option) {
    setQuizState(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        answers: { ...prev[category].answers, [itemId]: option },
      },
    }));
  }

  function finishQuiz(category) {
    if (!selected) return;
    const items = quizItemsByCategory[category] || [];
    if (!items.length) return;

    const answered = quizState[category].answers || {};
    const correctCount = items.filter(item => answered[item.id] === item.correct).length;
    const score = Math.round((correctCount / items.length) * 100);
    const passed = score >= 90;
    const attempt = {
      id: `${Date.now()}-${category}`,
      at: new Date().toISOString(),
      category,
      score,
      passed,
      reviewStatus: 'pending',
      reviewNote: '',
      reviewedBy: null,
      reviewedAt: null,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        selected: answered[item.id] || null,
        correct: item.correct,
        isCorrect: answered[item.id] === item.correct,
      })),
    };

    setQuizState(prev => ({
      ...prev,
      [category]: { ...prev[category], score },
    }));
    const quizHistory = [attempt, ...(selected.quizHistory || [])].slice(0, 200);
    if (!passed) {
      updateSelected({ quizHistory });
      return;
    }

    const keys = items.map(item => item.title);
    if (category === 'role') {
      updateSelected({
        checks: { ...selected.checks, ...Object.fromEntries(keys.map(k => [k, true])) },
        quizHistory,
      });
      return;
    }
    if (category === 'core') {
      updateSelected({
        values: { ...selected.values, ...Object.fromEntries(keys.map(k => [k, true])) },
        quizHistory,
      });
      return;
    }
    updateSelected({
      permissions: { ...selected.permissions, ...Object.fromEntries(keys.map(k => [k, true])) },
      quizHistory,
    });
  }

  function updateQuizReview(attemptId, patch) {
    if (!sessionTarget || !canEdit) return;
    const nextHistory = (sessionTarget.quizHistory || []).map(attempt =>
      attempt.id === attemptId ? { ...attempt, ...patch } : attempt
    );
    updateSessionTarget({ quizHistory: nextHistory });
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
      notes: '',
    };
    setStaff(prev => [next, ...prev]);
    setSelectedId(next.id);
    setAddStaffOpen(false);
    setAddStaffCardFile(null);
    saveStaffMember(next);
    writeAudit('staff.create', next.id, null, next);
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

  async function saveCheckboxItem(item) {
    if (!canManageCheckboxes || !dbReady || !supabase) return;
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
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-2">
                <Shield className="h-6 w-6 text-fuchsia-300" />
              </div>
              <img src="/assets/logos/drilluk-logo.png" alt="Drill UK logo" className="h-10 w-10 rounded-xl border border-white/10 bg-black/20 object-cover mix-blend-screen" />
              <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/10">Drill UK Staff System</Badge>
              <Badge className="border-white/10 bg-white/10 px-2 text-[10px] text-zinc-200">
                {accountRoleLabel(profile?.role)}
              </Badge>
              <Badge
                className="border-white/10 bg-white/10 px-2 text-[10px] text-zinc-200"
                title={profile?.username || authUser?.email?.split('@')[0] || 'Guest'}
              >
                {profile?.username || authUser?.email?.split('@')[0] || 'Guest'}
              </Badge>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Drill-UK Staff Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-300 md:text-base">A modern interactive staff panel for promotions and progression by xJeffValentine, with cleaner workflows for training, permissions, and disciplinary tracking.</p>
          </div>
          <div className="flex items-start gap-3 md:w-[620px] md:justify-end">
            <div className="space-y-2 md:w-[430px]">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Staff', value: totals.total, icon: Users },
                  { label: 'In Training', value: totals.inTraining, icon: GraduationCap },
                  { label: 'Promo Ready', value: totals.promotionReady, icon: ArrowUpRight },
                  { label: 'Signed Off', value: totals.signedOff, icon: CheckCircle2 },
                ].map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardContent className="flex items-center justify-between p-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">{item.label}</div>
                          <div className="mt-0.5 text-xl font-bold">{item.value}</div>
                        </div>
                        <item.icon className="h-4.5 w-4.5 text-fuchsia-300" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              {canViewPresence && (
                <div className="flex items-center gap-2">
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
            <div className="flex w-[84px] flex-col items-stretch gap-1.5">
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
                    className="h-[74px] w-[74px] rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-[74px] w-[74px] items-center justify-center rounded-xl text-xl font-bold text-zinc-200">
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

        <Tabs defaultValue={isStaffInTraining ? 'myprogress' : 'tracker'} className="space-y-4">
          <TabsList className={`grid w-full bg-white/5 ${isStaffInTraining ? 'grid-cols-2 md:w-[520px]' : 'grid-cols-8 md:w-[1360px]'}`}>
            {isStaffInTraining ? (
              <>
                <TabsTrigger value="myprogress">My Progress</TabsTrigger>
                <TabsTrigger value="hub">Overview & Resources</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="tracker">Tracker</TabsTrigger>
                <TabsTrigger value="session">Training Session</TabsTrigger>
                <TabsTrigger value="progression">Progression</TabsTrigger>
                <TabsTrigger value="hub">Overview & Resources</TabsTrigger>
                <TabsTrigger value="checkboxes">Checkboxes</TabsTrigger>
                <TabsTrigger value="management">Management</TabsTrigger>
                <TabsTrigger value="ranks">Rank Display</TabsTrigger>
                <TabsTrigger value="discipline">Discipline</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="myprogress">
            <div className="grid gap-4 xl:grid-cols-[380px,1fr]">
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
                  <div className="space-y-2">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Role Checklist</div>
                      <div className="mt-1 text-sm text-white">{checklistPercent((quizItemsByCategory.role || []).map(q => q.title), selected.checks)}%</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Core Values</div>
                      <div className="mt-1 text-sm text-white">{checklistPercent((quizItemsByCategory.core || []).map(q => q.title), selected.values)}%</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Permissions</div>
                      <div className="mt-1 text-sm text-white">{checklistPercent((quizItemsByCategory.permission || []).map(q => q.title), selected.permissions)}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {[
                  { id: 'role', label: 'Role Checklist Quiz', source: selected.checks },
                  { id: 'core', label: 'Core Values Quiz', source: selected.values },
                  { id: 'permission', label: 'Permissions Quiz', source: selected.permissions },
                ].map(section => {
                  const items = quizItemsByCategory[section.id] || [];
                  const state = quizState[section.id];
                  const progress = checklistPercent(items.map(item => item.title), section.source);
                  return (
                    <Card key={`quiz-${section.id}`} className="border-white/10 bg-white/5">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{section.label}</span>
                          <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200">{progress}% complete</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {!items.length && (
                          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
                            No quiz items configured for your rank yet.
                          </div>
                        )}
                        {items.length > 0 && !state.started && (
                          <Button onClick={() => startQuiz(section.id)} className="rounded-xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500">
                            Start {section.label}
                          </Button>
                        )}
                        {items.length > 0 && state.started && (
                          <div className="space-y-3">
                            {items.map((item, idx) => (
                              <div key={`q-${section.id}-${item.id}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-sm font-semibold text-white">{idx + 1}. {item.title}</div>
                                <div className="mt-1 text-xs text-zinc-400">{item.question}</div>
                                <div className="mt-3 space-y-2">
                                  {item.options.map(option => (
                                    <label key={`opt-${item.id}-${option}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-200">
                                      <input
                                        type="radio"
                                        name={`quiz-${section.id}-${item.id}`}
                                        checked={state.answers[item.id] === option}
                                        onChange={() => setQuizAnswer(section.id, item.id, option)}
                                      />
                                      <span>{option}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div className="flex items-center gap-2">
                              <Button onClick={() => finishQuiz(section.id)} className="rounded-xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500">
                                Submit Quiz
                              </Button>
                              {state.score !== null && (
                                <Badge className={state.score >= 90 ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200' : 'border-red-500/35 bg-red-500/15 text-red-200'}>
                                  Score: {state.score}% ({state.score >= 90 ? 'Pass' : 'Fail'})
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
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
                      <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-fuchsia-300" /> Role checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
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
                      <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-fuchsia-300" /> Core values review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentCoreValues.map(item => (
                        <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <label className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm text-zinc-100">
                              {item}
                              {manualCheckedByTitle[item] && (
                                <Badge className="border-orange-500/40 bg-orange-500/15 px-1.5 text-[10px] text-orange-200">Manually checked</Badge>
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
                      <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-fuchsia-300" /> Permissions and actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
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
                              <div className="font-medium text-white">{log.type} · {log.date}</div>
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
                        <div className="mt-1 text-xs text-zinc-400">{sessionTarget ? `${sessionTarget.role} · Trainer: ${sessionTarget.trainer}` : 'Select a staff member to start a training session.'}</div>
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
                          <Button disabled={!canEdit || !sessionTarget} onClick={() => setSessionNotesOpen(true)} className="rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500">
                            Open Notes
                          </Button>
                          <Button disabled={!canEdit || !sessionTarget} onClick={() => setSessionActionsOpen(true)} className="rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-500 hover:to-green-400">
                            Open Actions
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader><CardTitle>Quiz Review History</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {!sessionTarget && (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
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
                          {attempt.category?.toUpperCase?.() || 'QUIZ'} · {new Date(attempt.at).toLocaleString()}
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
                          <span className="text-zinc-500">By {attempt.reviewedBy}{attempt.reviewedAt ? ` · ${new Date(attempt.reviewedAt).toLocaleString()}` : ''}</span>
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        {(attempt.items || []).map(item => (
                          <div key={`${attempt.id}-${item.id}`} className="rounded-lg border border-white/10 bg-black/25 p-2 text-xs">
                            <div className="font-medium text-zinc-100">{item.title}</div>
                            <div className="mt-1 text-zinc-400">Selected: <span className="text-zinc-200">{item.selected || 'No answer'}</span></div>
                            <div className="text-zinc-400">Correct: <span className="text-zinc-200">{item.correct}</span></div>
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

          <TabsContent value="management">
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
                    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400 md:flex-row md:items-center md:justify-between">
                      <span>Manage trainer/admin access here. All changes are protected and audit logged.</span>
                      <Button onClick={restoreDemoStaff} className="rounded-xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:from-fuchsia-500 hover:to-indigo-500">
                        Restore Demo Staff
                      </Button>
                    </div>
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
                        {!managementError && !managementUsers.length && (
                          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
                            No users returned from profiles yet.
                          </div>
                        )}
                        {managementUsers.map(user => {
                          const linkedStaff = staff.find(member => member.traineeUserId === user.id) || null;
                          return (
                          <div key={user.id} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5 md:grid-cols-[1.35fr,0.95fr,1fr,1.9fr,0.78fr,220px] md:items-center">
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
                        )})}
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
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
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
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
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

        {checkboxEditorOpen && checkboxDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-zinc-950 p-5">
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
                <div className="text-lg font-semibold text-white">Session Notes · {sessionTarget.name}</div>
                <button type="button" onClick={() => setSessionNotesOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-sm text-zinc-400">Strong sides</div>
                  <Textarea
                    value={sessionTarget.strongSides}
                    onChange={(e) => updateSessionTarget({ strongSides: e.target.value })}
                    className="min-h-[110px] border-white/10 bg-black/20 text-white"
                  />
                </div>
                <div>
                  <div className="mb-2 text-sm text-zinc-400">Attention points</div>
                  <Textarea
                    value={sessionTarget.attentionPoints}
                    onChange={(e) => updateSessionTarget({ attentionPoints: e.target.value })}
                    className="min-h-[110px] border-white/10 bg-black/20 text-white"
                  />
                </div>
                <div>
                  <div className="mb-2 text-sm text-zinc-400">General notes</div>
                  <Textarea
                    value={sessionTarget.notes}
                    onChange={(e) => updateSessionTarget({ notes: e.target.value })}
                    className="min-h-[130px] border-white/10 bg-black/20 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {sessionActionsOpen && sessionTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-emerald-500/35 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Session Actions · {sessionTarget.name}</div>
                <button type="button" onClick={() => setSessionActionsOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Update trainer</div>
                  <Input disabled={!canEdit} value={sessionTarget.trainer} onChange={(e) => updateSessionTarget({ trainer: e.target.value })} className="border-white/10 bg-black/30 text-white" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Set status</div>
                  <Select value={sessionTarget.status} onValueChange={(value) => updateSessionTarget({ status: value })} disabled={!canEdit}>
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
                  <Button disabled={!canDeleteStaff} onClick={removeSessionTargetStaff} className="w-full rounded-2xl bg-red-700/80 text-white hover:bg-red-700">Remove staff member</Button>
                </div>
                <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-100">
                  Suggested next step: {completionPercent(sessionTarget) >= 90 ? `review ${sessionTarget.name} for ${sessionTarget.promotion}` : `continue ${sessionTarget.role} training until all required checks are complete`}.
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

        {canViewPresence && activeUsersOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Active Users</div>
                <button type="button" onClick={() => setActiveUsersOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="space-y-2">
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
            <div className="w-full max-w-lg rounded-2xl border border-zinc-500/30 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Offline Users</div>
                <button type="button" onClick={() => setOfflineUsersOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="space-y-2">
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
 



