import { useState, useRef } from 'react'
import './PermissionsPanel.css'

// Rule types: 'check' | 'text' | 'multi'
const DEFAULT_RULES = [
  { id: 1, name: 'Can manage ABC', category: 'Management', type: 'check' },
  { id: 2, name: 'Can view reports',  category: 'Reports',    type: 'check' },
  { id: 3, name: 'Access level',      category: 'Finance',    type: 'text'  },
  { id: 4, name: 'Regions',           category: 'Admin',      type: 'multi' },
]

const DEFAULT_USERS = [
  { id: 1, name: 'Bob',    email: 'bob@example.com',    role: 'Manager'   },
  { id: 2, name: 'Alice',  email: 'alice@example.com',  role: 'Analyst'   },
  { id: 3, name: 'Carlos', email: 'carlos@example.com', role: 'Developer' },
]

// userId -> ruleId -> null (unset) | true (granted) | false (denied) | string | string[]
const DEFAULT_PERMISSIONS = {
  1: { 1: true,  2: true,  3: 'Admin',     4: ['US', 'EU'] },
  2: { 1: false, 2: true,  3: 'Read-only', 4: ['US']       },
  3: { 1: null,  2: false, 3: '',          4: []           },
}

const TYPE_LABELS = { check: 'Checkmark', text: 'Text', multi: 'Multi-value' }
const TYPE_ICONS  = { check: '✓', text: 'Aa', multi: '⊞' }

function emptyValue(type) {
  if (type === 'check') return null
  if (type === 'text')  return ''
  return []
}

// Cycle: null (—) → true (✓) → false (✗) → null (—)
function nextCheckValue(v) {
  if (v === null || v === undefined) return true
  if (v === true)  return false
  return null
}

// How many rules are "set" for a user (used in the GRANTED counter)
function countSet(permissions, userId, rules) {
  return rules.reduce((acc, rule) => {
    const v = permissions[userId]?.[rule.id]
    if (rule.type === 'check') return acc + (v === true ? 1 : 0)
    if (rule.type === 'text')  return acc + (v && v.trim() ? 1 : 0)
    if (rule.type === 'multi') return acc + (Array.isArray(v) && v.length ? 1 : 0)
    return acc
  }, 0)
}

/* ── Cell components ─────────────────────────────────── */

function CheckCell({ value, onChange }) {
  const cls = value === true ? 'perm-on' : value === false ? 'perm-deny' : 'perm-off'
  const label = value === true ? '✓' : value === false ? '✕' : '—'
  const tip = value === true ? 'Granted — click to deny' : value === false ? 'Denied — click to clear' : 'Unset — click to grant'
  return (
    <button className={`perm-toggle ${cls}`} onClick={() => onChange(nextCheckValue(value))} title={tip}>
      {label}
    </button>
  )
}

