"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingCart, UtensilsCrossed, Settings } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Pedidos", href: "/pedidos", icon: ShoppingCart },
  { name: "Cardápio", href: "/cardapio", icon: UtensilsCrossed },
  { name: "Config", href: "/configuracoes", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-16">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                "active:scale-95 touch-manipulation",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
