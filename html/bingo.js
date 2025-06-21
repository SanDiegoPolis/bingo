const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const itemWidth = 200;
const labelHeight = itemWidth * 0.2;

const colsOptions = [];
const defaultTitle = 'W∩∀宾果';
const defaultSub = '连成线你就没救了';

for(let i = 3; i <= 10; i++){
	colsOptions.push({
		value: i,
		text: `${i}x`,
	});
}

const fitOptions = [
	{ value: 'cover', text: '裁切填充' },
	{ value: 'contain', text: '完整填充' },
];
const copyRightText = [
	
].join(' · ');

const lazy = (fn, delay = 100) => {
	let timer = null;
	return (...args) => {
		if(timer) clearTimeout(timer);
		timer = setTimeout(() => {
			fn(...args);
		}, delay);
	};
};


const chooseImage = async () => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = 'image/*';
	input.click();
	return new Promise(resolve => {
		input.addEventListener('change', e => {
			resolve(e.target.files[0]);
		});
	});
};
const readImageToURL = async (file) => {
	return URL.createObjectURL(file);
};
const getImageElFromURL = async (url) => {
	return new Promise(resolve => {
		const img = new Image();
		img.src = url;
		img.onload = () => {
			resolve(img);
		};
	});
};
const textSize = 80;
const textHeight = 100;
const generatorTextImage = (text) => {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	// 计算文字宽度
	canvas.style.cssText = `line-height: ${textHeight}px;`;
	ctx.font = `bold ${textSize}px sans-serif`;

	const width = ctx.measureText(text).width;
	canvas.width = width;
	canvas.height = textHeight;

	ctx.font = `normal bold ${textSize}px sans-serif`;

	ctx.fillStyle = '#222';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';

	ctx.fillText(text, 0, textHeight / 2);
	document.body.appendChild(canvas);
	return canvas;
}


// 根据比例计算 在 itemWidth 中的字体大小

