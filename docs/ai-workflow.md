# AI Coordination Workflow

## Pipeline Overview
1. **Ingest Events**: task updates, dependency changes, PR merges, issue state changes
2. **Build Project Graph**: tasks + dependencies + ownership + timelines
3. **Detect Blockers**: identify dependency violations and stalled tasks
4. **Predict Delays**: estimate critical path risk and milestone slip probability
5. **Balance Workloads**: spot overloaded or idle contributors
6. **Generate Explanations**: produce human-readable reasoning
7. **Recommend Actions**: suggest specific, low-friction interventions

## Explainable AI Logic
Every AI output must include:
- **Summary**: what’s happening
- **Rationale**: why the system believes this
- **Evidence**: source events, tasks, dependencies
- **Confidence**: low/medium/high
- **Next Actions**: minimal set of actions to resolve

## Example Output Structure
```
Risk: "Project Alpha likely to slip by 3 days"
Rationale: "Critical path tasks T12 → T19 are blocked by T7 (overdue)."
Evidence: "T7 overdue by 4 days; T12 assigned to same user; no dependency completion events."
Confidence: "medium"
Actions: ["Reassign T7", "Split T12", "Adjust milestone date"]
```

## AI Coordination Engine Inputs
- Task status and timestamps
- Dependency graph changes
- Assignee workload estimates
- Recent event log summaries
- Manual team feedback

## Safety and Guardrails
- AI suggestions are advisory, not enforced
- Always trace outputs to logged data
- No hidden changes; only explainable recommendations
