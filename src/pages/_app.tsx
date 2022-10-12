import type { AppProps } from 'next/app'
import '../styles/global.scss'
import { Header } from '../components/Header'
import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'
function MyApp({ Component, pageProps }: AppProps<{ session: Session }>) {
  return (
    <SessionProvider session={pageProps.session}>
      <Header />
      <Component {...pageProps} />
    </SessionProvider>
  )
}

export default MyApp