const calcItemFontSizeCtx = canvas.getContext('2d');
const calcItemFontSize = ( text ) => {
	calcItemFontSizeCtx.font = `bold ${textSize}px sans-serif`;
	const { width } = calcItemFontSizeCtx.measureText(text);
	return itemWidth / width * textSize;
}
const isImageEl = (el) => el instanceof HTMLImageElement;
const v = new Vue({
	el: '.app',
	data: {
		output: null,
		currentId: null,
		colsOptions,
		fitOptions,
		defaultTitle,
		config: {
			margin: 40, // px
			rows: 5,
			cols: 5,
			headHeight: 100,
			fit: 'cover',
			Texts: {},
			Images: {},
			title: '',
			sub: '',
		},
		logoImage: null,
	},
	methods: {
		async setImageFileById(file, id){
			const dataURL = await readImageToURL(file);
			console.log(dataURL)
			const img = await getImageElFromURL(dataURL);
			console.log(img)
			// this.config.Texts[id] = img;
			this.$set(this.config.Images, id, img);
		},
		async chooseItemImage(id){
			const file = await chooseImage();
			await this.setImageFileById(file, id);
		},
		generator(){
			console.time('generator');
			const { config } = this;
			const { rows, Texts, Images, title, sub , margin, fit, headHeight  } = config;
			const cols = rows;

			const width = cols * itemWidth + margin * 2;
			const height = rows * itemWidth + margin * 2 + headHeight;

			canvas.width = width;
			canvas.height = height;

			
			const ctx = canvas.getContext('2d');

			ctx.fillStyle = '#FFF';
			ctx.fillRect(0, 0, width, height);

			ctx.fillStyle = '#222';


			const maxWidth = cols * itemWidth / 2;

			if(cols > 3){
				ctx.font = 'bold 60px sans-serif';
				ctx.textBaseline = 'bottom';
				// 绘制标题
				ctx.fillText(title || defaultTitle, margin, headHeight + margin / 2, maxWidth);
			
				// 绘制副标题
				ctx.font = '30px sans-serif';
				ctx.textAlign = 'right';
				const subText = sub || defaultSub;
				const subTextWidth = ctx.measureText(subText).width;
				
				// 绘制副标题文本
				ctx.fillText(subText, width - margin - 50, headHeight + margin / 2, maxWidth);
			} else {
				ctx.font = 'bold 50px sans-serif';

				ctx.textAlign = 'center';
				ctx.textBaseline = 'top';
				// 绘制标题
				ctx.fillStyle = '#222';
				ctx.fillText( title || defaultTitle, width / 2, margin * 0.9 , width);

				// 绘制副标题
				ctx.font = '30px sans-serif';
				ctx.fillText( sub || defaultSub, width / 2, margin * 2.3 , width);
			}

			// 如果有logo图片，绘制在副标题右侧
			ctx.save();
			if(this.logoImage && this.logoImage.complete) {
				const logoSize = 40; // 方形logo的大小
				const logoX = width - margin - 40; // 右侧边距40px
				const logoY = headHeight + margin / 2 - logoSize;
				
				ctx.drawImage(
				this.logoImage,
				logoX, 
				logoY,
				logoSize, 
				logoSize
				);
			}
			ctx.restore();

			// 绘制末尾
			ctx.fillStyle = '#AAA';
			ctx.font = '18px sans-serif';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'bottom';
			ctx.fillText(copyRightText, margin, height - margin / 4);

			
			ctx.fillStyle = '#222';
			ctx.strokeStyle = '#222';

			// 居中
			ctx.transform(1, 0, 0, 1, margin, margin + headHeight);

			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = 'bold 30px sans-serif';

			for(let x = 0; x < cols; x++){
				for(let y = 0; y < rows; y++){
					const key = `${x}-${y}`;
					// if(!Texts[key]) continue;


					ctx.save();
					// 画个裁剪框
					ctx.beginPath();
					ctx.rect(x * itemWidth, y * itemWidth, itemWidth, itemWidth);
					ctx.clip();

					
					const image = Images[key];

					const text = Texts[key];

					if(image){
						// contain 保持比例填充形式裁切边缘绘制
						const { naturalWidth, naturalHeight } = image;

						if(fit === 'contain'){
							const scale = Math.max(naturalWidth, naturalHeight) / itemWidth;
							const width = naturalWidth / scale;
							const height = naturalHeight / scale;
							ctx.drawImage(
								image, 
								x * itemWidth + itemWidth / 2 - width / 2, 
								y * itemWidth + itemWidth / 2 - height / 2,
								width, height
							);
						}

						else if(fit === 'cover'){
							const scale = Math.min(naturalWidth, naturalHeight) / itemWidth;
							const width = naturalWidth / scale;
							const height = naturalHeight / scale;
							ctx.drawImage(
								image,
								x * itemWidth + itemWidth / 2 - width / 2, 
								y * itemWidth + itemWidth / 2 - height / 2, 
								width, height
							);
						}
						if(text){
							// 在图片下缘画个黑色半透明背景
							ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
							ctx.fillRect(
								x * itemWidth, y * itemWidth + itemWidth - labelHeight, 
								itemWidth, labelHeight
							);

							ctx.fillStyle = '#FFF';
							ctx.font = 'bold 20px sans-serif';
							ctx.fillText(
								text, 
								x * itemWidth + itemWidth / 2, 
								y * itemWidth + itemWidth - labelHeight / 2, 
								itemWidth - margin / 4
							);
						}
					}

					// 如果是文字
					else if (text) {
						const maxLines = 4; // 格子允许的最大行数
						const minFontSize = 10; // 最小字体限制
						let fontSize = Math.min(Math.max(calcItemFontSize(text), 40), 80); // 初始字号
						
						// 动态调整字体直至适配或达到最小字号
						while (fontSize >= minFontSize) {
							ctx.font = `bold ${fontSize}px sans-serif`;
							const lineHeight = fontSize * 1.2;
							const lines = splitTextToLines(text, ctx, itemWidth - margin / 4);
							
							// 检查是否超出格子高度（行数 * 行高 ≤ 格子高度）
							if (lines.length * lineHeight <= itemWidth) break;
							fontSize--; // 缩小字号
						}
					
						// 最终换行绘制（垂直居中）
						const lineHeight = fontSize * 1.2;
						const lines = splitTextToLines(text, ctx, itemWidth - margin / 4);
						const totalHeight = lines.length * lineHeight;
						const startY = y * itemWidth + (itemWidth - totalHeight) / 2 + lineHeight / 2;
						
						ctx.textAlign = 'center';
						for (let i = 0; i < lines.length; i++) {
							ctx.fillText(lines[i], x * itemWidth + itemWidth / 2, startY + i * lineHeight);
						}
					}
					
					// 辅助函数：按最大宽度分割文本为多行
					function splitTextToLines(text, ctx, maxWidth) {
						const lines = [];
						let currentLine = '';
						for (const char of text) {
							const testLine = currentLine + char;
							if (ctx.measureText(testLine).width > maxWidth) {
								lines.push(currentLine);
								currentLine = char;
							} else {
								currentLine = testLine;
							}
						}
						lines.push(currentLine);
						return lines;
					}

					ctx.restore();

				}
			}

			// 画线

			ctx.lineWidth = 6;
			// 圆角
			ctx.lineJoin = 'round';
			ctx.lineCap = 'round';

			ctx.beginPath();
			for(let i = 0; i <= rows; i++){
				// 加上边距
				ctx.moveTo(0, i * itemWidth);
				ctx.lineTo(cols * itemWidth, i * itemWidth);
				
			}
			for(let i = 0; i <= cols; i++){
				ctx.moveTo(i * itemWidth, 0);
				ctx.lineTo(i * itemWidth, rows * itemWidth);
			}
			ctx.stroke();

			console.timeEnd('generator');
		},
		_generator: lazy(function(){
			v.generator();
		}),
		async saveImage(){

			const { config } = this;
			const { title } = config;
			if(!title){
				const titleEl = $('.config-title-input');
				titleEl.focus();
				return;
			}

			const url = canvas.toDataURL('image/jpeg', 0.9);
			this.output = url;

			const a = document.createElement('a');
			a.href = url;
			
			a.download = this.outputFileName;
			a.click();
		},
		closeCurrentPop(){
			this.currentId = null;
		}
	},
	computed: {
		outputFileName(){
			return `[lab.magiconch.com][宾果游戏生成器]_${+new Date()}.jpg`;
		},
		haveImages(){
			return Object.keys(this.config.Images).length > 0;
		},
	},
	watch: {
		config: {
			handler(){
				this._generator();
			},
			deep: true,
		}
	},
	mounted(){
		this.$refs['canvas-box'].appendChild(canvas);
		// 加载logo图片
		const logoImg = new Image();
		//logoImg.crossOrigin = "Anonymous"; // 处理跨域问题
		logoImg.src = 'anti_muaball.png';
		logoImg.onload = () => {
		this.logoImage = logoImg;
		this.isImageLoaded = true;
		this.generator(); // 重新生成图片
		};
	}
});


