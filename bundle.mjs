import { readFile, writeFile } from "fs/promises";
import { format } from "prettier";
import { resolve, dirname, join } from "path";
import { minify } from "uglify-js";

const entry = process.argv[2];

let bundle = ``;

bundle += `
  (function () {
    "use strict";

    const modules = {};
`;

const addedModules = new Set();

async function addModule(modulePath) {
	const realpath = resolve(modulePath);
	const moduleDir = dirname(realpath);

	if (addedModules.has(realpath)) return realpath;
	addedModules.add(realpath);

	let moduleText;
	try {
		moduleText = await readFile(realpath, {
			encoding: "utf-8",
		});
	} catch (err) {
		throw new Error(`Module ${realpath} does not exist!`);
	}

	const requiredModules = [];
	const requireCall = /require\(\s*\"(.+)\"\s*\)/g;
	for (
		let match = requireCall.exec(moduleText);
		match !== null;
		match = requireCall.exec(moduleText)
	) {
		console.assert(match[1]);
		let requirePath = join(moduleDir, match[1]);
		if (!/\.[cm]?js$/.test(requirePath)) requirePath += ".js";

		const moduleName = await addModule(requirePath);
		requiredModules.push(moduleName);
	}

	// console.log(realpath, requiredModules);

	bundle += `
    modules["${realpath}"] = (function () {
      ${
				requiredModules.length > 0
					? `
            const require = (function () {
              const requiredModules = ${JSON.stringify(requiredModules)};
              
              return function () {
                return modules[requiredModules.shift()];
              };
            })();
          `
					: ""
			}
      
      const module = {
        exports: {},
      };

      (function (module, exports) {
        ${moduleText};
      })(module, module.exports);

      return module.exports;
    })();
  `;

	return realpath;
}

await addModule(entry);

bundle += `
  })();
`;

await writeFile(
	"build/bundled.js",
	// await format(bundle, {
	// 	parser: "babel",
	// }),
	minify(bundle).code,
	{
		encoding: "utf-8",
	}
);
