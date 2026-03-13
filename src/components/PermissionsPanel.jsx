import { useState, useRef } from 'react'
import './PermissionsPanel.css'

const RULE_REGION = 1
const RULE_TASK   = 2

const DEFAULT_VENDORS = [
  { id: 1, name: 'Vendor 1', email: 'vendor1@example.com', role: 'Manager'   },
  { id: 2, name: 'Vendor 2', email: 'vendor2@example.com', role: 'Analyst'   },
  { id: 3, name: 'Vendor 3', email: 'vendor3@example.com', role: 'Developer' },
  { id: 4, name: 'Vendor 4', email: 'vendor4@example.com', role: 'Member'    },
]

// vendorId -> { [RULE_REGION]: string, [RULE_TASK]: string }
const DEFAULT_PERMISSIONS = {
  1: { [RULE_REGION]: 'US', [RULE_TASK]: 'T01' },
  2: { [RULE_REGION]: 'EU', [RULE_TASK]: 'T02' },
  3: { [RULE_REGION]: 'US', [RULE_TASK]: 'T02' },
  4: { [RULE_REGION]: 'EU', [RULE_TASK]: 'T01' },
}

const DEFAULT_TASKS = [
  { id: 1, name: 'TASK-1', region_code: 'US', task_code: 'T01', is_valid: true,  assigned_to: null },
  { id: 2, name: 'TASK-2', region_code: 'EU', task_code: 'T02', is_valid: true,  assigned_to: null },
  { id: 3, name: 'TASK-3', region_code: 'US', task_code: 'T02', is_valid: false, assigned_to: null },
  { id: 4, name: 'TASK-4', region_code: 'EU', task_code: 'T01', is_valid: true,  assigned_to: null },
]

/* ── TextCell ─────────────────────────────────────────── */

function TextCell({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const inputRef = useRef()

  function start() { setDraft(value); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0) }
  function commit() { onChange(draft); setEditing(false) }
  function onKey(e) {
    if (e.key === 'Enter')  commit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="cell-text-input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
      />
    )
  }
  return (
    <div className="cell-text-display" onClick={start} title="Click to edit">
      {value ? <span className="cell-text-value">{value}</span> : <span className="cell-text-empty">—</span>}
    </div>
  )
}

/* ── Main component ───────────────────────────────────── */

