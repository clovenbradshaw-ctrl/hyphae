# Instructions for AI Developer: Refactor to Team-Based Stage Assignments

## Overview
We're refactoring from activity-based roles to stage-based team assignments. The core change: **Activities don't have roles. Stages have team assignments. Teams define who can work at each stage.**

---

## Phase 1: Data Structure Changes

### 1.1 Add Teams to Project Structure

**Location:** Project data model (in `EventOperator` component state)

**Current:**
```javascript
project: {
  id: 'p-1',
  name: 'Project Name',
  users: [...],
  flows: [...]
}
```

**New:**
```javascript
project: {
  id: 'p-1',
  name: 'Project Name',
  users: [...],
  teams: [
    {
      id: 'team-1',
      name: 'Writers',
      userIds: ['u-1', 'u-2'],
      color: 'blue' // optional, for UI
    }
  ],
  flows: [...]
}
```

### 1.2 Update Stage Config Structure

**Location:** Flow `stageConfig` array

**Current:**
```javascript
stageConfig: [
  {
    stageKey: 'doer',
    active: true,
    assignedRoleIds: [],  // Currently unused or wrong concept
    assignedUserIds: [],
    optedOutUserIds: []
  }
]
```

**New:**
```javascript
stageConfig: [
  {
    stageKey: 'doer',
    active: true,
    assignedTeamIds: ['team-1', 'team-2'],  // Teams responsible for this stage
    assignedUserIds: [],  // Optional: individual users (for small teams)
    optedOutUserIds: []   // Keep for opt-out functionality
  }
]
```

### 1.3 Remove roleId from Activities

**Location:** Activity objects

**Remove this field:**
```javascript
activity: {
  roleId: 'role-1',  // DELETE THIS
  // ... rest stays
}
```

Activities no longer have an inherent role. They inherit permissions from their current stage.

---

## Phase 2: Core Function Updates

### 2.1 Replace Role Management with Team Management

**Remove these functions:**
- `createRole()`
- `updateRole()`
- `normalizeRole()`
- All role-related state (`roles`, `setRoles`)

**Add these functions:**

```javascript
const createTeam = (name, userIds = []) => {
  const timestamp = Date.now();
  const newTeam = {
    id: `team-${timestamp}`,
    name,
    userIds: Array.from(new Set(userIds.filter(Boolean))),
    color: ['blue', 'green', 'purple', 'orange'][Math.floor(Math.random() * 4)]
  };
  
  setProjects(prev => prev.map(p => p.id === selectedProject.id ? {
    ...p,
    teams: [...(p.teams || []), newTeam]
  } : p));
  
  return newTeam;
};

const updateTeam = (teamId, updates) => {
  setProjects(prev => prev.map(p => p.id === selectedProject.id ? {
    ...p,
    teams: (p.teams || []).map(team => 
      team.id === teamId 
        ? { ...team, ...updates, userIds: Array.from(new Set(updates.userIds || team.userIds)) }
        : team
    )
  } : p));
};

const deleteTeam = (teamId) => {
  setProjects(prev => prev.map(p => ({
    ...p,
    teams: (p.teams || []).filter(t => t.id !== teamId),
    flows: p.flows.map(f => ({
      ...f,
      stageConfig: (f.stageConfig || []).map(sc => ({
        ...sc,
        assignedTeamIds: (sc.assignedTeamIds || []).filter(id => id !== teamId)
      }))
    }))
  })));
};
```

### 2.2 Update Activity Creation

**Current signature:**
```javascript
createActivity(projectId, flowId, title, roleId, deliverable, options)
```

**New signature:**
```javascript
createActivity(projectId, flowId, title, deliverable = '', options = {})
// Remove roleId parameter entirely
```

