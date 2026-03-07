import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Shield, GraduationCap, CheckCircle2, Users, ArrowUpRight, ClipboardList, Star, HelpCircle, ExternalLink, BookOpen, MessageSquareWarning, Gavel, Swords, FileVideo, Radio, LifeBuoy, ShieldAlert, Upload } from 'lucide-react';
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

function accountRoleLabel(role) {
  if (role === 'viewer') return 'Guest';
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
          <div className="rounded-lg border border-white/10 bg-black/30 p-2 text-zinc-300">{answer}</div>
        </div>
      )}
    </div>
  );
}

export default function DrillUKStaffTrackerPrototype({ authUser, profile, onSignOut, dbReady, onProfileRefresh }) {
  const canEdit = ['head_admin', 'admin', 'trainer'].includes(profile?.role || '');
  const canManageUsers = profile?.role === 'head_admin';
  const canManageCheckboxes = ['head_admin', 'admin'].includes(profile?.role || '');
  const canDeleteStaff = ['head_admin', 'admin'].includes(profile?.role || '');

  const [staff, setStaff] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('T-MOD');
  const [newAvatar, setNewAvatar] = useState('');
  const [disciplineOpen, setDisciplineOpen] = useState(false);
  const [disciplineType, setDisciplineType] = useState('Warning');
  const [disciplineReason, setDisciplineReason] = useState('');
  const [disciplineIssuer, setDisciplineIssuer] = useState('');
  const profileFileInputRef = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterRole, setFilterRole] = useState('All');
  const [filterTrainerOnly, setFilterTrainerOnly] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [filterWarningOnly, setFilterWarningOnly] = useState(false);
  const [managementUsers, setManagementUsers] = useState([]);
  const [managementLoading, setManagementLoading] = useState(false);
  const [checkboxCatalog, setCheckboxCatalog] = useState(buildDefaultCheckboxCatalog());
  const [checkboxCatalogLoading, setCheckboxCatalogLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(profile?.username || '');
  const [profileAvatar, setProfileAvatar] = useState(profile?.avatar_url || '');
  const lastLocalStaffEditRef = useRef(0);

  useEffect(() => {
    setProfileName(profile?.username || '');
    setProfileAvatar(profile?.avatar_url || '');
  }, [profile]);

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
      profileImage: row.profile_image || '',
      status: row.status,
      strongSides: row.strong_sides || '',
      attentionPoints: row.attention_points || '',
      signedOff: Boolean(row.signed_off),
      staffSince: row.staff_since || 'N/A',
      modSince: row.role_since || 'N/A',
      promotion: row.promotion || roles[Math.min(roles.indexOf(row.role) + 1, roles.length - 1)],
      checks: row.checks || Object.fromEntries((baseChecksByRole[row.role] || []).map(item => [item, false])),
      permissions: row.permissions || Object.fromEntries(dynamicPermissions.map(item => [item, false])),
      values: row.values || Object.fromEntries(dynamicCoreValues.map(v => [v, false])),
      disciplinary: row.disciplinary || { warnings: 0, actions: 0, logs: [] },
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, is_active, avatar_url')
      .order('username', { ascending: true });
    if (error?.code === '42703') {
      const { data: fallbackData } = await supabase
        .from('profiles')
        .select('id, username, role, is_active')
        .order('username', { ascending: true });
      setManagementUsers((fallbackData || []).map(u => ({ ...u, avatar_url: null })));
    } else {
      setManagementUsers(data || []);
    }
    setManagementLoading(false);
  }

  async function refreshCheckboxCatalogFromDb() {
    if (!dbReady || !supabase) return;
    setCheckboxCatalogLoading(true);
    const { data, error } = await supabase
      .from('checkbox_catalog')
      .select('*')
      .order('category', { ascending: true });

    if (!error && data?.length) {
      setCheckboxCatalog(data.map(item => ({
        id: item.id,
        category: item.category,
        role: item.role || '',
        title: item.title,
        question: item.question || '',
        answer: item.answer || '',
      })));
    }
    setCheckboxCatalogLoading(false);
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

  const baseChecksByRole = useMemo(() => {
    const map = Object.fromEntries(roles.map(role => [role, []]));
    checkboxCatalog
      .filter(item => item.category === 'role' && item.role)
      .forEach(item => {
        if (map[item.role]) map[item.role].push(item.title);
      });
    return map;
  }, [checkboxCatalog]);

  const dynamicCoreValues = useMemo(
    () => checkboxCatalog.filter(item => item.category === 'core').map(item => item.title),
    [checkboxCatalog]
  );

  const dynamicPermissions = useMemo(
    () => checkboxCatalog.filter(item => item.category === 'permission').map(item => item.title),
    [checkboxCatalog]
  );

  const dynamicQuizMap = useMemo(
    () => Object.fromEntries(checkboxCatalog.map(item => [item.title, { question: item.question, answer: item.answer, category: item.category === 'role' ? item.role || 'Role' : item.category === 'core' ? 'Core Value' : 'Permission' }])),
    [checkboxCatalog]
  );

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

  const selected = staff.find(s => s.id === selectedId) || staff[0] || null;

  const totals = {
    total: staff.length,
    inTraining: staff.filter(s => s.status === 'In Training').length,
    promotionReady: staff.filter(s => completionPercent(s) >= 90).length,
    signedOff: staff.filter(s => s.signedOff).length,
  };

  const currentChecks = selected ? (baseChecksByRole[selected.role] || []) : [];
  const currentPermissions = dynamicPermissions;

  async function saveStaffMember(member) {
    if (!dbReady || !supabase) return;
    lastLocalStaffEditRef.current = Date.now();

    const payload = {
      id: member.id,
      name: member.name,
      role: member.role,
      trainer: member.trainer,
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
    if (!selected || !canEdit || !disciplineReason.trim()) return;
    const today = new Date().toISOString().slice(0, 10);

    let updated = null;
    setStaff(prev =>
      prev.map(s => {
        if (s.id !== selected.id) return s;
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
    updateSelected({
      role: nextRole,
      promotion: roles[Math.min(currentIndex + 2, roles.length - 1)],
      checks: Object.fromEntries((baseChecksByRole[nextRole] || []).map(item => [item, false])),
      modSince: today,
    });
  }

  function demoteSelected() {
    if (!selected || !canEdit) return;
    const currentIndex = roles.indexOf(selected.role);
    if (currentIndex <= 0) return;
    const nextRole = roles[currentIndex - 1];
    const today = new Date().toISOString().slice(0, 10);
    updateSelected({
      role: nextRole,
      promotion: roles[currentIndex],
      checks: Object.fromEntries((baseChecksByRole[nextRole] || []).map(item => [item, false])),
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

  function addStaff() {
    if (!canEdit || !newName.trim()) return;
    const roleChecks = Object.fromEntries((baseChecksByRole[newRole] || []).map(item => [item, false]));
    const valueChecks = Object.fromEntries(dynamicCoreValues.map(item => [item, false]));
    const next = {
      id: Date.now(),
      name: newName.trim(),
      role: newRole,
      trainer: 'Unassigned',
      profileImage: newAvatar.trim() || '',
      status: 'In Training',
      strongSides: '',
      attentionPoints: '',
      signedOff: false,
      staffSince: 'N/A',
      modSince: 'N/A',
      promotion: roles[Math.min(roles.indexOf(newRole) + 1, roles.length - 1)],
      checks: roleChecks,
      permissions: Object.fromEntries(dynamicPermissions.map(item => [item, false])),
      values: valueChecks,
      disciplinary: { warnings: 0, actions: 0, logs: [] },
      notes: '',
    };
    setStaff(prev => [next, ...prev]);
    setSelectedId(next.id);
    setNewName('');
    setNewRole('T-MOD');
    setNewAvatar('');
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

  async function updateUserAvatar(userId, avatarUrl) {
    if (!canManageUsers || !dbReady || !supabase) return;
    await supabase.from('profiles').update({ avatar_url: avatarUrl || null }).eq('id', userId);
    setManagementUsers(prev => prev.map(u => (u.id === userId ? { ...u, avatar_url: avatarUrl || null } : u)));
    if (profile?.id === userId) {
      window.location.reload();
    }
    await writeAudit('user.avatar.update', userId, null, { avatar_url: avatarUrl || null });
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
    await supabase
      .from('profiles')
      .update({ username: profileName || null, avatar_url: profileAvatar || null })
      .eq('id', profile.id);
    await writeAudit('profile.update', profile.id, null, { username: profileName || null, avatar_url: profileAvatar || null });
    setProfileOpen(false);
    onProfileRefresh?.();
  }

  async function saveCheckboxItem(item) {
    if (!canManageCheckboxes || !dbReady || !supabase) return;
    const payload = {
      id: item.id,
      category: item.category,
      role: item.role || null,
      title: item.title,
      question: item.question || null,
      answer: item.answer || null,
      updated_by: authUser?.id || null,
    };
    await supabase.from('checkbox_catalog').upsert(payload);
    await writeAudit('checkbox_catalog.save', item.id, null, payload);
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
    setCheckboxCatalog(prev => [
      ...prev,
      { id, category, role: category === 'role' ? role : '', title: 'New Checklist Item', question: 'New quiz question', answer: 'New quiz answer' },
    ]);
  }

  if (!selected) {
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
          <div className="flex items-start gap-3 md:w-[560px] md:justify-end">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="rounded-2xl border border-white/15 bg-black/25 p-0 transition hover:border-fuchsia-500/40"
                title="Open profile"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Account logo"
                    className="h-[86px] w-[86px] rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-[86px] w-[86px] items-center justify-center rounded-2xl text-2xl font-bold text-zinc-200">
                    {(profile?.username?.[0] || authUser?.email?.[0] || 'G').toUpperCase()}
                  </div>
                )}
              </button>
              <button onClick={onSignOut} className="w-full rounded-xl border border-white/15 bg-black/25 px-2 py-1.5 text-xs text-zinc-200 hover:bg-white/10">
                Sign Out
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:w-[420px]">
              {[
                { label: 'Total Staff', value: totals.total, icon: Users },
                { label: 'In Training', value: totals.inTraining, icon: GraduationCap },
                { label: 'Promo Ready', value: totals.promotionReady, icon: ArrowUpRight },
                { label: 'Signed Off', value: totals.signedOff, icon: CheckCircle2 },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">{item.label}</div>
                        <div className="mt-1 text-2xl font-bold">{item.value}</div>
                      </div>
                      <item.icon className="h-5 w-5 text-fuchsia-300" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        {!canEdit && (
          <div className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-200">
            Read-only mode: your account role can view data but cannot edit staff records.
          </div>
        )}

        <Tabs defaultValue="tracker" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 bg-white/5 md:w-[1240px]">
            <TabsTrigger value="tracker">Tracker</TabsTrigger>
            <TabsTrigger value="session">Training Session</TabsTrigger>
            <TabsTrigger value="progression">Progression</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checkboxes">Checkboxes</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
          </TabsList>

          <TabsContent value="tracker">
            <div className="grid gap-4 xl:grid-cols-[380px,1fr]">
              <Card className="border-white/10 bg-white/5">
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
                            {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
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
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-[1fr,120px] gap-2">
                    <Input disabled={!canEdit} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add new staff member" className="border-white/10 bg-black/30 text-white placeholder:text-zinc-500" />
                    <Select value={newRole} onValueChange={setNewRole} disabled={!canEdit}>
                      <SelectTrigger className="border-white/10 bg-black/30 text-white">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input disabled={!canEdit} value={newAvatar} onChange={(e) => setNewAvatar(e.target.value)} placeholder="Profile image path or URL (example: /assets/cards/name.webp)" className="border-white/10 bg-black/30 text-white placeholder:text-zinc-500" />
                  <Button disabled={!canEdit} onClick={addStaff} className="w-full rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500">
                    <Plus className="mr-2 h-4 w-4" /> Add staff member
                  </Button>
                  <div className="max-h-[580px] space-y-3 overflow-auto pr-1">
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
                                <Badge className={`${roleColor(member.role)} px-2 text-[10px]`}>{member.role}</Badge>
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
                          <Badge className={roleColor(selected.role)}>{selected.role}</Badge>
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
                            [`${selected.role} Since`, selected.modSince],
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

                <div className="grid gap-4 xl:grid-cols-3">
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
                              <span className="text-sm text-zinc-100">{item}</span>
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
                      {dynamicCoreValues.map(item => (
                        <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <label className="flex items-center justify-between gap-3">
                            <span className="text-sm text-zinc-100">{item}</span>
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
                              <span className="text-sm text-zinc-100">{item}</span>
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
                <CardHeader><CardTitle>Trainer notes for {selected.name}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 text-sm text-zinc-400">Strong sides</div>
                    <Textarea value={selected.strongSides} onChange={(e) => updateSelected({ strongSides: e.target.value })} className="min-h-[120px] border-white/10 bg-black/20 text-white" />
                  </div>
                  <div>
                    <div className="mb-2 text-sm text-zinc-400">Attention points</div>
                    <Textarea value={selected.attentionPoints} onChange={(e) => updateSelected({ attentionPoints: e.target.value })} className="min-h-[120px] border-white/10 bg-black/20 text-white" />
                  </div>
                  <div>
                    <div className="mb-2 text-sm text-zinc-400">General notes</div>
                    <Textarea value={selected.notes} onChange={(e) => updateSelected({ notes: e.target.value })} className="min-h-[140px] border-white/10 bg-black/20 text-white" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader><CardTitle>Session actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Update trainer</div>
                    <Input disabled={!canEdit} value={selected.trainer} onChange={(e) => updateSelected({ trainer: e.target.value })} className="border-white/10 bg-black/30 text-white" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Set status</div>
                    <Select value={selected.status} onValueChange={(value) => updateSelected({ status: value })} disabled={!canEdit}>
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
                    <Button disabled={!canEdit} variant={selected.signedOff ? 'secondary' : 'default'} onClick={() => updateSelected({ signedOff: !selected.signedOff })} className={selected.signedOff ? 'w-full rounded-2xl' : 'w-full rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500'}>
                      {selected.signedOff ? 'Remove sign-off' : 'Mark as signed off'}
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Rank actions</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button disabled={!canEdit} onClick={promoteSelected} className="w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500">Promote</Button>
                      <Button disabled={!canEdit} onClick={demoteSelected} className="w-full rounded-2xl bg-red-600 text-white hover:bg-red-500">Demote</Button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                    <div className="mb-3 text-xs uppercase tracking-[0.2em] text-red-200">Remove from tracker</div>
                    <Button disabled={!canDeleteStaff} onClick={removeSelectedStaff} className="w-full rounded-2xl bg-red-700/80 text-white hover:bg-red-700">Remove staff member</Button>
                  </div>
                  <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-red-200">
                      <ShieldAlert className="h-4 w-4" />
                      Warning & disciplinary
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        disabled={!canEdit}
                        onClick={() => {
                          setDisciplineType('Warning');
                          setDisciplineOpen(true);
                        }}
                        className="w-full rounded-2xl bg-red-500/80 text-white hover:bg-red-500"
                      >
                        Warning
                      </Button>
                      <Button
                        disabled={!canEdit}
                        onClick={() => {
                          setDisciplineType('Disciplinary Action');
                          setDisciplineOpen(true);
                        }}
                        className="w-full rounded-2xl bg-red-700/80 text-white hover:bg-red-700"
                      >
                        Disciplinary
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-100">
                    Suggested next step: {completionPercent(selected) >= 90 ? `review ${selected.name} for ${selected.promotion}` : `continue ${selected.role} training until all required checks are complete`}.
                  </div>
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
                          <div className="font-semibold">{role}</div>
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

          <TabsContent value="resources">
            <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Drill UK quick resources</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {quickLinks.map(link => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-fuchsia-500/30 hover:bg-fuchsia-500/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                            <link.icon className="h-4 w-4 text-fuchsia-300" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{link.label}</div>
                            <div className="text-xs text-zinc-400">Open official Drill UK resource</div>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-zinc-500 transition group-hover:text-fuchsia-300" />
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Live server context to train around</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {siteSignals.map(signal => (
                    <div key={signal.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-1 text-sm font-semibold text-white">{signal.title}</div>
                      <div className="text-sm text-zinc-300">{signal.text}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 xl:col-span-2">
                <CardHeader>
                  <CardTitle>Meet The Team card showcase (Malia, MB, Loco)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {teamCardShowcase.map(member => (
                    <div
                      key={member.name}
                      className="overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-black/30"
                    >
                      <img
                        src={member.cardArt}
                        alt={`${member.name} staff card`}
                        className="h-[290px] w-full object-cover object-top"
                        loading="lazy"
                      />
                      <div className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-base font-semibold text-white">{member.name}</div>
                          <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200">{member.rarity}</Badge>
                        </div>
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">{member.role}</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="rounded-lg border border-white/10 bg-black/40 p-2 text-center">
                            <div className="text-zinc-400">Support</div>
                            <div className="mt-1 font-semibold text-white">{member.stats.support}</div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/40 p-2 text-center">
                            <div className="text-zinc-400">Reviews</div>
                            <div className="mt-1 font-semibold text-white">{member.stats.reviews}</div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/40 p-2 text-center">
                            <div className="text-zinc-400">Lead</div>
                            <div className="mt-1 font-semibold text-white">{member.stats.leadership}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 xl:col-span-2">
                <CardHeader>
                  <CardTitle>Rule training pack</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    {
                      title: 'Reports first',
                      text: 'Staff training should reinforce report-first workflow, with clip review baked into moderation sessions.',
                      icon: FileVideo,
                    },
                    {
                      title: 'No RDM / valid RP reason',
                      text: 'Use this as a constant quiz topic for trainees when reviewing force-based incidents.',
                      icon: Swords,
                    },
                    {
                      title: 'Unbiased reviews',
                      text: 'Build escalation habits around second opinions when situations are messy or disputed.',
                      icon: Gavel,
                    },
                  ].map(item => (
                    <div key={item.title} className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4">
                      <div className="mb-3 flex items-center gap-2 text-fuchsia-200">
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <div className="text-sm text-zinc-300">{item.text}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-white/10 bg-white/5 lg:col-span-2">
                <CardHeader>
                  <CardTitle>What this now replaces from the Excel version</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {[
                    'One record per staff member instead of one crowded worksheet tab',
                    'Checkboxes for training checks and values instead of manually ticking cells',
                    'Built-in question prompts tied to checks so trainers can test rule knowledge live',
                    'Faster searching, filtering, trainer assignment, and promotion tracking',
                    'Quick links to rules, commands, FAQ, keybinds, team page, and support resources',
                    'Expandable to add history logs, review dates, permissions, and real saved data later',
                  ].map(text => (
                    <div
                      key={text}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200"
                    >
                      {text}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Design language</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-zinc-300">
                  <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4">
                    Dark black base with Drill UK purple glow accents.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    Card-based layout for quick scanning during training.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    Now shaped around the live Drill UK website, support messaging, and rules flow.
                  </div>
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
                      <Button onClick={restoreDemoStaff} className="bg-fuchsia-600 hover:bg-fuchsia-500">
                        Restore Demo Staff
                      </Button>
                    </div>
                    {managementLoading ? (
                      <div className="text-sm text-zinc-400">Loading users...</div>
                    ) : (
                      <div className="space-y-3">
                        {managementUsers.map(user => (
                          <div key={user.id} className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1.5fr,1fr,1.2fr,140px]">
                            <div className="flex items-start gap-3">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={`${user.username || 'user'} avatar`} className="h-10 w-10 rounded-xl border border-white/10 object-cover" />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-sm font-semibold text-zinc-200">
                                  {(user.username?.[0] || 'G').toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-semibold text-white">{user.username || user.id}</div>
                                <div className="text-xs text-zinc-500">{user.id}</div>
                              </div>
                            </div>
                            <Select value={user.role} onValueChange={(value) => updateUserRole(user.id, value)}>
                              <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">viewer</SelectItem>
                                <SelectItem value="trainer">trainer</SelectItem>
                                <SelectItem value="admin">admin</SelectItem>
                                <SelectItem value="head_admin">head_admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                              <Input
                                value={user.avatar_url || ''}
                                onChange={(e) => setManagementUsers(prev => prev.map(u => (u.id === user.id ? { ...u, avatar_url: e.target.value } : u)))}
                                placeholder="Avatar URL"
                                className="border-white/10 bg-black/30 text-white"
                              />
                              <Button onClick={() => updateUserAvatar(user.id, user.avatar_url || null)} className="bg-fuchsia-600 hover:bg-fuchsia-500">
                                Save
                              </Button>
                            </div>
                            <Button
                              onClick={() => toggleUserActive(user.id, !user.is_active)}
                              className={user.is_active ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}
                            >
                              {user.is_active ? 'Active' : 'Disabled'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
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
                      Structured like Tracker: role-based panels for role checklist lines, plus dedicated Core Values and Permissions panels.
                    </div>
                    {checkboxCatalogLoading ? (
                      <div className="text-sm text-zinc-400">Loading checkbox catalog...</div>
                    ) : (
                      <div className="grid gap-6 xl:grid-cols-[1.35fr,1fr]">
                        <div className="space-y-6">
                          {roles.map(role => {
                            const roleItems = checkboxCatalog.filter(item => item.category === 'role' && (item.role || 'T-MOD') === role);
                            return (
                              <div key={role} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge className="border-blue-400/40 bg-blue-500/10 text-blue-200">{role}</Badge>
                                    <span className="text-sm text-zinc-400">Role Checklist</span>
                                  </div>
                                  <Button onClick={() => addCheckboxItem('role', role)} className="h-8 bg-fuchsia-600 px-3 text-xs hover:bg-fuchsia-500">Add line</Button>
                                </div>
                                <div className="space-y-3">
                                  {!roleItems.length && <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-500">No lines configured for this role.</div>}
                                  {roleItems.map(item => (
                                    <div key={item.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                                      <div className="grid gap-2 md:grid-cols-[1fr,90px,90px]">
                                        <Input
                                          value={item.title}
                                          onChange={(e) => patchCheckboxItem(item.id, { title: e.target.value })}
                                          className="border-white/10 bg-black/40 text-white"
                                          placeholder="Checklist title"
                                        />
                                        <Button onClick={() => saveCheckboxItem(item)} className="bg-emerald-600 hover:bg-emerald-500">Save</Button>
                                        <Button onClick={() => deleteCheckboxItem(item.id)} className="bg-red-600 hover:bg-red-500">Delete</Button>
                                      </div>
                                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <Textarea
                                          value={item.question || ''}
                                          onChange={(e) => patchCheckboxItem(item.id, { question: e.target.value })}
                                          className="min-h-[88px] border-white/10 bg-black/40 text-white"
                                          placeholder="Quiz question"
                                        />
                                        <Textarea
                                          value={item.answer || ''}
                                          onChange={(e) => patchCheckboxItem(item.id, { answer: e.target.value })}
                                          className="min-h-[88px] border-white/10 bg-black/40 text-white"
                                          placeholder="Expected answer"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-6">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-200">Core Values</Badge>
                                <span className="text-sm text-zinc-400">Values Checklist</span>
                              </div>
                              <Button onClick={() => addCheckboxItem('core')} className="h-8 bg-fuchsia-600 px-3 text-xs hover:bg-fuchsia-500">Add line</Button>
                            </div>
                            <div className="space-y-3">
                              {!checkboxCatalog.filter(item => item.category === 'core').length && <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-500">No core values configured.</div>}
                              {checkboxCatalog.filter(item => item.category === 'core').map(item => (
                                <div key={item.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                                  <div className="grid gap-2 md:grid-cols-[1fr,90px,90px]">
                                    <Input
                                      value={item.title}
                                      onChange={(e) => patchCheckboxItem(item.id, { title: e.target.value })}
                                      className="border-white/10 bg-black/40 text-white"
                                      placeholder="Core value title"
                                    />
                                    <Button onClick={() => saveCheckboxItem(item)} className="bg-emerald-600 hover:bg-emerald-500">Save</Button>
                                    <Button onClick={() => deleteCheckboxItem(item.id)} className="bg-red-600 hover:bg-red-500">Delete</Button>
                                  </div>
                                  <div className="mt-3 grid gap-3">
                                    <Textarea
                                      value={item.question || ''}
                                      onChange={(e) => patchCheckboxItem(item.id, { question: e.target.value })}
                                      className="min-h-[72px] border-white/10 bg-black/40 text-white"
                                      placeholder="Value check question"
                                    />
                                    <Textarea
                                      value={item.answer || ''}
                                      onChange={(e) => patchCheckboxItem(item.id, { answer: e.target.value })}
                                      className="min-h-[72px] border-white/10 bg-black/40 text-white"
                                      placeholder="Expected answer"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className="border-amber-400/40 bg-amber-500/10 text-amber-200">Permissions</Badge>
                                <span className="text-sm text-zinc-400">Permissions & Actions</span>
                              </div>
                              <Button onClick={() => addCheckboxItem('permission')} className="h-8 bg-fuchsia-600 px-3 text-xs hover:bg-fuchsia-500">Add line</Button>
                            </div>
                            <div className="space-y-3">
                              {!checkboxCatalog.filter(item => item.category === 'permission').length && <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-500">No permissions configured.</div>}
                              {checkboxCatalog.filter(item => item.category === 'permission').map(item => (
                                <div key={item.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                                  <div className="grid gap-2 md:grid-cols-[1fr,90px,90px]">
                                    <Input
                                      value={item.title}
                                      onChange={(e) => patchCheckboxItem(item.id, { title: e.target.value })}
                                      className="border-white/10 bg-black/40 text-white"
                                      placeholder="Permission title"
                                    />
                                    <Button onClick={() => saveCheckboxItem(item)} className="bg-emerald-600 hover:bg-emerald-500">Save</Button>
                                    <Button onClick={() => deleteCheckboxItem(item.id)} className="bg-red-600 hover:bg-red-500">Delete</Button>
                                  </div>
                                  <div className="mt-3 grid gap-3">
                                    <Textarea
                                      value={item.question || ''}
                                      onChange={(e) => patchCheckboxItem(item.id, { question: e.target.value })}
                                      className="min-h-[72px] border-white/10 bg-black/40 text-white"
                                      placeholder="Permissions quiz question"
                                    />
                                    <Textarea
                                      value={item.answer || ''}
                                      onChange={(e) => patchCheckboxItem(item.id, { answer: e.target.value })}
                                      className="min-h-[72px] border-white/10 bg-black/40 text-white"
                                      placeholder="Expected answer"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {disciplineOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-red-500/40 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">{disciplineType} report</div>
                <button type="button" onClick={() => setDisciplineOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                  Staff member: <span className="font-semibold text-white">{selected.name}</span> ({selected.role})
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
                  <Button onClick={() => applyDisciplinary(disciplineType)} className="rounded-2xl bg-red-600 text-white hover:bg-red-500">Submit {disciplineType}</Button>
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
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Avatar URL</div>
                  <Input value={profileAvatar} onChange={(e) => setProfileAvatar(e.target.value)} className="border-white/10 bg-black/30 text-white" placeholder="https://... or /assets/..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setProfileOpen(false)} className="rounded-2xl">Cancel</Button>
                  <Button onClick={saveOwnProfile} className="rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500">Save Profile</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 



