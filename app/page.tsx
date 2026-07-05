import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <h1 className="text-4xl font-heading font-semibold tracking-tight">
        NexusDojo
      </h1>
      <p className="max-w-md text-muted-foreground">
        Plataforma de gestão para escolas de luta. Setup do projeto em
        andamento — ver <code>TASK.md</code> para o progresso por fase.
      </p>
      <Button variant="default">Ação primária</Button>
    </div>
  );
}
