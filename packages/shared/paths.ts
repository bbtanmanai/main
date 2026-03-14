import { fromFileUrl, dirname, join } from "std/path/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
// agents/common -> agents -> root
export const PROJECT_ROOT = join(__dirname, "../../"); 
export const DATA_DIR = join(PROJECT_ROOT, "data");

export const PATHS = {
  root: PROJECT_ROOT,
  data: {
    scout: join(DATA_DIR, "scout"),
    raw: join(DATA_DIR, "raw"),
    refined: join(DATA_DIR, "refined"),
    expert: join(DATA_DIR, "expert"),
    transformed: join(DATA_DIR, "transformed"),
  },
  agents: join(PROJECT_ROOT, "agents"),
  docs: join(PROJECT_ROOT, "0. docs"),
  assets: join(PROJECT_ROOT, "front_assets"),
};
