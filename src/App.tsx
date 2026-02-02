import { useEffect } from 'react'

import { appName } from '@/lib/appConfig'
import AppRouter from '@/routes/AppRouter'

const App = () => {
  useEffect(() => {
    document.title = appName
  }, [])

  return <AppRouter />
}

export default App
