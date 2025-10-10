const colors = ['blue', 'green', 'purple', 'orange'];
let colorIndex = 0;
let timeSeed = 1700000000000;
function now() {
  timeSeed += 1;
  return timeSeed;
}

function pickColor() {
  const color = colors[colorIndex % colors.length];
  colorIndex += 1;
  return color;
}

const OPERATORS = [
  { id: 'starter', name: 'Starter', desc: 'Conceives and designs work', seq: 1, tier: 'genesis', canRequestRevision: false },
  { id: 'builder', name: 'Builder', desc: 'Builds and produces artifacts', seq: 2, tier: 'genesis', canRequestRevision: false },
  { id: 'compiler', name: 'Compiler', desc: 'Packages work into coherent form', seq: 3, tier: 'genesis', canRequestRevision: false },
  { id: 'reviewer', name: 'Reviewer', desc: 'Tests and evaluates quality', seq: 4, tier: 'evaluation', canRequestRevision: true },
  { id: 'approver', name: 'Approver', desc: 'Authorizes and validates', seq: 5, tier: 'evaluation', canRequestRevision: true },
  { id: 'documenter', name: 'Documenter', desc: 'Records and formalizes', seq: 6, tier: 'evaluation', canRequestRevision: false },
  { id: 'integrator', name: 'Integrator', desc: 'Synthesizes into coherent wholes', seq: 7, tier: 'continuity', canRequestRevision: false },
  { id: 'maintainer', name: 'Maintainer', desc: 'Preserves and sustains systems', seq: 8, tier: 'continuity', canRequestRevision: false },
  { id: 'evolver', name: 'Evolver', desc: 'Transforms and reinitiates cycles', seq: 9, tier: 'continuity', canRequestRevision: false }
];

const DEFAULT_STAGE_BLUEPRINT = OPERATORS.map((op, index) => ({
  key: op.id,
  name: op.name,
  description: op.desc,
  order: index,
  tier: op.tier,
  supportsRevision: op.canRequestRevision
}));

// Gentle, lay-friendly defaults (flow rhythm)
const DEFAULT_STAGE_TIMELINES = {
  starter: 10,
  builder: 14,
  compiler: 7,
  reviewer: 4,
  approver: 3,
  documenter: 7,
  integrator: 10,
  maintainer: 0,
  evolver: 0
};

// Default EO-aligned, lay-friendly conditions
const DEFAULT_CONDITIONS = {
  starter: "Goal, owner, and success criteria are clear.",
  builder: "Something tangible exists to review (a draft, prototype, or demo).",
  compiler: "Pieces combined into a coherent package ready for feedback.",
  reviewer: "At least one peer has reviewed and left feedback.",
  approver: "Decision-maker has signed off or provided approval notes.",
  documenter: "Final version and key notes recorded in one place.",
  integrator: "Work merged into the wider system or process.",
  maintainer: "Monitoring, updates, and issue tracking are active.",
  evolver: "Lessons captured and next cycle defined or initiated."
};

function toUniqueIds(list = []) {
  return Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)));
}

function createDefaultStageConfig() {
  return OPERATORS.map(op => ({
    stageKey: op.id,
    active: true,
    assignedTeamIds: [],
    assignedUserIds: [],
    optedOutUserIds: []
  }));
}

function normalizeStageConfigEntry(entry) {
  if (!entry) return null;
  const stageKey = entry.stageKey || entry.operatorKey || entry.key || entry.id;
  if (!stageKey) return null;
  const {
    assignedTeamIds: entryAssignedTeamIds,
    assignedRoleIds: entryAssignedRoleIds,
    assignedUserIds: entryAssignedUserIds,
    optedOutUserIds: entryOptedOutUserIds,
    roleId,
    roleIds,
    userIds: entryUserIds,
    excludedUserIds,
    ...rest
  } = entry;
  const assignedTeamIds = toUniqueIds([
    ...(Array.isArray(entryAssignedTeamIds) ? entryAssignedTeamIds : []),
    ...(Array.isArray(entryAssignedRoleIds) ? entryAssignedRoleIds : []),
    ...(Array.isArray(roleIds) ? roleIds : []),
    ...(roleId ? [roleId] : [])
  ]);
  const assignedUserIds = toUniqueIds([
    ...(Array.isArray(entryAssignedUserIds) ? entryAssignedUserIds : []),
    ...(Array.isArray(entryUserIds) ? entryUserIds : [])
  ]);
  const optedOutUserIds = toUniqueIds([
    ...(Array.isArray(entryOptedOutUserIds) ? entryOptedOutUserIds : []),
    ...(Array.isArray(excludedUserIds) ? excludedUserIds : [])
  ]);
  return {
    ...rest,
    stageKey,
    active: entry.active !== false,
    assignedTeamIds,
    assignedUserIds,
    optedOutUserIds
  };
}

