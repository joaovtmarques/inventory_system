"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { MultiSelect } from "../ui/multi-select";
import { CustomerFormDialog } from "@/components/forms/customer-form-dialog";

type SerialNumber = {
  id: string;
  number: string;
};

type Equipment = {
  id: string;
  name: string;
  serialNumbers: SerialNumber[];
};

type Customer = {
  id: string;
  name: string;
};

const loanFormSchema = z.object({
  customerId: z.string().nonempty("Selecione um cliente"),
  equipments: z
    .array(
      z.object({
        equipmentId: z.string().nonempty("Selecione um equipamento"),
        quantity: z.coerce.number().int().min(1),
        serialNumbers: z.array(z.string()).optional(),
      })
    )
    .min(1, "Adicione pelo menos um equipamento"),
  devolutionDate: z.string().optional(),
  observation: z.string().optional(),
  mission: z.string().optional(),
  type: z.enum(["CAUTELA", "EMPRESTIMO_TEMPORARIO"]),
  urgency: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanFormSchema>;

interface Props {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function LoanFormDialog({ children, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      type: "CAUTELA",
      equipments: [{ equipmentId: "", quantity: 1, serialNumbers: [] }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "equipments",
  });

  useEffect(() => {
    fetchEquipments();
    fetchCustomers();
  }, []);

  const fetchEquipments = async () => {
    try {
      const res = await fetch("/api/equipments");
      if (!res.ok) throw new Error("Erro ao buscar equipamentos");
      const data = await res.json();
      setEquipments(data);
    } catch {
      toast.error("Erro ao carregar equipamentos");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Erro ao buscar clientes");
      const data = await res.json();
      setCustomers(data);
    } catch {
      toast.error("Erro ao carregar clientes");
    }
  };

  const onSubmit = async (data: LoanFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          devolutionDate: data.devolutionDate
            ? new Date(data.devolutionDate)
            : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao criar cautela");
      }

      toast.success("Cautela criada com sucesso!");
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar cautela"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Nova Cautela / Empréstimo</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Cliente com opção de criar novo */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl className="flex-1">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <CustomerFormDialog onSuccess={fetchCustomers}>
                      <Button type="button" variant="outline">
                        Novo Cliente
                      </Button>
                    </CustomerFormDialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Equipamentos */}
            {fields.map((item, index) => {
              const selectedEquipment = equipments.find(
                (e) =>
                  e.id === form.getValues(`equipments.${index}.equipmentId`)
              );
              return (
                <div key={item.id} className="border p-4 rounded space-y-2">
                  <FormField
                    control={form.control}
                    name={`equipments.${index}.equipmentId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione equipamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipments.map((eq) => (
                              <SelectItem key={eq.id} value={eq.id}>
                                {eq.name}
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
                    name={`equipments.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`equipments.${index}.serialNumbers`}
                    render={({ field }) => {
                      const options =
                        selectedEquipment?.serialNumbers?.map((s) => ({
                          label: s.number,
                          value: s.id,
                        })) || [];
                      return (
                        <FormItem>
                          <FormLabel>Números de Série</FormLabel>
                          <FormControl>
                            <MultiSelect
                              options={options}
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Selecione os números de série"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => remove(index)}
                  >
                    Remover Equipamento
                  </Button>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({ equipmentId: "", quantity: 1, serialNumbers: [] })
              }
            >
              Adicionar Equipamento
            </Button>

            {/* Outras informações */}
            <FormField
              control={form.control}
              name="devolutionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Devolução</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Missão / Destino</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Cautela"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
