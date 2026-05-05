import { useState } from 'react'
import {
  API_KEY_STORAGE_KEY,
  MODEL_STORAGE_KEY,
  AVAILABLE_MODELS,
  getApiKey,
  getModel,
  type ModelId,
} from '../aiService'

export { getApiKey }

export default function Settings() {
  const [apiKey, setApiKey] = useState(getApiKey)
  const [model, setModel] = useState<ModelId>(getModel)
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim())
    localStorage.setItem(MODEL_STORAGE_KEY, model)
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

        <label htmlFor="model" style={{ display: 'block', marginTop: 24, marginBottom: 8 }}>
          Model
        </label>
        <select
          id="model"
          value={model}
          onChange={e => setModel(e.target.value as ModelId)}
          style={{ width: '100%', padding: '8px 12px', fontSize: 14, boxSizing: 'border-box' }}
        >
          {AVAILABLE_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>

        <button type="submit" style={{ marginTop: 16 }}>
          {saved ? 'Saved!' : 'Save'}
        </button>
      </form>
    </main>
  )
}
