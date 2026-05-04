import { useState } from 'react'

const API_KEY_STORAGE_KEY = 'claude-api-key'

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? ''
}

export default function Settings() {
  const [apiKey, setApiKey] = useState(getApiKey)
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <main style={{ maxWidth: 480, margin: '64px auto', padding: '0 24px' }}>
      <h1>Settings</h1>
      <form onSubmit={handleSave}>
        <label htmlFor="api-key" style={{ display: 'block', marginBottom: 8 }}>
          Claude API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          style={{ width: '100%', padding: '8px 12px', fontSize: 14, boxSizing: 'border-box' }}
        />
        <button type="submit" style={{ marginTop: 16 }}>
          {saved ? 'Saved!' : 'Save'}
        </button>
      </form>
    </main>
  )
}
