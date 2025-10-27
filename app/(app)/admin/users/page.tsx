"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Plus, Search, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { UserFormDialog } from "@/components/forms/user-form-dialog";
import { UserActionsDialog } from "@/components/forms/user-actions-dialog";
import { Separator } from "@/components/ui/separator";
import { isAdmin } from "@/lib/permissions";
import { getRankAbbreviation } from "@/lib/rank";
import { RoleType } from "@prisma/client";
import { capitalize } from "@/lib/capitalize";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  rank?: string;
  warName?: string;
  militaryOrganization?: string;
  role: RoleType;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 401) {
        toast.error("Não autorizado");
      }
    } catch (error) {
      toast.error("Erro ao buscar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.warName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const canManageUsers = session?.user && isAdmin(session.user.role);

  const getRoleColor = (role: RoleType) => {
    switch (role) {
      case RoleType.SUPER_ADMIN:
        return "bg-red-100 text-red-800";
      case RoleType.ADMIN:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: RoleType) => {
    switch (role) {
      case RoleType.SUPER_ADMIN:
        return <Shield className="h-4 w-4 text-red-600" />;
      case RoleType.ADMIN:
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">Acesso negado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Você não tem permissão para visualizar esta página
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Usuários do Sistema</h1>

        {canManageUsers && (
          <UserFormDialog onSuccess={fetchUsers}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </UserFormDialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <UserActionsDialog key={user.id} user={user} onSuccess={fetchUsers}>
            <Card className="cursor-pointer hover:shadow-lg transition">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold truncate">
                    {capitalize(user.name)}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {getRoleIcon(user.role)}
                  </div>
                </div>
                {user.warName && (
                  <p className="text-sm text-muted-foreground">
                    {capitalize(user.warName)}
                  </p>
                )}
              </CardHeader>

              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    Perfil:
                  </span>
                  <Badge className={getRoleColor(user.role)}>
                    {user.role === RoleType.SUPER_ADMIN
                      ? "Super Admin"
                      : user.role === RoleType.ADMIN
                      ? "Admin"
                      : "Usuário"}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                {(user.rank || user.militaryOrganization) && (
                  <>
                    <Separator />
                    <div className="text-xs text-muted-foreground space-y-1">
                      {user.rank && (
                        <div>
                          <span className="font-medium">Posto:</span>{" "}
                          {getRankAbbreviation(user.rank)}
                        </div>
                      )}
                      {user.militaryOrganization && (
                        <div>
                          <span className="font-medium">OM:</span>{" "}
                          {user.militaryOrganization}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </UserActionsDialog>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">
            Nenhum usuário encontrado
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? "Tente ajustar sua busca"
              : "Comece adicionando um novo usuário"}
          </p>
        </div>
      )}
    </div>
  );
}
