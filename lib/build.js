"use strict";

// The build script for the sytem

const FindOpenPort = require("./find-open-port.js");
const RequestModule = require("./request.js");

const ChildProcessModule = require("child_process");
const ProcessModule = require("process");
	
const rmRecursiveOption = {force: true, recursive: true};
const resolvedPromise = Promise.resolve();

const FsModule = require('fs');
const FsPromises = FsModule.promises;
const PathModule = require('path');
const walkDirectory = function(dir, done) {
	// from https://stackoverflow.com/a/5827895/5601591
	const results = [];
	FsModule.readdir(dir, function(err, list) {
		if (err) return done(err);
		var pending = list.length;
		if (!pending) return done(null, results);
		list.forEach(function(file) {
			file = PathModule.resolve(dir, file);
			FsModule.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					results.push(file + "/");
					walkDirectory(file, function(err, res) {
						results.push.apply(results, res); //results = results.concat(res);
						if (!--pending) done(null, results);
					});
				} else {
					results.push(file);
					if (!--pending) done(null, results);
				}
			});
		});
	});
};

const currentDirectory = ProcessModule.cwd();
const srcDirectory = currentDirectory + "/src";
const distDirectory = currentDirectory + "/dist";

FindOpenPort.findPort().then(async function(phpTmpServerInfo) {
	const phpServerAddress =  phpTmpServerInfo.host + ":" + phpTmpServerInfo.port;
	console.log("(INFO: spinning up internal PHP server on " + phpServerAddress + ")");

	const phpTmpProcess = ChildProcessModule.execFile("php", ["-S", phpServerAddress, "-t", srcDirectory], function(error, stdout, stderr) {
		if (error != null &&  error.code) {
			console.error("ERROR: PHP process exited with error code " + error.code + ". Details: ");
			console.error(stdout);
			console.error(stderr);
			ProcessModule.exit( 1 );
		}
	});

	const waitForPHPToBeReady = new Promise(p => setTimeout(p, 500));
	
	const srcFilesList = await new Promise(function(resolve, reject) {
		walkDirectory(srcDirectory, (err, dirs) => err ? reject(err) : resolve(dirs));
	});
	const distFilesListPromise = new Promise(function(resolve, reject) {
		walkDirectory(distDirectory, (err, dirs) => err ? reject(err) : resolve(dirs));
	});

	await waitForPHPToBeReady;

	function FilesMappingClass() {}
	FilesMappingClass.prototype = Object.create(null);
	const emptyMapObject = new FilesMappingClass();
	
	const resultFilesMap = new FilesMappingClass();
	const buildPromises = [];

	function addToFilesMapping(mapping, path, value) {
		/*const splitted = path.split("/");
		if (1 < splitted.length > 1) {
			var current = splitted[0] + "/";
			for (var i=1, len=splitted.length; i < len; i=i+1|0) {
				resultFilesMap[current] = null;
				current += splitted[i] + "/";
			}
		}
		resultFilesMap[path] = value;*/
		const splitted = path.split("/");//.split(/\/(?!$)/);
		var curObj = mapping;		
		for (var i=0, len=splitted.length-1; i < len; i=i+1|0) {
			curObj = curObj[splitted[i]] = curObj[splitted[i]] || new FilesMappingClass();
		}
		if (splitted[len] !== "") { // if its not a folder
			curObj[splitted[len]] = value;
		}
	}
	
	for (const srcFile of srcFilesList) {
		const srcRelPath = srcFile.substring(srcDirectory.length + 1);
		
		if (srcRelPath.endsWith("/")) {
			// do nothing as it's a directory
		} else if (srcRelPath.startsWith("pages/")) {
			const distRelPath = srcRelPath.substring("pages/".length);
			const distFile = distDirectory + "/" + distRelPath;
			
			buildPromises.push( RequestModule.request("http://" + phpServerAddress + "/?page=" + srcRelPath).then(function(text) {
				addToFilesMapping(resultFilesMap, distRelPath, () => {
					console.log("[INFO:] Writing " + text.length + " bytes of data to dist/" + distRelPath + " ...");
					return FsPromises.writeFile(distFile, text);
				});
			}) );
		} else if (srcRelPath.startsWith("index.")) {
			// do nothing
		} else {
			const distFile = distDirectory + "/" + srcRelPath;
			addToFilesMapping(resultFilesMap, srcRelPath, () => {
				console.log("[INFO:] Copying src/" + srcRelPath + " to dist/" + srcRelPath + " ...");
				return FsPromises.copyFile(srcFile, distDirectory + "/" + srcRelPath);
			});
		}
	}
	
	await Promise.all( buildPromises );
	
	phpTmpProcess.kill(); // kill the temporary php process

	var genResultHostAddr = (async function() {
		var resultHostAddr = {
			host: "127.7.7.7",
			port: 7777
		};
		if (await FindOpenPort.isAvailable(resultHostAddr.host, resultHostAddr.port)) {
			return resultHostAddr;		
		} else {
			return await FindOpenPort.findPort();		
		}
	})();
	
	const distFilesList = await distFilesListPromise;
	const distFilesMap = new FilesMappingClass();
	for (const distFile of distFilesList) {
		const distRelPath = distFile.substring(distDirectory.length + 1)
		addToFilesMapping(distFilesMap, distRelPath, null);
	}
	
	const outputStructurePromises = [];
	(function recurseRebuildStructure(distPath, dist, result) {
		for (const name in dist) {
			if (!(name in result)) {
				console.log("[INFO:] Removing " + (dist[name] instanceof FilesMappingClass ? "directory" : "file") + " dist/" + distPath.substring(distDirectory.length + 1));
				outputStructurePromises.push( FsPromises.rm(distPath + "/" + name, rmRecursiveOption) );
			}
		}
		for (const name in result) {
			const entry = result[name];
			const distEntry = dist[name];
			const curPath = distPath + "/" + name;
			if ((entry instanceof FilesMappingClass) && !(distEntry instanceof FilesMappingClass)) {
				let delPromise = resolvedPromise;
				
				if (name in dist) {
					console.log("[INFO:] Removing file dist/" + distPath.substring(distDirectory.length + 1));
					delPromise = FsPromises.rm(curPath);
				}
				
				console.log("[INFO:] Creating directory dist/" + distPath.substring(distDirectory.length + 1));
				outputStructurePromises.push( delPromise.then(() => FsPromises.mkdir(curPath).then(() => recurseRebuildStructure(curPath, emptyMapObject, entry))) );
			} else if (entry instanceof FilesMappingClass) {
				recurseRebuildStructure(curPath, distEntry, entry);
			}
		}
	})(distDirectory, distFilesMap, resultFilesMap);
	await Promise.all( outputStructurePromises );

	const outputGeneratePromises = [];
	(function recurseGenerateStructure(result) {
		for (const name in result) {
			const entry = result[name];
			if (entry instanceof FilesMappingClass) {
				recurseGenerateStructure( entry );
			} else {
				outputGeneratePromises.push( entry() );
			}
		}
	})(resultFilesMap);
	await Promise.all( outputGeneratePromises );
	
	
	const demoListenServer = await genResultHostAddr;
	const demoServerAddress = demoListenServer.host + ":" + demoListenServer.port
	console.log();
	console.log("Visit the demo server at http://" + demoServerAddress);
	console.log();

	const phpDemoServer = ChildProcessModule.execFile("php", ["-S", demoServerAddress, "-t", distDirectory], function(error, stdout, stderr) {
		if (error != null &&  error.code) {
			console.error("ERROR: PHP process exited with error code " + error.code + ". Details: ");
			console.error(stdout);
			console.error(stderr);
			ProcessModule.exit( 1 );
		}
	});
	
	await new Promise(then => phpDemoServer.on("close", then));
});
