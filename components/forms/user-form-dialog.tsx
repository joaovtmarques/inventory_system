"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleType } from "@prisma/client";

const UserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .optional(),
  role: z.nativeEnum(RoleType),
  phone: z.string().optional(),
  document: z.string().optional(),
  rank: z.string().optional(),
  warName: z.string().optional(),
  militaryOrganization: z.string().optional(),
});

type UserFormData = z.infer<typeof UserSchema>;

interface Props {
  children: React.ReactNode;
  onSuccess?: () => void;
  user?: any; // Para edição
}

const ranks = [
  { value: "CEL", label: "Coronel" },
  { value: "TEN_CEL", label: "Tenente Coronel" },
  { value: "MAJ", label: "Major" },
  { value: "CAP", label: "Capitão" },
  { value: "TEN_1", label: "1° Tenente" },
  { value: "TEN_2", label: "2° Tenente" },
  { value: "STEN", label: "Sub Tenente" },
  { value: "SGT_1", label: "1° Sargento" },
  { value: "SGT_2", label: "2° Sargento" },
  { value: "SGT_3", label: "3° Sargento" },
  { value: "CB", label: "Cabo" },
  { value: "SD_EP", label: "Soldado EP" },
  { value: "SD_EV", label: "Soldado EV" },
];

export function UserFormDialog({ children, onSuccess, user }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || RoleType.COMMON,
      phone: user?.phone || "",
      document: user?.document || "",
      rank: user?.rank || "",
      warName: user?.warName || "",
      militaryOrganization: user?.militaryOrganization || "",
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      const url = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PATCH" : "POST";

      // Se é edição e senha está vazia, remover do payload
      if (user && !data.password) {
        const { password, ...dataWithoutPassword } = data;
        data = dataWithoutPassword as UserFormData;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar usuário");
      }

      toast.success(`Usuário ${user ? "atualizado" : "criado"} com sucesso!`);
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar usuário"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {user
                      ? "Nova Senha (deixe em branco para manter atual)"
                      : "Senha"}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Senha" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={RoleType.COMMON}>
                        Usuário Comum
                      </SelectItem>
                      <SelectItem value={RoleType.ADMIN}>
                        Administrador
                      </SelectItem>
                      <SelectItem value={RoleType.SUPER_ADMIN}>
                        Super Admin
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="warName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Guerra</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome de Guerra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posto/Graduação</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o posto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ranks.map((rank) => (
                        <SelectItem key={rank.value} value={rank.value}>
                          {rank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="militaryOrganization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organização Militar</FormLabel>
                  <FormControl>
                    <Input placeholder="Organização Militar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Documento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Salvando..."
                  : user
                  ? "Atualizar"
                  : "Criar Usuário"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
