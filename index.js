const fs = require('fs');
const firstBy = require('thenby');
const pathJoin = require('path.join');

const defaultConfig = Object.freeze({
	packageJsonPath: './package.json',
	nodeModulesPath: './node_modules',
	skip: {},
});

const maxOrder = Number.MAX_SAFE_INTEGER;
const defaultStyleFile = 'style.css';

function getStyleNodeFiles(options) {
	const config = Object.assign({}, defaultConfig, options);
	const packageJson = _getPackageJson(config.packageJsonPath);
	if(!packageJson.dependencies) {
		return [];
	}
	
	var packages = Object.keys(packageJson.dependencies)
		.filter(key => !config.skip[key])
		.map(key => {
			const package = _getDefaultPackageDescription(config, key);

			if(config.overrides && config.overrides[key]) {
				package.style = _getOverridenPaths(config, key);
			}

			if(config.order && Number.isInteger(config.order[key])) {
				package.order = config.order[key];
			}

			return package;
	});
	
  const shouldSort = config.order && Object.keys(config.order).length > 0;
	return _getOrderedPaths(packages, shouldSort);
}

function _getDefaultPackageDescription(config, key) {
	return {
		key,
		style: _getStylePackageFile(`${config.nodeModulesPath}/${key}`),
		order: maxOrder
	}
}

function _getStylePackageFile(modulePath) {
	var packageJson = _getPackageJson(`${modulePath}/package.json`);
	return `${modulePath}/${packageJson.style || defaultStyleFile}`;
}

function _getPackageJson(path) {
	const file = fs.readFileSync(path);
	if(!file) {
		throw new Error('package.json not found');
	}
	
	return JSON.parse(file.toString());
}

function _getOverridenPaths(config, key) {
	const styleOverrides = config.overrides[key];
	if(Array.isArray(styleOverrides)) {
		return styleOverrides.map(p => `./${pathJoin(config.nodeModulesPath, key, p)}`);
	} else {
		return [`${config.nodeModulesPath}/${key}/${styleOverrides}`];
	}
}

function _getOrderedPaths(packages, shouldSort) {
  const result = [];
  var sortedPackages = shouldSort ? packages.sort(firstBy("order").thenBy("key")) : packages;
  sortedPackages
  	.forEach(pckg => {
      if(Array.isArray(pckg.style)) {
        result.push.apply(result, pckg.style);
      } else {
        result.push(pckg.style);
      }
    });
  return result;
}

module.exports = getStyleNodeFiles;
