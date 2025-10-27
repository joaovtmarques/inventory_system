"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EquipmentSchema } from "@/lib/validations";
import type { Category } from "@prisma/client";

type EquipmentFormData = z.infer<typeof EquipmentSchema>;

interface Props {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function EquipmentsFormDialog({ children, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(EquipmentSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      amount: 0,
      unitPrice: 0,
      condition: "" as "NOVO" | "BOM" | "REGULAR" | "RUIM",
      observation: "",
    },
  });

  const {
    setValue,
    formState: { errors },
  } = form;

  const fetchCategories = async () => {
    const response = await fetch("/api/categories");
    const categories = await response.json();
    setCategories(categories);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: EquipmentFormData) => {
    console.log("Submitting data:", data); // 👀 debug
    setIsLoading(true);
    try {
      const response = await fetch("/api/equipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status); // 👀 debug

      if (!response.ok) {
        const error = await response.json();
        console.error("API error:", error); // 👀 debug
        throw new Error(error.error || "Erro ao criar equipamento");
      }

      toast.success("Equipamento criado com sucesso!");
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar equipamento"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const conditions = ["NOVO", "BOM", "REGULAR", "RUIM"] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Novo equipamento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do equipamento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Informe o nome do equipamento"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel htmlFor="categoryId">Categoria</FormLabel>
              <Select onValueChange={(value) => setValue("categoryId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do equipamento"
                      className="resize-none"
                      {...field}
                    />
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
                  <FormLabel>Quantidade disponível</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Informe a quantidade disponível"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
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
                  <FormLabel>Preço unitário</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Informe o preço unitário"
                      value={field.value === 0 ? "" : field.value} // mostra vazio se for 0
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseFloat(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel htmlFor="condition">Condição</FormLabel>
              <Select
                onValueChange={(value) =>
                  setValue(
                    "condition",
                    value as "NOVO" | "BOM" | "REGULAR" | "RUIM"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a condição do equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.condition && (
                <p className="text-sm text-destructive">
                  {errors.condition.message}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="observation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações do equipamento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Observações do equipamento"
                      {...field}
                    />
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
                {isLoading ? "Criando..." : "Criar Equipamento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
