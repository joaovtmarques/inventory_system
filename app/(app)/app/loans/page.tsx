"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoansTable } from "@/components/tables/loans-table";
import { isAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default function LoansPage() {
  const { data: session } = useSession();

  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/app/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Cautelas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Cautelas</CardTitle>
        </CardHeader>
        <CardContent>
          <LoansTable />
        </CardContent>
      </Card>
    </div>
  );
}