"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Check, Loader2, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"

// Dados mockados do carrinho
const mockCartItems = [
  { id: 1, name: "Pizza Margherita", quantity: 2, price: 45.9 },
  { id: 2, name: "Hambúrguer Clássico", quantity: 1, price: 32.9 },
  { id: 3, name: "Refrigerante 2L", quantity: 1, price: 8.9 },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    observations: "",
  })
  const [errors, setErrors] = useState({
    name: false,
    phone: false,
  })

  const subtotal = mockCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const deliveryFee = 5.0
  const total = subtotal + deliveryFee

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpa erro ao digitar
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: false }))
    }
  }

  const validateForm = () => {
    const newErrors = {
      name: !formData.name.trim(),
      phone: !formData.phone.trim(),
    }
    setErrors(newErrors)
    return !newErrors.name && !newErrors.phone
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Simula envio
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setIsSuccess(true)

    // Redireciona após 2 segundos
    setTimeout(() => {
      router.push("/cardapio-publico")
    }, 2000)
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Pedido Confirmado!</h2>
              <p className="text-muted-foreground">
                Seu pedido foi recebido com sucesso. Entraremos em contato em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Finalizar Pedido</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumo do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Itens */}
              <div className="space-y-3">
                {mockCartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm whitespace-nowrap">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totais */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span>R$ {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seus Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome completo *
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Digite seu nome"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`h-12 text-base ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {errors.name && <p className="text-xs text-red-500">Nome é obrigatório</p>}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Telefone *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`h-12 text-base ${errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {errors.phone && <p className="text-xs text-red-500">Telefone é obrigatório</p>}
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <label htmlFor="observations" className="text-sm font-medium">
                  Observações (opcional)
                </label>
                <Textarea
                  id="observations"
                  placeholder="Alguma observação sobre seu pedido?"
                  value={formData.observations}
                  onChange={(e) => handleInputChange("observations", e.target.value)}
                  className="min-h-[100px] text-base resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão de Confirmar */}
          <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-base font-semibold" size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Confirmar Pedido
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao confirmar, você receberá uma ligação para confirmar o endereço de entrega e forma de pagamento.
          </p>
        </form>
      </div>
    </div>
  )
}