function TextCell({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const inputRef = useRef()

  function start() {
    setDraft(value)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }
  function commit() {
    onChange(draft)
    setEditing(false)
  }
  function onKey(e) {
    if (e.key === 'Enter') commit()
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

function MultiCell({ value = [], onChange }) {
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef()

  function addTag() {
    const trimmed = inputVal.trim()
    if (!trimmed || value.includes(trimmed)) { setInputVal(''); return }
    onChange([...value, trimmed])
    setInputVal('')
  }
  function removeTag(tag) {
    onChange(value.filter(t => t !== tag))
  }
  function onKey(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !inputVal && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="cell-multi" onClick={() => inputRef.current?.focus()}>
      {value.map(tag => (
        <span key={tag} className="cell-tag">
          {tag}
          <button className="cell-tag-remove" onClick={e => { e.stopPropagation(); removeTag(tag) }}>×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="cell-multi-input"
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={onKey}
        onBlur={addTag}
        placeholder={value.length ? '' : 'Add…'}
      />
    </div>
  )
}

/* ── Main component ──────────────────────────────────── */

export default function PermissionsPanel() {
  const [users,       setUsers]       = useState(DEFAULT_USERS)
  const [rules,       setRules]       = useState(DEFAULT_RULES)
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS)

  const [newUserName,  setNewUserName]  = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole,  setNewUserRole]  = useState('')
  const [showAddUser,  setShowAddUser]  = useState(false)

  const [newRuleName,     setNewRuleName]     = useState('')
  const [newRuleCategory, setNewRuleCategory] = useState('')
  const [newRuleType,     setNewRuleType]     = useState('check')
  const [showAddRule,     setShowAddRule]      = useState(false)

  const [search,         setSearch]         = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  const categories   = ['All', ...new Set(rules.map(r => r.category))]
  const filteredRules = filterCategory === 'All' ? rules : rules.filter(r => r.category === filterCategory)
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  function setPermValue(userId, ruleId, value) {
    setPermissions(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [ruleId]: value },
    }))
  }

  function addUser() {
    if (!newUserName.trim()) return
    const id = Date.now()
    setUsers(prev => [...prev, { id, name: newUserName.trim(), email: newUserEmail.trim(), role: newUserRole.trim() || 'Member' }])
    const initial = {}
    rules.forEach(r => { initial[r.id] = emptyValue(r.type) })
    setPermissions(prev => ({ ...prev, [id]: initial }))
    setNewUserName(''); setNewUserEmail(''); setNewUserRole('')
    setShowAddUser(false)
  }

  function removeUser(userId) {
    setUsers(prev => prev.filter(u => u.id !== userId))
    setPermissions(prev => { const n = { ...prev }; delete n[userId]; return n })
  }

  function addRule() {
    if (!newRuleName.trim()) return
    const id = Date.now()
    const rule = { id, name: newRuleName.trim(), category: newRuleCategory.trim() || 'Custom', type: newRuleType }
    setRules(prev => [...prev, rule])
    setPermissions(prev => {
      const n = { ...prev }
      Object.keys(n).forEach(uid => { n[uid] = { ...n[uid], [id]: emptyValue(newRuleType) } })
      return n
    })
    setNewRuleName(''); setNewRuleCategory(''); setNewRuleType('check')
    setShowAddRule(false)
  }

  function removeRule(ruleId) {
    setRules(prev => prev.filter(r => r.id !== ruleId))
    setPermissions(prev => {
      const n = { ...prev }
      Object.keys(n).forEach(uid => { const c = { ...n[uid] }; delete c[ruleId]; n[uid] = c })
      return n
    })
  }

  function grantAll(userId) {
    const all = {}
    rules.forEach(r => { all[r.id] = r.type === 'check' ? true : permissions[userId]?.[r.id] ?? emptyValue(r.type) })
    setPermissions(prev => ({ ...prev, [userId]: all }))
  }

  function revokeAll(userId) {
    const none = {}
    rules.forEach(r => { none[r.id] = emptyValue(r.type) }) // check → null, text → '', multi → []
    setPermissions(prev => ({ ...prev, [userId]: none }))
  }

  const totalGrants = Object.keys(permissions).reduce((acc, uid) =>
    acc + countSet(permissions, Number(uid), rules), 0)

  return (
    <div className="panel">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="search-input"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="category-filter" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-secondary" onClick={() => { setShowAddRule(true); setShowAddUser(false) }}>+ Add Rule</button>
          <button className="btn btn-primary"   onClick={() => { setShowAddUser(true); setShowAddRule(false) }}>+ Add User</button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <div className="inline-form">
          <span className="form-label">New User</span>
          <input placeholder="Name *"                    value={newUserName}  onChange={e => setNewUserName(e.target.value)} />
          <input placeholder="Email"                     value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
          <input placeholder="Role (default: Member)"    value={newUserRole}  onChange={e => setNewUserRole(e.target.value)} />
          <button className="btn btn-primary" onClick={addUser}>Add</button>
          <button className="btn btn-ghost"   onClick={() => setShowAddUser(false)}>Cancel</button>
        </div>
      )}

      {/* Add Rule Form */}
      {showAddRule && (
        <div className="inline-form">
          <span className="form-label">New Rule</span>
          <input placeholder="Rule name *"                    value={newRuleName}     onChange={e => setNewRuleName(e.target.value)} />
          <input placeholder="Category (default: Custom)"     value={newRuleCategory} onChange={e => setNewRuleCategory(e.target.value)} />
          <div className="type-selector">
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`type-btn ${newRuleType === key ? 'type-btn-active' : ''}`}
                onClick={() => setNewRuleType(key)}
                title={label}
              >
                <span className="type-btn-icon">{TYPE_ICONS[key]}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={addRule}>Add</button>
          <button className="btn btn-ghost"   onClick={() => setShowAddRule(false)}>Cancel</button>
        </div>
      )}

      {/* Stats bar */}
      <div className="stats-bar">
        <span>{users.length} users</span>
        <span className="dot">·</span>
        <span>{rules.length} rules</span>
        <span className="dot">·</span>
        <span>{totalGrants} total grants</span>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="permissions-table">
          <thead>
            <tr>
              <th className="col-user sticky-col">
                <div className="th-inner"><span>USER</span></div>
              </th>
              <th className="col-meta sticky-col-2">
                <div className="th-inner" style={{justifyContent:'center'}}>ROLE</div>
              </th>
              <th className="col-granted sticky-col-3">
                <div className="th-inner">GRANTED</div>
              </th>
              {filteredRules.map(rule => (
                <th key={rule.id} className={`col-rule col-rule-${rule.type}`}>
                  <div className="rule-header">
                    <div className="rule-header-top">
                      <span className="rule-category">{rule.category}</span>
                      <span className="rule-type-badge" title={TYPE_LABELS[rule.type]}>
                        {TYPE_ICONS[rule.type]}
                      </span>
                      <button className="remove-btn" onClick={() => removeRule(rule.id)} title="Remove rule">×</button>
                    </div>
                    <span className="rule-name" title={rule.name}>{rule.name}</span>
                    <span className="rule-type-label">{TYPE_LABELS[rule.type]}</span>
                  </div>
                </th>
              ))}
              <th className="col-add-rule">
                <button className="add-rule-col-btn" onClick={() => { setShowAddRule(true); setShowAddUser(false) }}>
                  + Rule
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={filteredRules.length + 4} className="empty-row">No users found. Add one above.</td>
              </tr>
            )}
            {filteredUsers.map((user, idx) => (
              <tr key={user.id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                <td className="col-user sticky-col">
                  <div className="user-cell">
                    <span className="user-avatar">{user.name[0].toUpperCase()}</span>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="col-meta sticky-col-2" style={{textAlign:'center'}}>
                  <span className="role-badge">{user.role}</span>
                </td>
                <td className="col-granted sticky-col-3">
                  <div className="grant-actions">
                    <span className="grant-count">{countSet(permissions, user.id, rules)}/{rules.length}</span>
                    <button className="tiny-btn"            onClick={() => grantAll(user.id)}   title="Grant all checkmarks">All</button>
                    <button className="tiny-btn tiny-btn-red"    onClick={() => revokeAll(user.id)} title="Clear all">None</button>
                    <button className="tiny-btn tiny-btn-danger" onClick={() => removeUser(user.id)} title="Remove user">✕</button>
                  </div>
                </td>
                {filteredRules.map(rule => {
                  const value = permissions[user.id]?.[rule.id] ?? emptyValue(rule.type)
                  const isSet =
                    rule.type === 'check' ? value === true :
                    rule.type === 'text'  ? !!(value && value.trim()) :
                    Array.isArray(value) && value.length > 0

                  return (
                    <td key={rule.id} className={`col-rule-cell col-rule-cell-${rule.type} ${isSet ? 'granted' : ''}`}>
                      {rule.type === 'check' && (
                        <CheckCell value={value} onChange={v => setPermValue(user.id, rule.id, v)} />
                      )}
                      {rule.type === 'text' && (
                        <TextCell value={value} onChange={v => setPermValue(user.id, rule.id, v)} />
                      )}
                      {rule.type === 'multi' && (
                        <MultiCell value={value} onChange={v => setPermValue(user.id, rule.id, v)} />
                      )}
                    </td>
                  )
                })}
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel-footer">
        Checkmark: click to toggle · Text: click cell to edit · Multi-value: type + Enter to add tags
      </div>
    </div>
  )
}