function getFlowStageConfig(flow = {}) {
  const existing = Array.isArray(flow.stageConfig) ? flow.stageConfig : [];
  const normalized = existing
    .map(normalizeStageConfigEntry)
    .filter(Boolean);
  const configMap = new Map(normalized.map(entry => [entry.stageKey, entry]));
  const ordered = OPERATORS.map(op => {
    const existingEntry = configMap.get(op.id);
    if (existingEntry) {
      return { ...existingEntry, stageKey: op.id, active: existingEntry.active !== false };
    }
    return {
      stageKey: op.id,
      active: true,
      assignedTeamIds: [],
      assignedUserIds: [],
      optedOutUserIds: []
    };
  });
  normalized.forEach(entry => {
    if (!ordered.find(item => item.stageKey === entry.stageKey)) {
      ordered.push(entry);
    }
  });
  return ordered;
}

function getFirstActiveStage(orderedStages = []) {
  for (const stage of orderedStages) {
    if (!stage?.skipped) return stage;
  }
  return orderedStages[0] || null;
}

function getStageIdentity(stage) {
  return stage?.id || stage?.key || stage?.name;
}

function createDefaultStages() {
  const timestamp = now();
  return DEFAULT_STAGE_BLUEPRINT.map((stage, idx) => ({
    id: `stage-${timestamp}-${idx}`,
    key: stage.key,
    operatorKey: stage.key,
    name: stage.name,
    description: stage.description,
    order: idx,
    tier: stage.tier,
    roleId: null,
    supportsRevision: stage.supportsRevision,
    expectedDurationDays: DEFAULT_STAGE_TIMELINES[stage.key] ?? 0,
    conditions: DEFAULT_CONDITIONS[stage.key] || '',
    skipped: false
  }));
}

