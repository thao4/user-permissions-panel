import PermissionsPanel from './components/PermissionsPanel'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo-icon">⚡</span>
          <h1>User Permissions Control Panel</h1>
        </div>
        <span className="header-badge">Admin View</span>
      </header>
      <main>
        <PermissionsPanel />
      </main>
    </div>
  )
}

export default App
