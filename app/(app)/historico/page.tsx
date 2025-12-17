"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, CheckCircle2, XCircle, Loader2, Search, ChevronLeft, ChevronRight, Package } from "lucide-react"

// Mock data
const mockOrders = [
  {
    id: 1234,
    customer: "João Silva",
    items: [
      { name: "Pizza Margherita", qty: 2 },
      { name: "Refrigerante", qty: 1 },
    ],
    total: 89.9,
    status: "completed",
    date: "2024-01-15T14:30:00",
  },
  {
    id: 1235,
    customer: "Maria Santos",
    items: [
      { name: "Hambúrguer Clássico", qty: 1 },
      { name: "Batata Frita", qty: 1 },
    ],
    total: 45.0,
    status: "completed",
    date: "2024-01-15T13:15:00",
  },
  {
    id: 1236,
    customer: "Pedro Costa",
    items: [
      { name: "Sushi Variado", qty: 1 },
      { name: "Yakisoba", qty: 1 },
    ],
    total: 125.5,
    status: "pending",
    date: "2024-01-15T12:45:00",
  },
  {
    id: 1237,
    customer: "Ana Oliveira",
    items: [{ name: "Salada Caesar", qty: 1 }],
    total: 32.0,
    status: "cancelled",
    date: "2024-01-15T11:20:00",
  },
  {
    id: 1238,
    customer: "Carlos Souza",
    items: [
      { name: "Lasanha Bolonhesa", qty: 1 },
      { name: "Tiramisu", qty: 2 },
    ],
    total: 98.0,
    status: "completed",
    date: "2024-01-14T19:30:00",
  },
  {
    id: 1239,
    customer: "Beatriz Lima",
    items: [{ name: "Risoto de Funghi", qty: 1 }],
    total: 67.0,
    status: "completed",
    date: "2024-01-14T18:00:00",
  },
  {
    id: 1240,
    customer: "Rafael Mendes",
    items: [
      { name: "Bife Grelhado", qty: 1 },
      { name: "Vinho Tinto", qty: 1 },
    ],
    total: 156.9,
    status: "pending",
    date: "2024-01-14T17:15:00",
  },
  {
    id: 1241,
    customer: "Juliana Rocha",
    items: [{ name: "Frango Grelhado", qty: 2 }],
    total: 78.0,
    status: "completed",
    date: "2024-01-14T16:45:00",
  },
]

type OrderStatus = "all" | "pending" | "completed" | "cancelled"

export default function HistoricoPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const itemsPerPage = 5

  // Filter orders
  const filteredOrders = mockOrders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesSearch = searchQuery === "" || order.id.toString().includes(searchQuery)
    return matchesStatus && matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

  // Reset page when filters change
  const handleFilterChange = (value: OrderStatus) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Pedidos</h1>
        <p className="text-muted-foreground mt-1">Visualize e acompanhe todos os seus pedidos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por ID do pedido..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => handleFilterChange(value as OrderStatus)}>
          <SelectTrigger className="w-full sm:w-[200px] h-12">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {filteredOrders.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground max-w-sm">
              {searchQuery
                ? "Tente ajustar os filtros ou o termo de busca."
                : "Você ainda não tem pedidos registrados."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mobile & Tablet - Cards */}
      {filteredOrders.length > 0 && (
        <div className="lg:hidden grid gap-4 sm:grid-cols-2">
          {paginatedOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">#{order.id}</CardTitle>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium">{order.customer}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Itens:</span>
                    <span>{order.items.length} item(s)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(order.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Data:</span>
                    <span className="text-xs">{formatDate(order.date)}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-12 mt-2 bg-transparent">
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Desktop - Table */}
      {filteredOrders.length > 0 && (
        <div className="hidden lg:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-bold">#{order.id}</TableCell>
                    <TableCell className="font-medium">{order.customer}</TableCell>
                    <TableCell>{order.items.length} item(s)</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-sm">{formatDate(order.date)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{formatCurrency(order.total)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Pagination */}
      {filteredOrders.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredOrders.length)} de{" "}
            {filteredOrders.length} pedidos
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-12 w-12"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(page)}
                  className="h-12 w-12"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-12 w-12"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
