import {
  ConstructionNotice,
  PageContainer,
  PageHeader,
} from "@/components/PageHeader";

export default function CalendarPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="Spațiul de joacă văzut ca ocupare în timp — sloturi standard, rezervări, zile de naștere și evenimente."
      />
      <ConstructionNotice
        stage="Etapa 4 din 6"
        description="Aici va apărea vizualizarea săptămânală și lunară cu sloturile pre-populate (L–V 10–12 și 16–18; weekend 10–12), zile de naștere care blochează 3 ore, și indicator de capacitate rămasă."
      />
    </PageContainer>
  );
}
