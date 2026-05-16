import {
  ConstructionNotice,
  PageContainer,
  PageHeader,
} from "@/components/PageHeader";

export default function IncasariPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Încasări potențiale"
        description="Banii pe drum — toate rezervările viitoare cu valoarea estimată, pâlnia Potențial → Confirmat → Încasat."
      />
      <ConstructionNotice
        stage="Etapa 5 din 6"
        description="Aici va apărea pâlnia financiară pe trei niveluri și proiecția lunii curente comparată cu cele 3 targete (18k / 30k / 50k lei)."
      />
    </PageContainer>
  );
}
