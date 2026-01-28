/**
 * Validation script for criteria matching logic
 *
 * This script validates that:
 * 1. The evaluateRule function correctly handles all operators
 * 2. The predefined plans' criteria are correctly defined
 * 3. Districts are correctly matched based on their metric values
 *
 * Run with: npx tsx scripts/validate-criteria-matching.ts
 */

import { evaluateRule } from "../src/hooks/use-district-rules";
import { getPlanById, PREDEFINED_PLANS } from "../src/data/predefined-plans";
import type { RuleOperator } from "../src/types/intervention";

// Colors for console output
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`${GREEN}✓${RESET} ${message}`);
    passCount++;
  } else {
    console.log(`${RED}✗${RESET} ${message}`);
    failCount++;
  }
}

function section(title: string): void {
  console.log(`\n${YELLOW}=== ${title} ===${RESET}\n`);
}

// Test 1: evaluateRule function with all operators
section("Testing evaluateRule function");

// Test "<" operator
assert(evaluateRule(5, "<", 10) === true, "5 < 10 should be true");
assert(evaluateRule(10, "<", 10) === false, "10 < 10 should be false");
assert(evaluateRule(15, "<", 10) === false, "15 < 10 should be false");

// Test "<=" operator
assert(evaluateRule(5, "<=", 10) === true, "5 <= 10 should be true");
assert(evaluateRule(10, "<=", 10) === true, "10 <= 10 should be true");
assert(evaluateRule(15, "<=", 10) === false, "15 <= 10 should be false");

// Test "=" operator
assert(evaluateRule(10, "=", 10) === true, "10 = 10 should be true");
assert(evaluateRule(5, "=", 10) === false, "5 = 10 should be false");
assert(evaluateRule(15, "=", 10) === false, "15 = 10 should be false");

// Test ">=" operator
assert(evaluateRule(15, ">=", 10) === true, "15 >= 10 should be true");
assert(evaluateRule(10, ">=", 10) === true, "10 >= 10 should be true");
assert(evaluateRule(5, ">=", 10) === false, "5 >= 10 should be false");

// Test ">" operator
assert(evaluateRule(15, ">", 10) === true, "15 > 10 should be true");
assert(evaluateRule(10, ">", 10) === false, "10 > 10 should be false");
assert(evaluateRule(5, ">", 10) === false, "5 > 10 should be false");

// Test with decimal values (important for criteria like seasonality >= 0.6)
assert(evaluateRule(0.6, ">=", 0.6) === true, "0.6 >= 0.6 should be true");
assert(evaluateRule(0.7, ">=", 0.6) === true, "0.7 >= 0.6 should be true");
assert(evaluateRule(0.5, ">=", 0.6) === false, "0.5 >= 0.6 should be false");
assert(evaluateRule(0.59, "<", 0.6) === true, "0.59 < 0.6 should be true");
assert(evaluateRule(0.6, "<", 0.6) === false, "0.6 < 0.6 should be false");

// Test with invalid operator (should return false)
assert(evaluateRule(5, "invalid" as RuleOperator, 10) === false, "invalid operator should return false");

// Test 2: Predefined plans structure
section("Testing predefined plans structure");

assert(PREDEFINED_PLANS.length === 2, "Should have 2 predefined plans");

const bauPlan = getPlanById("bau");
const nspPlan = getPlanById("nsp-2026-30");

assert(bauPlan !== undefined, "BAU plan should exist");
assert(nspPlan !== undefined, "NSP 2026-30 plan should exist");
assert(getPlanById("invalid") === undefined, "Invalid plan ID should return undefined");

// Test 3: BAU plan structure
section("Testing BAU plan criteria");

