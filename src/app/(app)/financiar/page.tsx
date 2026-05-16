import {
  ConstructionNotice,
  PageContainer,
  PageHeader,
} from "@/components/PageHeader";

export default function FinanciarPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Financiar"
        description="Atingem targetele lunare? Venitul lunar comparat cu cele 3 praguri și defalcare pe surse de venit / lead."
      />
      <ConstructionNotice
        stage="Etapa 5 din 6"
        description="Aici vor apărea cele 3 niveluri (Încasat / Confirmat / Potențial), defalcarea pe vizite / zile de naștere / evenimente / abonamente și trendul pe ultimele 12 luni."
      />
    </PageContainer>
  );
}
