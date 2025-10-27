"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Package } from "lucide-react";
import { canManageCategories } from "@/lib/permissions";
import type { Category } from "@prisma/client";
import { CategoryFormDialog } from "@/components/forms/category-form-dialog";
import { CategoryActionsDialog } from "@/components/forms/category-actions-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CategoryWithCount extends Category {
  _count: {
    equipments: number;
  };
}

export default function CategoriesPage() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      toast.error("Erro ao buscar categorias:" + error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      )
  );

  const canManage = session?.user && canManageCategories(session.user.role);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categorias</h1>
        {canManage && (
          <CategoryFormDialog onSuccess={fetchCategories}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </CategoryFormDialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category) => (
          <CategoryActionsDialog
            key={category.id}
            category={category}
            onSuccess={fetchCategories}
          >
            <Card className="cursor-pointer hover:shadow-lg transition">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold truncate">
                    {category.name}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <Badge variant="outline" className="text-xs w-fit">
                  {category._count.equipments} equipamento(s)
                </Badge>
              </CardHeader>

              <CardContent className="pt-0">
                {category.description && (
                  <div className="text-sm text-muted-foreground">
                    <p className="line-clamp-2">{category.description}</p>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Criada em:</span>
                  <span>
                    {new Date(category.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </CategoryActionsDialog>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">
            Nenhuma categoria encontrada
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? "Tente ajustar sua busca"
              : "Comece adicionando uma nova categoria"}
          </p>
        </div>
      )}
    </div>
  );
}
