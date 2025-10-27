"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserFormDialog } from "./user-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, FileText, User, Key, Trash2, Copy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getRankAbbreviation } from "@/lib/rank";

interface UserActionsDialogProps {
  user: any;
  onSuccess: () => void;
  children: React.ReactNode;
}

export function UserActionsDialog({
  user,
  onSuccess,
  children,
}: UserActionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const handleResetPassword = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Erro ao resetar senha");
      }

      const data = await response.json();
      setNewPassword(data.newPassword);
      toast.success("Senha resetada com sucesso!");
    } catch (error) {
      toast.error("Erro ao resetar senha");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir usuário");
      }

      toast.success("Usuário excluído com sucesso!");
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast.error("Erro ao excluir usuário");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800";
      case "ADMIN":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const capitalize = (s: string) => {
    if (!s) return s;
    return s
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{capitalize(user.name)}</h3>
                <Badge className={getRoleColor(user.role)}>
                  {user.role === "SUPER_ADMIN"
                    ? "Super Admin"
                    : user.role === "ADMIN"
                    ? "Administrador"
                    : "Usuário"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{user.email}</span>
            </div>

            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}

            {user.document && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{user.document}</span>
              </div>
            )}

            {user.warName && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nome de Guerra:</span>
                <span>{capitalize(user.warName)}</span>
              </div>
            )}

            {user.rank && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Posto/Graduação:</span>
                <span>{getRankAbbreviation(user.rank)}</span>
              </div>
            )}

            {user.militaryOrganization && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">OM:</span>
                <span>{user.militaryOrganization}</span>
              </div>
            )}
          </div>

          {newPassword && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">
                  Nova senha gerada:
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(newPassword)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <code className="text-green-700 font-mono text-sm bg-green-100 px-2 py-1 rounded">
                {newPassword}
              </code>
              <p className="text-xs text-green-600 mt-1">
                Copie esta senha e compartilhe com o usuário
              </p>
            </div>
          )}

          <Separator />

          <div className="flex flex-col gap-2">
            <UserFormDialog user={user} onSuccess={onSuccess}>
              <Button variant="outline" className="w-full">
                Editar Usuário
              </Button>
            </UserFormDialog>

            <Button
              variant="outline"
              onClick={handleResetPassword}
              disabled={isResetting}
            >
              <Key className="mr-2 h-4 w-4" />
              {isResetting ? "Resetando..." : "Resetar Senha"}
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Excluindo..." : "Excluir Usuário"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
