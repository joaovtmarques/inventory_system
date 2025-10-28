"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoanFormDialog } from "@/components/forms/loan-form-dialog";
import { LoansTable } from "@/components/tables/loans-table";
import { Plus, Package, FileText, DollarSign, Clock } from "lucide-react";
import { canCreateLoans } from "@/lib/permissions";
import { toast } from "sonner";

interface DashboardStats {
  totalEquipments: number;
  equipmentsInLoan: number;
  totalValue: number;
  pendingLoans: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalEquipments: 0,
    equipmentsInLoan: 0,
    totalValue: 0,
    pendingLoans: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      console.log(stats);
      if (!response.ok) throw new Error("Erro ao buscar estatísticas");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast.error("Erro ao carregar tickets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const canCreate = session?.user && canCreateLoans(session.user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {canCreate && (
          <LoanFormDialog onSuccess={fetchStats}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Cautela
            </Button>
          </LoanFormDialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Equipamentos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEquipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Cautela</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.equipmentsInLoan}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total dos Equipamentos
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalValue &&
                stats.totalValue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cautelas Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLoans}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cautelas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <LoansTable />
        </CardContent>
      </Card>
    </div>
  );
}
