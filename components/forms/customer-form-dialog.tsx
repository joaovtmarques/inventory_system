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
import { CustomerSchema } from "@/lib/validations";

const ranks = [
  { id: 1, value: "CEL", label: "Coronel" },
  { id: 2, value: "TEN_CEL", label: "Tenente Coronel" },
  { id: 3, value: "MAJ", label: "Major" },
  { id: 4, value: "CAP", label: "Capitão" },
  { id: 5, value: "TEN_1", label: "1° Tenente" },
  { id: 6, value: "TEN_2", label: "2° Tenente" },
  { id: 7, value: "STEN", label: "Sub Tenente" },
  { id: 8, value: "SGT_1", label: "1° Sargento" },
  { id: 9, value: "SGT_2", label: "2° Sargento" },
  { id: 10, value: "SGT_3", label: "3° Sargento" },
  { id: 11, value: "CB", label: "Cabo" },
  { id: 12, value: "SD_EP", label: "Soldado EP" },
  { id: 13, value: "SD_EV", label: "Soldado EV" },
];

const omsu = [
  {
    id: 1,
    value: "BIAMV_6",
    label: "6º BI Amv",
  },
  {
    id: 2,
    value: "CIACOMAMV_12",
    label: "12º Cia Com Amv",
  },
  {
    id: 3,
    value: "PELPE_12",
    label: "12º Pel PE Amv",
  },
  {
    id: 4,
    value: "QGBDAAMV",
    label: "QG Bda Amv",
  },
  {
    id: 5,
    value: "BASEADM",
    label: "Base Adm",
  },
  {
    id: 6,
    value: "CIACMDO_12",
    label: "12º Cia Cmdo Bda Amv",
  },
];

type CustomerFormData = z.infer<typeof CustomerSchema>;

interface Props {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function CustomerFormDialog({ children, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      document: "",
      rank: "",
      warName: "",
      militaryOrganization: "",
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao criar cliente");
      }

      toast.success("Cliente criado com sucesso!");
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar cliente"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
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
                    <Input placeholder="Nome do cliente" {...field} />
                  </FormControl>
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
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

            <FormField
              control={form.control}
              name="rank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posto/Graduação</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ranks.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                {isLoading ? "Criando..." : "Criar Cliente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
