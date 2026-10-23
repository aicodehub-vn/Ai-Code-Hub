import {defineConfig,devices} from "@playwright/test";
import {fileURLToPath} from "node:url";

const repositoryRoot=fileURLToPath(new URL("../",import.meta.url));
export default defineConfig({
  testDir:"./tests/e2e",
  fullyParallel:false,
  forbidOnly:!!process.env.CI,
  retries:0,
  workers:1,
  reporter:[["list"],["html",{open:"never",outputFolder:"playwright-report"}]],
  timeout:30000,
  expect:{timeout:7000},
  use:{
    baseURL:"http://127.0.0.1:8765/website-factory/",
    trace:"retain-on-failure",
    screenshot:"only-on-failure",
    ...devices["Desktop Chrome"]
  },
  webServer:{
    command:"python3 -m http.server 8765 --bind 127.0.0.1",
    cwd:repositoryRoot,
    url:"http://127.0.0.1:8765/website-factory/",
    reuseExistingServer:!process.env.CI,
    timeout:30000
  },
  outputDir:"playwright-results"
});
