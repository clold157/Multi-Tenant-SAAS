import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, XCircle } from "lucide-react"

export default function PedidosPage() {
  const orders = [
    { id: 1001, customer: "João Silva", items: 3, total: "R$ 89,90", status: "pending", time: "5 min" },
    { id: 1002, customer: "Maria Santos", items: 2, total: "R$ 45,00", status: "completed", time: "15 min" },
    { id: 1003, customer: "Pedro Costa", items: 5, total: "R$ 125,50", status: "pending", time: "2 min" },
    { id: 1004, customer: "Ana Oliveira", items: 1, total: "R$ 32,00", status: "cancelled", time: "30 min" },
    { id: 1005, customer: "Carlos Souza", items: 4, total: "R$ 98,00", status: "completed", time: "45 min" },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os pedidos do sistema</p>
        </div>
        <Button>Novo Pedido</Button>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pedido #{order.id}</CardTitle>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{order.customer}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <span>{order.items} itens</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-base">{order.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Há:</span>
                  <span>{order.time}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    Ver Detalhes
                  </Button>
                  {order.status === "pending" && (
                    <Button size="sm" className="flex-1">
                      Confirmar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
