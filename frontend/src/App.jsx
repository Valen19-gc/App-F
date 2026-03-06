import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Players from './pages/Players'
import Tournament from './pages/Tournament'
import TournamentDetail from './pages/TournamentDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="players" element={<Players />} />
          <Route path="tournament" element={<Tournament />} />
          <Route path="tournament/:id" element={<TournamentDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
