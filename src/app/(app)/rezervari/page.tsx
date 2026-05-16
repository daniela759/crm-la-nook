import {
  ConstructionNotice,
  PageContainer,
  PageHeader,
} from "@/components/PageHeader";

export default function RezervariPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Rezervări"
        description="Tabelul operațional al lead-urilor — cine vine și în ce stare e fiecare rezervare."
      />
      <ConstructionNotice
        stage="Etapa 3 din 6"
        description="Aici vor apărea: lista filtrabilă după status / dată / sursă / tip; acțiuni rapide Confirmă · Prezent · Absent · Încasează; buton „Rezervare nouă” cu flow integrat de creare contact + lead."
      />
    </PageContainer>
  );
}