**Update implementation:**
```javascript
const createActivity = (projectId, flowId, title, deliverable = '', options = {}) => {
  const timestamp = Date.now();
  const activityId = options.id || `a-${timestamp}`;
  const explicitStageId = options.stageId || null;
  
  setProjects(prev => prev.map(p => p.id === projectId ? {
    ...p,
    flows: p.flows.map(f => {
      if (f.id !== flowId) return f;
      
      const orderedStages = getOrderedStages(f);
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
      
      return {
        ...f,
        activities: [...f.activities, {
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
          // NOTE: No roleId field!
        }]
      };
    })
  } : p));
};
```

### 2.3 Update Permission Check Logic

**Create new helper function:**
```javascript
const getStageTeams = (flow, stageId) => {
  if (!flow || !stageId) return [];
  
  const stageConfig = getFlowStageConfig(flow);
  const config = stageConfig.find(sc => sc.stageKey === stageId);
  
  if (!config) return [];
  
  const project = projects.find(p => 
    p.flows.some(f => f.id === flow.id)
  );
  
  if (!project) return [];
  
  const teams = (config.assignedTeamIds || [])
    .map(teamId => (project.teams || []).find(t => t.id === teamId))
    .filter(Boolean);
  
  return teams;
};

const canUserWorkOnStage = (flow, stageId, userName) => {
  const teams = getStageTeams(flow, stageId);
  
  // Check team membership
  const hasTeamAccess = teams.some(team => 
    team.userIds.some(userId => {
      const project = projects.find(p => p.flows.some(f => f.id === flow.id));
      const user = project?.users.find(u => u.id === userId);
      return user?.name === userName;
    })
  );
  
  // Check direct user assignment (if no teams assigned)
  const config = getFlowStageConfig(flow).find(sc => sc.stageKey === stageId);
  const hasDirectAccess = (config?.assignedUserIds || []).some(userId => {
    const project = projects.find(p => p.flows.some(f => f.id === flow.id));
    const user = project?.users.find(u => u.id === userId);
    return user?.name === userName;
  });
  
  return hasTeamAccess || hasDirectAccess;
};
```

### 2.4 Update Claim Activity Logic

**Find this code in `claimActivity`:**
```javascript
// OLD - Delete this
const canClaim = stageState === 'ready' && !claimedBy && 
  role?.userIds.some(uid => project.users.find(u => u.id === uid)?.name === currentUser);
```

**Replace with:**
```javascript
// NEW
const canClaim = stageState === 'ready' && !claimedBy && 
  canUserWorkOnStage(f, currentStageId, currentUser);
```

### 2.5 Update Activity Card canClaim Logic

**Location:** `ActivityCard` component and `ActivityDetailPanel`

**Find:**
```javascript
const canClaim = stageState === 'ready' && !claimedBy && 
  role?.userIds.some(uid => project.users.find(u => u.id === uid)?.name === currentUser);
```

**Replace with:**
```javascript
const canClaim = stageState === 'ready' && !claimedBy && 
  canUserWorkOnStage(flow, activity.currentStageId, currentUser);
```

### 2.6 Remove Role-Based Stage Finding

**Delete this function:**
```javascript
function findStageForRole(flow, role) { ... }
```

This is no longer needed. Activities start at the first active stage or an explicitly specified stage.

---

## Phase 3: UI Component Updates

### 3.1 Update CreateActivityModal

**Remove all role selection UI.**

**Current (DELETE):**
```javascript
const [selectedRole, setSelectedRole] = useState('');
const [newRoleName, setNewRoleName] = useState('');
// ... all role creation logic
```

**New modal should only have:**
1. Activity title input
2. Deliverable input (optional)
3. Starting stage selector (optional, defaults to first)

