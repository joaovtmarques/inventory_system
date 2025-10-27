// components/alterations/create-alteration-dialog.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { getRankAbbreviation } from "@/lib/rank";
import { getFormattedDate } from "@/lib/date";

type Loan = {
  id: string;
  mission?: string;
  date?: string;
  customer?: { id: string; name?: string; warName?: string; rank?: string };
};
type Equipment = {
  id: string;
  name: string;
  category?: { name?: string };
  serialNumbers?: { id: string; number: string }[];
};
type Customer = { id: string; name: string; warName?: string };

type FormValues = {
  loanId: string;
  equipmentId: string;
  serialNumbers: string[];
  customerId: string;
  date: string;
  mission: string;
  location: string;
  desc: string;
  amount: string;
};

interface Props {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function CreateAlterationDialog({ children, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedEquipmentSerials, setSelectedEquipmentSerials] = useState<
    { id: string; label: string; value: string }[]
  >([]);

  const form = useForm<FormValues>({
    defaultValues: {
      loanId: "",
      equipmentId: "",
      serialNumbers: [],
      customerId: "",
      date: "",
      mission: "",
      location: "",
      desc: "",
      amount: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    fetchLoans();
    fetchEquipments();
    fetchCustomers();
  }, [open]);

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/loans");
      if (!res.ok) throw new Error("Erro");
      const json = await res.json();
      setLoans(json.loans || []);
    } catch {
      toast.error("Erro ao carregar cautelas");
    }
  };

  const fetchEquipments = async () => {
    try {
      const res = await fetch("/api/equipments");
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setEquipments(data || []);
    } catch {
      toast.error("Erro ao carregar equipamentos");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setCustomers(data || []);
    } catch {
      toast.error("Erro ao carregar clientes");
    }
  };

  const handleEquipmentChange = (value: string) => {
    form.setValue("equipmentId", value);
    form.setValue("serialNumbers", []);
    const eq = equipments.find((e) => e.id === value);
    const options = (eq?.serialNumbers || []).map((s) => ({
      id: s.id,
      label: s.number,
      value: s.id,
    }));
    setSelectedEquipmentSerials(options);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const body = {
        loanId: values.loanId || undefined,
        equipment: values.equipmentId,
        serialNumber: values.serialNumbers || [],
        customerId: values.customerId,
        date: values.date ? new Date(values.date) : new Date(),
        mission: values.mission,
        location: values.location,
        desc: values.desc,
        amount: values.amount,
      };

      console.log("Enviando dados:", body);

      const res = await fetch("/api/alterations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData?.error || "Erro ao criar alteração");
      }

      toast.success("Alteração criada com sucesso");
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (err) {
      console.error("Erro no frontend:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar alteração"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Criar Alteração de Equipamento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="loanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cautela (opcional)</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cautela" />
                      </SelectTrigger>
                      <SelectContent>
                        {loans.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.mission
                              ? `${
                                  getRankAbbreviation(l.customer!.rank ?? "") +
                                  " " +
                                  l.customer?.warName
                                } - ${l.mission} - ${getFormattedDate(l.date)}`
                              : l.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="equipmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipamento</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={handleEquipmentChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione equipamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipments.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.warName || c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serialNumbers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Números de Série</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={selectedEquipmentSerials as any}
                      value={field.value || []}
                      onChange={(v: string[]) => field.onChange(v)}
                      placeholder="Selecione números de série"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Missão</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" {...field} />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Criar Alteração"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
