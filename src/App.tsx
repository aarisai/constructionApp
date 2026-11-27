import { Component, useEffect, useState, type ReactNode } from 'react'
import { Shell } from './components/Shell'
import { StoreProvider } from './context/Store'
import { ThemeProvider } from './context/Theme'
import { parseHash, type Route } from './lib/routes'
import { Dashboard } from './pages/Dashboard'
import { OwnerReport } from './pages/OwnerReport'
import { Reports } from './pages/Reports'
import { SiteDetail } from './pages/SiteDetail'
import { SiteForm } from './pages/SiteForm'
import { Sites } from './pages/Sites'
import { VendorDetail } from './pages/VendorDetail'
import { Vendors } from './pages/Vendors'

export default function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <AppErrorBoundary>
          <Routed />
        </AppErrorBoundary>
      </StoreProvider>
    </ThemeProvider>
  )
}

function Routed() {
  const route = useRoute()
  return (
    <Shell route={route}>
      <RouteView route={route} />
    </Shell>
  )
}

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Dashboard />
    case 'sites':
      return <Sites />
    case 'site-new':
      return <SiteForm />
    case 'site':
      return <SiteDetail id={route.id} tab={route.tab} />
    case 'site-edit':
      return <SiteForm siteId={route.id} />
    case 'vendors':
      return <Vendors />
    case 'vendor':
      return <VendorDetail id={route.id} />
    case 'reports':
      return <Reports />
    case 'owner-report':
      return <OwnerReport id={route.id} />
  }
}

function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const sync = () => setHash(window.location.hash)
    window.addEventListener('hashchange', sync)
    if (!window.location.hash) window.location.replace('#/')
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [hash])
  return parseHash(hash)
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null }

  static getDerivedStateFromError(error: Error) {
    return { message: error.message }
  }

  render() {
    if (this.state.message) {
      return (
        <div className="mx-auto max-w-lg px-6 py-16 text-ink">
          <h1 className="font-display text-3xl">Something went wrong</h1>
          <p className="mt-2 text-muted">Reload this page. Your saved sites are still on this phone.</p>
          <p className="mt-3 text-sm">{this.state.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
