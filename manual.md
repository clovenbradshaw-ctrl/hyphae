# Event Operator User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Getting Started](#getting-started)
4. [Working with Projects & Flows](#working-with-projects--flows)
5. [Managing Team Members](#managing-team-members)
6. [Creating Activities](#creating-activities)
7. [Understanding Activity States](#understanding-activity-states)
8. [Claiming Work & Priorities](#claiming-work--priorities)
9. [Wiring Activities Together](#wiring-activities-together)
10. [Completing Activities & Spawning Next Steps](#completing-activities--spawning-next-steps)
11. [The Revision Workflow](#the-revision-workflow)
12. [Coordination Patterns](#coordination-patterns)
13. [Tips & Best Practices](#tips--best-practices)
14. [Common Questions](#common-questions)
15. [Getting Help](#getting-help)

---

## Introduction

Event Operator is a coordination management system where **structure emerges through action**. Unlike traditional project management tools where you plan everything upfront, Event Operator lets you discover what needs to happen as you work.

The key insight: **Activities spawn new activities, dependencies compute states, and coordination patterns materialize organically.**

---

## Core Concepts

### The Nine Operators

Every activity in Event Operator is assigned to one of nine operator types. These represent different kinds of coordination work:

1. **Starter** - Designs and initiates work
2. **Doer** - Produces artifacts and outputs
3. **Connector** - Links work across contexts
4. **Reviewer** - Evaluates and segments quality
5. **Approver** - Alters state with authority
6. **Documenter** - Records and formalizes
7. **Convener** - Assembles people and resources
8. **Steward** - Supervises ongoing work
9. **Coordinator** - Orchestrates the next cycle

**Important:** These aren't rigid stages you must follow in order. They're semantic labels that help you understand what type of work is happening. Activities can appear in any order based on actual coordination needs.

### Roles

Roles connect people to operator types. A role has:
- A name (e.g., "Content Writer")
- An operator type (e.g., Doer)
- A list of people who can perform that role

You create roles as you need them. When you create an activity, you either pick an existing role or create a new one.

### Activities

Activities are units of work. Each activity has:
- A title (what needs to be done)
- A role (who does it and what operator type)
- An optional deliverable (what gets produced)
- A state (blocked, ready, in progress, or completed)
- Dependencies (what it's waiting on)

### Edges (Dependencies)

Edges connect activities and create the dependency graph. Two types:
- **Enables**: When activity A completes, it unlocks activity B
- **Requires**: Activity A depends on activity B completing first

There's also a special **loops** edge used for revision cycles.

### The State Machine

Activities automatically compute their state based on dependencies:
- **Ready** (green) - No dependencies, or all dependencies complete. Can be claimed.
- **Blocked** (yellow) - Has dependencies that aren't complete yet. Can't start.
- **In Progress** (blue) - Someone has claimed it and is working on it.
- **Completed** (gray) - The work is done.

You never manually set "blocked" or "ready" - the system figures it out from the dependency graph.

---

## Getting Started

### 1. Create Your First Project

When you first open Event Operator, you'll see the welcome screen.

**Fill in:**
- **Project name** - What are you coordinating? (e.g., "Marketing Campaign", "Product Launch")
- **Team members** - Comma-separated names (e.g., "alex, pat, sam")
- **Your name** - How you'll appear in the system

Click "Create Project" and you'll land in the Projects view.

### 2. Create Your First Flow

A flow represents one complete coordination cycle. Think of it as a container for related activities.

Click "New Flow" and define:
- **Flow name** - What's this cycle about? (e.g., "Newsletter Creation", "Q4 Planning")
- **Description** - Optional context
- **Deliverables (1-3)** - What will this flow produce? (e.g., "Published newsletter", "Social media assets", "Analytics report")

These deliverables are your north star - all activities in the flow contribute toward producing them.

### 3. Create Your First Activity

Click into a flow and you'll see the nine operator columns. Initially they're all empty.

Click "New Activity" to create your first piece of work.

**Step 1: Choose or Create a Role**
- If this is your first activity, you'll need to create a role
- Enter a role name (e.g., "Content Writer")
- Select the operator type that matches this work (e.g., Doer)
- Click "Create Role & Continue"

**Step 2: Define the Activity**
- Enter a title (e.g., "Write draft article")
- Optional: Enter what it delivers (e.g., "800-word draft")
- Click "Create"

Your activity appears in the appropriate operator column, with a green "Ready to start" badge.

---

## Working with Projects & Flows

### Navigating the Hierarchy

Event Operator has three levels:
1. **Projects** - Top level containers (e.g., "Marketing")
2. **Flows** - Coordination cycles within projects (e.g., "Newsletter Creation")
3. **Activities** - Discrete work items within flows (e.g., "Write article")

Use the back buttons to move up levels. Breadcrumbs show you where you are.

### Multiple Flows

A project can have many flows running simultaneously:
- Current week's newsletter
- Next month's planning
- Emergency response coordination

Each flow is independent with its own activities and dependency graph.

### Team Visibility

Everyone on the project team sees all flows and activities. When you create a role, you're automatically added to it, so you can claim activities in that role.

---

## Managing Team Members

Projects evolve, and so do the people involved. Use the **Manage Users** button in the project view to keep the roster accurate.

### Adding People Mid-Flight

1. Click **Manage Users** from the project header.
2. Enter the person's name in **Add New User**.
3. Click **Add**. The teammate is now available for role assignments.

### Removing People Who've Rolled Off

1. Open **Manage Users**.
2. Click **Remove** next to their name.
3. Existing activities stay assigned, but the person no longer appears for future role assignments.

### Why This Matters

- Roles draw from the current project roster when you assign people.
- Keeping the list accurate prevents accidental assignments to folks who are unavailable.
- You can adjust the team as often as needed—there's no penalty for updating the roster during a flow.

---

## Creating Activities

### When to Create Activities

You have two options for creating activities:

**Option 1: Create Upfront**
- You know some work needs to happen
- Click "New Activity" anytime
- Useful for establishing initial structure

**Option 2: Spawn on Completion**
- You just finished something and discovered what needs to happen next
- Use "Complete & Spawn Next" (covered later)
- This is the emergent structure approach

### The Role Decision

Every activity needs a role. Ask yourself:
1. **What type of work is this?** → Choose operator type
2. **Who does this kind of work?** → Name the role

**Examples:**
- Writing content → Doer → "Content Writer"
- Checking quality → Reviewer → "Editor"
- Final sign-off → Approver → "Director"
- Organizing meeting → Convener → "Project Manager"

### Reusing Roles

Once you've created a role, it's available for all activities in all flows. If you're creating another writing activity, just select the existing "Content Writer" role instead of creating a duplicate.

### Editing Activities After Creation

Made a typo or discovered a better framing? Click the **Edit** button on an activity card (pencil icon) while it's still active. You can update:

- The activity title
- The deliverable description
- The assigned role (pick an existing role or create a new one on the fly)

Edits keep the activity in place so you preserve its history and existing dependencies.

### Removing Activities You Don't Need

If an activity is no longer relevant, click the **Delete** button (trash icon). Deleting:

- Removes the activity card from the flow
- Cleans up any edges connected to it so nothing stays blocked

This action can't be undone, so use it when you're confident the work is obsolete.

---

## Understanding Activity States

### The Four States

**Ready (Green)**
- No dependencies blocking it
- Available for anyone in the role to claim
- Shows "Ready to start" badge

**Blocked (Yellow)**
- Has dependencies that aren't complete yet
- Shows "Blocked" badge
- Lists what it's "Waiting on" with bullet points
- Completed dependencies appear crossed out

**In Progress (Blue)**
- Someone has claimed it
- Shows "You" if it's yours, or the person's name
- Only the person who claimed it can complete it

**Completed (Gray)**
- Work is done
- Shows "✓ Done" badge
- Can't be modified (except for revision requests)
- Unblocks any activities that depended on it

### The AND Gate (Default)

When multiple activities point to one target activity, that target needs **ALL** of them to complete before it becomes ready.

**Example:**
```
Activity A ──┐
             ├──> Activity C (blocked until both A and B complete)
Activity B ──┘
```

This is called an AND gate. It happens automatically - you don't configure it.

### Watching State Changes

States update in real-time as you work:
1. You complete Activity A
2. Activity B's "Waiting on" list shows A as crossed out
3. If A was the last blocker, Activity B turns green (ready)

---

## Claiming Work & Priorities

### Claiming an Activity

When an activity is ready and you're on the assigned role, click **Claim** on the card. You'll choose a priority before confirming:

- **High – Focus** for urgent, time-sensitive work
- **Medium – Normal** for standard throughput (default)
- **Low – When available** for stretch items

The activity switches to **In Progress** with your name on it, so everyone knows who's driving.

### Changing Your Mind

Need to hand it back? Click **Unclaim** while it's still in progress. The activity returns to the ready pool and teammates can claim it again (they'll pick a fresh priority).

### Why Priorities Help

- They make expectations explicit when multiple ready items exist.
- The selection sticks with the activity while you're working, giving everyone shared context about the urgency you intended.
- You can always re-evaluate by unclaiming and reclaiming with a different priority if circumstances change.

---

## Wiring Activities Together

### What is Wiring?

Wiring creates edges (dependencies) between activities. It's how you say "this activity depends on that activity" or "completing this unlocks that."

### When to Wire

Wire activities when:
- You realize work needs to happen in a specific order
- You discover gaps in your coordination
- You want to create parallel branches that converge
- You're building out structure manually

### How to Wire

Click the chain link icon (🔗) on any activity card. You'll see two options:

**Wire to Existing Activity:**
1. Choose connection type:
   - **Enables** - This activity unlocks the other when complete
   - **Requires** - This activity depends on the other completing first
2. Select the target activity from the dropdown
3. Click "Wire"

**Create New & Wire:**
1. Switch to "Create New" tab
2. Choose connection type (enables/requires)
3. Enter the new activity title
4. Choose or create a role
5. Optional: add deliverable
6. Click "Create & Wire"

The new activity appears and is automatically connected.

### Enables vs Requires

These are two ways to express the same relationship:

**"A enables B"** = When A is done, B can start
**"B requires A"** = B can't start until A is done

Use whichever feels more natural for your mental model. The result is the same: a dependency from A to B.

### Creating Structure Just-in-Time

One of the most powerful patterns:
1. You're working on Activity A
2. You realize "oh, this needs another step after"
3. Click Wire on Activity A
4. "Create New" → make Activity B
5. Activity B is now blocked, waiting for A

No need to plan everything upfront. Discover structure as you go.

---

## Completing Activities & Spawning Next Steps

### Simple Completion

When you finish work on an activity you've claimed:
1. Click the "Complete" button
2. You'll see the completion modal
3. If you just want to mark it done, click "Complete"

The activity moves to completed state and unblocks anything waiting on it.

### Spawning the Next Activity

Often, completing work reveals what needs to happen next. That's when you use spawn:

1. Click "Complete" on your activity
2. Check "Spawn next activity (what does this enable?)"
3. Fill in the next activity:
   - Title (e.g., "Review article")
   - Role (choose existing or create new)
   - Optional deliverable
4. Click "Complete"

**What happens:**
- Current activity → completed
- New activity → created
- Edge automatically created: completed → new (enables)
- New activity appears in the appropriate operator column

### Sequential Discovery

This is how emergent structure works in practice:

```
Start → Create "Write draft" → Complete & spawn "Review draft" → 
Complete & spawn "Publish article" → Complete & spawn "Promote on social"
```

Each completion reveals the next step. You're not planning a gantt chart - you're flowing through coordination in real-time.

### When NOT to Spawn

Don't spawn when:
- The next step already exists as an activity
- Multiple things need to happen next (use Wire for branching)
- You're not sure what comes next yet (just complete it)

Spawning is for simple sequential chains. For complex structures, use Wire.

---

## The Revision Workflow

### Why Revisions are Special

In real coordination, work often needs refinement. A reviewer finds issues, an approver requests changes, and the work loops back.

Event Operator makes this natural without losing history.

### Who Can Request Revisions

Only **Reviewer** and **Approver** operator types can request revisions. These roles have a "Revise" button when completing activities.

### How to Request a Revision

1. You're completing a Reviewer or Approver activity
2. Instead of clicking "Complete", click "Revise"
3. The system automatically:
   - Spawns a new revision activity (e.g., "Write draft (revision)")
   - Tags it with 🔄 indicator
   - Creates a loops edge: Reviewer → Revision
   - Creates an enables edge: Revision → Reviewer
   - Your Reviewer activity becomes blocked again

### The Revision Cycle

Here's what a typical revision cycle looks like:

```
1. Doer completes "Write draft"
2. Reviewer becomes ready, claims it
3. Reviewer clicks "Revise" instead of "Complete"
4. New activity appears: "Write draft (revision)"
5. Original "Write draft" stays completed ✓
6. Reviewer shows "Waiting on: Write draft (revision)"
7. Someone claims and completes the revision
8. Reviewer becomes ready again
9. Reviewer completes normally (or requests another revision)
```

### Version History

Because each revision is a new activity, you maintain complete history:
- "Write draft" ✓ Done
- "Write draft (revision)" ✓ Done
- "Write draft (revision)" ✓ Done (second revision)

You can see how many times work cycled through refinement.

### Breaking the Loop

The loop ends when the Reviewer/Approver completes normally instead of requesting another revision. There's no "max revisions" - it's organic to the work.

---

## Coordination Patterns

### Pattern 1: Simple Sequential Flow

**Use when:** One thing leads to another in a straight line

**How to build:**
1. Create first activity or start with existing one
2. Complete & spawn next
3. Complete & spawn next
4. Repeat

**Example:**
```
Starter: "Plan article topics" →
Doer: "Write article" →
Reviewer: "Review article" →
Approver: "Approve for publishing" →
Documenter: "Archive to content library"
```

### Pattern 2: Parallel Branches

**Use when:** Multiple things can happen simultaneously

**How to build:**
1. Create parent activity (e.g., "Approve design direction")
2. Create multiple child activities
3. Wire parent to each child with "enables"
4. All children become ready when parent completes

**Example:**
```
Approver: "Approve design" ──┬──> Doer: "Build landing page"
                             ├──> Doer: "Create social graphics"
                             └──> Doer: "Write copy"
```

### Pattern 3: Converging Branches (AND Gate)

**Use when:** Multiple parallel work streams must complete before next step

**How to build:**
1. Create the parallel activities
2. Create the convergence activity (e.g., "Integrate all components")
3. Wire each parallel activity to convergence with "enables"
4. Convergence activity stays blocked until all complete

**Example:**
```
Doer: "Write section 1" ──┐
Doer: "Write section 2" ──┼──> Connector: "Integrate all sections"
Doer: "Write section 3" ──┘
```

### Pattern 4: Review Loop

**Use when:** Work needs quality gates with potential rework

**How to build:**
1. Doer activity → Wire enables → Reviewer activity
2. Claim and complete Doer
3. Claim Reviewer
4. If issues found: Click "Revise" (automatic loop creation)
5. If acceptable: Click "Complete" (moves forward)

**Example:**
```
Doer: "Write article" → Reviewer: "Review article"
                        ↓ (if revision needed)
              "Write article (revision)" ← loops back
```

### Pattern 5: Distribution After Approval

**Use when:** Authority decision triggers multiple distribution actions

**How to build:**
1. Create Approver activity
2. Wire to multiple downstream activities (Convener, Steward, etc.)
3. When approved, all distribution activities become ready

**Example:**
```
Approver: "Approve launch" ──┬──> Convener: "Schedule team meeting"
                             ├──> Documenter: "File compliance docs"
                             └──> Steward: "Monitor rollout"
```

### Pattern 6: Emergent Discovery

**Use when:** You don't know all the steps upfront

**How to build:**
1. Start with just one activity
2. Complete & spawn next step
3. Sometimes wire additional dependencies as you discover them
4. Let structure materialize through action

**Example:**
```
Start: "Research competitor landscape"
  → Complete, discover need for "Interview customers"
  → Complete, discover need for "Synthesize findings"
  → Complete, discover need for "Present to stakeholders"
  (Each step revealed by previous step)
```

---

## Tips & Best Practices

### Start Simple

Don't try to map out everything upfront. Create 1-2 initial activities and let structure emerge through completion and spawning.

### Use Descriptive Titles

Good: "Review article for SEO compliance"
Bad: "Review thing"

The title should make it obvious what needs to be done.

### Leverage Operator Types

The nine operator types help you think about coordination holistically:
- Starting work (Starter)
- Doing work (Doer, Connector)
- Quality gates (Reviewer, Approver)
- Recording (Documenter)
- Distribution (Convener, Steward)
- Planning next (Coordinator)

If you're not sure where to put an activity, think about what kind of coordination work it is.

### Create Roles That Match Your Team

Don't create generic roles like "Person 1". Create meaningful roles like:
- Content Writer
- Technical Reviewer
- Design Lead
- Project Coordinator

This makes it clear who should claim what.

### Watch the Dependency Lists

The "Waiting on" section is your coordination dashboard. If an activity is blocked by many things, that's a convergence point. If nothing is blocked, you might be missing dependencies.

### Use Wire for Complex Structures

Spawn is great for sequential discovery. Wire is great for:
- Creating parallel branches
- Adding dependencies to existing activities
- Building complex convergence patterns

### Revision is for Quality Gates Only

Don't use revision for general rework. Use it specifically when a Reviewer or Approver role is sending work back through a quality gate.

For other situations, just create new activities or use regular enables edges.

### Complete Activities Promptly

The system depends on completion events to unblock downstream work. If you've finished something, mark it complete so others can proceed.

### Don't Over-Structure

The power of Event Operator is emergence. Resist the urge to create 50 activities upfront. Create what you know about now, and let the rest reveal itself.

### Review State Badges Regularly

- Lots of green (ready) → good, work is available
- Lots of yellow (blocked) → might indicate over-planning or missing completions
- Lots of blue (in progress) → active work happening
- Growing gray (completed) → progress!

---

## Common Questions

**Q: Can I edit an activity after creating it?**
Yes. While the activity is still active, click the pencil icon to update its title, deliverable, or role assignment.

**Q: What if I claimed the wrong activity?**
Hit **Unclaim** and it will return to the ready pool so the right person can take it (or you can reclaim it with a different priority).

**Q: Can I change the priority after claiming?**
Yes. Unclaim the activity and claim it again with the priority that matches the new urgency.

**Q: Can activities have OR gates instead of AND gates?**
Not in the current version. All convergence points use AND gates (all dependencies must complete). This covers most real coordination patterns.

**Q: How do I delete an activity?**
Use the trash icon to remove it. This also clears any edges so nothing stays blocked by accident.

**Q: Can I work across multiple flows simultaneously?**
Yes! You can claim activities in different flows. Each flow's dependency graph is independent.

**Q: What happens if I wire in a circular dependency?**
The system doesn't prevent this, but it will create a situation where activities block each other. Use circular dependencies intentionally (like revision loops) and avoid accidental cycles.

**Q: Can I export or print the dependency graph?**
Not in the current version. The swimlane view shows you activities grouped by operator type, and each card shows its immediate dependencies.

**Q: How many activities can a flow have?**
There's no hard limit, but flows with 20-30 activities start to feel complex. Consider breaking into multiple flows if coordination gets unwieldy.

---

## Getting Help

Remember: Event Operator is designed for **emergent structure**. If you're feeling like you need to plan everything perfectly upfront, you're fighting the tool. 

Start small, complete things, spawn next steps, wire when you see patterns, and let coordination materialize through action.

The structure you need will reveal itself through the work.
