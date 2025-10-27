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
import { SerialNumberSchema } from "@/lib/validations";
import type { Equipment, SerialStatus } from "@prisma/client";
import type { z } from "zod";

type SerialNumberFormData = z.infer<typeof SerialNumberSchema>;

interface Props {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function SerialNumberFormDialog({ children, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoadingEquipments, setIsLoadingEquipments] = useState(false);

  const form = useForm<SerialNumberFormData>({
    resolver: zodResolver(SerialNumberSchema),
    defaultValues: {
      number: "",
      equipmentId: "",
      status: "EM_ESTOQUE" as SerialStatus,
      condition: "BOM",
      observation: "",
    },
  });

  const {
    setValue,
    formState: { errors },
    reset,
  } = form;

  const fetchEquipments = async () => {
    setIsLoadingEquipments(true);
    try {
      const res = await fetch("/api/equipments");
      if (!res.ok) throw new Error("Erro ao buscar equipamentos");
      const data = await res.json();
      setEquipments(data);
    } catch (error) {
      toast.error("Erro ao carregar equipamentos");
    } finally {
      setIsLoadingEquipments(false);
    }
  };

  // Buscar equipamentos sempre que o modal abrir
  useEffect(() => {
    if (open) {
      fetchEquipments();
      reset(); // Resetar o form quando abrir
    }
  }, [open, reset]);

  const onSubmit = async (data: SerialNumberFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/serial-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar número de série");
      }

      toast.success("Número de série criado com sucesso!");
      setOpen(false);
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar número de série"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const statuses = [
    "EM_ESTOQUE",
    "CAUTELADO",
    "MANUTENCAO",
    "BAIXADO",
  ] as const;
  const conditions = ["NOVO", "BOM", "REGULAR", "RUIM"] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Número de Série</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Número de Série */}
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Série</FormLabel>
                  <FormControl>
                    <Input placeholder="Informe o número de série" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Equipamento */}
            <div className="space-y-2">
              <FormLabel htmlFor="equipmentId">Equipamento</FormLabel>
              <Select
                onValueChange={(value) => setValue("equipmentId", value)}
                disabled={isLoadingEquipments}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingEquipments
                        ? "Carregando equipamentos..."
                        : "Selecione o equipamento"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {equipments.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.equipmentId && (
                <p className="text-sm text-destructive">
                  {errors.equipmentId.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <FormLabel htmlFor="status">Status</FormLabel>
              <Select
                onValueChange={(value) =>
                  setValue("status", value as (typeof statuses)[number])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "EM_ESTOQUE"
                        ? "Em Estoque"
                        : status === "CAUTELADO"
                        ? "Cautelado"
                        : status === "MANUTENCAO"
                        ? "Em Manutenção"
                        : "Baixado"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Condição */}
            <div className="space-y-2">
              <FormLabel htmlFor="condition">Condição</FormLabel>
              <Select
                onValueChange={(value) =>
                  setValue("condition", value as (typeof conditions)[number])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a condição" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observação */}
            <FormField
              control={form.control}
              name="observation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Input placeholder="Observações" {...field} />
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
              <Button type="submit" disabled={isLoading || isLoadingEquipments}>
                {isLoading ? "Criando..." : "Criar Número de Série"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
