"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, CheckCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { isAdmin } from "@/lib/permissions";

interface Loan {
  id: string;
  date: string;
  devolutionDate?: string;
  status: "ABERTO" | "FECHADO";
  type: "CAUTELA" | "EMPRESTIMO_TEMPORARIO";
  mission?: string;
  observation?: string;
  lender: { name: string };
  customer?: { name: string };
  equipments: Array<{
    quantity: number;
    equipment: { name: string };
    serialNumbers?: { number: string }[];
  }>;
}

function LoanDetailsDialog({
  loan,
  onLoanUpdated,
}: {
  loan: Loan;
  onLoanUpdated: (updatedLoan: Loan) => void;
}) {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/loans/${loan.id}/download`);
      if (!response.ok) throw new Error("Erro ao gerar documento");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `loan-${loan.id}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Documento baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao baixar documento");
    }
  };

  const handleUpdateStatus = async () => {
    if (!session?.user || !isAdmin(session.user.role)) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/loans/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FECHADO" }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar cautela");
      const updatedLoan = await response.json();

      // Mapear serial numbers para equipamentos
      const equipmentsWithSerials = updatedLoan.equipments.map((eq: any) => ({
        ...eq,
        serialNumbers: updatedLoan.serialNumbers
          .filter((s: any) => s.serialNumber.equipmentId === eq.equipmentId)
          .map((s: any) => ({ number: s.serialNumber.number })),
      }));
      updatedLoan.equipments = equipmentsWithSerials;

      toast.success("Cautela atualizada com sucesso!");
      onLoanUpdated(updatedLoan);
    } catch {
      toast.error("Erro ao atualizar cautela");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Cautela</DialogTitle>
        </DialogHeader>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <strong>Responsável:</strong> {loan.lender.name}
            </div>
            <div>
              <strong>Cliente:</strong> {loan.customer?.name || "-"}
            </div>
            <div>
              <strong>Tipo:</strong>{" "}
              <Badge variant="secondary">
                {loan.type === "CAUTELA" ? "Cautela" : "Empréstimo"}
              </Badge>
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <Badge
                variant={loan.status === "ABERTO" ? "destructive" : "default"}
              >
                {loan.status === "ABERTO" ? "Aberto" : "Fechado"}
              </Badge>
            </div>
            <div>
              <strong>Data:</strong>{" "}
              {format(new Date(loan.date), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <div>
              <strong>Data de Devolução:</strong>{" "}
              {loan.devolutionDate
                ? format(new Date(loan.devolutionDate), "dd/MM/yyyy", {
                    locale: ptBR,
                  })
                : "-"}
            </div>
            <div className="col-span-2">
              <strong>Missão / Destino:</strong> {loan.mission || "-"}
            </div>
            <div className="col-span-2">
              <strong>Observação:</strong> {loan.observation || "-"}
            </div>
          </CardContent>
        </Card>

        <Separator className="my-4" />

        <Card>
          <CardHeader>
            <CardTitle>Equipamentos Cautelados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Números de Série</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loan.equipments.map((eq, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{eq.equipment.name}</TableCell>
                    <TableCell>{eq.quantity}</TableCell>
                    <TableCell>
                      {eq.serialNumbers && eq.serialNumbers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {eq.serialNumbers.map((s, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {s.number}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={handleDownload} variant="secondary">
            <Download className="mr-2 h-4 w-4" /> Baixar Documento
          </Button>
          {isAdmin(session?.user?.role || "") && loan.status === "ABERTO" && (
            <Button
              onClick={handleUpdateStatus}
              variant="destructive"
              disabled={isUpdating}
            >
              <CheckCircle className="mr-2 h-4 w-4" />{" "}
              {isUpdating ? "Atualizando..." : "Atualizar Status"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LoansTable() {
  const { data: session } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await fetch("/api/loans");
      if (response.ok) {
        const data = await response.json();

        // Mapear serial numbers para cada equipamento
        const mappedLoans = data.loans.map((loan: any) => {
          const equipmentsWithSerials = loan.equipments.map((eq: any) => ({
            ...eq,
            serialNumbers: loan.serialNumbers
              .filter((s: any) => s.serialNumber.equipmentId === eq.equipmentId)
              .map((s: any) => ({ number: s.serialNumber.number })),
          }));
          return { ...loan, equipments: equipmentsWithSerials };
        });

        setLoans(mappedLoans);
      }
    } catch {
      toast.error("Erro ao carregar cautelas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseLoan = async (loanId: string) => {
    try {
      const response = await fetch(`/api/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FECHADO" }),
      });
      if (response.ok) {
        toast.success("Cautela fechada com sucesso!");
        fetchLoans();
      } else {
        throw new Error("Erro ao fechar cautela");
      }
    } catch {
      toast.error("Erro ao fechar cautela");
    }
  };

  const getStatusBadge = (status: string) => (
    <Badge variant={status === "ABERTO" ? "destructive" : "default"}>
      {status === "ABERTO" ? "Aberto" : "Fechado"}
    </Badge>
  );

  const getTypeBadge = (type: string) => (
    <Badge variant="secondary">
      {type === "CAUTELA" ? "Cautela" : "Empréstimo"}
    </Badge>
  );

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Equipamentos</TableHead>
            <TableHead>Missão</TableHead>
            <TableHead>Devolução</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan) => (
            <TableRow key={loan.id}>
              <TableCell>
                {format(new Date(loan.date), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>{getTypeBadge(loan.type)}</TableCell>
              <TableCell>{getStatusBadge(loan.status)}</TableCell>
              <TableCell>{loan.lender.name}</TableCell>
              <TableCell>{loan.customer?.name || "-"}</TableCell>
              <TableCell>{loan.equipments.length} item(s)</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {loan.mission || "-"}
              </TableCell>
              <TableCell>
                {loan.devolutionDate
                  ? format(new Date(loan.devolutionDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : "-"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <LoanDetailsDialog
                        loan={loan}
                        onLoanUpdated={(updatedLoan) => {
                          setLoans((prev) =>
                            prev.map((l) =>
                              l.id === updatedLoan.id ? updatedLoan : l
                            )
                          );
                        }}
                      />
                    </DropdownMenuItem>
                    {isAdmin(session?.user?.role || "") &&
                      loan.status === "ABERTO" && (
                        <DropdownMenuItem
                          onClick={() => handleCloseLoan(loan.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Fechar Cautela
                        </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {loans.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma cautela encontrada
        </div>
      )}
    </div>
  );
}
