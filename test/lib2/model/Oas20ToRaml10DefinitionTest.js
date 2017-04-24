const expect = require('chai').expect;
const beforeEach = require("mocha/lib/mocha.js").beforeEach;
const afterEach = require("mocha/lib/mocha.js").afterEach;
const it = require("mocha/lib/mocha.js").it;
const describe = require("mocha/lib/mocha.js").describe;
const Oas = require('../../../lib/importers/swagger');
const Oas20DefinitionConverter = require('../../../lib/oas20/Oas20DefinitionConverter');
const Raml = require('../../../lib/importers/baseraml');
const Raml10DefinitionConverter = require('../../../lib/raml10/Raml10DefinitionConverter');
const YAML = require('js-yaml');
const fs = require('fs');
const _ = require('lodash');
const jsonHelper = require('../../../lib/utils/json');

function removePropertyFromObject(object, propName) {
	for (const id in object) {
		if (!object.hasOwnProperty(id)) continue;

		const value = object[id];
		if (id === propName) {
			delete object[id];
		}
		if (typeof value === 'object') {
			removePropertyFromObject(value, propName);
		}
	}
}

describe ('Oas20 to Raml10 Definition Test', () => {

	const testWithData = function (sourceFile, targetFile, stringCompare) {
		return done => {
			const oasImporter = new Oas();
			const oasPromise = oasImporter.loadFile(sourceFile);
			oasPromise.then(() => {
				if (_.isEmpty(oasImporter.data))
					return done()

				try {
					const oasDefinitions = oasImporter.data.definitions;
					if (_.isEmpty(oasDefinitions)) return done();

					const oas20DefinitionConverter = new Oas20DefinitionConverter();
					const raml10DefinitionConverter = new Raml10DefinitionConverter('oas');
					const models = oas20DefinitionConverter.import(oasDefinitions)

					const result = {};
					result.types = raml10DefinitionConverter.export(models);

					// expect(YAML.safeLoad(YAML.safeDump(result.types))).to.deep.equal(YAML.safeLoad(fs.readFileSync(targetFile, 'utf8')).types);
					expect(YAML.safeLoad(YAML.dump(jsonHelper.parse(JSON.stringify(result.types))))).to.deep.equal(YAML.safeLoad(fs.readFileSync(targetFile, 'utf8')).types);
					done();
					//validate if ramlData is valid.
					// try {
					// 	const promise2 = ramlImporter.loadData('#%RAML 1.0\n' + YAML.safeDump(result));
					// 	promise2
					// 		.then(() => {
					// 			return done();
					// 		})
					// 		.catch(err => {
					// 			return done(err);
					// 		});
					// } catch (e) {
					// 	return done(e);
					// }
				} catch (e) {
					done(e);
				}
			}).catch(err => {
				done(err);
			});
		};
	};

	const baseDir = __dirname + '/../../data/swagger-import/swagger';
	const testFiles = fs.readdirSync(baseDir);

	testFiles.forEach(function (testFile) {
		if (!_.startsWith(testFile, '.')) {
			const stringCompare = _.includes(testFile, 'stringcompare');
			const sourceFile = baseDir + '/' + testFile;
			const targetFile = baseDir + '/../raml/' + _.replace(testFile, 'json', 'yaml');

			if (process.env.testFile) {
				if (_.endsWith(testFile, process.env.testFile)) {
					it('test: ' + testFile, testWithData(sourceFile, targetFile, stringCompare));
				}
			} else {
				it('test: ' + testFile, testWithData(sourceFile, targetFile, stringCompare));
			}
		}
	});
});