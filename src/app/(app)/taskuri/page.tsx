import {
  ConstructionNotice,
  PageContainer,
  PageHeader,
} from "@/components/PageHeader";

export default function TaskuriPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Taskuri zilnice"
        description="Lista de lucru a zilei — taskuri manuale și auto-generate, sortate după prioritate."
      />
      <ConstructionNotice
        stage="Etapa 6 din 6"
        description="Aici vor apărea: confirmare rezervări noi după 24h, ofertă abonament la scor ≥ 60, reînnoire abonamente aproape consumate, recuperare no-show la +48h. Plus taskuri manuale."
      />
    </PageContainer>
  );
}