function getOrderedStages(flow) {
  const stages = Array.isArray(flow?.stages) && flow.stages.length > 0
    ? flow.stages
    : DEFAULT_STAGE_BLUEPRINT.map((stage, idx) => ({
        key: stage.key,
        operatorKey: stage.key,
        name: stage.name,
        description: stage.description,
        order: idx,
        tier: stage.tier,
        roleId: null,
        supportsRevision: stage.supportsRevision,
        expectedDurationDays: DEFAULT_STAGE_TIMELINES[stage.key] ?? 0,
        conditions: DEFAULT_CONDITIONS[stage.key] || '',
        skipped: false
      }));

  const stageConfig = getFlowStageConfig(flow || {});
  const stageConfigMap = new Map(stageConfig.map(entry => [entry.stageKey, entry]));

  return [...stages]
    .map((stage, idx) => {
      const operatorKey = stage.operatorKey || stage.key;
      const config = stageConfigMap.get(operatorKey) || null;
      const skipped = config ? !config.active : stage.skipped;
      return {
        ...stage,
        order: stage.order ?? idx,
        operatorKey,
        tier: stage.tier || DEFAULT_STAGE_BLUEPRINT[idx]?.tier,
        uid: getStageIdentity(stage),
        skipped: skipped ?? false,
        stageConfig: config || null
      };
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function createStageHistoryEntry(stageId, timestamp) {
  return {
    id: `stage-entry-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    stageId,
    enteredAt: timestamp,
    exitedAt: null,
    claimedBy: null,
    claimedAt: null,
    priority: null,
    completedAt: null,
    skippedAt: null,
    log: []
  };
}

function getLatestStageHistoryEntry(stageHistory, stageId) {
  if (!Array.isArray(stageHistory)) return null;
  for (let i = stageHistory.length - 1; i >= 0; i -= 1) {
    const entry = stageHistory[i];
    if (entry?.stageId === stageId) {
      return entry;
    }
  }
  return null;
}

function updateLatestStageHistoryEntry(stageHistory, stageId, updater, { createIfMissing = false, timestamp = now() } = {}) {
  const nextHistory = Array.isArray(stageHistory) ? [...stageHistory] : [];
  for (let i = nextHistory.length - 1; i >= 0; i -= 1) {
    if (nextHistory[i]?.stageId === stageId) {
      nextHistory[i] = updater(nextHistory[i]);
      return nextHistory;
    }
  }
  if (createIfMissing && stageId) {
    const created = updater(createStageHistoryEntry(stageId, timestamp));
    nextHistory.push(created);
  }
  return nextHistory;
}

function ensureStageTracking(activity, stageId, timestamp = now()) {
  const currentStageId = stageId || activity.currentStageId || activity.stageId || null;
  const baseHistory = Array.isArray(activity.stageHistory) ? activity.stageHistory : [];
  let stageHistory = [...baseHistory];
  if (currentStageId && !getLatestStageHistoryEntry(stageHistory, currentStageId)) {
    stageHistory.push(createStageHistoryEntry(currentStageId, activity.createdAt || timestamp));
  }
  const stageReadBy = { ...(activity.stageReadBy || {}) };
  if (currentStageId && !stageReadBy[currentStageId]) {
    stageReadBy[currentStageId] = { ...(activity.readBy || {}) };
  }
  return { currentStageId, stageHistory, stageReadBy };
}

function getActivityDefaultStageId(activity, orderedStages = []) {
  if (!activity) {
    const firstStage = getFirstActiveStage(orderedStages);
    return firstStage ? getStageIdentity(firstStage) : null;
  }
  if (activity.currentStageId) return activity.currentStageId;
  if (activity.stageId) return activity.stageId;
  if (Array.isArray(activity.stageHistory) && activity.stageHistory.length > 0) {
    const lastEntry = activity.stageHistory[activity.stageHistory.length - 1];
    if (lastEntry?.stageId) return lastEntry.stageId;
  }
  const firstStage = getFirstActiveStage(orderedStages);
  return firstStage ? getStageIdentity(firstStage) : null;
}

function getNextStageId(orderedStages, currentStageId, skippedStages = []) {
  if (!currentStageId) return null;
  const skippedSet = new Set(skippedStages || []);
  const startIndex = orderedStages.findIndex(stage => getStageIdentity(stage) === currentStageId);
  if (startIndex === -1) return null;
  for (let idx = startIndex + 1; idx < orderedStages.length; idx += 1) {
    const candidate = orderedStages[idx];
    const candidateId = getStageIdentity(candidate);
    if (candidate.skipped) continue;
    if (skippedSet.has(candidateId)) continue;
    return candidateId;
  }
  return null;
}

function resolveStageTeams(project, flow, stageId) {
  if (!project || !flow || !stageId) return [];
  const orderedStages = getOrderedStages(flow);
  const stage = orderedStages.find(stageItem => {
    const identity = getStageIdentity(stageItem);
    return identity === stageId || stageItem.operatorKey === stageId || stageItem.key === stageId;
  });
  const stageKey = stage ? (stage.operatorKey || stage.key || getStageIdentity(stage)) : stageId;
  const stageConfig = getFlowStageConfig(flow);
  const config = stageConfig.find(entry => entry.stageKey === stageKey);
  if (!config) return [];
  return (config.assignedTeamIds || [])
    .map(teamId => (project.teams || []).find(team => team.id === teamId))
    .filter(Boolean);
}

function getStageTeams(state, flow, stageId) {
  const project = state.projects.find(p => p.flows.some(f => f.id === flow.id));
  if (!project) return [];
  return resolveStageTeams(project, flow, stageId);
}

function canUserWorkOnStage(state, flow, stageId, userName) {
  if (!flow || !stageId || !userName) return false;
  const project = state.projects.find(p => p.flows.some(f => f.id === flow.id));
  if (!project) return false;
  const teams = getStageTeams(state, flow, stageId);
  const hasTeamAccess = teams.some(team => (team.userIds || []).some(userId => {
    const user = project.users.find(u => u.id === userId);
    return user?.name === userName;
  }));
  if (hasTeamAccess) return true;
  const orderedStages = getOrderedStages(flow);
  const stage = orderedStages.find(stageItem => {
    const identity = getStageIdentity(stageItem);
    return identity === stageId || stageItem.operatorKey === stageId || stageItem.key === stageId;
  });
  const stageKey = stage ? (stage.operatorKey || stage.key || getStageIdentity(stage)) : stageId;
  const config = getFlowStageConfig(flow).find(sc => sc.stageKey === stageKey);
  const hasDirectAccess = (config?.assignedUserIds || []).some(userId => {
    const user = project.users.find(u => u.id === userId);
    return user?.name === userName;
  });
  return hasDirectAccess;
}

function createTeam(state, projectId, name, userIds = []) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  if (!Array.isArray(project.teams)) project.teams = [];
  const timestamp = now();
  const newTeam = {
    id: `team-${timestamp}`,
    name,
    userIds: toUniqueIds(userIds),
    color: pickColor()
  };
  project.teams.push(newTeam);
  return newTeam;
}

function updateTeam(state, projectId, teamId, updates = {}) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project || !Array.isArray(project.teams)) return;
  const team = project.teams.find(t => t.id === teamId);
  if (!team) return;
  const nextUserIds = toUniqueIds(updates.userIds || team.userIds || []);
  Object.assign(team, updates, { userIds: nextUserIds });
}

function deleteTeam(state, projectId, teamId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  project.teams = (project.teams || []).filter(team => team.id !== teamId);
  project.flows.forEach(flow => {
    const config = getFlowStageConfig(flow).map(entry => ({
      ...entry,
      assignedTeamIds: (entry.assignedTeamIds || []).filter(id => id !== teamId)
    }));
    flow.stageConfig = config;
  });
}

function assignTeamsToStage(state, projectId, flowId, stageId, { assignedTeamIds = [], assignedUserIds = [] } = {}) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  const flow = project.flows.find(f => f.id === flowId);
  if (!flow) throw new Error('Flow not found');
  const orderedStages = getOrderedStages(flow);
  const targetStage = orderedStages.find(stage => {
    const identity = getStageIdentity(stage);
    return identity === stageId || stage.operatorKey === stageId || stage.key === stageId;
  });
  const stageKey = targetStage ? (targetStage.operatorKey || targetStage.key || getStageIdentity(targetStage)) : stageId;
  const normalized = getFlowStageConfig(flow);
  const updatedConfig = normalized.map(entry => entry.stageKey === stageKey ? {
    ...entry,
    assignedTeamIds: toUniqueIds(assignedTeamIds),
    assignedUserIds: toUniqueIds(assignedUserIds)
  } : entry);
  flow.stageConfig = updatedConfig;
}

function createActivity(state, projectId, flowId, title, deliverable = '', options = {}, currentUser = 'Someone') {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  const flow = project.flows.find(f => f.id === flowId);
  if (!flow) throw new Error('Flow not found');
  if (!Array.isArray(flow.activities)) flow.activities = [];
  const timestamp = now();
  const activityId = options.id || `a-${timestamp}`;
  const explicitStageId = options.stageId || null;
  const orderedStages = getOrderedStages(flow);
  const targetStage = explicitStageId
    ? orderedStages.find(stage => getStageIdentity(stage) === explicitStageId)
    : getFirstActiveStage(orderedStages);
  const stageId = targetStage ? getStageIdentity(targetStage) : null;
  const entry = stageId ? createStageHistoryEntry(stageId, timestamp) : null;
  if (entry) {
    entry.log = [{
      id: `log-${timestamp}`,
      text: `${currentUser || 'Someone'} created this activity`,
      timestamp
    }];
  }
  const activity = {
    id: activityId,
    title,
    deliverable,
    currentStageId: stageId,
    skippedStages: [],
    stageHistory: entry ? [entry] : [],
    stageReadBy: stageId ? { [stageId]: {} } : {},
    createdAt: timestamp,
    completedAt: null,
    comments: [],
    attachments: [],
    history: [{
      id: `h-${timestamp}`,
      text: `${currentUser || 'Someone'} created this activity`,
      timestamp
    }]
  };
  flow.activities.push(activity);
  return activity;
}

function claimActivity(state, projectId, flowId, activityId, priority = null, currentUser = 'Someone') {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  const flow = project.flows.find(f => f.id === flowId);
  if (!flow) throw new Error('Flow not found');
  const activity = flow.activities.find(a => a.id === activityId);
  if (!activity) throw new Error('Activity not found');
  const timestamp = now();
  const orderedStages = getOrderedStages(flow);
  const stageIdSeed = activity.currentStageId || activity.stageId;
  const { currentStageId, stageHistory, stageReadBy } = ensureStageTracking(activity, stageIdSeed, timestamp);
  if (!currentStageId) return false;
  const stageMeta = orderedStages.find(stage => getStageIdentity(stage) === currentStageId);
  const latestEntry = getLatestStageHistoryEntry(stageHistory, currentStageId);
  if (latestEntry?.claimedBy && latestEntry.claimedBy !== currentUser) {
    return false;
  }
  const actor = currentUser || 'Someone';
  const updatedHistory = updateLatestStageHistoryEntry(stageHistory, currentStageId, (entry) => ({
    ...entry,
    claimedBy: currentUser,
    claimedAt: timestamp,
    priority: priority || null,
    log: [...(entry.log || []), {
      id: `log-${timestamp}`,
      text: `${actor} claimed${priority ? ` (${priority})` : ''}`,
      timestamp
    }]
  }), { createIfMissing: true, timestamp });
  const updatedStageReadBy = {
    ...stageReadBy,
    [currentStageId]: { ...(stageReadBy[currentStageId] || {}), [actor]: timestamp }
  };
  const stageName = stageMeta?.name || 'stage';
  const comments = [
    ...(activity.comments || []),
    {
      id: `c-${timestamp}`,
      author: actor,
      content: `${actor} claimed ${stageName}${priority ? ` (priority: ${priority})` : ''}`,
      createdAt: timestamp,
      mentions: [],
      system: true
    }
  ];
  Object.assign(activity, {
    currentStageId,
    stageHistory: updatedHistory,
    stageReadBy: updatedStageReadBy,
    comments,
    history: [...(activity.history || []), {
      id: `h-${timestamp}`,
      text: `${actor} claimed ${stageName}${priority ? ` (priority: ${priority})` : ''}`,
      timestamp
    }]
  });
  return true;
}

function unclaimActivity(state, projectId, flowId, activityId, currentUser = 'Someone') {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  const flow = project.flows.find(f => f.id === flowId);
  if (!flow) throw new Error('Flow not found');
  const activity = flow.activities.find(a => a.id === activityId);
  if (!activity) throw new Error('Activity not found');
  const timestamp = now();
  const orderedStages = getOrderedStages(flow);
  const stageIdSeed = activity.currentStageId || activity.stageId;
  const { currentStageId, stageHistory, stageReadBy } = ensureStageTracking(activity, stageIdSeed, timestamp);
  if (!currentStageId) return false;
  const stageMeta = orderedStages.find(stage => getStageIdentity(stage) === currentStageId);
  const actor = currentUser || 'Someone';
  const updatedHistory = updateLatestStageHistoryEntry(stageHistory, currentStageId, (entry) => ({
    ...entry,
    claimedBy: null,
    priority: null,
    log: [...(entry.log || []), {
      id: `log-${timestamp}`,
      text: `${actor} unclaimed`,
      timestamp
    }]
  }), { createIfMissing: true, timestamp });
  const updatedStageReadBy = {
    ...stageReadBy,
    [currentStageId]: { ...(stageReadBy[currentStageId] || {}), [actor]: timestamp }
  };
  const stageName = stageMeta?.name || 'stage';
  const comments = [
    ...(activity.comments || []),
    {
      id: `c-${timestamp}`,
      author: actor,
      content: `${actor} unclaimed ${stageName}`,
      createdAt: timestamp,
      mentions: [],
      system: true
    }
  ];
  Object.assign(activity, {
    currentStageId,
    stageHistory: updatedHistory,
    stageReadBy: updatedStageReadBy,
    comments,
    history: [...(activity.history || []), {
      id: `h-${timestamp}`,
      text: `${actor} unclaimed ${stageName}`,
      timestamp
    }]
  });
  return true;
}

function completeActivity(state, projectId, flowId, activityId, options = {}, currentUser = 'Someone') {
  const { skipStage: skipStageFlag = false, note = null } = options || {};
  const project = state.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  const flow = project.flows.find(f => f.id === flowId);
  if (!flow) throw new Error('Flow not found');
  const activity = flow.activities.find(a => a.id === activityId);
  if (!activity) throw new Error('Activity not found');
  const timestamp = now();
  const actor = currentUser || 'Someone';
  const orderedStages = getOrderedStages(flow);
  const stageIdSeed = activity.currentStageId || activity.stageId;
  const { currentStageId, stageHistory, stageReadBy } = ensureStageTracking(activity, stageIdSeed, timestamp);
  if (!currentStageId) return null;
  const stageMeta = orderedStages.find(stage => getStageIdentity(stage) === currentStageId);
  const stageName = stageMeta?.name || 'stage';
  const message = skipStageFlag ? `${actor} skipped ${stageName}` : `${actor} completed ${stageName}`;
  const trimmedNote = note ? note.trim() : '';
  const updatedHistory = updateLatestStageHistoryEntry(stageHistory, currentStageId, (entry) => ({
    ...entry,
    exitedAt: timestamp,
    completedAt: skipStageFlag ? entry.completedAt : timestamp,
    skippedAt: skipStageFlag ? timestamp : entry.skippedAt,
    log: [
      ...(entry.log || []),
      { id: `log-${timestamp}`, text: message, timestamp },
      ...(trimmedNote ? [{ id: `log-${timestamp}-note`, text: `Note: ${trimmedNote}`, timestamp }] : [])
    ]
  }), { createIfMissing: true, timestamp });
  const newSkippedStages = skipStageFlag ? Array.from(new Set([...(activity.skippedStages || []), currentStageId])) : (activity.skippedStages || []);
  const nextStageId = getNextStageId(orderedStages, currentStageId, newSkippedStages);
  const nextStageMeta = nextStageId ? orderedStages.find(stage => getStageIdentity(stage) === nextStageId) : null;
  let extendedHistory = [...updatedHistory];
  if (nextStageId) {
    const nextEntry = createStageHistoryEntry(nextStageId, timestamp);
    nextEntry.log = [{ id: `log-${timestamp}-enter`, text: `${actor} moved to ${nextStageMeta?.name || 'next stage'}`, timestamp }];
    extendedHistory.push(nextEntry);
  }
  const updatedStageReadBy = {
    ...stageReadBy,
    [currentStageId]: { ...(stageReadBy[currentStageId] || {}), [actor]: timestamp }
  };
  if (nextStageId && !updatedStageReadBy[nextStageId]) {
    updatedStageReadBy[nextStageId] = {};
  }
  const historyEntries = [
    ...(activity.history || []),
    { id: `h-${timestamp}`, text: message, timestamp }
  ];
  if (nextStageMeta) {
    historyEntries.push({ id: `h-${timestamp}-advance`, text: `${actor} advanced to ${nextStageMeta.name}`, timestamp });
  } else {
    historyEntries.push({ id: `h-${timestamp}-finish`, text: `${actor} completed the activity`, timestamp });
  }
  if (trimmedNote) {
    historyEntries.push({ id: `h-${timestamp}-note`, text: `${actor} noted: ${trimmedNote}`, timestamp });
  }
  const comments = [
    ...(activity.comments || []),
    {
      id: `c-${timestamp}`,
      author: actor,
      content: message,
      createdAt: timestamp,
      mentions: [],
      system: true
    },
    ...(trimmedNote ? [{
      id: `c-${timestamp}-note`,
      author: actor,
      content: `Note on ${stageName}: ${trimmedNote}`,
      createdAt: timestamp,
      mentions: [],
      system: true
    }] : [])
  ];
  Object.assign(activity, {
    currentStageId: nextStageId || currentStageId,
    skippedStages: newSkippedStages,
    stageHistory: extendedHistory,
    stageReadBy: updatedStageReadBy,
    comments,
    history: historyEntries,
    completedAt: nextStageId ? activity.completedAt : timestamp
  });
  return nextStageId;
}

function migrateLegacyRolesToTeams(state) {
  state.projects.forEach(project => {
    const roleMap = new Map();
    const registerRole = (roleId) => {
      if (!roleId || !project.roles) return;
      const role = project.roles.find(r => r.id === roleId);
      if (role && !roleMap.has(role.id)) {
        roleMap.set(role.id, role);
      }
    };
    (project.flows || []).forEach(flow => {
      (flow.activities || []).forEach(activity => {
        if (activity.roleId) registerRole(activity.roleId);
      });
      (flow.stageConfig || []).forEach(config => {
        if (!config) return;
        registerRole(config.roleId);
        (config.assignedRoleIds || []).forEach(registerRole);
      });
    });
    if (project.teams && project.teams.length > 0 && roleMap.size === 0) {
      project.roles = [];
      return;
    }
    const teams = Array.from(roleMap.values()).map(role => ({
      id: role.id.replace('role-', 'team-'),
      name: role.name,
      userIds: toUniqueIds(role.userIds || []),
      color: pickColor()
    }));
    if (teams.length > 0 && (!project.teams || project.teams.length === 0)) {
      project.teams = teams;
    }
    (project.flows || []).forEach(flow => {
      flow.stageConfig = getFlowStageConfig(flow).map(entry => ({
        ...entry,
        assignedTeamIds: entry.assignedTeamIds.map(teamId => teamId.startsWith('role-') ? teamId.replace('role-', 'team-') : teamId)
      }));
      (flow.activities || []).forEach(activity => {
        if (activity.roleId) {
          const migrated = activity.roleId.replace('role-', 'team-');
          activity.teamId = migrated;
          delete activity.roleId;
        }
      });
    });
    project.roles = [];
  });
}

function section(title) {
  console.log(`\n## ${title}`);
}

function step(description, outcome) {
  console.log(`- ${description}: ${outcome}`);
}

function formatTeam(team, project) {
  const members = (team.userIds || []).map(id => project.users.find(u => u.id === id)?.name || id);
  return `${team.name} [${members.join(', ')}]`;
}

function main() {
  const state = {
    projects: [
      {
        id: 'project-1',
        name: 'Event Prep',
        users: [
          { id: 'user-alex', name: 'Alex' },
          { id: 'user-beth', name: 'Beth' },
          { id: 'user-cara', name: 'Cara' },
          { id: 'user-dan', name: 'Dan' },
          { id: 'user-erin', name: 'Erin' }
        ],
        teams: [],
        flows: [
          {
            id: 'flow-1',
            name: 'Launch Flow',
            description: 'Prep for product launch',
            stageConfig: createDefaultStageConfig(),
            stages: createDefaultStages(),
            activities: [],
            edges: []
          }
        ]
      }
    ]
  };

  const project = state.projects[0];
  const flow = project.flows[0];

  section('Scenario 1 · Team CRUD');
  const teamAlpha = createTeam(state, project.id, 'Alpha Squad', ['user-alex', 'user-beth']);
  step('Create team with Alex & Beth', formatTeam(teamAlpha, project));
  updateTeam(state, project.id, teamAlpha.id, { userIds: ['user-alex', 'user-beth', 'user-cara'] });
  step('Add Cara to Alpha Squad', formatTeam(teamAlpha, project));
  const teamBeta = createTeam(state, project.id, 'Beta Crew', ['user-dan']);
  step('Create temporary Beta Crew', formatTeam(teamBeta, project));
  deleteTeam(state, project.id, teamBeta.id);
  step('Delete Beta Crew', project.teams.some(t => t.id === teamBeta.id) ? 'still present' : 'removed');
  const teamBravo = createTeam(state, project.id, 'Bravo Ops', ['user-dan']);
  step('Create Bravo Ops for multi-team stage', formatTeam(teamBravo, project));

  section('Scenario 2 · Stage Assignment');
  assignTeamsToStage(state, project.id, flow.id, 'starter', { assignedTeamIds: [teamAlpha.id] });
  step('Assign Starter stage to Alpha', JSON.stringify(getFlowStageConfig(flow).find(sc => sc.stageKey === 'starter').assignedTeamIds));
  assignTeamsToStage(state, project.id, flow.id, 'starter', { assignedTeamIds: [teamAlpha.id, teamBravo.id] });
  step('Allow both Alpha & Bravo on Starter', JSON.stringify(getFlowStageConfig(flow).find(sc => sc.stageKey === 'starter').assignedTeamIds));
  assignTeamsToStage(state, project.id, flow.id, 'compiler', { assignedTeamIds: [teamAlpha.id] });
  step('Assign Compiler stage to Alpha', JSON.stringify(getFlowStageConfig(flow).find(sc => sc.stageKey === 'compiler').assignedTeamIds));
  assignTeamsToStage(state, project.id, flow.id, 'maintainer', { assignedTeamIds: [teamAlpha.id] });
  step('Assign Maintainer to Alpha temporarily', JSON.stringify(getFlowStageConfig(flow).find(sc => sc.stageKey === 'maintainer').assignedTeamIds));
  assignTeamsToStage(state, project.id, flow.id, 'maintainer', { assignedTeamIds: [] });
  step('Remove Maintainer team assignment', JSON.stringify(getFlowStageConfig(flow).find(sc => sc.stageKey === 'maintainer').assignedTeamIds));

  section('Scenario 3 · Create Activity');
  const kickoff = createActivity(state, project.id, flow.id, 'Kickoff briefing', 'Slides deck', {}, 'Alex');
  step('Activity created without roleId', kickoff.roleId === undefined ? 'roleId absent' : 'roleId present');
  step('Activity current stage', kickoff.currentStageId);
  const starterTeams = getStageTeams(state, flow, kickoff.currentStageId).map(team => team.name).join(', ');
  step('Teams available on Starter stage', starterTeams);

  section('Scenario 4 · Claim Activity');
  const alexCanClaim = canUserWorkOnStage(state, flow, kickoff.currentStageId, 'Alex');
  const erinCanClaim = canUserWorkOnStage(state, flow, kickoff.currentStageId, 'Erin');
  const danCanClaim = canUserWorkOnStage(state, flow, kickoff.currentStageId, 'Dan');
  step('Alex (Alpha) can claim', alexCanClaim);
  step('Erin (no team) can claim', erinCanClaim);
  step('Dan (Bravo) can claim', danCanClaim);
  const alexClaimed = claimActivity(state, project.id, flow.id, kickoff.id, 'high', 'Alex');
  step('Alex claims kickoff', alexClaimed ? 'claimed' : 'blocked');
  const erinAttempt = claimActivity(state, project.id, flow.id, kickoff.id, 'medium', 'Erin');
  step('Erin attempt while claimed', erinAttempt ? 'claimed' : 'blocked');
  unclaimActivity(state, project.id, flow.id, kickoff.id, 'Alex');
  const danClaimed = claimActivity(state, project.id, flow.id, kickoff.id, 'low', 'Dan');
  step('Dan claims after unclaim', danClaimed ? 'claimed' : 'blocked');

  section('Scenario 5 · Stage Advancement');
  assignTeamsToStage(state, project.id, flow.id, 'builder', { assignedTeamIds: [teamBravo.id] });
  const nextStageId = completeActivity(state, project.id, flow.id, kickoff.id, { skipStage: false }, 'Dan');
  step('Advance from Starter', nextStageId || 'completed');
  const alexAccess = canUserWorkOnStage(state, flow, kickoff.currentStageId, 'Alex');
  const danAccess = canUserWorkOnStage(state, flow, kickoff.currentStageId, 'Dan');
  step('Alex access after advancement', alexAccess);
  step('Dan access after advancement', danAccess);

  section('Scenario 6 · Wire Activity');
  const compilerStage = getOrderedStages(flow).find(stage => (stage.operatorKey || stage.key) === 'compiler');
  const compilerStageId = compilerStage ? getStageIdentity(compilerStage) : 'compiler';
  const wired = createActivity(state, project.id, flow.id, 'Assemble assets', 'Asset bundle', { stageId: compilerStageId }, 'Dan');
  step('Wire-created activity stage', wired.currentStageId);
  const compilerTeams = getStageTeams(state, flow, wired.currentStageId).map(team => team.name).join(', ') || 'none';
  step('Teams available on Compiler stage', compilerTeams);

  section('Scenario 7 · Migration');
  const legacyState = {
    projects: [
      {
        id: 'legacy-1',
        name: 'Legacy Project',
        users: [
          { id: 'user-liz', name: 'Liz' },
          { id: 'user-moe', name: 'Moe' }
        ],
        roles: [
          { id: 'role-research', name: 'Research Guild', userIds: ['user-liz'] },
          { id: 'role-build', name: 'Build Guild', userIds: ['user-moe'] }
        ],
        teams: [],
        flows: [
          {
            id: 'legacy-flow',
            name: 'Legacy Flow',
            stageConfig: [
              { stageKey: 'starter', assignedRoleIds: ['role-research'] },
              { stageKey: 'builder', assignedRoleIds: ['role-build'] }
            ],
            activities: [
              { id: 'legacy-a1', title: 'Old Task', roleId: 'role-research', stageHistory: [], stageReadBy: {}, skippedStages: [], createdAt: now() }
            ],
            edges: []
          }
        ]
      }
    ]
  };
  migrateLegacyRolesToTeams(legacyState);
  const migratedProject = legacyState.projects[0];
  step('Teams created from roles', migratedProject.teams.map(team => formatTeam(team, migratedProject)).join(' | '));
  const legacyFlow = migratedProject.flows[0];
  const starterAssignment = getFlowStageConfig(legacyFlow).find(sc => sc.stageKey === 'starter').assignedTeamIds;
  step('Starter assignment uses team ids', JSON.stringify(starterAssignment));
  const legacyActivity = legacyFlow.activities[0];
  step('Legacy activity role field removed', legacyActivity.roleId === undefined && legacyActivity.teamId ? `teamId=${legacyActivity.teamId}` : 'roleId still present');

  console.log('\nAll scenarios executed.');
}

main();