export default function PermissionsPanel() {
  const [vendors,     setVendors]     = useState(DEFAULT_VENDORS)
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS)
  const [tasks,       setTasks]       = useState(DEFAULT_TASKS)

  // Add vendor form
  const [showAddVendor,  setShowAddVendor]  = useState(false)
  const [newVendorName,  setNewVendorName]  = useState('')
  const [newVendorEmail, setNewVendorEmail] = useState('')
  const [newVendorRole,  setNewVendorRole]  = useState('')

  // Add task form
  const [showAddTask,   setShowAddTask]   = useState(false)
  const [newTaskName,   setNewTaskName]   = useState('')
  const [newTaskRegion, setNewTaskRegion] = useState('')
  const [newTaskCode,   setNewTaskCode]   = useState('')
  const [newTaskValid,  setNewTaskValid]  = useState(true)

  // Vendor search
  const [search, setSearch] = useState('')

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase())
  )

  function setPermValue(vendorId, ruleId, value) {
    setPermissions(prev => ({
      ...prev,
      [vendorId]: { ...prev[vendorId], [ruleId]: value },
    }))
  }

  /* ── Vendor CRUD ── */

  function addVendor() {
    if (!newVendorName.trim()) return
    const id = Date.now()
    setVendors(prev => [...prev, {
      id,
      name:  newVendorName.trim(),
      email: newVendorEmail.trim(),
      role:  newVendorRole.trim() || 'Member',
    }])
    setPermissions(prev => ({ ...prev, [id]: { [RULE_REGION]: '', [RULE_TASK]: '' } }))
    setNewVendorName(''); setNewVendorEmail(''); setNewVendorRole('')
    setShowAddVendor(false)
  }

  function removeVendor(vendorId) {
    setVendors(prev => prev.filter(v => v.id !== vendorId))
    setPermissions(prev => { const n = { ...prev }; delete n[vendorId]; return n })
    setTasks(prev => prev.map(t => t.assigned_to === vendorId ? { ...t, assigned_to: null } : t))
  }

  /* ── Task CRUD ── */

  function addTask() {
    if (!newTaskName.trim()) return
    const id = Date.now()
    setTasks(prev => [...prev, {
      id,
      name:        newTaskName.trim(),
      region_code: newTaskRegion.trim(),
      task_code:   newTaskCode.trim(),
      is_valid:    newTaskValid,
      assigned_to: null,
    }])
    setNewTaskName(''); setNewTaskRegion(''); setNewTaskCode(''); setNewTaskValid(true)
    setShowAddTask(false)
  }

  function removeTask(taskId) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  function updateTask(taskId, field, value) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t))
  }

  /* ── Auto-assign ── */

  function autoAssign() {
    setTasks(prev => prev.map(task => {
      if (!task.is_valid) return { ...task, assigned_to: null }
      const matches = vendors.filter(v =>
        (permissions[v.id]?.[RULE_REGION] || '') === task.region_code &&
        (permissions[v.id]?.[RULE_TASK]   || '') === task.task_code
      )
      const pick = matches.length ? matches[Math.floor(Math.random() * matches.length)] : null
      return { ...task, assigned_to: pick ? pick.id : null }
    }))
  }

  const validCount    = tasks.filter(t => t.is_valid).length
  const assignedCount = tasks.filter(t => t.assigned_to !== null).length

  return (
    <div className="panels-container">

      {/* ══ Vendors Panel ══════════════════════════════════ */}
      <div className="panel">
        <div className="section-title">Vendors</div>

        <div className="toolbar">
          <div className="toolbar-left">
            <input
              className="search-input"
              placeholder="Search vendors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={() => { setShowAddVendor(v => !v); setShowAddTask(false) }}>
              + Add Vendor
            </button>
          </div>
        </div>

        {showAddVendor && (
          <div className="inline-form">
            <span className="form-label">New Vendor</span>
            <input placeholder="Name *"                   value={newVendorName}  onChange={e => setNewVendorName(e.target.value)} />
            <input placeholder="Email"                    value={newVendorEmail} onChange={e => setNewVendorEmail(e.target.value)} />
            <input placeholder="Role (default: Member)"   value={newVendorRole}  onChange={e => setNewVendorRole(e.target.value)} />
            <button className="btn btn-primary" onClick={addVendor}>Add</button>
            <button className="btn btn-ghost"   onClick={() => setShowAddVendor(false)}>Cancel</button>
          </div>
        )}

        <div className="stats-bar">
          <span>{vendors.length} vendors</span>
        </div>

        <div className="table-wrapper">
          <table className="permissions-table">
            <thead>
              <tr>
                <th className="col-user sticky-col">
                  <div className="th-inner">VENDOR</div>
                </th>
                <th className="col-meta sticky-col-2">
                  <div className="th-inner" style={{ justifyContent: 'center' }}>ROLE</div>
                </th>
                <th className="col-rule col-rule-text">
                  <div className="th-inner" style={{ justifyContent: 'center' }}>REGION CODE</div>
                </th>
                <th className="col-rule col-rule-text">
                  <div className="th-inner" style={{ justifyContent: 'center' }}>TASK CODE</div>
                </th>
                <th className="col-actions"><div className="th-inner" /></th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">No vendors found. Add one above.</td>
                </tr>
              )}
              {filteredVendors.map((vendor, idx) => (
                <tr key={vendor.id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td className="col-user sticky-col">
                    <div className="user-cell">
                      <span className="user-avatar">{vendor.name[0].toUpperCase()}</span>
                      <div className="user-info">
                        <span className="user-name">{vendor.name}</span>
                        <span className="user-email">{vendor.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="col-meta sticky-col-2" style={{ textAlign: 'center' }}>
                    <span className="role-badge">{vendor.role}</span>
                  </td>
                  <td className="col-rule-cell col-rule-cell-text">
                    <TextCell
                      value={permissions[vendor.id]?.[RULE_REGION] || ''}
                      onChange={v => setPermValue(vendor.id, RULE_REGION, v)}
                    />
                  </td>
                  <td className="col-rule-cell col-rule-cell-text">
                    <TextCell
                      value={permissions[vendor.id]?.[RULE_TASK] || ''}
                      onChange={v => setPermValue(vendor.id, RULE_TASK, v)}
                    />
                  </td>
                  <td className="col-actions">
                    <div className="actions-cell">
                      <button className="tiny-btn tiny-btn-danger" onClick={() => removeVendor(vendor.id)} title="Remove vendor">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ Tasks Panel ════════════════════════════════════ */}
      <div className="panel">
        <div className="section-title">Tasks</div>

        <div className="toolbar">
          <div className="toolbar-left">
            <span className="stats-inline">
              <span>{tasks.length} tasks</span>
              <span className="dot">·</span>
              <span>{validCount} valid</span>
              <span className="dot">·</span>
              <span>{assignedCount} assigned</span>
            </span>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-unassign" onClick={() => setTasks(prev => prev.map(t => ({ ...t, assigned_to: null })))}>Unassign All</button>
            <button className="btn btn-assign" onClick={autoAssign}>⚡ Auto-assign</button>
            <button className="btn btn-primary" onClick={() => { setShowAddTask(v => !v); setShowAddVendor(false) }}>
              + Add Task
            </button>
          </div>
        </div>

        {showAddTask && (
          <div className="inline-form">
            <span className="form-label">New Task</span>
            <input placeholder="Task name *" value={newTaskName}   onChange={e => setNewTaskName(e.target.value)} />
            <input placeholder="Region Code" value={newTaskRegion} onChange={e => setNewTaskRegion(e.target.value)} />
            <input placeholder="Task Code"   value={newTaskCode}   onChange={e => setNewTaskCode(e.target.value)} />
            <label className="valid-toggle">
              <input type="checkbox" checked={newTaskValid} onChange={e => setNewTaskValid(e.target.checked)} />
              <span>Valid</span>
            </label>
            <button className="btn btn-primary" onClick={addTask}>Add</button>
            <button className="btn btn-ghost"   onClick={() => setShowAddTask(false)}>Cancel</button>
          </div>
        )}

        <div className="table-wrapper">
          <table className="permissions-table">
            <thead>
              <tr>
                <th className="col-task">
                  <div className="th-inner">TASK</div>
                </th>
                <th className="col-code">
                  <div className="th-inner" style={{ justifyContent: 'center' }}>REGION CODE</div>
                </th>
                <th className="col-code">
                  <div className="th-inner" style={{ justifyContent: 'center' }}>TASK CODE</div>
                </th>
                <th className="col-valid">
                  <div className="th-inner" style={{ justifyContent: 'center' }}>IS VALID</div>
                </th>
                <th className="col-assigned">
                  <div className="th-inner" style={{ justifyContent: 'center' }}>ASSIGNED TO</div>
                </th>
                <th className="col-actions"><div className="th-inner" /></th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">No tasks. Add one above.</td>
                </tr>
              )}
              {tasks.map((task, idx) => {
                const assignedVendor = vendors.find(v => v.id === task.assigned_to)
                return (
                  <tr
                    key={task.id}
                    className={`${idx % 2 === 0 ? 'row-even' : 'row-odd'} ${!task.is_valid ? 'row-invalid' : ''}`}
                  >
                    <td className="col-task">
                      <TextCell value={task.name} onChange={v => updateTask(task.id, 'name', v)} />
                    </td>
                    <td className="col-code col-rule-cell col-rule-cell-text">
                      <TextCell value={task.region_code} onChange={v => updateTask(task.id, 'region_code', v)} />
                    </td>
                    <td className="col-code col-rule-cell col-rule-cell-text">
                      <TextCell value={task.task_code} onChange={v => updateTask(task.id, 'task_code', v)} />
                    </td>
                    <td className="col-valid" style={{ textAlign: 'center' }}>
                      <button
                        className={`valid-btn ${task.is_valid ? 'valid-btn-yes' : 'valid-btn-no'}`}
                        onClick={() => updateTask(task.id, 'is_valid', !task.is_valid)}
                        title="Click to toggle"
                      >
                        {task.is_valid ? '✓ Valid' : '✕ Invalid'}
                      </button>
                    </td>
                    <td className="col-assigned" style={{ textAlign: 'center' }}>
                      {assignedVendor
                        ? (
                          <span className="assigned-badge">
                            {assignedVendor.name}
                            <button
                              className="assigned-remove"
                              onClick={() => updateTask(task.id, 'assigned_to', null)}
                              title="Remove assignment"
                            >×</button>
                          </span>
                        )
                        : <span className="unassigned-badge">Unassigned</span>
                      }
                    </td>
                    <td className="col-actions">
                      <div className="actions-cell">
                        <button className="tiny-btn tiny-btn-danger" onClick={() => removeTask(task.id)} title="Remove task">✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
