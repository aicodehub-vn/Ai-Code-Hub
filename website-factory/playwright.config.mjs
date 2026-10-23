import {defineConfig,devices} from "@playwright/test";
import {fileURLToPath} from "node:url";

const repositoryRoot=fileURLToPath(new URL("../",import.meta.url));
const visualBaseline=process.env.FACTORY_VISUAL_BASELINE==="1";
const webServers=[{
  command:"python3 -m http.server 8765 --bind 127.0.0.1",
  cwd:repositoryRoot,
  url:"http://127.0.0.1:8765/website-factory/",
  reuseExistingServer:!process.env.CI,
  timeout:30000
}];
if(visualBaseline)webServers.push({
  command:"python3 -m http.server 8766 --bind 127.0.0.1",
  cwd:fileURLToPath(new URL("../reference/",import.meta.url)),
  url:"http://127.0.0.1:8766/website-factory/",
  reuseExistingServer:false,
  timeout:30000
});
export default defineConfig({
  testDir:"./tests/e2e",
  fullyParallel:false,
  forbidOnly:!!process.env.CI,
  retries:0,
  workers:1,
  reporter:[["list"],["html",{open:"never",outputFolder:"playwright-report"}]],
  timeout:45000,
  expect:{timeout:8000},
  use:{
    baseURL:"http://127.0.0.1:8765/website-factory/",
    trace:"retain-on-failure",
    screenshot:"only-on-failure",
    reducedMotion:"reduce",
    ...devices["Desktop Chrome"]
  },
  projects:[
    {name:"chromium",use:{...devices["Desktop Chrome"]}},
    {name:"firefox",testMatch:/cross-browser\.spec\.mjs$/,use:{...devices["Desktop Firefox"]}},
    {name:"webkit",testMatch:/cross-browser\.spec\.mjs$/,use:{...devices["Desktop Safari"]}}
  ],
  webServer:webServers,
  outputDir:"playwright-results"
});