if (bauPlan) {
  assert(bauPlan.id === "bau", "BAU plan ID should be 'bau'");
  assert(bauPlan.name === "BAU", "BAU plan name should be 'BAU'");
  assert(bauPlan.rules.length === 2, "BAU plan should have 2 rules");

  const bauRule1 = bauPlan.rules[0];
  const bauDefault = bauPlan.rules[1];

  // Check Rule 1 criteria
  assert(bauRule1.criteria.length === 4, "BAU Rule 1 should have 4 criteria");
  assert(bauRule1.isAllDistricts === false, "BAU Rule 1 should not be isAllDistricts");

  // Verify specific criteria values from PRD
  const bauSeasonality = bauRule1.criteria.find(c => c.metricTypeId === 413);
  assert(bauSeasonality?.operator === "<", "BAU Rule 1 seasonality operator should be '<'");
  assert(bauSeasonality?.value === "0.7", "BAU Rule 1 seasonality value should be '0.7'");

  const bauIncidence = bauRule1.criteria.find(c => c.metricTypeId === 410);
  assert(bauIncidence?.operator === ">=", "BAU Rule 1 incidence operator should be '>='");
  assert(bauIncidence?.value === "500", "BAU Rule 1 incidence value should be '500'");

  const bauMortality = bauRule1.criteria.find(c => c.metricTypeId === 407);
  assert(bauMortality?.operator === "<", "BAU Rule 1 mortality operator should be '<'");
  assert(bauMortality?.value === "10", "BAU Rule 1 mortality value should be '10'");

  const bauResistance = bauRule1.criteria.find(c => c.metricTypeId === 412);
  assert(bauResistance?.operator === ">=", "BAU Rule 1 resistance operator should be '>='");
  assert(bauResistance?.value === "0.75", "BAU Rule 1 resistance value should be '0.75'");

  // Check default rule
  assert(bauDefault.criteria.length === 0, "BAU default rule should have no criteria");
  assert(bauDefault.isAllDistricts === true, "BAU default rule should be isAllDistricts");
}

// Test 4: NSP 2026-30 plan structure
section("Testing NSP 2026-30 plan criteria");

