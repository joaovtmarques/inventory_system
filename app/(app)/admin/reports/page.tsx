"use client";

import { useEffect, useState } from "react";
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
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  if (!session?.user || !canGenerateReports(session.user.role)) {
    redirect("/app/dashboard");
  }

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, []);

  const handleDownload = async () => {
    try {
      const params = new URLSearchParams();

      if (selectedCategories.length > 0) {
        selectedCategories.forEach((categoryId) => {
          params.append("categories", categoryId);
        });
      }

      const response = await fetch(`/api/ready/download?${params.toString()}`);
      if (!response.ok) throw new Error("Erro ao gerar relatório");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

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

            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium">
                Selecione as categorias que devem sair no pronto
              </p>

              {/* 🔽 CONTAINER COM SCROLL */}
              <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      value={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories((prev) => [
                            ...prev,
                            category.id,
                          ]);
                        } else {
                          setSelectedCategories((prev) =>
                            prev.filter((id) => id !== category.id)
                          );
                        }
                      }}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

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
