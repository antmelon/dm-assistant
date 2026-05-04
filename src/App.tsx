import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import CampaignView from './pages/CampaignView'
import SessionView from './pages/SessionView'

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/campaigns/:campaignId" element={<CampaignView />} />
        <Route path="/campaigns/:campaignId/sessions/:sessionId" element={<SessionView />} />
      </Routes>
    </BrowserRouter>
  )
}
