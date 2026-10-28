import { useEffect, useState } from 'react'
import { decodePayload } from './lib/payload'
import CreatePage from './pages/CreatePage'
import ReceiverPage from './pages/ReceiverPage'

function readParam() {
  return new URLSearchParams(window.location.search).get('v')
}

export default function App() {
  const [v, setV] = useState<string | null>(readParam)

  // 뒤로가기 / 앞으로가기 대응
  useEffect(() => {
    const onPop = () => setV(readParam())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (v === null) return <CreatePage />
  return <ReceiverPage payload={decodePayload(v)} />
}
