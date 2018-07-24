"use strict";

require("colors");
var ProgressBar = require("progress");
var puppeteer = require("puppeteer");
var readline = require("readline");
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
var sleep = function sleep(ms) {
	var bar = new ProgressBar("  [:bar] :percent :etas", {
		complete: "=",
		incomplete: " ",
		width: 20,
		total: ms
	});
	return new Promise(async function (reslove) {
		var timer = setInterval(function () {
			bar.tick();
			if (bar.complete) {
				console.log("\ncomplete\n");
				clearInterval(timer);
				reslove();
			}
		}, 1000);
	});
};
console.log("请输入你的500丁简历地址：".green);
rl.on("line", async function (line) {
	var url = line.trim();
	var patt = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
	var isUrl = patt.test(url);
	if (!isUrl) {
		console.log("请输入合法的url".red);
	} else {
		var browser = await puppeteer.launch();
		var page = await browser.newPage();
		await page.goto("https://www.baidu.com/");
		page.goto(url);
		console.log("正在生成登录二维码");
		await sleep(5);
		await page.screenshot({ path: "qrcode.png" });
		console.log("请在15秒钟内扫码qrcode.png登录".green);
		await sleep(15);
		/**
   * 因为扫码登录后返回个人主页，所以需要再次跳转
   */
		await page.setViewport({
			width: 1920,
			height: 10800
		});
		page.goto(url);
		console.log("正在登录跳转".green);
		await sleep(5);
		await page.evaluate(function () {
			var tips = document.getElementsByClassName("page_tips");
			console.log(tips.length);
			for (var i = 0; i < tips.length; i++) {
				tips[i].style.display = "none";
			}
			var nullcon = document.getElementsByClassName("addCustomItem");
			for (var _i = 0; _i < nullcon.length; _i++) {
				nullcon[_i].style.display = "none";
			}
		});
		var overlay = await page.$(".wbdCv-baseStyle");
		await overlay.screenshot({ path: "test.png" });
		await page.evaluate(function (resume) {
			resume = resume.cloneNode(true);
			resume.style.height = "1160px";
			resume.style.overflow = "hidden";
			document.documentElement.style.minWidth = 0;
			document.body.style.minWidth = 0;
			document.body.innerHTML = "\n\t\t\t\t\t  " + resume.outerHTML + "\n\t\t\t\t  ";
		}, overlay);

		await page.setViewport({
			width: 300,
			height: 300
		});
		await page.pdf({
			path: "简历.pdf",
			printBackground: true,
			format: "A4"
		});
		console.log("简历已生成".green);
		await browser.close();
		rl.close();
	}
});

rl.on("close", function () {
	process.exit(0);
});