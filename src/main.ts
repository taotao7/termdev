import { HELP_TEXT, parseCli } from "./cli.ts";
import { runTui } from "./tui.tsx";

export async function run(argv: string[]): Promise<void> {
  let opts: ReturnType<typeof parseCli>;
  try {
    opts = parseCli(argv);
  } catch (err) {
    console.error(String(err));
    console.log(HELP_TEXT);
    return;
  }

  if (opts.help) {
    console.log(HELP_TEXT);
    return;
  }

  await runTui(opts);
}
