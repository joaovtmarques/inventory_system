"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package } from "lucide-react";
import { canManageEquipments } from "@/lib/permissions";
import { toast } from "sonner";
import EquipmentsFormDialog from "@/components/forms/equipments-form-dialog";
import SerialNumberFormDialog from "@/components/forms/serial-number-form-dialog";
import EditEquipmentFormDialog from "@/components/forms/edit-equipment-form-dialog";
import { Separator } from "@/components/ui/separator";

interface Equipment {
  id: string;
  name: string;
  description?: string;
  amount: number;
  unitPrice: number;
  condition: string;
  category: { name: string };
  serialNumbers: Array<{ id: string; number: string; status: string }>;
  _count: { serialNumbers: number };
}

export default function EquipmentsPage() {
  const { data: session } = useSession();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      const response = await fetch("/api/equipments");
      if (response.ok) {
        const data = await response.json();
        setEquipments(data);
      }
    } catch (error) {
      toast.error("Erro ao buscar equipamentos:" + error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEquipments = equipments.filter(
    (equipment) =>
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = session?.user && canManageEquipments(session.user.role);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "NOVO":
        return "bg-green-100 text-green-800";
      case "BOM":
        return "bg-blue-100 text-blue-800";
      case "REGULAR":
        return "bg-yellow-100 text-yellow-800";
      case "RUIM":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Equipamentos</h1>

        {canManage && (
          <div className="flex items-center space-x-2">
            <EquipmentsFormDialog onSuccess={fetchEquipments}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo equipamento
              </Button>
            </EquipmentsFormDialog>
            <SerialNumberFormDialog onSuccess={fetchEquipments}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo número de série
              </Button>
            </SerialNumberFormDialog>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEquipments.map((equipment) => (
          <EditEquipmentFormDialog
            key={equipment.id}
            equipmentId={equipment.id}
            onSuccess={fetchEquipments}
          >
            <Card className="cursor-pointer hover:shadow-lg transition">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold truncate">
                    {equipment.name}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <Badge variant="outline" className="text-xs w-fit">
                  {equipment.category.name}
                </Badge>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    Quantidade:
                  </span>
                  <span className="font-medium">{equipment.amount}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    Preço Unitário:
                  </span>
                  <span className="font-medium">
                    {Number(equipment.unitPrice).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    Condição:
                  </span>
                  <Badge className={getConditionColor(equipment.condition)}>
                    {equipment.condition}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    Números de série:
                  </span>
                  <span className="font-medium">
                    {equipment._count.serialNumbers}
                  </span>
                </div>

                {equipment.description && (
                  <>
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Descrição:</p>
                      <p className="line-clamp-2">{equipment.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </EditEquipmentFormDialog>
        ))}
      </div>

      {filteredEquipments.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">
            Nenhum equipamento encontrado
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? "Tente ajustar sua busca"
              : "Comece adicionando um novo equipamento"}
          </p>
        </div>
      )}
    </div>
  );
}
