"use client";

import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  searchActiveStudents,
  type StudentSearchResult,
} from "@/modules/students/search";

export function StudentSearch({
  onSelect,
  excludeIds = [],
}: {
  onSelect: (student: StudentSearchResult) => void;
  excludeIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const data = await searchActiveStudents(query);
        setResults(data);
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const visibleResults = results.filter((s) => !excludeIds.includes(s.id));

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar aluno pelo nome..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus
      />

      <div className="space-y-1">
        {visibleResults.map((student) => (
          <button
            key={student.id}
            type="button"
            onClick={() => onSelect(student)}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2 text-left hover:bg-muted"
          >
            {student.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photoUrl}
                alt={student.name}
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
                {student.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <p className="font-medium">{student.name}</p>
              {student.beltName && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="inline-block size-2.5 rounded-full border border-border"
                    style={{
                      backgroundColor: student.beltColorHex ?? undefined,
                    }}
                  />
                  {student.beltName} · grau {student.currentDegree}
                </p>
              )}
            </div>
          </button>
        ))}

        {isPending && (
          <p className="text-xs text-muted-foreground">Buscando...</p>
        )}

        {!isPending && query.trim() && !visibleResults.length && (
          <p className="text-xs text-muted-foreground">
            Nenhum aluno ativo encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
