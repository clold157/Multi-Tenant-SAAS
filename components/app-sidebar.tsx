"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingCart, UtensilsCrossed, Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AppSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Pedidos", href: "/pedidos", icon: ShoppingCart },
  { name: "Cardápio", href: "/cardapio", icon: UtensilsCrossed },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
]

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen bg-sidebar-background border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          "w-64 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
          <h2 className="text-xl font-bold text-sidebar-foreground">SaaS Menu</h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggle}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onToggle}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      "active:scale-[0.98] touch-manipulation",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Admin</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">admin@example.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
