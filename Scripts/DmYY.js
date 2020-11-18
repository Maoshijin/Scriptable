// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: cogs;

/*
 * Author: 2Ya
 * Github: https://github.com/dompling
 */

class DmYY {
	constructor(arg) {
		this.arg = arg;
		this._actions = {};
		this.init();
		this.widgetColor = Color.dynamic(new Color(this.settings.lightColor), new Color(this.settings.darkColor));
	}

	isNight = Device.isUsingDarkAppearance();

	// 获取 Request 对象
	getRequest = (url = "") => {
		return new Request(url);
	};

	// 发起请求
	http = async (options = { headers: {}, url: "" }, type = "JSON") => {
		try {
			let request;
			if (type !== "IMG") {
				request = this.getRequest();
				Object.keys(options).forEach((key) => {
					request[key] = options[key];
				});
				request.headers = { ...this.defaultHeaders, ...options.headers };
			} else {
				request = this.getRequest(options.url);
				return await request.loadImage();
			}
			if (type === "JSON") {
				return await request.loadJSON();
			}
			if (type === "STRING") {
				return await request.loadString();
			}
			return await request.loadJSON();
		} catch (e) {
			console.log("error:" + e);
		}
	};

	//request 接口请求
	$request = {
		get: async (url = "", options = {}, type = "JSON") => {
			const params = { url, ...options, method: "GET" };
			let _type = type;
			if (typeof options === "string") _type = options;
			return await this.http(params, _type);
		},
		post: async (url = "", options = {}, type = "JSON") => {
			const params = { url, ...options, method: "POST" };
			let _type = type;
			if (typeof options === "string") _type = options;
			return await this.http(params, _type);
		},
	};

	// 获取 boxJS 缓存
	getCache = async (key) => {
		try {
			const url = `http://${this.prefix}/query/boxdata`;
			const boxdata = await this.$request.get(url);
			console.log(boxdata.datas[key]);
			if (key) return boxdata.datas[key];
			return boxdata.datas;
		} catch (e) {
			console.log(e);
			return false;
		}
	};

	transforJSON = (str) => {
		if (typeof str == "string") {
			try {
				return JSON.parse(str);
			} catch (e) {
				console.log(e);
				return str;
			}
		}
		console.log("It is not a string!");
	};

	// 选择图片并缓存
	chooseImg = async () => {
		return await Photos.fromLibrary();
	};

	// 设置 widget 背景图片
	getWidgetBackgroundImage = async (widget) => {
		const backgroundImage = this.getBackgroundImage();
		if (backgroundImage) {
			const opacity = this.isNight
			 ? Number(this.settings.opacity[0])
			 : Number(this.settings.opacity[1]);
			widget.backgroundImage = await this.shadowImage(backgroundImage, "#000", opacity);
			return true;
		} else {
			return false;
		}
	};

	/**
	 * 验证图片尺寸： 图片像素超过 1000 左右的时候会导致背景无法加载
	 * @param img Image
	 */
	verifyImage = async (img) => {
		try {
			const width = img.size.width;
			if (width > 1000) {
				const options = ["取消", "打开图像处理"];
				const message = `您的图片像素为${width} x ${img.size.height}，设置的背景图内存占用过高，请调整！`;
				const index = await this.generateAlert(message, options);
				if (index === 1) Safari.openInApp('https://www.yasuotu.com/size', false);
				return false;
			}
			return true;
		} catch (e) {
			return false;
		}
	};

