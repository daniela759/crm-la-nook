import { db } from "@/lib/db";
import {
  DEFAULT_PRICES,
  DEFAULT_SCHEDULE,
  DEFAULT_SCORE_RULES,
  DEFAULT_TARGETS,
} from "@/lib/domain";

export type Prices = typeof DEFAULT_PRICES;
export type Schedule = typeof DEFAULT_SCHEDULE;
export type Targets = typeof DEFAULT_TARGETS;
export type ScoreRules = typeof DEFAULT_SCORE_RULES;

export type AppSettings = {
  prices: Prices;
  schedule: Schedule;
  targets: Targets;
  scoreRules: ScoreRules;
};

/** Citește setările singleton. Returnează defaults dacă rândul nu există. */
export async function getSettings(): Promise<AppSettings> {
  const row = await db.settings.findUnique({ where: { id: 1 } });
  if (!row) {
    return {
      prices: DEFAULT_PRICES,
      schedule: DEFAULT_SCHEDULE,
      targets: DEFAULT_TARGETS,
      scoreRules: DEFAULT_SCORE_RULES,
    };
  }
  return {
    prices: JSON.parse(row.prices) as Prices,
    schedule: JSON.parse(row.schedule) as Schedule,
    targets: JSON.parse(row.targets) as Targets,
    scoreRules: JSON.parse(row.scoreRules) as ScoreRules,
  };
}
