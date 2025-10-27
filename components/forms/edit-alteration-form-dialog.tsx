// components/alterations/edit-alteration-dialog.tsx
"use client";

import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Alteration = {
  id: string;
  desc: string;
  mission: string;
  location: string;
  date: string;
  equipment: string;
  serialNumber: string[];
  amount: string;
  loanId: string;
  customer?: {
    name?: string;
    warName?: string;
    document?: string;
    militaryOrganization?: string;
    phone?: string;
  };
  equipmentMeta?: { name?: string; category?: { name?: string } };
};

type FormValues = {
  mission: string;
  location: string;
  date: string;
  desc: string;
  amount: string;
};

interface Props {
  children: React.ReactNode;
  alteration: Alteration;
  onSuccess?: () => void;
}

export default function EditAlterationDialog({
  children,
  alteration,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      mission: alteration.mission || "",
      location: alteration.location || "",
      date: alteration.date ? alteration.date.split("T")[0] : "",
      desc: alteration.desc || "",
      amount: alteration.amount || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        mission: alteration.mission || "",
        location: alteration.location || "",
        date: alteration.date ? alteration.date.split("T")[0] : "",
        desc: alteration.desc || "",
        amount: alteration.amount || "",
      });
    }
  }, [open, alteration]);

  const onSubmit = async (vals: FormValues) => {
    setIsSaving(true);
    try {
      const body = {
        mission: vals.mission,
        location: vals.location,
        date: vals.date ? new Date(vals.date) : new Date(),
        desc: vals.desc,
        amount: vals.amount,
      };
      const res = await fetch(`/api/alterations/${alteration.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao atualizar");
      }
      toast.success("Alteração atualizada");
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // URL CORRETA - sem o "?id=", usando a dynamic route
      const response = await fetch(
        `/api/alterations/${alteration.id}/download`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao baixar documento");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Extrair filename
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "alteracao.docx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Documento baixado com sucesso");
    } catch (error) {
      console.error("Erro no download:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao baixar documento"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Editar Alteração</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Equipamento</div>
              <div className="font-medium">
                {alteration.equipmentMeta?.name || alteration.equipment}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Categoria</div>
              <div className="font-medium">
                {alteration.equipmentMeta?.category?.name || "-"}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Cliente</div>
              <div className="font-medium">
                {alteration.customer?.warName ||
                  alteration.customer?.name ||
                  "-"}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Quantidade</div>
              <div className="font-medium">{alteration.amount}</div>
            </div>
          </div>

          <Separator />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
          <div className="w-full flex justify-end">
            <Button
              onClick={handleDownload}
              variant="destructive"
              type="button"
            >
              {isDownloading ? "Baixando..." : "Baixar Alteração"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
