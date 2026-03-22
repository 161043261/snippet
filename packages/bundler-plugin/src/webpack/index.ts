import path from "path";
import type { Compiler } from "webpack";
import type { ConditionalOptions } from "../core/index.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class WebpackConditionalPlugin {
  private options: ConditionalOptions;

  constructor(options: ConditionalOptions = {}) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    if (!compiler.options.module) {
      // @ts-expect-error
      compiler.options.module = { rules: [] };
    }
    if (!compiler.options.module.rules) {
      compiler.options.module.rules = [];
    }
    compiler.options.module.rules.unshift({
      enforce: "pre",
      use: [
        {
          loader: path.resolve(__dirname, "./loader.js"),
          options: this.options,
        },
      ],
    });
  }
}
