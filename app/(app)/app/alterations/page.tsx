// app/(dashboard)/equipment-alterations/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import CreateAlterationDialog from "@/components/forms/alteration-form-dialog";
import EditAlterationDialog from "@/components/forms/edit-alteration-form-dialog";

type Alteration = {
  id: string;
  desc: string;
  mission: string;
  location: string;
  date: string;
  equipment: string;
  serialNumber: string[];
  amount: string;
  loanId: string;
  customer?: {
    name?: string;
    warName?: string;
    document?: string;
    militaryOrganization?: string;
    phone?: string;
  };
  equipmentMeta?: { name?: string; category?: { name?: string } };
  createdAt: string;
};

export default function EquipmentAlterationsPage() {
  const [alterations, setAlterations] = useState<Alteration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAlterations();
  }, []);

  const fetchAlterations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/alterations");
      if (!res.ok) throw new Error("Erro ao buscar alterações");
      const data = await res.json();
      setAlterations(data || []);
    } catch (err) {
      toast.error("Erro ao carregar alterações");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = alterations.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.equipment?.toLowerCase().includes(term) ||
      (a.equipmentMeta?.category?.name || "").toLowerCase().includes(term) ||
      (a.customer?.warName || "").toLowerCase().includes(term) ||
      a.desc?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Equipment Alterations</h1>
        <div className="flex items-center space-x-2">
          <CreateAlterationDialog onSuccess={fetchAlterations}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Alteração
            </Button>
          </CreateAlterationDialog>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar por equipamento, categoria, posto de guerra ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((alt) => (
          <EditAlterationDialog
            key={alt.id}
            alteration={alt}
            onSuccess={fetchAlterations}
          >
            <Card className="cursor-pointer hover:shadow-lg transition">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold truncate">
                    {alt.equipmentMeta?.name || alt.equipment || "-"}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="inline-block mr-2">
                    {alt.equipmentMeta?.category?.name || "-"}
                  </span>
                  <span className="inline-block">•</span>
                  <span className="inline-block ml-2">
                    {alt.amount} unidade(s)
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-muted-foreground">
                    Cliente
                  </div>
                  <div className="truncate">
                    {alt.customer?.warName || alt.customer?.name || "-"}
                  </div>
                </div>

                <Separator />

                <div className="text-sm">
                  <div className="font-medium text-muted-foreground">
                    Nº(s) de Série
                  </div>
                  <div className="mt-1">
                    {alt.serialNumber?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {alt.serialNumber.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2 py-1 rounded bg-muted/10"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="text-sm">
                  <div className="font-medium text-muted-foreground">
                    Descrição
                  </div>
                  <div className="line-clamp-2 break-words">
                    {alt.desc || "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </EditAlterationDialog>
        ))}
      </div>
      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">
            Nenhuma alteração encontrada
          </h3>
        </div>
      )}
    </div>
  );
}
