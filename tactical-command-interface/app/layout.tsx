import type React from "react"
import type { Metadata } from "next"
import { Geist_Mono as GeistMono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const geistMono = GeistMono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TopDash - Server Monitoring Dashboard",
  description: "Server monitoring and infrastructure management dashboard",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <html lang="es">
        <body className={`${geistMono.className} bg-black text-white antialiased`}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
