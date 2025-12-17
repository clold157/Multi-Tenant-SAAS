import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

export default function CardapioPage() {
  const menuItems = [
    {
      id: 1,
      name: "Pizza Margherita",
      category: "Pizza",
      price: "R$ 45,00",
      available: true,
      image: "/delicious-pizza.png",
    },
    {
      id: 2,
      name: "Hambúrguer Artesanal",
      category: "Hambúrguer",
      price: "R$ 32,00",
      available: true,
      image: "/classic-beef-burger.png",
    },
    {
      id: 3,
      name: "Sushi Mix",
      category: "Japonês",
      price: "R$ 68,00",
      available: false,
      image: "/assorted-sushi-platter.png",
    },
    {
      id: 4,
      name: "Lasanha Bolonhesa",
      category: "Massas",
      price: "R$ 38,00",
      available: true,
      image: "/classic-lasagna.png",
    },
    {
      id: 5,
      name: "Salada Caesar",
      category: "Saladas",
      price: "R$ 28,00",
      available: true,
      image: "/vibrant-mixed-salad.png",
    },
    {
      id: 6,
      name: "Filé Mignon",
      category: "Carnes",
      price: "R$ 85,00",
      available: true,
      image: "/juicy-steak.png",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cardápio</h1>
          <p className="text-muted-foreground mt-1">Gerencie os itens do seu menu</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video relative bg-muted overflow-hidden">
              <img src={item.image || "/placeholder.svg"} alt={item.name} className="object-cover w-full h-full" />
              {!item.available && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge variant="secondary">Indisponível</Badge>
                </div>
              )}
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-tight">{item.name}</CardTitle>
                <Badge variant="outline" className="shrink-0">
                  {item.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{item.price}</span>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
