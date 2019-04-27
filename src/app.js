require("colors");
const puppeteerResolver = require("puppeteer-chromium-resolver");
const ProgressBar = require("progress");
const readline = require("readline");
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
const sleep = ms => {
	const bar = new ProgressBar("  [:bar] :percent :etas", {
		complete: "=",
		incomplete: " ",
		width: 20,
		total: ms
	});
	return new Promise(async resolve => {
		let timer = setInterval(function() {
			bar.tick();
			if (bar.complete) {
				console.log("\ncomplete\n");
				clearInterval(timer);
				resolve();
			}
		}, 1000);
	});
};
console.log("请输入你的500丁简历地址：".green);
rl.on("line", async line => {
	const url = line.trim();
	const patt = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
	const isUrl = patt.test(url);
	if (!isUrl) {
		console.log("请输入合法的url".red);
	} else {
        const revisionInfo = await puppeteerResolver({
            revision: "",
            detectionPath: "",
            folderName: '.chromium-browser-snapshots',
            hosts: ["https://storage.googleapis.com", "https://npm.taobao.org/mirrors"],
            retry: 3
        });
        const browser = await revisionInfo.puppeteer.launch({
            headless: true,
            args: ['--no-sandbox'],
            executablePath: revisionInfo.executablePath
        }).catch(function (error) {
            console.log(error);
        });
		// const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto(url);
		/**
		 *  不用await的原因是这个页面加载很久，
		 *  但其实很早已经加载好了，用await会超时
		 */
		page.goto(url);
		console.log("正在生成登录二维码");
		await sleep(5);
		await page.screenshot({ path: "./src/登录二维码.png" });
		console.log("请在15秒钟内扫码 src目录下“登录二维码.png”登录".green);
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
		await page.evaluate(() => {
			let tips = document.getElementsByClassName("page_tips");
			console.log(tips.length);
			for (let i = 0; i < tips.length; i++) {
				tips[i].style.display = "none";
			}
			let nullcon = document.getElementsByClassName("addCustomItem");
			for (let i = 0; i < nullcon.length; i++) {
				nullcon[i].style.display = "none";
            }
            document.body.style.padding = 0;
            document.body.style.margin = 0;
            document.body.style.background = 'none';
		});
		const overlay = await page.$(".wbdCv-baseStyle");
		await page.evaluate(resume => {
			resume = resume.cloneNode(true);
			// resume.style.height = "1160px";
            // resume.style.overflow = "hidden";
			document.documentElement.style.minWidth = 0;
			document.body.style.minWidth = 0;
			document.body.innerHTML = `
					  ${resume.outerHTML}
				  `;
        }, overlay);
        await page.screenshot({ path: "./src/1.png" });
		/**
		 * viewport尽量 小
		 */
		await page.setViewport({
			width: 300,
			height: 300
		});
		await page.pdf({
			path: "./src/简历.pdf",
			printBackground: true,
			format: "A4"
		});
		console.log("简历已生成，src目录下“简历.pdf”".green);
		await browser.close();
		rl.close();
	}
});

rl.on("close", function() {
	process.exit(0);
});
