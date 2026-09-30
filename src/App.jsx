import AuthPage from './AuthPage.jsx'
import BuyerPage from './BuyerPage.jsx'
import Landing from './Landing.jsx'
import SellerPage from './SellerPage.jsx'
import { useRoute } from './router.js'

// The first screen asks whether to continue as a seller or a buyer and goes straight
// to that page. The login pages below are built but not linked yet: they come back
// once accounts are connected. Unknown addresses fall back to the first screen.
export default function App() {
  const route = useRoute()

  if (route === '/seller/login') return <AuthPage role="seller" />
  if (route === '/buyer/login') return <AuthPage role="buyer" />
  if (route === '/seller') return <SellerPage />
  if (route === '/buyer') return <BuyerPage />
  return <Landing />
}
