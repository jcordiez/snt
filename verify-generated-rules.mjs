/**
 * Verification script to compare generated rules with WHO Guidelines (Cumulative)
 * Run with: node verify-generated-rules.mjs
 */

import { generateRulesFromGuidelines } from "./src/utils/generate-rules-from-guidelines.ts";
import { PREDEFINED_PLANS } from "./src/data/predefined-plans.ts";

const WHO_GUIDELINES_CUMULATIVE_PLAN = PREDEFINED_PLANS.find(p => p.id === "who-guidelines-cumulative");

console.log("=== Verifying Generated Rules ===\n");

const generatedRules = generateRulesFromGuidelines();
const expectedRules = WHO_GUIDELINES_CUMULATIVE_PLAN.rules;

console.log(`Generated ${generatedRules.length} rules`);
console.log(`Expected ${expectedRules.length} rules\n`);

if (generatedRules.length !== expectedRules.length) {
  console.error("❌ Rule count mismatch!");
} else {
  console.log("✓ Rule count matches");
}

// Compare each rule
for (let i = 0; i < Math.max(generatedRules.length, expectedRules.length); i++) {
  const generated = generatedRules[i];
  const expected = expectedRules[i];

  console.log(`\n--- Rule ${i + 1} ---`);

  if (!generated) {
    console.error(`❌ Missing generated rule at index ${i}`);
    continue;
  }

  if (!expected) {
    console.error(`❌ Extra generated rule at index ${i}: ${generated.title}`);
    continue;
  }

  console.log(`Title: "${generated.title}" vs "${expected.title}"`);
  if (generated.title !== expected.title) {
    console.warn(`  ⚠ Title mismatch`);
  }

  console.log(`Color: "${generated.color}" vs "${expected.color}"`);
  if (generated.color !== expected.color) {
    console.warn(`  ⚠ Color mismatch`);
  }

  console.log(`Criteria count: ${generated.criteria.length} vs ${expected.criteria.length}`);
  if (generated.criteria.length !== expected.criteria.length) {
    console.warn(`  ⚠ Criteria count mismatch`);
  }

  // Compare interventions
  const genInterventions = Array.from(generated.interventionsByCategory.entries()).sort((a, b) => a[0] - b[0]);
  const expInterventions = Array.from(expected.interventionsByCategory.entries()).sort((a, b) => a[0] - b[0]);

  console.log(`Interventions count: ${genInterventions.length} vs ${expInterventions.length}`);

  if (genInterventions.length !== expInterventions.length) {
    console.warn(`  ⚠ Intervention count mismatch`);
  } else {
    let allMatch = true;
    for (let j = 0; j < genInterventions.length; j++) {
      if (
        genInterventions[j][0] !== expInterventions[j][0] ||
        genInterventions[j][1] !== expInterventions[j][1]
      ) {
        allMatch = false;
        console.warn(`  ⚠ Intervention mismatch at position ${j}:`, genInterventions[j], "vs", expInterventions[j]);
      }
    }
    if (allMatch) {
      console.log(`  ✓ All interventions match`);
    }
  }

  // Compare criteria details
  for (let j = 0; j < Math.max(generated.criteria.length, expected.criteria.length); j++) {
    const genCrit = generated.criteria[j];
    const expCrit = expected.criteria[j];

    if (!genCrit || !expCrit) {
      console.warn(`  ⚠ Criterion count mismatch at position ${j}`);
      continue;
    }

    if (
      genCrit.metricTypeId !== expCrit.metricTypeId ||
      genCrit.operator !== expCrit.operator ||
      genCrit.value !== expCrit.value
    ) {
      console.warn(`  ⚠ Criterion mismatch at position ${j}:`);
      console.warn(`    Generated: metricTypeId=${genCrit.metricTypeId}, operator=${genCrit.operator}, value=${genCrit.value}`);
      console.warn(`    Expected:  metricTypeId=${expCrit.metricTypeId}, operator=${expCrit.operator}, value=${expCrit.value}`);
    }
  }
}

console.log("\n=== Verification Complete ===");
