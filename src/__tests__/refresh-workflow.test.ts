import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/update-results.yml", "utf8");

describe("refresh workflow", () => {
  it("runs result and stat refreshes before checking generated data changes", () => {
    const resultRefresh = workflow.indexOf("npm run update-results");
    const statRefresh = workflow.indexOf("npm run update-stats");
    const changeCheck = workflow.indexOf("git diff --quiet -- src/data/tournament.generated.json");

    expect(resultRefresh).toBeGreaterThan(-1);
    expect(statRefresh).toBeGreaterThan(resultRefresh);
    expect(changeCheck).toBeGreaterThan(statRefresh);
  });

  it("validates, commits, and deploys only when generated data changes", () => {
    expect(workflow).toContain("if: steps.changes.outputs.changed == 'true'\n        run: npm test");
    expect(workflow).toContain("if: steps.changes.outputs.changed == 'true'\n        run: npm run typecheck");
    expect(workflow).toContain("if: steps.changes.outputs.changed == 'true'\n        run: npm run build");
    expect(workflow).toContain("git add src/data/tournament.generated.json");
    expect(workflow).toContain("npx wrangler pages deploy dist --project-name worldcup2026 --branch main");
  });

  it("indexes scenario vectors only after changed data is deployed", () => {
    const changeCheck = workflow.indexOf("git diff --quiet -- src/data/tournament.generated.json");
    const tests = workflow.indexOf("npm test");
    const build = workflow.indexOf("npm run build");
    const artifactVerify = workflow.indexOf("Verify Cloudflare Pages artifact");
    const scenarioIndex = workflow.indexOf("npm run index-scenarios");
    const commit = workflow.indexOf("git commit -m \"chore(data): update tournament results\"");
    const deploy = workflow.indexOf("npx wrangler pages deploy dist --project-name worldcup2026 --branch main");

    expect(scenarioIndex).toBeGreaterThan(artifactVerify);
    expect(scenarioIndex).toBeGreaterThan(build);
    expect(scenarioIndex).toBeGreaterThan(tests);
    expect(scenarioIndex).toBeGreaterThan(changeCheck);
    expect(scenarioIndex).toBeGreaterThan(commit);
    expect(scenarioIndex).toBeGreaterThan(deploy);
    expect(workflow).toContain("if: steps.changes.outputs.changed == 'true'\n        run: npm run index-scenarios");
  });
});