v.generator();




// 屏蔽拖放默认事件
window.addEventListener('dragover', e => {
	e.preventDefault();
	e.stopPropagation();
});

const getXY = (e) => {
	const { clientX, clientY } = e;

	const rect = canvas.getBoundingClientRect();
	const { left, top, width, height } = rect;

	
	const scale = canvas.width / width;

	const x = (clientX - left) * scale;
	const y = (clientY - top) * scale;

	return { x, y };
}
// 监控拖放释放事件
const getFilesOrTextsFromEvent = (e) => {
	const files = [];
	const texts = [];
	if(e.dataTransfer.items){
		for(let i = 0; i < e.dataTransfer.items.length; i++){
			const item = e.dataTransfer.items[i];
			if(item.kind === 'file'){
				files.push(item.getAsFile());
			}
			// else if(item.kind === 'string'){
			// 	console.log(item)
			// 	texts.push(item.getAsString());
			// }
		}
	}
	else if(e.dataTransfer.files){
		for(let i = 0; i < e.dataTransfer.files.length; i++){
			files.push(e.dataTransfer.files[i]);
		}
	}
	return { files, texts };
};
canvas.addEventListener('drop',async e => {
	e.preventDefault();
	// 获取图片文件 或者 图片元素
	const { files, texts } = getFilesOrTextsFromEvent(e);
	const imageFiles = files.filter(file => file.type.startsWith('image/'));
	const { x, y } = getXY(e);
	const { margin, rows, cols, headHeight } = v.config;

	const itemX = Math.floor((x - margin) / itemWidth);
	const itemY = Math.floor((y - margin - headHeight) / itemWidth);

	// 在范围内
	if(itemX >= 0 && itemX < cols && itemY >= 0 && itemY < rows){
		// v.chooseItemImage(itemX, itemY);
		// console.log('在范围内', itemX, itemY);
		const id = `${itemX}-${itemY}`;
		
		if(imageFiles.length){
			const imageFile = imageFiles[0];
			await v.setImageFileById(imageFile, id);
		}

		// else if(texts.length){
		// 	// v.config.Texts[id] = texts[0];
		// 	v.$set(v.config.Texts, id, texts[0]);
		// }
	}
	// else{
	// 	console.log('范围外', itemX, itemY);
	// }
});


