function extractCodeField(block, labels) {
  const labelList = Array.isArray(labels) ? labels : [labels];
  for (const label of labelList) {
    const pattern = new RegExp(`${label}\\s*\\r?\\n\\s*\`\`\`([\\s\\S]*?)\`\`\``, 'i');
    const match = block.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function extractPlainField(block, label) {
  const pattern = new RegExp(`${label}\\s*\\r?\\n([^\\r\\n]+)`, 'i');
  const match = block.match(pattern);
  return match?.[1]?.trim() || '';
}

function normalizeRiskKey(license, playerName) {
  if (license) return license.toLowerCase();
  return `name:${String(playerName || 'unknown').trim().toLowerCase()}`;
}

function parseNumber(value) {
  const number = Number(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

export function parseRiskPlayerLog(rawText) {
  const text = String(rawText || '').replace(/\r\n/g, '\n');
  const blocks = text
    .split(/(?=\[\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}\])/)
    .map(block => block.trim())
    .filter(Boolean);

  const entries = [];
  let ignoredCompletions = 0;
  let ignoredOther = 0;

  blocks.forEach((block) => {
    const isSent = /Sent To Community Service/i.test(block);
    const isCompletion = /Community Service Completed|completed community service|confirm(ed)?/i.test(block);

    if (!isSent) {
      if (isCompletion) ignoredCompletions += 1;
      else ignoredOther += 1;
      return;
    }

    const timestampMatch = block.match(/\[(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\]/);
    const timestamp = timestampMatch?.[1] || '';
    const licenseMatch = block.match(/license:[a-z0-9]+/i);
    const license = licenseMatch?.[0] || '';
    const playerName = extractCodeField(block, 'Player Name') || 'Unknown player';
    const actions = parseNumber(extractCodeField(block, 'Actions'));
    const reason = extractCodeField(block, 'Reason') || 'No reason provided';
    const staffMember = extractCodeField(block, 'Staff Member') || 'Unknown staff';
    const playerDiscord = extractPlainField(block, 'Player Discord').replace(/^@/, '');

    entries.push({
      id: `${timestamp}-${license || playerName}-${entries.length}`,
      timestamp,
      license,
      playerName,
      playerDiscord,
      actions,
      reason,
      staffMember,
      rawType: 'Sent To Community Service',
    });
  });

  const playersByKey = new Map();
  entries.forEach((entry) => {
    const key = normalizeRiskKey(entry.license, entry.playerName);
    const current = playersByKey.get(key) || {
      key,
      license: entry.license,
      playerName: entry.playerName,
      playerDiscord: entry.playerDiscord,
      entryCount: 0,
      totalActions: 0,
      reasons: {},
      staff: {},
      entries: [],
    };

    current.entryCount += 1;
    current.totalActions += entry.actions;
    current.playerName = current.playerName === 'Unknown player' ? entry.playerName : current.playerName;
    current.playerDiscord = current.playerDiscord || entry.playerDiscord;
    current.reasons[entry.reason] = (current.reasons[entry.reason] || 0) + 1;
    current.staff[entry.staffMember] = (current.staff[entry.staffMember] || 0) + 1;
    current.entries.push(entry);
    playersByKey.set(key, current);
  });

  const players = Array.from(playersByKey.values())
    .map(player => ({
      ...player,
      topReason: Object.entries(player.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No reason provided',
      latestTimestamp: player.entries[player.entries.length - 1]?.timestamp || '',
    }))
    .sort((a, b) => b.entryCount - a.entryCount || b.totalActions - a.totalActions || a.playerName.localeCompare(b.playerName));

  return {
    summary: {
      totalEntries: entries.length,
      uniquePlayers: players.length,
      ignoredCompletions,
      ignoredOther,
      generatedAt: new Date().toISOString(),
    },
    entries,
    players,
    topPlayers: players.slice(0, 10),
  };
}
