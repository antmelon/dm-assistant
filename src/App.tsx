import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import CampaignView from './pages/CampaignView'

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/campaigns/:campaignId/*" element={<CampaignView />} />
      </Routes>
    </BrowserRouter>
  )
}
