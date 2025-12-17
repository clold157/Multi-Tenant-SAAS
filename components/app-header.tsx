"use client"

import { Button } from "@/components/ui/button"
import { Menu, Bell } from "lucide-react"

interface AppHeaderProps {
  onMenuClick: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden touch-manipulation active:scale-95"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menu</span>
        </Button>

        <div className="hidden md:block">
          <h1 className="text-lg font-semibold">Sistema de Gestão</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative touch-manipulation active:scale-95">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            <span className="sr-only">Notificações</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