canvas.addEventListener('mousemove', e => {
	
	const { x, y } = getXY(e);
	const { margin, rows, headHeight } = v.config;

	const itemX = Math.floor((x - margin) / itemWidth);
	const itemY = Math.floor((y - margin - headHeight) / itemWidth);

	// 在范围内
	if(itemX >= 0 && itemX < rows && itemY >= 0 && itemY < rows){
		// v.chooseItemImage(itemX, itemY);
		//console.log('在范围内', itemX, itemY);
		canvas.style.cursor = 'pointer';
	}
	else{
		canvas.style.cursor = '';
	}
});

const $ = document.querySelector.bind(document);


// 点击事件
canvas.addEventListener('click', e => {
	const { x, y } = getXY(e);

	const { margin, rows, headHeight } = v.config;
	console.log('margin rows headHeight', margin, rows, headHeight);
	console.log('x y', x, y);
	
	// 点击标题
	if(y < margin + headHeight){
		console.log('title')
	}

	// 点击末尾
	else if(y > canvas.height - margin){
		console.log('footer')
	}

	// 点击方格
	else {
		const itemX = Math.floor((x - margin) / itemWidth);
		const itemY = Math.floor((y - margin - headHeight) / itemWidth);

		// 在范围内
		if(itemX >= 0 && itemX < rows && itemY >= 0 && itemY < rows){
			// v.chooseItemImage(itemX, itemY);
			//console.log('在范围内', itemX, itemY);
			v.currentId = `${itemX}-${itemY}`;

			v.$nextTick(() => {
				const currentTextInputEl = $('.current-text-input');
				currentTextInputEl.focus();
			});
		}
		// else{
		// 	console.log('范围外', itemX, itemY);
		// }
	}
});


// ESC 关闭弹出层
window.addEventListener('keydown', e => {
	if(e.key === 'Escape'){
		v.closeCurrentPop();
	}
});


// <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "203ba33cb58c43f0a0e06479f52e4c1b"}'></script>

setTimeout(() => {
	const script = document.createElement('script');
	script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
	script.setAttribute('data-cf-beacon', `{"token": "203ba33cb58c43f0a0e06479f52e4c1b"}`);
	document.head.appendChild(script);
}, 1000);