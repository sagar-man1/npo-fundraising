/** One-off run from the terminal: `npm run research:now [-- --notify]` */
import "dotenv/config";
import { runDailyResearch } from "../src/lib/jobs/dailyResearch";

const notify = process.argv.includes("--notify");

runDailyResearch({ notify })
  .then((result) => {
    console.log(result.summary);
    for (const company of result.companies) {
      console.log(`  ${company.name} — ${company.deliveryModel} (${company.grantLikelihood})`);
    }
    if (result.deliveryError) console.error(`WhatsApp: ${result.deliveryError}`);
    else if (result.notified) console.log("WhatsApp message sent.");
    else if (!notify) console.log("Run with --notify to also send the WhatsApp message.");
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
