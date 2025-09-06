import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core"
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum"
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <DynamicContextProvider
          settings={{
            environmentId: "e17ad575-a790-4eb2-ab2d-55de883301cf",
            walletConnectors: [EthereumWalletConnectors],
            socialProviders: ['google'],
          }}
        >
          {children}
        </DynamicContextProvider>
        <Analytics />
      </body>
    </html>
  )
}
