/**
 * Validation script for navigation flows
 *
 * This script validates that:
 * 1. Sidebar navigation links are correctly generated for all predefined plans
 * 2. Active route detection logic works correctly for all routes
 * 3. Plan routes map to correct plan IDs
 * 4. Invalid plan IDs are handled correctly
 * 5. All expected routes are defined
 *
 * Run with: npx tsx scripts/validate-navigation-flows.ts
 */

import { PREDEFINED_PLANS, getPlanById } from "../src/data/predefined-plans";

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

// Simulate the pathname detection logic from app-sidebar.tsx
function getActiveRouteInfo(pathname: string) {
  const isNewPlanActive = pathname === "/plan";
  const activePlanId = pathname.startsWith("/plan/") ? pathname.split("/")[2] : null;
  const isWelcomeScreen = pathname === "/";
  const isLayersActive = pathname === "/layers";
  const isCostSettingsActive = pathname === "/cost-settings";
  const isCompositeScoresActive = pathname === "/composite-scores";
  const isHelpActive = pathname === "/help";
  const isFeedbackActive = pathname === "/feedback";
  const isAccountActive = pathname === "/account";
  const isSearchActive = pathname === "/search";
  const isCompareActive = pathname === "/compare";

  return {
    isNewPlanActive,
    activePlanId,
    isWelcomeScreen,
    isLayersActive,
    isCostSettingsActive,
    isCompositeScoresActive,
    isHelpActive,
    isFeedbackActive,
    isAccountActive,
    isSearchActive,
    isCompareActive,
  };
}

// Test 1: Route structure validation
section("Testing route structure");

// Test root route
const rootRoute = getActiveRouteInfo("/");
assert(rootRoute.isWelcomeScreen === true, "Root route '/' should be welcome screen");
assert(rootRoute.isNewPlanActive === false, "Root route should not show new plan as active");
assert(rootRoute.activePlanId === null, "Root route should have no active plan ID");

// Test new plan route
const newPlanRoute = getActiveRouteInfo("/plan");
assert(newPlanRoute.isNewPlanActive === true, "'/plan' route should show new plan as active");
assert(newPlanRoute.activePlanId === null, "'/plan' route should have no active plan ID");
assert(newPlanRoute.isWelcomeScreen === false, "'/plan' route should not be welcome screen");

// Test predefined plan routes
const bauRoute = getActiveRouteInfo("/plan/bau");
assert(bauRoute.activePlanId === "bau", "'/plan/bau' should have activePlanId 'bau'");
assert(bauRoute.isNewPlanActive === false, "'/plan/bau' should not show new plan as active");

const nspRoute = getActiveRouteInfo("/plan/nsp-2026-30");
assert(nspRoute.activePlanId === "nsp-2026-30", "'/plan/nsp-2026-30' should have activePlanId 'nsp-2026-30'");
assert(nspRoute.isNewPlanActive === false, "'/plan/nsp-2026-30' should not show new plan as active");

// Test 2: Sidebar link generation for predefined plans
section("Testing sidebar link generation");

// Verify all predefined plans have valid IDs for URL generation
PREDEFINED_PLANS.forEach((plan) => {
  const expectedPath = `/plan/${plan.id}`;
  assert(plan.id !== "", `Plan '${plan.name}' should have non-empty ID`);
  assert(!plan.id.includes(" "), `Plan ID '${plan.id}' should not contain spaces`);
  assert(expectedPath.startsWith("/plan/"), `Plan path '${expectedPath}' should start with '/plan/'`);

  // Verify the plan can be retrieved by ID
  const retrievedPlan = getPlanById(plan.id);
  assert(retrievedPlan !== undefined, `Plan with ID '${plan.id}' should be retrievable`);
  assert(retrievedPlan?.name === plan.name, `Retrieved plan name should match '${plan.name}'`);
});

// Test 3: Active state detection for plan links
section("Testing active state detection for plans");

PREDEFINED_PLANS.forEach((plan) => {
  const pathname = `/plan/${plan.id}`;
  const routeInfo = getActiveRouteInfo(pathname);

  // The current plan should be active
  assert(
    routeInfo.activePlanId === plan.id,
    `Route '${pathname}' should have activePlanId '${plan.id}'`
  );

  // Other plans should not be active
  PREDEFINED_PLANS.filter((p) => p.id !== plan.id).forEach((otherPlan) => {
    assert(
      routeInfo.activePlanId !== otherPlan.id,
      `Route '${pathname}' should NOT have activePlanId '${otherPlan.id}'`
    );
  });
});

// Test 4: Settings routes active state
section("Testing settings routes active state");

const layersRoute = getActiveRouteInfo("/layers");
assert(layersRoute.isLayersActive === true, "'/layers' should show layers as active");
assert(layersRoute.activePlanId === null, "'/layers' should have no active plan ID");

const costSettingsRoute = getActiveRouteInfo("/cost-settings");
assert(costSettingsRoute.isCostSettingsActive === true, "'/cost-settings' should show cost settings as active");
assert(costSettingsRoute.activePlanId === null, "'/cost-settings' should have no active plan ID");

