"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { canGenerateReports } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default function ReportsPage() {
  const { data: session } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!session?.user || !canGenerateReports(session.user.role)) {
    redirect("/app/dashboard");
  }

  const handleDownload = async () => {
    try {
      const response = await fetch("/api/ready/download");
      if (!response.ok) throw new Error("Erro ao gerar relatório");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Gerar nome do arquivo com data atual
      const currentDate = new Date()
        .toLocaleDateString("pt-BR")
        .replace(/\//g, "-");
      const fileName = `situacao-equipamentos-${currentDate}.docx`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Relatório baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao baixar relatório");
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/reports/daily", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Relatório gerado com sucesso!");

        // Fazer download automático
        if (data.downloadUrl) {
          const downloadResponse = await fetch(data.downloadUrl);
          const blob = await downloadResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao gerar relatório");
      }
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Relatórios</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Gerar Pronto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gera o relatório diário com a situação atual dos equipamentos em
              cautela e estoque geral.
            </p>
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                "Gerando..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
