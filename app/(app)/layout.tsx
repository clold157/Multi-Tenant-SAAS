"use client"

import type React from "react"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { useMobile } from "@/hooks/use-mobile"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMobile()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
          <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-6 max-w-7xl">{children}</div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && <BottomNav />}
      </div>
    </div>
  )
}
