import { defineConfig } from "@playwright/test";
export default defineConfig({
 testDir:"./tests/e2e",fullyParallel:false,workers:1,timeout:180000,
 expect:{timeout:30000},reporter:[["list"],["html",{open:"never"}]],
 use:{baseURL:"http://127.0.0.1:3100",headless:true,navigationTimeout:180000,viewport:{width:1440,height:1000},screenshot:"only-on-failure",trace:"retain-on-failure"},
 webServer:{command:process.env.LOREOS_E2E_PRODUCTION?"node ./node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100":"node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100",url:"http://127.0.0.1:3100",reuseExistingServer:false,timeout:480000,env:{LOREOS_DB_PATH:"./data/e2e-"+Date.now()+".sqlite",LOREOS_AI_MODE:"demo",LOREOS_NEXT_DIR:process.env.LOREOS_E2E_PRODUCTION?".next":".next-e2e"}}
});