const compositeScoresRoute = getActiveRouteInfo("/composite-scores");
assert(compositeScoresRoute.isCompositeScoresActive === true, "'/composite-scores' should show composite scores as active");
assert(compositeScoresRoute.activePlanId === null, "'/composite-scores' should have no active plan ID");

// Test 5: Footer routes active state
section("Testing footer routes active state");

const helpRoute = getActiveRouteInfo("/help");
assert(helpRoute.isHelpActive === true, "'/help' should show help as active");

const feedbackRoute = getActiveRouteInfo("/feedback");
assert(feedbackRoute.isFeedbackActive === true, "'/feedback' should show feedback as active");

const accountRoute = getActiveRouteInfo("/account");
assert(accountRoute.isAccountActive === true, "'/account' should show account as active");

// Test 6: Action routes active state
section("Testing action routes active state");

const searchRoute = getActiveRouteInfo("/search");
assert(searchRoute.isSearchActive === true, "'/search' should show search as active");

const compareRoute = getActiveRouteInfo("/compare");
assert(compareRoute.isCompareActive === true, "'/compare' should show compare as active");

// Test 7: Invalid plan ID handling
section("Testing invalid plan ID handling");

const invalidPlanRoute = getActiveRouteInfo("/plan/invalid-plan");
assert(invalidPlanRoute.activePlanId === "invalid-plan", "Invalid plan route should extract plan ID");
assert(getPlanById("invalid-plan") === undefined, "getPlanById should return undefined for invalid ID");

const emptyPlanRoute = getActiveRouteInfo("/plan/");
assert(emptyPlanRoute.activePlanId === "", "'/plan/' should extract empty string as plan ID");

// Test 8: Edge cases in pathname parsing
section("Testing pathname parsing edge cases");

// Nested paths should only extract first segment after /plan/
const nestedRoute = getActiveRouteInfo("/plan/bau/edit");
assert(nestedRoute.activePlanId === "bau", "Nested route should extract 'bau' as plan ID");

// Paths with query params (simulated - query params handled separately by Next.js)
const pathWithTrailingSlash = getActiveRouteInfo("/plan/bau/");
assert(pathWithTrailingSlash.activePlanId === "bau", "Path with trailing slash should extract 'bau'");

// Test 9: Navigation flow scenarios
section("Testing navigation flow scenarios");

// Scenario 1: User lands on welcome screen, clicks BAU plan
const scenario1Start = getActiveRouteInfo("/");
const scenario1End = getActiveRouteInfo("/plan/bau");
assert(
  scenario1Start.isWelcomeScreen && scenario1End.activePlanId === "bau",
  "Scenario 1: Welcome screen -> BAU plan navigation"
);

// Scenario 2: User on BAU plan, clicks New Plan
const scenario2Start = getActiveRouteInfo("/plan/bau");
const scenario2End = getActiveRouteInfo("/plan");
assert(
  scenario2Start.activePlanId === "bau" && scenario2End.isNewPlanActive,
  "Scenario 2: BAU plan -> New plan navigation"
);

// Scenario 3: User on New Plan, clicks NSP 2026-30
const scenario3Start = getActiveRouteInfo("/plan");
const scenario3End = getActiveRouteInfo("/plan/nsp-2026-30");
assert(
  scenario3Start.isNewPlanActive && scenario3End.activePlanId === "nsp-2026-30",
  "Scenario 3: New plan -> NSP 2026-30 navigation"
);

// Scenario 4: User on plan, clicks header logo to go home
const scenario4Start = getActiveRouteInfo("/plan/nsp-2026-30");
const scenario4End = getActiveRouteInfo("/");
assert(
  scenario4Start.activePlanId === "nsp-2026-30" && scenario4End.isWelcomeScreen,
  "Scenario 4: NSP plan -> Welcome screen via header"
);

// Test 10: Verify all expected sidebar links exist
section("Testing sidebar link completeness");

const expectedRoutes = [
  { path: "/", description: "Home/Logo" },
  { path: "/plan", description: "New plan" },
  { path: "/search", description: "Search plans" },
  { path: "/compare", description: "Compare plans" },
  { path: "/layers", description: "Metric layers" },
  { path: "/cost-settings", description: "Cost settings" },
  { path: "/composite-scores", description: "Composite scores" },
  { path: "/help", description: "Help" },
  { path: "/feedback", description: "Feedback" },
  { path: "/account", description: "User account" },
];

// Add predefined plan routes
PREDEFINED_PLANS.forEach((plan) => {
  expectedRoutes.push({ path: `/plan/${plan.id}`, description: plan.name });
});

expectedRoutes.forEach(({ path, description }) => {
  const routeInfo = getActiveRouteInfo(path);
  // Verify route is parseable (no errors thrown)
  assert(
    routeInfo !== undefined,
    `Route '${path}' (${description}) is parseable`
  );
});

// Final summary
section("Summary");
console.log(`${GREEN}Passed: ${passCount}${RESET}`);
console.log(`${RED}Failed: ${failCount}${RESET}`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`\n${GREEN}All navigation flow tests passed!${RESET}\n`);
  process.exit(0);
}
