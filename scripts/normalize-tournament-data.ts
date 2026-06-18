import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tournamentData } from "../src/data/tournament";
import { validateTournamentData } from "../src/data/schema";

const outputPath = resolve("src/data/tournament.generated.json");
const sourcePath = process.argv[2];

const data = sourcePath ? JSON.parse(readFileSync(sourcePath, "utf8")) : tournamentData;
const issues = validateTournamentData(data);

if (issues.length > 0) {
  console.error("Tournament data failed validation:");
  for (const issue of issues) console.error(`- ${issue.path}: ${issue.message}`);
  process.exit(1);
}

writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
