"use client";

import {
  User,
  Users,
  Wallet,
  GraduationCap,
  CalendarClock,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function StudentEditTabs({
  personalTab,
  guardiansTab,
  financialTab,
  graduationTab,
  attendanceTab,
}: {
  personalTab: React.ReactNode;
  guardiansTab: React.ReactNode;
  financialTab: React.ReactNode;
  graduationTab: React.ReactNode;
  attendanceTab: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="dados" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="dados">
          <User className="mr-1.5 size-4" />
          Dados pessoais
        </TabsTrigger>
        <TabsTrigger value="responsaveis">
          <Users className="mr-1.5 size-4" />
          Responsáveis
        </TabsTrigger>
        <TabsTrigger value="financeiro">
          <Wallet className="mr-1.5 size-4" />
          Financeiro
        </TabsTrigger>
        <TabsTrigger value="graduacao">
          <GraduationCap className="mr-1.5 size-4" />
          Graduação
        </TabsTrigger>
        <TabsTrigger value="frequencia">
          <CalendarClock className="mr-1.5 size-4" />
          Frequência
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="flex flex-col items-center gap-6">
        {personalTab}
      </TabsContent>
      <TabsContent value="responsaveis" className="flex flex-col items-center gap-6">
        {guardiansTab}
      </TabsContent>
      <TabsContent value="financeiro" className="flex flex-col items-center gap-6">
        {financialTab}
      </TabsContent>
      <TabsContent value="graduacao" className="flex flex-col items-center gap-6">
        {graduationTab}
      </TabsContent>
      <TabsContent value="frequencia" className="flex flex-col items-center gap-6">
        {attendanceTab}
      </TabsContent>
    </Tabs>
  );
}
