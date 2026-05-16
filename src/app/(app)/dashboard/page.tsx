import {
  ConstructionNotice,
  PageContainer,
  PageHeader,
} from "@/components/PageHeader";

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Sănătatea afacerii într-o privire de 10 secunde — venit lunar, conversie lead → vizită, oportunități fierbinți."
      />
      <ConstructionNotice
        stage="Etapa 6 din 6"
        description="Aici va apărea cardul de venit lunar cu semafor (roșu < 18.000 lei, galben 18–30k, verde 30–50k, verde-aprins > 50k), rata de no-show, abonamentele active și contactele pregătite pentru abonament."
      />
    </PageContainer>
  );
}
