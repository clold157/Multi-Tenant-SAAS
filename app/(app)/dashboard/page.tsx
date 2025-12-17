import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShoppingCart, Clock, DollarSign, CheckCircle2, XCircle, Package } from "lucide-react"

const stats = [
  {
    title: "Pedidos Hoje",
    value: "24",
    description: "+12% em relação a ontem",
    icon: ShoppingCart,
    trend: "up",
  },
  {
    title: "Pedidos Pendentes",
    value: "8",
    description: "Requerem atenção",
    icon: Clock,
    trend: "neutral",
  },
  {
    title: "Faturamento",
    value: "R$ 2.450",
    description: "+8% em relação a semana passada",
    icon: DollarSign,
    trend: "up",
  },
]

const recentOrders = [
  {
    id: "#1234",
    cliente: "João Silva",
    items: "2x Pizza Margherita, 1x Refrigerante",
    total: "R$ 85,00",
    status: "entregue",
    tempo: "5 min atrás",
  },
  {
    id: "#1233",
    cliente: "Maria Santos",
    items: "1x Hambúrguer Artesanal, 1x Batata Frita",
    total: "R$ 45,00",
    status: "preparando",
    tempo: "12 min atrás",
  },
  {
    id: "#1232",
    cliente: "Pedro Costa",
    items: "3x Sushi Mix, 2x Suco Natural",
    total: "R$ 120,00",
    status: "pendente",
    tempo: "18 min atrás",
  },
  {
    id: "#1231",
    cliente: "Ana Oliveira",
    items: "1x Lasanha Bolonhesa",
    total: "R$ 38,00",
    status: "cancelado",
    tempo: "25 min atrás",
  },
  {
    id: "#1230",
    cliente: "Carlos Mendes",
    items: "2x Pizza Calabresa, 1x Coca-Cola",
    total: "R$ 95,00",
    status: "entregue",
    tempo: "32 min atrás",
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "entregue":
      return { variant: "default" as const, icon: CheckCircle2, label: "Entregue" }
    case "preparando":
      return { variant: "secondary" as const, icon: Package, label: "Preparando" }
    case "pendente":
      return { variant: "outline" as const, icon: Clock, label: "Pendente" }
    case "cancelado":
      return { variant: "destructive" as const, icon: XCircle, label: "Cancelado" }
    default:
      return { variant: "outline" as const, icon: Clock, label: status }
  }
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu negócio</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="active:scale-[0.98] transition-transform">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
          <CardDescription>Últimos pedidos realizados hoje</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile e Tablet: Cards empilhados */}
          <div className="space-y-3 lg:hidden">
            {recentOrders.map((order) => {
              const statusInfo = getStatusBadge(order.status)
              const StatusIcon = statusInfo.icon
              return (
                <div key={order.id} className="p-4 rounded-lg border bg-card active:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.cliente}</p>
                    </div>
                    <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{order.items}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-primary">{order.total}</span>
                    <span className="text-muted-foreground">{order.tempo}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: Tabela */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => {
                  const statusInfo = getStatusBadge(order.status)
                  const StatusIcon = statusInfo.icon
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.cliente}</TableCell>
                      <TableCell className="max-w-xs truncate">{order.items}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">{order.total}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{order.tempo}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
