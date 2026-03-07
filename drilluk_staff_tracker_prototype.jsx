import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Shield, GraduationCap, CheckCircle2, Users, ArrowUpRight, ClipboardList, Star, HelpCircle, ExternalLink, BookOpen, MessageSquareWarning, Gavel, Swords, FileVideo, Radio, LifeBuoy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roles = ['T-MOD', 'MOD', 'S-MOD', 'ADMIN', 'S-ADMIN', 'HEAD-ADMIN'];

const baseChecks = {
  'T-MOD': ['Bring Player', 'Community Service (Offline)', 'Community Service (Online)', 'Freeze Player', 'Give Outfit', 'Kick', 'Player Info', 'Revive', 'Saved Locations', 'Teleport Marker', 'Teleport To Player'],
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
    question: 'When should a staff member intervene in a live situation?',
    answer: 'After a player report exists, while still using judgment on behavior not explicitly listed when needed.',
    category: 'Process',
  },
  'Community Service (Offline)': {
    question: 'What should a player include when reporting a rule break?',
    answer: 'A /report plus a 2-minute clip of the incident.',
    category: 'Reports',
  },
  'Community Service (Online)': {
    question: 'What is the correct in-city report command?',
    answer: 'Press T and use /report.',
    category: 'Reports',
  },
  'Freeze Player': {
    question: 'What principle matters before staff use force or support force decisions?',
    answer: 'There must be a valid RP reason before force is used.',
    category: 'RP Standard',
  },
  'Give Outfit': {
    question: 'What tone should staff protect in DRILL-UK?',
    answer: 'Structured gameplay, long-term characters, stability, and a family-value community style.',
    category: 'Brand',
  },
  'Kick': {
    question: 'What happens if someone ignores the rules?',
    answer: 'Ignorance of the rules can result in a ban.',
    category: 'Rules',
  },
  'Player Info': {
    question: 'Who gets the final say in reviewed situations?',
    answer: 'Staff have the final say in any situation.',
    category: 'Authority',
  },
  'Revive': {
    question: 'What is one of the clearest general rules staff should know?',
    answer: 'No RDM and no force without valid RP reason.',
    category: 'Rules',
  },
  'Saved Locations': {
    question: 'Why keep reference locations and resources handy?',
    answer: 'So trainers can quickly direct staff to rules, commands, FAQ, keybinds, and other support info during sessions.',
    category: 'Training',
  },
  'Teleport Marker': {
    question: 'What should staff do when players are confused or new?',
    answer: 'Guide them toward official resources like rules, FAQ, commands, and keybinds instead of leaving them lost.',
    category: 'Support',
  },
  'Teleport To Player': {
    question: 'What public expectation does the Drill UK site create for staff?',
    answer: 'Fast, consistent support and a calm helpful presence.',
    category: 'Support',
  },
  'Money Logs': {
    question: 'What should a moderator understand besides punishments?',
    answer: 'The current server ecosystem, including Season 2 systems and how players progress.',
    category: 'Awareness',
  },
  'Death Logs': {
    question: 'What evidence standard should staff ask for in reports?',
    answer: 'A 2-minute clip tied to the reported incident.',
    category: 'Evidence',
  },
  'Join Logs': {
    question: 'What resources should staff know for helping players get started?',
    answer: 'Join flow, FAQ, keybinds, commands, and rules.',
    category: 'Onboarding',
  },
  'Leave Logs': {
    question: 'What should staff watch for around reports and disconnects?',
    answer: 'Whether a reported situation needs review context and saved evidence before conclusions are made.',
    category: 'Review',
  },
  'Org Join Logs': {
    question: 'What bigger community goal should staff protect?',
    answer: 'Meaningful progression and structured gameplay, not chaos for chaos sake.',
    category: 'Standards',
  },
  'Org Leave Logs': {
    question: 'How should staff handle reviewed situations?',
    answer: 'Use more than one opinion where needed so outcomes stay fair and unbiased.',
    category: 'Fairness',
  },
  'Org Create Logs': {
    question: 'What should staff understand about city progression?',
    answer: 'Players are encouraged to build lasting characters and structured stories, so staff decisions should support that.',
    category: 'RP Vision',
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

const initialStaff = [
  {
    id: 1,
    name: 'Leto',
    role: 'T-MOD',
    trainer: 'Trainer',
    status: 'In Training',
    strongSides: 'Calm in tickets, follows instructions well',
    attentionPoints: 'Needs faster report handling',
    signedOff: false,
    staffSince: 'N/A',
    modSince: 'N/A',
    promotion: 'MOD',
    checks: {
      'Bring Player': true,
      'Community Service (Offline)': true,
      'Community Service (Online)': true,
      'Freeze Player': true,
      'Give Outfit': false,
      'Kick': true,
      'Player Info': true,
      'Revive': true,
      'Saved Locations': false,
      'Teleport Marker': false,
      'Teleport To Player': true,
    },
    values: {
      'Respectful with community': true,
      'Respectful with staff': true,
      'Upholds the rules': true,
      'Applies same standards': true,
      'Follows chain of command': true,
      'Monitors trap talk': false,
      'Motivated to learn': true,
      'Socializes with staff': true,
      'Shows initiative': true,
      'Completes staff duties': true,
      'Educates community members': false,
      'No recent rule breaks': true,
    },
    notes: 'Ready for 1 more shadow session before promotion review.',
  },
  {
    id: 2,
    name: 'Rex',
    role: 'MOD',
    trainer: 'Alpha',
    status: 'Active',
    strongSides: 'Fast and reliable',
    attentionPoints: 'Could improve coaching quality',
    signedOff: true,
    staffSince: '2026-01-12',
    modSince: '2026-02-01',
    promotion: 'S-MOD',
    checks: {
      'Money Logs': true,
      'Death Logs': true,
      'Join Logs': true,
      'Leave Logs': true,
      'Org Join Logs': true,
      'Org Leave Logs': true,
      'Org Create Logs': true,
    },
    values: Object.fromEntries(coreValues.map(v => [v, true])),
    notes: 'Strong promotion candidate this week.',
  },
  {
    id: 3,
    name: 'Ashton',
    role: 'S-MOD',
    trainer: 'Loco',
    status: 'Reviewing Others',
    strongSides: 'Leadership and consistency',
    attentionPoints: 'None currently',
    signedOff: true,
    staffSince: '2025-11-03',
    modSince: '2025-11-21',
    promotion: 'ADMIN',
    checks: {
      'Conflict Handling': true,
      'Trainer Shadowing': true,
      'Escalation Flow': true,
      'Evidence Review': true,
    },
    values: Object.fromEntries(coreValues.map(v => [v, true])),
    notes: 'Can help onboard new staff.',
  },
];

function completionPercent(record) {
  const checkValues = Object.values(record.checks || {});
  const valueValues = Object.values(record.values || {});
  const total = checkValues.length + valueValues.length;
  const done = [...checkValues, ...valueValues].filter(Boolean).length;
  return total ? Math.round((done / total) * 100) : 0;
}

function statusColor(status) {
  if (status === 'Active') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (status === 'Reviewing Others') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  return 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30';
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

export default function DrillUKStaffTrackerPrototype() {
  const [staff, setStaff] = useState(initialStaff);
  const [selectedId, setSelectedId] = useState(initialStaff[0].id);
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('T-MOD');

  const filtered = useMemo(() => {
    return staff.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.role.toLowerCase().includes(query.toLowerCase()) ||
      s.status.toLowerCase().includes(query.toLowerCase())
    );
  }, [staff, query]);

  const selected = staff.find(s => s.id === selectedId) || staff[0];

  const totals = {
    total: staff.length,
    inTraining: staff.filter(s => s.status === 'In Training').length,
    promotionReady: staff.filter(s => completionPercent(s) >= 90).length,
    signedOff: staff.filter(s => s.signedOff).length,
  };

  const currentChecks = baseChecks[selected.role] || [];

  function updateSelected(patch) {
    setStaff(prev => prev.map(s => (s.id === selected.id ? { ...s, ...patch } : s)));
  }

  function toggleCheck(key, category) {
    setStaff(prev =>
      prev.map(s => {
        if (s.id !== selected.id) return s;
        if (category === 'checks') {
          return { ...s, checks: { ...s.checks, [key]: !s.checks[key] } };
        }
        return { ...s, values: { ...s.values, [key]: !s.values[key] } };
      })
    );
  }

  function addStaff() {
    if (!newName.trim()) return;
    const roleChecks = Object.fromEntries((baseChecks[newRole] || []).map(item => [item, false]));
    const valueChecks = Object.fromEntries(coreValues.map(item => [item, false]));
    const next = {
      id: Date.now(),
      name: newName.trim(),
      role: newRole,
      trainer: 'Unassigned',
      status: 'In Training',
      strongSides: '',
      attentionPoints: '',
      signedOff: false,
      staffSince: 'N/A',
      modSince: 'N/A',
      promotion: roles[Math.min(roles.indexOf(newRole) + 1, roles.length - 1)],
      checks: roleChecks,
      values: valueChecks,
      notes: '',
    };
    setStaff(prev => [next, ...prev]);
    setSelectedId(next.id);
    setNewName('');
    setNewRole('T-MOD');
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(140,33,255,0.22),transparent_35%),radial-gradient(circle_at_right,rgba(164,52,235,0.16),transparent_25%)]" />
      <div className="relative p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-2">
                <Shield className="h-6 w-6 text-fuchsia-300" />
              </div>
              <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/10">Drill UK Staff System</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Training tracker, promotions, and staff progression in one clean panel</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-300 md:text-base">A modern replacement for the spreadsheet workflow: add staff, track checks, log notes, review readiness, and push people through the Drill UK ranks with cleaner Drill-themed UI and built-in rules coaching.</p>
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

        <Tabs defaultValue="tracker" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/5 md:w-[860px]">
            <TabsTrigger value="tracker">Tracker</TabsTrigger>
            <TabsTrigger value="session">Training Session</TabsTrigger>
            <TabsTrigger value="progression">Progression</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="tracker">
            <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Staff records</span>
                    <Badge className="border-white/10 bg-white/10 text-zinc-200">{filtered.length} shown</Badge>
                  </CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, role, or status..." className="border-white/10 bg-black/30 pl-9 text-white placeholder:text-zinc-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-[1fr,120px] gap-2">
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add new staff member" className="border-white/10 bg-black/30 text-white placeholder:text-zinc-500" />
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="border-white/10 bg-black/30 text-white">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addStaff} className="w-full rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500">
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
                          <div>
                            <div className="text-lg font-semibold">{member.name}</div>
                            <div className="mt-1 text-sm text-zinc-400">{member.role} · Trainer: {member.trainer}</div>
                          </div>
                          <Badge className={statusColor(member.status)}>{member.status}</Badge>
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

              <div className="space-y-6">
                <Card className="border-white/10 bg-white/5">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-bold">{selected.name}</h2>
                          <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200">{selected.role}</Badge>
                          <Badge className={statusColor(selected.status)}>{selected.status}</Badge>
                        </div>
                        <p className="mt-2 text-zinc-400">Promotion target: <span className="text-white">{selected.promotion}</span></p>
                      </div>
                      <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Readiness score</div>
                        <div className="mt-2 text-3xl font-bold">{completionPercent(selected)}%</div>
                        <Progress value={completionPercent(selected)} className="mt-3 h-2 bg-white/10" />
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        ['Trainer', selected.trainer],
                        ['Staff Since', selected.staffSince],
                        ['Mod Since', selected.modSince],
                        ['Signed Off', selected.signedOff ? 'Yes' : 'No'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
                          <div className="mt-2 text-sm font-medium text-white">{value}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 2xl:grid-cols-2">
                  <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-fuchsia-300" /> Role checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentChecks.map(item => {
                        const quiz = ruleQuizMap[item];
                        return (
                          <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <label className="flex items-center justify-between gap-3">
                              <span className="text-sm text-zinc-100">{item}</span>
                              <Checkbox checked={!!selected.checks[item]} onCheckedChange={() => toggleCheck(item, 'checks')} />
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
                      {coreValues.map(item => (
                        <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <label className="flex items-center justify-between gap-3">
                            <span className="text-sm text-zinc-100">{item}</span>
                            <Checkbox checked={!!selected.values[item]} onCheckedChange={() => toggleCheck(item, 'values')} />
                          </label>
                          <div className="mt-2 text-xs text-zinc-400">{valueGuidance[item]}</div>
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
                    <Input value={selected.trainer} onChange={(e) => updateSelected({ trainer: e.target.value })} className="border-white/10 bg-black/30 text-white" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Set status</div>
                    <Select value={selected.status} onValueChange={(value) => updateSelected({ status: value })}>
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
                    <Button variant={selected.signedOff ? 'secondary' : 'default'} onClick={() => updateSelected({ signedOff: !selected.signedOff })} className={selected.signedOff ? 'w-full rounded-2xl' : 'w-full rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500'}>
                      {selected.signedOff ? 'Remove sign-off' : 'Mark as signed off'}
                    </Button>
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
        </Tabs>
      </div>
    </div>
  );
}
 