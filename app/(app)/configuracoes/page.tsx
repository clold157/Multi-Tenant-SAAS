import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Atualize suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome" defaultValue="Admin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" defaultValue="admin@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurant">Nome do Restaurante</Label>
              <Input id="restaurant" placeholder="Nome do estabelecimento" defaultValue="Meu Restaurante" />
            </div>
            <Button>Salvar Alterações</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Configure como você deseja receber notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications-orders">Novos Pedidos</Label>
                <p className="text-sm text-muted-foreground">Receber notificação de novos pedidos</p>
              </div>
              <Switch id="notifications-orders" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications-updates">Atualizações do Sistema</Label>
                <p className="text-sm text-muted-foreground">Receber notificações de atualizações</p>
              </div>
              <Switch id="notifications-updates" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications-marketing">Marketing</Label>
                <p className="text-sm text-muted-foreground">Receber emails promocionais</p>
              </div>
              <Switch id="notifications-marketing" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Personalize a aparência do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Modo Escuro</Label>
                <p className="text-sm text-muted-foreground">Alternar entre tema claro e escuro</p>
              </div>
              <Switch id="dark-mode" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>Ações irreversíveis que afetam sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Excluir Conta</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
