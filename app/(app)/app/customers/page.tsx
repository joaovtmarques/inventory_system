"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Mail, Phone, Plus, Search, User } from "lucide-react";
import { toast } from "sonner";
import { CustomerFormDialog } from "@/components/forms/customer-form-dialog";
import type { Customer } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getRankAbbreviation } from "@/lib/rank";

export default function CustomersPage() {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      toast.error("Erro ao buscar clientes: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.document?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const capitalize = (s: string) => {
    if (!s) return s;
    return s
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <CustomerFormDialog onSuccess={fetchCustomers}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </CustomerFormDialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold truncate">
                  {capitalize(customer.name)}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </div>
              {customer.warName && (
                <p className="text-sm text-muted-foreground">
                  {capitalize(customer.warName)}
                </p>
              )}
            </CardHeader>

            <CardContent className="pt-0 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">
                  Posto/Graduação:
                </span>
                <Badge variant="secondary" className="text-xs">
                  {getRankAbbreviation(customer.rank!) || "-"}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{customer.email || "-"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{customer.phone || "-"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{customer.document || "-"}</span>
                </div>
              </div>

              {customer.militaryOrganization && (
                <>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">OM:</span>{" "}
                    {customer.militaryOrganization}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">
            Nenhum cliente encontrado
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? "Tente ajustar sua busca"
              : "Comece adicionando um novo cliente"}
          </p>
        </div>
      )}
    </div>
  );
}
