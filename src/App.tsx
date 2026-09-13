import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Dialogues from './pages/Dialogues'
import DialogueDetail from './pages/DialogueDetail'
import Words from './pages/Words'
import WordDetail from './pages/WordDetail'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="practice" element={<Practice />} />
        <Route path="dialogues" element={<Dialogues />} />
        <Route path="dialogues/:id" element={<DialogueDetail />} />
        <Route path="words" element={<Words />} />
        <Route path="words/:char" element={<WordDetail />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