**New implementation:**
```javascript
function CreateActivityModal({ project, flow, onClose, onCreate, initialOperatorId }) {
  const [title, setTitle] = useState('');
  const [deliverable, setDeliverable] = useState('');
  const [startingStageId, setStartingStageId] = useState('');
  
  const orderedStages = useMemo(() => getOrderedStages(flow), [flow]);
  
  useEffect(() => {
    // Set default starting stage
    if (initialOperatorId) {
      setStartingStageId(initialOperatorId);
    } else {
      const firstStage = getFirstActiveStage(orderedStages);
      setStartingStageId(firstStage ? getStageIdentity(firstStage) : '');
    }
  }, [initialOperatorId, orderedStages]);
  
  return (
    <Modal onClose={onClose} title="Create Activity">
      <div className="space-y-4">
        <div className="bg-blue-900/30 border border-blue-700/50 rounded p-4">
          <p className="text-sm text-gray-100">
            Activities start in a stage. The teams assigned to that stage can work on it.
          </p>
        </div>
        
        <div>
          <label className="block text-sm text-gray-200 mb-2">Activity name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Write article"
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-100 placeholder-gray-400"
            autoFocus
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-200 mb-2">Starting stage</label>
          <select
            value={startingStageId}
            onChange={(e) => setStartingStageId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-100"
          >
            {orderedStages.filter(s => !s.skipped).map(stage => (
              <option key={getStageIdentity(stage)} value={getStageIdentity(stage)}>
                {stage.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Teams assigned: {/* Show assigned teams */}
          </p>
        </div>
        
        <div>
          <label className="block text-sm text-gray-200 mb-2">Deliverable (optional)</label>
          <input
            type="text"
            value={deliverable}
            onChange={(e) => setDeliverable(e.target.value)}
            placeholder="e.g., 800-word article"
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-100 placeholder-gray-400"
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              if (title) onCreate(title, deliverable, { stageId: startingStageId });
            }}
            disabled={!title}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-2 rounded transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### 3.2 Update EditActivityModal

**Remove role selection.**

**New implementation:**
```javascript
function EditActivityModal({ project, activity, onClose, onUpdate }) {
  const [title, setTitle] = useState(activity?.title || '');
  const [deliverable, setDeliverable] = useState(activity?.deliverable || '');
  
  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDeliverable(activity.deliverable || '');
    }
  }, [activity]);
  
  return (
    <Modal onClose={onClose} title="Edit Activity">
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-200 mb-2">Activity name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Write article"
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-100 placeholder-gray-400"
            autoFocus
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-200 mb-2">Deliverable (optional)</label>
          <input
            type="text"
            value={deliverable}
            onChange={(e) => setDeliverable(e.target.value)}
            placeholder="e.g., 800-word article"
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-100 placeholder-gray-400"
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              if (title) onUpdate({ title, deliverable });
            }}
            disabled={!title}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-2 rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### 3.3 Update WireActivityModal

**Remove all role creation/selection logic when creating new activities.**

**In the "Create New" mode, update to:**
```javascript
// Remove role selection entirely
// Replace with starting stage selection

<div>
  <label className="block text-sm text-gray-200 mb-2">New activity starts at</label>
  <select
    value={newInitialStageId}
    onChange={(e) => setNewInitialStageId(e.target.value)}
    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-100"
  >
    <option value="">Choose...</option>
    {stageOptions.map(option => (
      <option key={option.id} value={option.id}>
        {option.name}{option.skipped ? ' (skipped)' : ''}
      </option>
    ))}
  </select>
</div>

<div>
  <label className="block text-sm text-gray-200 mb-2">New activity title</label>
  <input
    type="text"
    value={newTitle}
    onChange={(e) => setNewTitle(e.target.value)}
    placeholder="e.g., Review article"
    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-100 placeholder-gray-400"
  />
</div>

<div>
  <label className="block text-sm text-gray-200 mb-2">Deliverable (optional)</label>
  <input
    type="text"
    value={newDeliverable}
    onChange={(e) => setNewDeliverable(e.target.value)}
    placeholder="e.g., Reviewed draft"
    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-100 placeholder-gray-400"
  />
</div>

// Remove all role creation UI

<button
  onClick={() => {
    if (newTitle && newInitialStageId) {
      onCreate({
        title: newTitle,
        deliverable: newDeliverable,
        edgeType,
        srcStageId,
        dstStageId,
        initialStageId: newInitialStageId
      });
    }
  }}
  disabled={!newTitle || !newInitialStageId}
  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-2 rounded transition-colors"
>
  Create & Wire
</button>
```

