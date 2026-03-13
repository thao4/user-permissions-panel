# Vendor Task Assignment Panel

A React demo application for managing vendors and assigning tasks to them based on matching rules.

## What it does

The app has two sections:

### Vendors
A table of vendors, each with a **Region Code** and **Task Code** rule. These two fields determine which tasks a vendor is eligible to receive. You can:
- Add and remove vendors
- Edit a vendor's Region Code and Task Code inline (click any cell to edit)

### Tasks
A table of tasks, each with the following attributes:
- **Task** — the task name (editable inline)
- **Region Code** — the region the task belongs to (editable inline)
- **Task Code** — the task type code (editable inline)
- **Is Valid** — whether the task is eligible for assignment (click to toggle)
- **Assigned To** — which vendor the task is assigned to

You can add and remove tasks. Invalid tasks are visually dimmed and cannot be assigned.

## Auto-assign

The **Auto-assign** button matches each valid task to a vendor by comparing:

```
task.region_code === vendor.region_code  AND  task.task_code === vendor.task_code
```

- If one vendor matches, the task is assigned to them.
- If multiple vendors match, one is picked at random.
- If no vendor matches, the task remains unassigned.
- Invalid tasks are always left unassigned.

The **Unassign All** button clears all assignments at once. Individual assignments can also be removed using the × on each assigned badge.

## Running locally

```bash
npm install
npm run dev
```