if (nspPlan) {
  assert(nspPlan.id === "nsp-2026-30", "NSP plan ID should be 'nsp-2026-30'");
  assert(nspPlan.name === "NSP 2026-30", "NSP plan name should be 'NSP 2026-30'");
  assert(nspPlan.rules.length === 4, "NSP plan should have 4 rules");

  const nspRule1 = nspPlan.rules[0];
  const nspRule2 = nspPlan.rules[1];
  const nspRule3 = nspPlan.rules[2];
  const nspDefault = nspPlan.rules[3];

  // Rule 1: High Seasonality, High Mortality (2 criteria)
  assert(nspRule1.criteria.length === 2, "NSP Rule 1 should have 2 criteria");
  const nsp1Seasonality = nspRule1.criteria.find(c => c.metricTypeId === 413);
  assert(nsp1Seasonality?.operator === ">=", "NSP Rule 1 seasonality operator should be '>='");
  assert(nsp1Seasonality?.value === "0.6", "NSP Rule 1 seasonality value should be '0.6'");
  const nsp1Mortality = nspRule1.criteria.find(c => c.metricTypeId === 407);
  assert(nsp1Mortality?.operator === ">=", "NSP Rule 1 mortality operator should be '>='");
  assert(nsp1Mortality?.value === "5", "NSP Rule 1 mortality value should be '5'");

  // Rule 2: Low Seasonality, High Incidence, High Mortality, High Resistance (4 criteria)
  assert(nspRule2.criteria.length === 4, "NSP Rule 2 should have 4 criteria");
  const nsp2Seasonality = nspRule2.criteria.find(c => c.metricTypeId === 413);
  assert(nsp2Seasonality?.operator === "<", "NSP Rule 2 seasonality operator should be '<'");
  assert(nsp2Seasonality?.value === "0.6", "NSP Rule 2 seasonality value should be '0.6'");
  const nsp2Incidence = nspRule2.criteria.find(c => c.metricTypeId === 410);
  assert(nsp2Incidence?.operator === ">=", "NSP Rule 2 incidence operator should be '>='");
  assert(nsp2Incidence?.value === "300", "NSP Rule 2 incidence value should be '300'");
  const nsp2Mortality = nspRule2.criteria.find(c => c.metricTypeId === 407);
  assert(nsp2Mortality?.operator === ">=", "NSP Rule 2 mortality operator should be '>='");
  assert(nsp2Mortality?.value === "5", "NSP Rule 2 mortality value should be '5'");
  const nsp2Resistance = nspRule2.criteria.find(c => c.metricTypeId === 412);
  assert(nsp2Resistance?.operator === ">=", "NSP Rule 2 resistance operator should be '>='");
  assert(nsp2Resistance?.value === "0.75", "NSP Rule 2 resistance value should be '0.75'");

  // Rule 3: Low Seasonality, High Incidence, Low Mortality, High Resistance (4 criteria)
  assert(nspRule3.criteria.length === 4, "NSP Rule 3 should have 4 criteria");
  const nsp3Seasonality = nspRule3.criteria.find(c => c.metricTypeId === 413);
  assert(nsp3Seasonality?.operator === "<", "NSP Rule 3 seasonality operator should be '<'");
  assert(nsp3Seasonality?.value === "0.6", "NSP Rule 3 seasonality value should be '0.6'");
  const nsp3Incidence = nspRule3.criteria.find(c => c.metricTypeId === 410);
  assert(nsp3Incidence?.operator === ">=", "NSP Rule 3 incidence operator should be '>='");
  assert(nsp3Incidence?.value === "300", "NSP Rule 3 incidence value should be '300'");
  const nsp3Mortality = nspRule3.criteria.find(c => c.metricTypeId === 407);
  assert(nsp3Mortality?.operator === "<", "NSP Rule 3 mortality operator should be '<'");
  assert(nsp3Mortality?.value === "5", "NSP Rule 3 mortality value should be '5'");
  const nsp3Resistance = nspRule3.criteria.find(c => c.metricTypeId === 412);
  assert(nsp3Resistance?.operator === ">=", "NSP Rule 3 resistance operator should be '>='");
  assert(nsp3Resistance?.value === "0.75", "NSP Rule 3 resistance value should be '0.75'");

  // Default rule
  assert(nspDefault.criteria.length === 0, "NSP default rule should have no criteria");
  assert(nspDefault.isAllDistricts === true, "NSP default rule should be isAllDistricts");
}

// Test 5: Simulated district matching scenarios
section("Testing district matching scenarios");

// Helper function to simulate matching a district against criteria
function matchesAllCriteria(
  districtMetrics: Record<number, number>,
  criteria: Array<{ metricTypeId: number | null; operator: RuleOperator; value: string }>
): boolean {
  return criteria.every((criterion) => {
    if (criterion.metricTypeId === null) return false;
    const metricValue = districtMetrics[criterion.metricTypeId];
    if (metricValue === undefined) return false;
    const threshold = Number(criterion.value);
    return evaluateRule(metricValue, criterion.operator, threshold);
  });
}

// Scenario 1: District matching NSP Rule 1 (High Seasonality, High Mortality)
const districtMatchingNspRule1 = {
  413: 0.8,  // seasonality >= 0.6 ✓
  407: 10,   // mortality >= 5 ✓
  410: 200,  // incidence (not used in rule 1)
  412: 0.5,  // resistance (not used in rule 1)
};
if (nspPlan) {
  const matches = matchesAllCriteria(districtMatchingNspRule1, nspPlan.rules[0].criteria);
  assert(matches === true, "District with seasonality=0.8, mortality=10 should match NSP Rule 1");
}

// Scenario 2: District NOT matching NSP Rule 1 (low seasonality)
const districtNotMatchingNspRule1 = {
  413: 0.5,  // seasonality < 0.6, fails >= 0.6
  407: 10,   // mortality >= 5 ✓
};
if (nspPlan) {
  const matches = matchesAllCriteria(districtNotMatchingNspRule1, nspPlan.rules[0].criteria);
  assert(matches === false, "District with seasonality=0.5 should NOT match NSP Rule 1");
}