	/**
	 * 获取截图中的组件剪裁图
	 * 可用作透明背景
	 * 返回图片image对象
	 * 代码改自：https://gist.github.com/mzeryck/3a97ccd1e059b3afa3c6666d27a496c9
	 * @param {string} title 开始处理前提示用户截图的信息，可选（适合用在组件自定义透明背景时提示）
	 */
	async getWidgetScreenShot(title = null) {
		// Crop an image into the specified rect.
		function cropImage(img, rect) {

			let draw = new DrawContext();
			draw.size = new Size(rect.width, rect.height);

			draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y));
			return draw.getImage();
		}

		// Pixel sizes and positions for widgets on all supported phones.
		function phoneSizes() {
			return {
				// 12 and 12 Pro
				"2532": {
					small: 474,
					medium: 1014,
					large: 1062,
					left: 78,
					right: 618,
					top: 231,
					middle: 819,
					bottom: 1407,
				},

				// 11 Pro Max, XS Max
				"2688": {
					small: 507,
					medium: 1080,
					large: 1137,
					left: 81,
					right: 654,
					top: 228,
					middle: 858,
					bottom: 1488,
				},

				// 11, XR
				"1792": {
					small: 338,
					medium: 720,
					large: 758,
					left: 54,
					right: 436,
					top: 160,
					middle: 580,
					bottom: 1000,
				},


				// 11 Pro, XS, X
				"2436": {
					small: 465,
					medium: 987,
					large: 1035,
					left: 69,
					right: 591,
					top: 213,
					middle: 783,
					bottom: 1353,
				},

				// Plus phones
				"2208": {
					small: 471,
					medium: 1044,
					large: 1071,
					left: 99,
					right: 672,
					top: 114,
					middle: 696,
					bottom: 1278,
				},

				// SE2 and 6/6S/7/8
				"1334": {
					small: 296,
					medium: 642,
					large: 648,
					left: 54,
					right: 400,
					top: 60,
					middle: 412,
					bottom: 764,
				},


				// SE1
				"1136": {
					small: 282,
					medium: 584,
					large: 622,
					left: 30,
					right: 332,
					top: 59,
					middle: 399,
					bottom: 399,
				},

				// 11 and XR in Display Zoom mode
				"1624": {
					small: 310,
					medium: 658,
					large: 690,
					left: 46,
					right: 394,
					top: 142,
					middle: 522,
					bottom: 902,
				},

				// Plus in Display Zoom mode
				"2001": {
					small: 444,
					medium: 963,
					large: 972,
					left: 81,
					right: 600,
					top: 90,
					middle: 618,
					bottom: 1146,
				},
			};
		}

		let message = title || "开始之前，请先前往桌面，截取空白界面的截图。然后回来继续";
		let exitOptions = ["我已截图", "前去截图 >"];
		let shouldExit = await this.generateAlert(message, exitOptions);
		if (shouldExit) return;

		// Get screenshot and determine phone size.
		let img = await Photos.fromLibrary();
		let height = img.size.height;
		let phone = phoneSizes()[height];
		if (!phone) {
			message = "好像您选择的照片不是正确的截图，请先前往桌面";
			await this.generateAlert(message, ["我已知晓"]);
			return;
		}

		// Prompt for widget size and position.
		message = "截图中要设置透明背景组件的尺寸类型是？";
		let sizes = ["小尺寸", "中尺寸", "大尺寸"];
		let size = await this.generateAlert(message, sizes);
		let widgetSize = sizes[size];

		message = "要设置透明背景的小组件在哪个位置？";
		message += (height === 1136 ? " （备注：当前设备只支持两行小组件，所以下边选项中的「中间」和「底部」的选项是一致的）" : "");

		// Determine image crop based on phone size.
		let crop = { w: "", h: "", x: "", y: "" };
		if (widgetSize === "小尺寸") {
			crop.w = phone.small;
			crop.h = phone.small;
			let positions = ["左上角", "右上角", "中间左", "中间右", "左下角", "右下角"];
			let _posotions = ["Top left", "Top right", "Middle left", "Middle right", "Bottom left", "Bottom right"];
			let position = await this.generateAlert(message, positions);

			// Convert the two words into two keys for the phone size dictionary.
			let keys = _posotions[position].toLowerCase().split(' ');
			crop.y = phone[keys[0]];
			crop.x = phone[keys[1]];

		} else if (widgetSize === "中尺寸") {
			crop.w = phone.medium;
			crop.h = phone.small;

			// Medium and large widgets have a fixed x-value.
			crop.x = phone.left;
			let positions = ["顶部", "中间", "底部"];
			let _positions = ["Top", "Middle", "Bottom"];
			let position = await this.generateAlert(message, positions);
			let key = _positions[position].toLowerCase();
			crop.y = phone[key];

		} else if (widgetSize === "大尺寸") {
			crop.w = phone.medium;
			crop.h = phone.large;
			crop.x = phone.left;
			let positions = ["顶部", "底部"];
			let position = await this.generateAlert(message, positions);

			// Large widgets at the bottom have the "middle" y-value.
			crop.y = position ? phone.middle : phone.top;
		}

		// Crop image and finalize the widget.
		return cropImage(img, new Rect(crop.x, crop.y, crop.w, crop.h));
	}

	/**
	 * 设置组件内容
	 * @returns {Promise<void>}
	 */
	setWidgetConfig = async () => {
		const alert = new Alert();
		alert.title = "内容配置";
		alert.message = "设置字体颜色、蒙层透明、背景";
		alert.addAction("新背景图");
		alert.addAction("字体颜色");
		alert.addAction("透明背景");
		alert.addAction("蒙层透明");
		alert.addAction("清空背景");
		alert.addAction("BoxJS域名");
		alert.addAction("重置所有");
		alert.addCancelAction("取消");
		const actions = [
			async () => {
				const backImage = await this.chooseImg();
				if (!await this.verifyImage(backImage)) return;
				await this.setBackgroundImage(backImage, true);
			},
			async () => {
				const a = new Alert();
				a.title = "白天和夜间的字体颜色";
				a.message = "请自行去网站上搜寻颜色（Hex 颜色）";
				const lightColor = this.settings.lightColor || "#000";
				const darkColor = this.settings.darkColor || "#fff";
				a.addTextField("白天", lightColor);
				a.addTextField("夜间", darkColor);
				a.addAction("确定");
				a.addCancelAction("取消");
				const id = await a.presentAlert();
				if (id === -1) return;
				this.settings.lightColor = a.textFieldValue(0);
				this.settings.darkColor = a.textFieldValue(1);
				// 保存到本地
				this.saveSettings();
			},
			async () => {
				const backImage = await this.getWidgetScreenShot();
				if (backImage) await this.setBackgroundImage(backImage, true);
			},
			async () => {
				try {
					const a = new Alert();
					a.title = "白天和夜间透明";
					a.message = "若是设置了透明背景，请自行都设置为 0";
					a.addTextField("白天", `${Number(this.settings.opacity[1])}`);
					a.addTextField("夜间", `${Number(this.settings.opacity[0])}`);
					a.addAction("确定");
					a.addCancelAction("取消");
					const id = await a.presentAlert();
					if (id === -1) return;
					this.settings.opacity[1] = Number(a.textFieldValue(0));
					this.settings.opacity[0] = Number(a.textFieldValue(1));
					// 保存到本地
					this.saveSettings();
				} catch (e) {
					console.log(e);
				}
			},
			() => {
				this.setBackgroundImage(false, true);
			},
			async () => {
				const a = new Alert();
				a.title = "BoxJS 域名";
				a.addTextField("域名", this.settings.boxjsDomain);
				a.addAction("确定");
				a.addCancelAction("取消");
				const id = await a.presentAlert();
				if (id === -1) return;
				this.settings.boxjsDomain = a.textFieldValue(0);
				// 保存到本地
				this.saveSettings();
			},
			async () => {
				const options = ["取消", "确定"];
				const message = "该操作不可逆，会清空所有组件配置！";
				const index = await this.generateAlert(message, options);
				if (index === 0) return;
				this.settings = {};
				// 保存到本地
				await this.setBackgroundImage(false, false);
				this.saveSettings();
			},
		];
		const id = await alert.presentAlert();
		if (id === -1) return;
		actions[id] && actions[id].call(this);
	};

	init(widgetFamily = config.widgetFamily) {
		// 组件大小：small,medium,large
		this.widgetFamily = widgetFamily;
		this.SETTING_KEY = this.md5(Script.name());
		//用于配置所有的组件相关设置

		// 文件管理器
		// 提示：缓存数据不要用这个操作，这个是操作源码目录的，缓存建议存放在local temp目录中
		this.FILE_MGR = FileManager[
		 module.filename.includes("Documents/iCloud~") ? "iCloud" : "local"
		 ]();
		// 本地，用于存储图片等
		this.FILE_MGR_LOCAL = FileManager.local();
		this.BACKGROUND_KEY = this.FILE_MGR_LOCAL.joinPath(
		 this.FILE_MGR_LOCAL.documentsDirectory(),
		 `bg_${this.SETTING_KEY}.jpg`,
		);

		this.settings = this.getSettings();
		if (this.settings.opacity) {
			this.settings.opacity[0] = Number(this.settings.opacity[0]);
			this.settings.opacity[1] = Number(this.settings.opacity[1]);
		} else {
			this.settings.opacity = [0.7, 0.4];
		}
		this.settings.lightColor = this.settings.lightColor || "#000";
		this.settings.darkColor = this.settings.darkColor || "#fff";
		this.settings.boxjsDomain = this.settings.boxjsDomain || "boxjs.net";
		this.prefix = this.settings.boxjsDomain;
	}

	/**
	 * 注册点击操作菜单
	 * @param {string} name 操作函数名
	 * @param {func} func 点击后执行的函数
	 */
	registerAction(name, func) {
		this._actions[name] = func.bind(this);
	}

	/**
	 * base64 编码字符串
	 * @param {string} str 要编码的字符串
	 */
	base64Encode(str) {
		const data = Data.fromString(str);
		return data.toBase64String();
	}

	/**
	 * base64解码数据 返回字符串
	 * @param {string} b64 base64编码的数据
	 */
	base64Decode(b64) {
		const data = Data.fromBase64String(b64);
		return data.toRawString();
	}

	/**
	 * md5 加密字符串
	 * @param {string} str 要加密成md5的数据
	 */
	md5(str) {
		function d(n, t) {
			var r = (65535 & n) + (65535 & t);
			return (((n >> 16) + (t >> 16) + (r >> 16)) << 16) | (65535 & r);
		}

		function f(n, t, r, e, o, u) {
			return d(((c = d(d(t, n), d(e, u))) << (f = o)) | (c >>> (32 - f)), r);
			var c, f;
		}

		function l(n, t, r, e, o, u, c) {
			return f((t & r) | (~t & e), n, t, o, u, c);
		}

		function v(n, t, r, e, o, u, c) {
			return f((t & e) | (r & ~e), n, t, o, u, c);
		}

		function g(n, t, r, e, o, u, c) {
			return f(t ^ r ^ e, n, t, o, u, c);
		}

		function m(n, t, r, e, o, u, c) {
			return f(r ^ (t | ~e), n, t, o, u, c);
		}

		function i(n, t) {
			var r, e, o, u;
			(n[t >> 5] |= 128 << t % 32), (n[14 + (((t + 64) >>> 9) << 4)] = t);
			for (
			 var c = 1732584193,
				f = -271733879,
				i = -1732584194,
				a = 271733878,
				h = 0;
			 h < n.length;
			 h += 16
			)
				(c = l((r = c), (e = f), (o = i), (u = a), n[h], 7, -680876936)),
				 (a = l(a, c, f, i, n[h + 1], 12, -389564586)),
				 (i = l(i, a, c, f, n[h + 2], 17, 606105819)),
				 (f = l(f, i, a, c, n[h + 3], 22, -1044525330)),
				 (c = l(c, f, i, a, n[h + 4], 7, -176418897)),
				 (a = l(a, c, f, i, n[h + 5], 12, 1200080426)),
				 (i = l(i, a, c, f, n[h + 6], 17, -1473231341)),
				 (f = l(f, i, a, c, n[h + 7], 22, -45705983)),
				 (c = l(c, f, i, a, n[h + 8], 7, 1770035416)),
				 (a = l(a, c, f, i, n[h + 9], 12, -1958414417)),
				 (i = l(i, a, c, f, n[h + 10], 17, -42063)),
				 (f = l(f, i, a, c, n[h + 11], 22, -1990404162)),
				 (c = l(c, f, i, a, n[h + 12], 7, 1804603682)),
				 (a = l(a, c, f, i, n[h + 13], 12, -40341101)),
				 (i = l(i, a, c, f, n[h + 14], 17, -1502002290)),
				 (c = v(
					c,
					(f = l(f, i, a, c, n[h + 15], 22, 1236535329)),
					i,
					a,
					n[h + 1],
					5,
					-165796510,
				 )),
				 (a = v(a, c, f, i, n[h + 6], 9, -1069501632)),
				 (i = v(i, a, c, f, n[h + 11], 14, 643717713)),
				 (f = v(f, i, a, c, n[h], 20, -373897302)),
				 (c = v(c, f, i, a, n[h + 5], 5, -701558691)),
				 (a = v(a, c, f, i, n[h + 10], 9, 38016083)),
				 (i = v(i, a, c, f, n[h + 15], 14, -660478335)),
				 (f = v(f, i, a, c, n[h + 4], 20, -405537848)),
				 (c = v(c, f, i, a, n[h + 9], 5, 568446438)),
				 (a = v(a, c, f, i, n[h + 14], 9, -1019803690)),
				 (i = v(i, a, c, f, n[h + 3], 14, -187363961)),
				 (f = v(f, i, a, c, n[h + 8], 20, 1163531501)),
				 (c = v(c, f, i, a, n[h + 13], 5, -1444681467)),
				 (a = v(a, c, f, i, n[h + 2], 9, -51403784)),
				 (i = v(i, a, c, f, n[h + 7], 14, 1735328473)),
				 (c = g(
					c,
					(f = v(f, i, a, c, n[h + 12], 20, -1926607734)),
					i,
					a,
					n[h + 5],
					4,
					-378558,
				 )),
				 (a = g(a, c, f, i, n[h + 8], 11, -2022574463)),
				 (i = g(i, a, c, f, n[h + 11], 16, 1839030562)),
				 (f = g(f, i, a, c, n[h + 14], 23, -35309556)),
				 (c = g(c, f, i, a, n[h + 1], 4, -1530992060)),
				 (a = g(a, c, f, i, n[h + 4], 11, 1272893353)),
				 (i = g(i, a, c, f, n[h + 7], 16, -155497632)),
				 (f = g(f, i, a, c, n[h + 10], 23, -1094730640)),
				 (c = g(c, f, i, a, n[h + 13], 4, 681279174)),
				 (a = g(a, c, f, i, n[h], 11, -358537222)),
				 (i = g(i, a, c, f, n[h + 3], 16, -722521979)),
				 (f = g(f, i, a, c, n[h + 6], 23, 76029189)),
				 (c = g(c, f, i, a, n[h + 9], 4, -640364487)),
				 (a = g(a, c, f, i, n[h + 12], 11, -421815835)),
				 (i = g(i, a, c, f, n[h + 15], 16, 530742520)),
				 (c = m(
					c,
					(f = g(f, i, a, c, n[h + 2], 23, -995338651)),
					i,
					a,
					n[h],
					6,
					-198630844,
				 )),
				 (a = m(a, c, f, i, n[h + 7], 10, 1126891415)),
				 (i = m(i, a, c, f, n[h + 14], 15, -1416354905)),
				 (f = m(f, i, a, c, n[h + 5], 21, -57434055)),
				 (c = m(c, f, i, a, n[h + 12], 6, 1700485571)),
				 (a = m(a, c, f, i, n[h + 3], 10, -1894986606)),
				 (i = m(i, a, c, f, n[h + 10], 15, -1051523)),
				 (f = m(f, i, a, c, n[h + 1], 21, -2054922799)),
				 (c = m(c, f, i, a, n[h + 8], 6, 1873313359)),
				 (a = m(a, c, f, i, n[h + 15], 10, -30611744)),
				 (i = m(i, a, c, f, n[h + 6], 15, -1560198380)),
				 (f = m(f, i, a, c, n[h + 13], 21, 1309151649)),
				 (c = m(c, f, i, a, n[h + 4], 6, -145523070)),
				 (a = m(a, c, f, i, n[h + 11], 10, -1120210379)),
				 (i = m(i, a, c, f, n[h + 2], 15, 718787259)),
				 (f = m(f, i, a, c, n[h + 9], 21, -343485551)),
				 (c = d(c, r)),
				 (f = d(f, e)),
				 (i = d(i, o)),
				 (a = d(a, u));
			return [c, f, i, a];
		}

		function a(n) {
			for (var t = "", r = 32 * n.length, e = 0; e < r; e += 8)
				t += String.fromCharCode((n[e >> 5] >>> e % 32) & 255);
			return t;
		}

		function h(n) {
			var t = [];
			for (t[(n.length >> 2) - 1] = void 0, e = 0; e < t.length; e += 1)
				t[e] = 0;
			for (var r = 8 * n.length, e = 0; e < r; e += 8)
				t[e >> 5] |= (255 & n.charCodeAt(e / 8)) << e % 32;
			return t;
		}

		function e(n) {
			for (var t, r = "0123456789abcdef", e = "", o = 0; o < n.length; o += 1)
				(t = n.charCodeAt(o)),
				 (e += r.charAt((t >>> 4) & 15) + r.charAt(15 & t));
			return e;
		}

		function r(n) {
			return unescape(encodeURIComponent(n));
		}

		function o(n) {
			return a(i(h((t = r(n))), 8 * t.length));
			var t;
		}

		function u(n, t) {
			return (function (n, t) {
				var r,
				 e,
				 o = h(n),
				 u = [],
				 c = [];
				for (
				 u[15] = c[15] = void 0,
				 16 < o.length && (o = i(o, 8 * n.length)),
					r = 0;
				 r < 16;
				 r += 1
				)
					(u[r] = 909522486 ^ o[r]), (c[r] = 1549556828 ^ o[r]);
				return (
				 (e = i(u.concat(h(t)), 512 + 8 * t.length)), a(i(c.concat(e), 640))
				);
			})(r(n), r(t));
		}

		function t(n, t, r) {
			return t ? (r ? u(t, n) : e(u(t, n))) : r ? o(n) : e(o(n));
		}

		return t(str);
	}

	/**
	 * 渲染标题内容
	 * @param {object} widget 组件对象
	 * @param {string} icon 图标地址
	 * @param {string} title 标题内容
	 * @param {bool|color} color 字体的颜色（自定义背景时使用，默认系统）
	 */
	async renderHeader(widget, icon, title, color = false) {
		let header = widget.addStack();
		header.centerAlignContent();
		const image = await this.$request.get(icon, "IMG");
		let _icon = header.addImage(image);
		_icon.imageSize = new Size(14, 14);
		_icon.cornerRadius = 4;
		header.addSpacer(10);
		let _title = header.addText(title);
		if (color) _title.textColor = color;
		_title.textOpacity = 0.7;
		_title.font = Font.boldSystemFont(12);
		_title.lineLimit = 1;
		widget.addSpacer(15);
		return widget;
	}

	/**
	 * @param message 描述内容
	 * @param options 按钮
	 * @returns {Promise<number>}
	 */

	async generateAlert(message, options) {
		let alert = new Alert();
		alert.message = message;

		for (const option of options) {
			alert.addAction(option);
		}
		return await alert.presentAlert();
	}

	/**
	 * 弹出一个通知
	 * @param {string} title 通知标题
	 * @param {string} body 通知内容
	 * @param {string} url 点击后打开的URL
	 */
	async notify(title, body, url, opts = {}) {
		let n = new Notification();
		n = Object.assign(n, opts);
		n.title = title;
		n.body = body;
		if (url) n.openURL = url;
		return await n.schedule();
	}

	/**
	 * 给图片加一层半透明遮罩
	 * @param {Image} img 要处理的图片
	 * @param {string} color 遮罩背景颜色
	 * @param {float} opacity 透明度
	 */
	async shadowImage(img, color = "#000000", opacity = 0.7) {
		let ctx = new DrawContext();
		// 获取图片的尺寸
		ctx.size = img.size;

		ctx.drawImageInRect(
		 img,
		 new Rect(0, 0, img.size["width"], img.size["height"]),
		);
		ctx.setFillColor(new Color(color, opacity));
		ctx.fillRect(new Rect(0, 0, img.size["width"], img.size["height"]));

		let res = await ctx.getImage();
		return res;
	}

	/**
	 * 获取当前插件的设置
	 * @param {boolean} json 是否为json格式
	 */
	getSettings(json = true) {
		let res = json ? {} : "";
		let cache = "";
		if (Keychain.contains(this.SETTING_KEY)) {
			cache = Keychain.get(this.SETTING_KEY);
		}
		if (json) {
			try {
				res = JSON.parse(cache);
			} catch (e) {
			}
		} else {
			res = cache;
		}

		return res;
	}

	/**
	 * 存储当前设置
	 * @param {bool} notify 是否通知提示
	 */
	saveSettings(notify = true) {
		let res =
		 typeof this.settings === "object"
			? JSON.stringify(this.settings)
			: String(this.settings);
		Keychain.set(this.SETTING_KEY, res);
		if (notify) this.notify("设置成功", "桌面组件稍后将自动刷新");
	}

	/**
	 * 获取当前插件是否有自定义背景图片
	 * @reutrn img | false
	 */
	getBackgroundImage() {
		let result = null;
		if (this.FILE_MGR_LOCAL.fileExists(this.BACKGROUND_KEY)) {
			result = Image.fromFile(this.BACKGROUND_KEY);
		}
		return result;
	}

	/**
	 * 设置当前组件的背景图片
	 * @param {image} img
	 */
	setBackgroundImage(img, notify = true) {
		if (!img) {
			// 移除背景
			if (this.FILE_MGR_LOCAL.fileExists(this.BACKGROUND_KEY)) {
				this.FILE_MGR_LOCAL.remove(this.BACKGROUND_KEY);
			}
			if (notify) this.notify("移除成功", "小组件背景图片已移除，稍后刷新生效");
		} else {
			// 设置背景
			// 全部设置一遍，
			this.FILE_MGR_LOCAL.writeImage(this.BACKGROUND_KEY, img);
			if (notify) this.notify("设置成功", "小组件背景图片已设置！稍后刷新生效");
		}
	}

	randomNum(minNum, maxNum) {
		switch (arguments.length) {
			case 1:
				return parseInt(Math.random() * minNum + 1, 10);
			case 2:
				return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
			default:
				return 0;
		}
	}

	getRandomArrayElements(arr, count) {
		let shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
		min = min > 0 ? min : 0;
		while (i-- > min) {
			index = Math.floor((i + 1) * Math.random());
			temp = shuffled[index];
			shuffled[index] = shuffled[i];
			shuffled[i] = temp;
		}
		return shuffled.slice(min);
	}
}

