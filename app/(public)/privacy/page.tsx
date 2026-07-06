import { BackLink } from "@/components/layout/back-link";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6 text-foreground">
      <div className="flex justify-end">
        <BackLink href="/login" />
      </div>

      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
        <strong>Rascunho — não publicado.</strong> Este texto é um ponto de
        partida gerado automaticamente, baseado na LGPD e nos dados que o
        NexusDojo efetivamente coleta. Precisa de revisão jurídica antes de
        ser considerado a política de privacidade oficial da escola
        (Fase 8.7 do <code>TASK.md</code>).
      </div>

      <h1 className="font-heading text-2xl font-semibold">
        Política de Privacidade
      </h1>

      <section className="space-y-2 text-sm">
        <h2 className="font-heading text-lg font-semibold">
          1. Quem somos
        </h2>
        <p>
          Esta política descreve como a escola coleta, usa e protege dados
          pessoais de alunos, responsáveis e professores cadastrados no
          NexusDojo, em conformidade com a Lei Geral de Proteção de Dados
          (Lei nº 13.709/2018 — LGPD).
        </p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-heading text-lg font-semibold">
          2. Dados que coletamos
        </h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Dados de identificação: nome, data de nascimento, CPF.</li>
          <li>Dados de contato: telefone, e-mail, endereço.</li>
          <li>Dados de responsáveis/contato de emergência.</li>
          <li>
            Dados financeiros: plano contratado, parcelas, pagamentos e
            histórico de inadimplência.
          </li>
          <li>Dados de frequência: presença em aulas e turmas.</li>
          <li>Dados de graduação: faixa, grau e histórico de graduações.</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-heading text-lg font-semibold">
          3. Finalidade do tratamento
        </h2>
        <p>
          Os dados são usados exclusivamente para gestão operacional da
          escola: matrícula, controle de frequência, cobrança e controle
          financeiro, acompanhamento de graduação e comunicação direta com
          aluno/responsável sobre a relação com a escola.
        </p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-heading text-lg font-semibold">
          4. Compartilhamento
        </h2>
        <p>
          Os dados não são vendidos ou compartilhados com terceiros para
          fins de marketing. Podem ser processados por prestadores de
          infraestrutura (hospedagem e banco de dados) estritamente para
          viabilizar o funcionamento do sistema.
        </p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-heading text-lg font-semibold">
          5. Direitos do titular
        </h2>
        <p>
          Você pode solicitar acesso, correção, portabilidade ou exclusão
          dos seus dados pessoais a qualquer momento, entrando em contato
          diretamente com a administração da escola.
        </p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-heading text-lg font-semibold">
          6. Retenção e segurança
        </h2>
        <p>
          Os dados são mantidos enquanto durar o vínculo do aluno com a
          escola e pelo período exigido por obrigações legais e
          financeiras. O acesso é restrito à equipe administrativa e a
          professores autorizados, com controle de permissões por escola.
        </p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-heading text-lg font-semibold">
          7. Contato
        </h2>
        <p>
          Dúvidas sobre esta política podem ser encaminhadas diretamente à
          administração da escola.
        </p>
      </section>
    </div>
  );
}