// Scenario 3: District matching NSP Rule 2 (Low Seasonality, High Incidence, High Mortality, High Resistance)
const districtMatchingNspRule2 = {
  413: 0.5,   // seasonality < 0.6 ✓
  410: 400,   // incidence >= 300 ✓
  407: 8,     // mortality >= 5 ✓
  412: 0.8,   // resistance >= 0.75 ✓
};
if (nspPlan) {
  const matches = matchesAllCriteria(districtMatchingNspRule2, nspPlan.rules[1].criteria);
  assert(matches === true, "District with seasonality=0.5, incidence=400, mortality=8, resistance=0.8 should match NSP Rule 2");
}

// Scenario 4: District matching NSP Rule 3 (same as rule 2 but LOW mortality)
const districtMatchingNspRule3 = {
  413: 0.5,   // seasonality < 0.6 ✓
  410: 400,   // incidence >= 300 ✓
  407: 3,     // mortality < 5 ✓
  412: 0.8,   // resistance >= 0.75 ✓
};
if (nspPlan) {
  const matchesRule2 = matchesAllCriteria(districtMatchingNspRule3, nspPlan.rules[1].criteria);
  const matchesRule3 = matchesAllCriteria(districtMatchingNspRule3, nspPlan.rules[2].criteria);
  assert(matchesRule2 === false, "District with mortality=3 should NOT match NSP Rule 2 (requires mortality >= 5)");
  assert(matchesRule3 === true, "District with mortality=3 should match NSP Rule 3 (requires mortality < 5)");
}

// Scenario 5: District matching BAU Rule 1
const districtMatchingBauRule1 = {
  413: 0.6,   // seasonality < 0.7 ✓
  410: 600,   // incidence >= 500 ✓
  407: 8,     // mortality < 10 ✓
  412: 0.8,   // resistance >= 0.75 ✓
};
if (bauPlan) {
  const matches = matchesAllCriteria(districtMatchingBauRule1, bauPlan.rules[0].criteria);
  assert(matches === true, "District with seasonality=0.6, incidence=600, mortality=8, resistance=0.8 should match BAU Rule 1");
}

// Scenario 6: District NOT matching BAU Rule 1 (incidence too low)
const districtNotMatchingBauRule1 = {
  413: 0.6,   // seasonality < 0.7 ✓
  410: 400,   // incidence < 500, fails >= 500
  407: 8,     // mortality < 10 ✓
  412: 0.8,   // resistance >= 0.75 ✓
};
if (bauPlan) {
  const matches = matchesAllCriteria(districtNotMatchingBauRule1, bauPlan.rules[0].criteria);
  assert(matches === false, "District with incidence=400 should NOT match BAU Rule 1 (requires >= 500)");
}

// Scenario 7: Edge case - boundary values
const districtAtBoundary = {
  413: 0.6,   // seasonality = 0.6 (boundary for NSP >= 0.6 and BAU < 0.7)
  410: 300,   // incidence = 300 (boundary for NSP >= 300)
  407: 5,     // mortality = 5 (boundary for NSP >= 5)
  412: 0.75,  // resistance = 0.75 (boundary for >= 0.75)
};
if (nspPlan) {
  const matchesNspRule1 = matchesAllCriteria(districtAtBoundary, nspPlan.rules[0].criteria);
  const matchesNspRule2 = matchesAllCriteria(districtAtBoundary, nspPlan.rules[1].criteria);
  assert(matchesNspRule1 === true, "District at boundary (seasonality=0.6, mortality=5) should match NSP Rule 1");
  assert(matchesNspRule2 === false, "District at boundary should NOT match NSP Rule 2 (seasonality needs to be < 0.6)");
}

// Final summary
section("Summary");
console.log(`${GREEN}Passed: ${passCount}${RESET}`);
console.log(`${RED}Failed: ${failCount}${RESET}`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`\n${GREEN}All criteria matching tests passed!${RESET}\n`);
  process.exit(0);
}
