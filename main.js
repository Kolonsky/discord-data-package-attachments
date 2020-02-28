const fs = require('fs');
const path = require('path');
const rimraf = require("rimraf");
var ProgressBar = require('progress');
const download = require('download');
const extract = require('extract-zip');
const { v4: uuidv4 } = require('uuid');

let cwd = path.resolve("./");
let package = path.resolve("./package.zip");
let temp = path.resolve("./temp")

global.init = async function () {
	// Check if file exists
	if (!fs.existsSync(package)) {
		console.log(`Can't find ${package}`);
		console.log("Exiting...");
		process.exit();
	};

	// Unpacking archive
	console.log("Unpacking package.zip...");
	await new Promise(resolve => {
		extract(package, { dir: path.resolve("./temp/") }, function (err) {
			resolve();
		});
	});
	console.log("Unpacking package.zip - done.");

	// Extract links from messages
	let links = [];
	console.log("Parse messages...");
	await new Promise(resolve => {
		let reg = /https:\/\/cdn\.discordapp\.com\/attachments\/\d+\/\d+\/[^\s\n,]+/g;
		let messages = fs.readdirSync("./temp/messages/");
		messages.pop();

		messages.forEach(msg => {
			msg = path.resolve(`./temp/messages/${msg}/messages.csv`);
			var array = fs.readFileSync(msg).toString().split("\n");
			array.forEach(content => {
				let line = reg.exec(content);
				if (line)
					links.push(line[0]);
			});
		});
		resolve();
	})
	console.log("Parse messages - done.");

	// Download files.
	console.log(`In total, ${links.length} files will be downloaded.`);

	var bar = new ProgressBar('Downloading [:bar]\t:percent\t:etas', {
		total: links.length,
		complete: '#',
		incomplete: '.',
		width: '40'
	});

	if (!fs.existsSync("./out"))
		fs.mkdirSync("./out");
	for (let link of links) {
		await new Promise(resolve => {
			download(link).then(data => {
				fs.writeFileSync(`./out/${uuidv4()}${/\.[0-9a-z]+$/i.exec(link)}`, data);
				bar.tick();
				resolve();
			});
		})
	};

	console.log("All done! Exiting...");
	rimraf(temp, () => {
		process.exit();
	});
};

init();