### 3.4 Update ActivityCard Display

**Replace role display with team display:**

**Find:**
```javascript
{role && <div className="text-xs text-gray-300 mb-2">
  {role.name} • {role.userIds...}
</div>}
```

**Replace with:**
```javascript
{(() => {
  const teams = getStageTeams(flow, activity.currentStageId);
  if (teams.length === 0) return null;
  
  return (
    <div className="text-xs text-gray-300 mb-2">
      {teams.map(team => (
        <span key={team.id} className="inline-flex items-center gap-1 mr-2">
          <span className={`w-2 h-2 rounded-full bg-${team.color}-500`}></span>
          {team.name}
        </span>
      ))}
    </div>
  );
})()}
```

### 3.5 Create Team Management UI

**Add new modal component:**

```javascript
function ManageTeamsModal({ project, onClose, onCreateTeam, onUpdateTeam, onDeleteTeam }) {
  const [editingTeam, setEditingTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  
  const teams = project.teams || [];
  
  const toggleUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      onCreateTeam(newTeamName.trim(), selectedUserIds);
      setNewTeamName('');
      setSelectedUserIds([]);
    }
  };
  
  const handleUpdateTeam = () => {
    if (editingTeam && newTeamName.trim()) {
      onUpdateTeam(editingTeam.id, {
        name: newTeamName.trim(),
        userIds: selectedUserIds
      });
      setEditingTeam(null);
      setNewTeamName('');
      setSelectedUserIds([]);
    }
  };
  
  const startEdit = (team) => {
    setEditingTeam(team);
    setNewTeamName(team.name);
    setSelectedUserIds([...team.userIds]);
  };
  
  return (
    <Modal onClose={onClose} title="Manage Teams" size="large">
      <div className="space-y-6">
        <div className="bg-blue-900/30 border border-blue-700/50 rounded p-4">
          <p className="text-sm text-gray-100">
            Teams are groups of people who work together. Assign teams to stages in your flows.
          </p>
        </div>
        
        {/* Existing Teams */}
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Current Teams</h3>
          <div className="space-y-2">
            {teams.length === 0 ? (
              <p className="text-sm text-gray-500">No teams yet. Create one below.</p>
            ) : (
              teams.map(team => (
                <div
                  key={team.id}
                  className="flex items-center justify-between bg-gray-800 rounded px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${team.color}-500`}></div>
                      <span className="font-medium text-gray-100">{team.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {team.userIds.length} members:{' '}
                      {team.userIds
                        .map(uid => project.users.find(u => u.id === uid)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(team)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete team "${team.name}"?`)) {
                          onDeleteTeam(team.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Create/Edit Team Form */}
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            {editingTeam ? 'Edit Team' : 'Create New Team'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-200 mb-2">Team name</label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g., Writers, Editors, QA"
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-100 placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-200 mb-2">Team members</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {project.users.map(user => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded cursor-pointer hover:border-gray-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                    <span className="text-sm text-gray-100">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              {editingTeam && (
                <button
                  onClick={() => {
                    setEditingTeam(null);
                    setNewTeamName('');
                    setSelectedUserIds([]);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                disabled={!newTeamName.trim() || selectedUserIds.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-2 rounded transition-colors"
              >
                {editingTeam ? 'Update Team' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### 3.6 Add Team Management to Dashboard

**In `DashboardView`, add a button:**

```javascript
<button
  onClick={() => setShowModal('manageTeams')}
  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
>
  <UsersIcon className="w-4 h-4" />
  Manage Teams
</button>
```

**And in the modal switcher:**

```javascript
{showModal === 'manageTeams' && selectedProject && (
  <ManageTeamsModal
    project={selectedProject}
    onClose={() => setShowModal(null)}
    onCreateTeam={(name, userIds) => {
      createTeam(name, userIds);
    }}
    onUpdateTeam={updateTeam}
    onDeleteTeam={deleteTeam}
  />
)}
```

### 3.7 Add Stage Team Assignment UI

**In `ActivitiesView`, update the stage card to show team assignment:**

```javascript
<div className="flex flex-wrap gap-2 mt-3">
  <button
    onClick={() => {
      // Open team assignment modal
      setModalData({ projectId: project.id, flowId: flow.id, stageId: identity });
      setShowModal('assignStageTeams');
    }}
    className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
  >
    <UsersIcon className="w-3 h-3 inline mr-1" />
    Teams ({getStageTeams(flow, identity).length})
  </button>
  
  {/* Existing Conditions and Skip Stage buttons */}
</div>

{/* Show assigned teams */}
{(() => {
  const teams = getStageTeams(flow, identity);
  if (teams.length === 0) {
    return (
      <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-800/30 rounded px-2 py-1 mt-2">
        ⚠️ No teams assigned - no one can work on activities in this stage
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {teams.map(team => (
        <span
          key={team.id}
          className="inline-flex items-center gap-1 text-xs bg-gray-800/60 px-2 py-1 rounded"
        >
          <div className={`w-2 h-2 rounded-full bg-${team.color}-500`}></div>
          {team.name}
        </span>
      ))}
    </div>
  );
})()}
```

**Create new modal:**

```javascript
function AssignStageTeamsModal({ project, flow, stageId, onClose, onUpdate }) {
  const stageConfig = getFlowStageConfig(flow);
  const config = stageConfig.find(sc => sc.stageKey === stageId);
  const [selectedTeamIds, setSelectedTeamIds] = useState(config?.assignedTeamIds || []);
  const [selectedUserIds, setSelectedUserIds] = useState(config?.assignedUserIds || []);
  
  const teams = project.teams || [];
  const stage = getOrderedStages(flow).find(s => getStageIdentity(s) === stageId);
  
  const toggleTeam = (teamId) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };
  
  const toggleUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSave = () => {
    onUpdate(stageId, {
      assignedTeamIds: selectedTeamIds,
      assignedUserIds: selectedUserIds
    });
    onClose();
  };
  
  return (
    <Modal onClose={onClose} title={`Assign Teams: ${stage?.name}`} size="large">
      <div className="space-y-6">
        <div className="bg-blue-900/30 border border-blue-700/50 rounded p-4">
          <p className="text-sm text-gray-100">
            Choose which teams can work on activities when they reach this stage.
            You can also assign individual users if needed.
          </p>
        </div>
        
        {/* Team Assignment */}
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Assign Teams</h3>
          {teams.length === 0 ? (
            <p className="text-sm text-gray-500">
              No teams yet. Create teams in the dashboard.
            </p>
          ) : (
            <div className="space-y-2">
              {teams.map(team => (
                <label
                  key={team.id}
                  className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded cursor-pointer hover:border-gray-600"
                >
                  <input
                    type="checkbox"
                    checked={selectedTeamIds.includes(team.id)}
                    onChange={() => toggleTeam(team.id)}
                  />
                  <div className={`w-3 h-3 rounded-full bg-${team.color}-500`}></div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-100">{team.name}</div>
                    <div className="text-xs text-gray-400">
                      {team.userIds.length} members:{' '}
                      {team.userIds
                        .map(uid => project.users.find(u => u.id === uid)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        
        {/* Individual User Assignment (optional) */}
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            Or assign individual users
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            For small flows, you can skip teams and assign users directly.
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {project.users.map(user => (
              <label
                key={user.id}
                className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded cursor-pointer hover:border-gray-600"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                />
                <span className="text-sm text-gray-100">{user.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded transition-colors"
          >
            Save Assignment
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

**Add handler in EventOperator:**

```javascript
const updateStageTeamAssignment = (projectId, flowId, stageId, updates) => {
  setProjects(prev => prev.map(p => p.id === projectId ? {
    ...p,
    flows: p.flows.map(f => f.id === flowId ? {
      ...f,
      stageConfig: (f.stageConfig || []).map(sc => 
        sc.stageKey === stageId 
          ? { 
              ...sc, 
              assignedTeamIds: updates.assignedTeamIds || sc.assignedTeamIds || [],
              assignedUserIds: updates.assignedUserIds || sc.assignedUserIds || []
            }
          : sc
      )
    } : f)
  } : p));
};
```

---

## Phase 4: Update Function Call Signatures

### 4.1 Update all onCreate calls

**Find:**
```javascript
onCreate(title, roleId, deliverable)
```

**Replace with:**
```javascript
onCreate(title, deliverable, options)
// or
onCreate(title, deliverable)
```

### 4.2 Update all onWire onCreate calls

**Find:**
```javascript
onCreate({ title, roleId, deliverable, edgeType, srcStageId, dstStageId, initialStageId })
```

**Replace with:**
```javascript
onCreate({ title, deliverable, edgeType, srcStageId, dstStageId, initialStageId })
```

### 4.3 Remove onCreateRole and onUpdateRole props

**Find and remove from all modal prop lists:**
```javascript
onCreateRole={createRole}
onUpdateRole={updateRole}
```

---

## Phase 5: Add Migration for Existing Data

**Add this function to run once on load:**

```javascript
const migrateRolesToTeams = () => {
  setProjects(prev => prev.map(project => {
    // Skip if already has teams
    if (project.teams && project.teams.length > 0) return project;
    
    // Collect all unique roles from activities
    const roleMap = new Map();
    
    project.flows.forEach(flow => {
      flow.activities.forEach(activity => {
        if (activity.roleId) {
          const role = roles.find(r => r.id === activity.roleId);
          if (role && !roleMap.has(role.id)) {
            roleMap.set(role.id, role);
          }
        }
      });
    });
    
    // Convert roles to teams
    const teams = Array.from(roleMap.values()).map(role => ({
      id: role.id.replace('role-', 'team-'),
      name: role.name,
      userIds: role.userIds || [],
      color: ['blue', 'green', 'purple', 'orange'][Math.floor(Math.random() * 4)]
    }));
    
    return { ...project, teams };
  }));
  
  // Clear old roles state
  setRoles([]);
};

// Call on mount
useEffect(() => {
  migrateRolesToTeams();
}, []);
```

---

## Phase 6: Testing Checklist

After implementing, test these scenarios:

1. **Create a team**
   - Add users to team
   - Edit team membership
   - Delete team

2. **Assign team to stage**
   - Assign single team
   - Assign multiple teams
   - Remove team assignment

3. **Create activity**
   - Should not ask for role
   - Should start in correct stage
   - Should show assigned teams

4. **Claim activity**
   - User in assigned team can claim
   - User not in team cannot claim
   - Multiple teams on stage - both can claim

5. **Stage advancement**
   - Activity advances to next stage
   - Teams change appropriately
   - Previous team cannot claim anymore
   - New stage team can claim

6. **Wire activity**
   - Create new activity without role selection
   - Should use stage assignment

7. **Migration**
   - Existing projects load correctly
   - Old role data converts to teams

---

## Summary of Changes

**Removed:**
- `roles` state
- `createRole()`, `updateRole()` functions
- `roleId` from activities
- Role selection in CreateActivityModal
- Role selection in EditActivityModal
- Role creation in WireActivityModal
- `findStageForRole()` function

**Added:**
- `teams` array in project
- `createTeam()`, `updateTeam()`, `deleteTeam()` functions
- `assignedTeamIds` in stageConfig
- `getStageTeams()` helper
- `canUserWorkOnStage()` helper
- ManageTeamsModal component
- AssignStageTeamsModal component
- Team display in stage cards
- Team display in activity cards
- Migration function

**Modified:**
- `createActivity()` - removed roleId parameter
- `claimActivity()` - uses team-based permissions
- All activity modals - removed role UI
- Activity cards - show teams instead of roles
- Permission checks throughout

This refactor makes stages the central organizing principle, with teams defining who can work at each stage, creating clear accountability surfaces for each person.