// @base.end
const Runing = async (Widget, default_args = "", isDebug = true, extra) => {
	let M = null;
	// 判断hash是否和当前设备匹配
	if (config.runsInWidget) {
		M = new Widget(args.widgetParameter || "");
		if (extra) {
			Object.keys(extra).forEach((key) => {
				M[key] = extra[key];
			});
		}
		const W = await M.render();
		if (W) {
			Script.setWidget(W);
			Script.complete();
		}
	} else {
		let { act, data, __arg, __size } = args.queryParameters;
		M = new Widget(__arg || default_args || "");
		if (extra) {
			Object.keys(extra).forEach((key) => {
				M[key] = extra[key];
			});
		}
		if (__size) M.init(__size);
		if (!act || !M["_actions"]) {
			// 弹出选择菜单
			const actions = M["_actions"];
			const _actions = [
				...(isDebug
				 ? [
					 // 远程开发
					 async () => {
						 // 1. 获取服务器ip
						 const a = new Alert();
						 a.title = "服务器 IP";
						 a.message = "请输入远程开发服务器（电脑）IP地址";
						 let xjj_debug_server = "192.168.1.3";
						 if (Keychain.contains("xjj_debug_server")) {
							 xjj_debug_server = Keychain.get("xjj_debug_server");
						 }
						 a.addTextField("server-ip", xjj_debug_server);
						 a.addAction("连接");
						 a.addCancelAction("取消");
						 const id = await a.presentAlert();
						 if (id === -1) return;
						 const ip = a.textFieldValue(0);
						 // 保存到本地
						 Keychain.set("xjj_debug_server", ip);
						 const server_api = `http://${ip}:5566`;
						 // 2. 发送当前文件到远程服务器
						 const SELF_FILE = module.filename.replace(
							"DmYY",
							Script.name(),
						 );
						 const req = new Request(`${server_api}/sync`);
						 req.method = "POST";
						 req.addFileToMultipart(SELF_FILE, "Widget", Script.name());
						 try {
							 const res = await req.loadString();
							 if (res !== "ok") {
								 return M.notify("连接失败", res);
							 }
						 } catch (e) {
							 return M.notify("连接错误", e.message);
						 }
						 M.notify("连接成功", "编辑文件后保存即可进行下一步预览操作");
						 // 重写console.log方法，把数据传递到nodejs
						 const rconsole_log = async (data, t = "log") => {
							 const _req = new Request(`${server_api}/console`);
							 _req.method = "POST";
							 _req.headers = {
								 "Content-Type": "application/json",
							 };
							 _req.body = JSON.stringify({
								 t,
								 data,
							 });
							 return await _req.loadString();
						 };
						 const lconsole_log = console.log.bind(console);
						 const lconsole_warn = console.warn.bind(console);
						 const lconsole_error = console.error.bind(console);
						 console.log = (d) => {
							 lconsole_log(d);
							 rconsole_log(d, "log");
						 };
						 console.warn = (d) => {
							 lconsole_warn(d);
							 rconsole_log(d, "warn");
						 };
						 console.error = (d) => {
							 lconsole_error(d);
							 rconsole_log(d, "error");
						 };
						 // 3. 同步
						 while (1) {
							 let _res = "";
							 try {
								 const _req = new Request(
									`${server_api}/sync?name=${encodeURIComponent(
									 Script.name(),
									)}`,
								 );
								 _res = await _req.loadString();
							 } catch (e) {
								 M.notify("停止调试", "与开发服务器的连接已终止");
								 break;
							 }
							 if (_res === "stop") {
								 console.log("[!] 停止同步");
								 break;
							 } else if (_res === "no") {
								 // console.log("[-] 没有更新内容")
							 } else if (_res.length > 0) {
								 M.notify("同步成功", "新文件已同步，大小：" + _res.length);
								 // 重新加载组件
								 // 1. 读取当前源码
								 const _code = _res
									.split("// @组件代码开始")[1]
									.split("// @组件代码结束")[0];
								 // 2. 解析 widget class
								 let NewWidget = null;
								 try {
									 const _func = new Function(
										`const _Debugger = DmYY => {\n${_code}\nreturn Widget\n}\nreturn _Debugger`,
									 );
									 NewWidget = _func()(DmYY);
								 } catch (e) {
									 M.notify("解析失败", e.message);
								 }
								 if (!NewWidget) continue;
								 // 3. 重新执行 widget class
								 delete M;
								 M = new NewWidget(__arg || default_args || "");
								 if (__size) M.init(__size);
								 // 写入文件
								 FileManager.local().writeString(SELF_FILE, _res);
								 // 执行预览
								 let i = await _actions[1](true);
								 if (i === 4 + Object.keys(actions).length) break;
							 }
						 }
					 },
				 ]
				 : []),
				// 预览组件
				async (debug = false) => {
					let a = new Alert();
					a.title = "预览组件";
					a.message = "测试桌面组件在各种尺寸下的显示效果";
					a.addAction("小尺寸 Small");
					a.addAction("中尺寸 Medium");
					a.addAction("大尺寸 Large");
					a.addAction("全部 All");
					a.addCancelAction("取消操作");
					const funcs = [];
					if (debug) {
						for (let _ in actions) {
							a.addAction(_);
							funcs.push(actions[_].bind(M));
						}
						a.addDestructiveAction("停止调试");
					}
					let i = await a.presentSheet();
					if (i === -1) return;
					let w;
					switch (i) {
						case 0:
							M.widgetFamily = "small";
							w = await M.render();
							w && (await w.presentSmall());
							break;
						case 1:
							M.widgetFamily = "medium";
							w = await M.render();
							w && (await w.presentMedium());
							break;
						case 2:
							M.widgetFamily = "large";
							w = await M.render();
							w && (await w.presentLarge());
							break;
						case 3:
							M.widgetFamily = "small";
							w = await M.render();
							w && (await w.presentSmall());
							M.widgetFamily = "medium";
							w = await M.render();
							w && (await w.presentMedium());
							M.widgetFamily = "large";
							w = await M.render();
							w && (await w.presentLarge());
							break;
						default:
							const func = funcs[i - 4];
							if (func) await func();
							break;
					}

					return i;
				},
			];
			const alert = new Alert();
			alert.title = M.name;
			alert.message = M.desc;
			if (isDebug) {
				alert.addAction("远程开发");
			}
			alert.addAction("预览组件");
			for (let _ in actions) {
				alert.addAction(_);
				_actions.push(actions[_]);
			}
			alert.addCancelAction("取消操作");
			const idx = await alert.presentSheet();
			if (_actions[idx]) {
				const func = _actions[idx];
				await func();
			}
			return;
		}
		let _tmp = act
		 .split("-")
		 .map((_) => _[0].toUpperCase() + _.substr(1))
		 .join("");
		let _act = `action${_tmp}`;
		if (M[_act] && typeof M[_act] === "function") {
			const func = M[_act].bind(M);
			await func(data);
		}
	}
};

module.exports = { DmYY, Runing };
