"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EquipmentSchema } from "@/lib/validations";
import type { Equipment } from "@prisma/client";
import type { z } from "zod";

type EditEquipmentForm = z.infer<typeof EquipmentSchema>;

interface Props {
  equipmentId?: string;
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function EditEquipmentFormDialog({
  equipmentId,
  children,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  const form = useForm<EditEquipmentForm>({
    resolver: zodResolver(EquipmentSchema),
    defaultValues: {
      name: "",
      description: "",
      amount: 0,
      unitPrice: 0,
      condition: "BOM",
      categoryId: "",
    },
  });

  const {
    setValue,
    reset,
    formState: { errors },
  } = form;

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast.error("Erro ao buscar categorias");
    }
  };

  const fetchEquipment = async (id: string) => {
    try {
      const res = await fetch(`/api/equipments/${id}`);
      if (!res.ok) throw new Error("Erro ao buscar equipamento");
      const data: Equipment = await res.json();
      reset({
        name: data.name,
        description: data.description ?? "",
        amount: data.amount,
        unitPrice: Number(data.unitPrice),
        condition: data.condition,
        categoryId: data.categoryId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar equipamento"
      );
    }
  };

  useEffect(() => {
    fetchCategories();
    if (equipmentId) {
      fetchEquipment(equipmentId);
    }
  }, [equipmentId]);

  const onSubmit = async (data: EditEquipmentForm) => {
    if (!equipmentId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/equipments/${equipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao atualizar equipamento");
      }

      toast.success("Equipamento atualizado com sucesso!");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar equipamento"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const conditions = ["NOVO", "BOM", "REGULAR", "RUIM"] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {equipmentId ? "Editar Equipamento" : "Novo Equipamento"}
          </DialogTitle>
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
                    <Input placeholder="Nome do equipamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do equipamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Unitário</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Condição</FormLabel>
              <Select
                onValueChange={(value) =>
                  setValue("condition", value as (typeof conditions)[number])
                }
                value={form.getValues("condition")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a condição" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((cond) => (
                    <SelectItem key={cond} value={cond}>
                      {cond}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel>Categoria</FormLabel>
              <Select
                onValueChange={(value) => setValue("categoryId", value)}
                value={form.getValues("categoryId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
