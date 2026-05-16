import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { getSettings } from "@/lib/settings";
import {
  InterestsEditor,
  LeadSourcesEditor,
  PricesForm,
  ScheduleForm,
  ScoreRulesForm,
  TargetsForm,
} from "./Forms";

export default async function SetariPage() {
  const [settings, sources, interests] = await Promise.all([
    getSettings(),
    db.leadSource.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    db.interest.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Setări"
        description="Configurarea afacerii — toate aceste valori se folosesc peste tot în CRM. Modificările au efect imediat."
      />

      <div className="mt-8 space-y-6">
        <PricesForm prices={settings.prices} />
        <TargetsForm targets={settings.targets} />
        <ScheduleForm schedule={settings.schedule} />
        <ScoreRulesForm rules={settings.scoreRules} />
        <div className="grid gap-6 lg:grid-cols-2">
          <LeadSourcesEditor items={sources} />
          <InterestsEditor items={interests} />
        </div>
      </div>
    </PageContainer>
  );
}
