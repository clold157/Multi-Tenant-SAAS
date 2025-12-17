"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, ShoppingCart, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuItem {
  id: number
  name: string
  description: string
  category: string
  price: number
  available: boolean
  image: string
}

interface CartItem extends MenuItem {
  quantity: number
}

export default function CardapioPublicoPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  const menuItems: MenuItem[] = [
    {
      id: 1,
      name: "Pizza Margherita",
      description: "Molho de tomate, mussarela e manjericão",
      category: "Pizzas",
      price: 45.0,
      available: true,
      image: "/delicious-pizza.jpg",
    },
    {
      id: 2,
      name: "Hambúrguer Artesanal",
      description: "Pão brioche, blend 180g, queijo cheddar",
      category: "Hambúrgueres",
      price: 32.0,
      available: true,
      image: "/classic-beef-burger.jpg",
    },
    {
      id: 3,
      name: "Sushi Mix - 20 peças",
      description: "Variado de sushis e sashimis frescos",
      category: "Japonês",
      price: 68.0,
      available: false,
      image: "/assorted-sushi-platter.jpg",
    },
    {
      id: 4,
      name: "Lasanha Bolonhesa",
      description: "Molho bolonhesa caseiro e queijo gratinado",
      category: "Massas",
      price: 38.0,
      available: true,
      image: "/classic-lasagna.jpg",
    },
    {
      id: 5,
      name: "Salada Caesar",
      description: "Alface romana, croutons, parmesão",
      category: "Saladas",
      price: 28.0,
      available: true,
      image: "/vibrant-mixed-salad.jpg",
    },
    {
      id: 6,
      name: "Filé Mignon 300g",
      description: "Acompanha arroz, batata e legumes",
      category: "Carnes",
      price: 85.0,
      available: true,
      image: "/juicy-steak.jpg",
    },
    {
      id: 7,
      name: "Risoto de Funghi",
      description: "Arroz arbóreo com cogumelos variados",
      category: "Massas",
      price: 42.0,
      available: true,
      image: "/creamy-risotto.jpg",
    },
    {
      id: 8,
      name: "Frango Grelhado",
      description: "Peito de frango com ervas finas",
      category: "Carnes",
      price: 35.0,
      available: true,
      image: "/grilled-chicken.jpg",
    },
  ]

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
      }
      return prev.filter((i) => i.id !== itemId)
    })
  }

  const clearCart = () => {
    setCart([])
  }

  const getItemQuantity = (itemId: number) => {
    return cart.find((i) => i.id === itemId)?.quantity || 0
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const categories = Array.from(new Set(menuItems.map((item) => item.category)))

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Cardápio Online</h1>
              <p className="text-sm text-muted-foreground">Escolha seus pratos favoritos</p>
            </div>
            {/* Desktop cart button */}
            <Button size="lg" className="hidden lg:flex gap-2" onClick={() => setShowCart(!showCart)}>
              <ShoppingCart className="h-5 w-5" />
              <span>Carrinho ({totalItems})</span>
              <span className="font-bold">R$ {totalPrice.toFixed(2)}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Menu items */}
          <div className="flex-1">
            {categories.map((category) => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-semibold mb-4 sticky top-[73px] lg:top-[89px] z-30 bg-background py-2">
                  {category}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {menuItems
                    .filter((item) => item.category === category)
                    .map((item) => {
                      const quantity = getItemQuantity(item.id)
                      return (
                        <Card
                          key={item.id}
                          className={cn("overflow-hidden transition-all", !item.available && "opacity-60")}
                        >
                          <div className="aspect-video relative bg-muted overflow-hidden">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="object-cover w-full h-full"
                            />
                            {!item.available && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Badge variant="secondary">Indisponível</Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div>
                                <h3 className="font-semibold text-base leading-tight">{item.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xl font-bold text-primary">R$ {item.price.toFixed(2)}</span>
                                {item.available && (
                                  <div className="flex items-center gap-2">
                                    {quantity === 0 ? (
                                      <Button size="sm" onClick={() => addToCart(item)} className="h-9 px-4">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Adicionar
                                      </Button>
                                    ) : (
                                      <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-md">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => removeFromCart(item.id)}
                                          className="h-9 w-9 hover:bg-primary-foreground/20"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="font-semibold min-w-[1.5rem] text-center">{quantity}</span>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => addToCart(item)}
                                          className="h-9 w-9 hover:bg-primary-foreground/20"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop sidebar cart */}
          <div className="hidden lg:block w-80 xl:w-96">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Seu Pedido</h3>
                    {cart.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearCart}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Seu carrinho está vazio</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-16 h-16 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm leading-tight">{item.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                R$ {item.price.toFixed(2)} × {item.quantity}
                              </p>
                              <p className="text-sm font-semibold mt-1">R$ {(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-1 bg-muted rounded-md">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeFromCart(item.id)}
                                className="h-7 w-7"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium min-w-[1.5rem] text-center">{item.quantity}</span>
                              <Button size="icon" variant="ghost" onClick={() => addToCart(item)} className="h-7 w-7">
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">R$ {totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Taxa de entrega</span>
                          <span className="font-medium">R$ 5,00</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <span>Total</span>
                          <span>R$ {(totalPrice + 5).toFixed(2)}</span>
                        </div>
                      </div>

                      <Button size="lg" className="w-full mt-4 h-12 text-base">
                        Finalizar Pedido
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile cart footer */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
          <div className="container px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0 bg-transparent"
                onClick={() => setShowCart(!showCart)}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Total do pedido</p>
                <p className="text-lg font-bold">R$ {(totalPrice + 5).toFixed(2)}</p>
              </div>
              <Button size="lg" className="h-12 px-6">
                Finalizar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile cart modal */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Seu Pedido</h2>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    Limpar
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-3 opacity-50" />
                  <p>Seu carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-20 h-20 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold leading-tight">{item.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">R$ {item.price.toFixed(2)} cada</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2 bg-muted rounded-md">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-9 w-9"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                                <Button size="icon" variant="ghost" onClick={() => addToCart(item)} className="h-9 w-9">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <span className="text-lg font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span className="font-medium">R$ 5,00</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>R$ {(totalPrice + 5).toFixed(2)}</span>
                  </div>
                </div>
                <Button size="lg" className="w-full h-14 text-base">
                  Finalizar Pedido
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
