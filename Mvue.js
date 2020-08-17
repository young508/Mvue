const compileUtils = {

	getContentValue(value, vm) {
		return value.replace(/\{\{(.+?)\}\}/g, (...args) => {
			return this.getValue(args[1], vm);
		})
	},

	text(value, node, vm) {
		let val;
		if (value.indexOf("{{") != -1) { //存在{{}}
			//这里的正则很关键
			val = value.replace(/\{\{(.+?)\}\}/g, (...args) => {
				new Watcher(vm, args[1], (newVal) => {
					this.update.textUpdate(node, this.getContentValue(value, vm))
				})
				return this.getValue(args[1], vm);
			})
		} else {
			val = this.getValue(value, vm);
		}
		this.update.textUpdate(node, val)
	},
	html(value, node, vm) {
		const val = this.getValue(value, vm);
		console.log("new watcher html")
		new Watcher(vm, value, (newVal) => {
			this.update.htmlUpdate(node, newVal)
		})

		this.update.htmlUpdate(node, val)
	},
	model(value, node, vm) {
		const val = this.getValue(value, vm);
		new Watcher(vm, value, (newVal) => {
			this.update.modelUpdate(node, newVal)
		})

		//双向绑定,监听input事件
		node.addEventListener('input', (e) => {
			this.setVal(value, vm, e.target.value)
		})

		this.update.modelUpdate(node, val)
	},
	//value自定义的事件名字
	//event：原生事件名字
	on(value, node, vm, event) {
		let fn = vm.$option.methods && vm.$option.methods[value];
		node.addEventListener(event, fn.bind(vm), false)

	},

	//双向绑定
	setVal(value, vm, inputVal) {
		value.split(".").reduce((data, currentVal) => {
			data[currentVal] = inputVal
		}, vm.$data)
	},

	getValue(value, vm) {
		//reduce是高阶函数，下面内容主要是解决person.age.a.b的情况
		//data[person][age][a][b]
		return value.split(".").reduce((data, currentVal) => {
			return data[currentVal];
		}, vm.$data)
	},

	update: {
		modelUpdate(node, value) {
			node.value = value
		},
		htmlUpdate(node, value) {
			node.innerHTML = value
		},
		textUpdate(node, value) {
			node.textContent = value;
		}
	}
}

class Compile {
	constructor(el, vm) {
		this.el = this.isElementNode(el) ? el : document.querySelector(el);
		this.vm = vm;

		//1.获取文档碎片对象，放入内存中减少页面的回流和重汇

		let fragment = this.node2Fragemts(this.el);

		//2.编译模版
		this.compile(fragment)

		//3.追加子元素到跟元素
		this.el.appendChild(fragment);
	}

	compile(fragment) {
		const nodes = fragment.childNodes;
		[...nodes].forEach(child => {
			if (this.isElementNode(child)) {
				//元素节点
				// console.log(child)
				this.compileElement(child)
			} else {
				//文本节点
				// console.log(child)
				this.compileText(child)
			}

			if (child.childNodes && child.childNodes.length) {
				this.compile(child)
			}
		})
	}

	//编译节点元素
	compileElement(node) {
		const attributes = node.attributes;
		[...attributes].forEach(attr => {
			const {
				name,
				value
			} = attr; //name:v-text,value:'msg'
			if (this.isDirective(name)) {
				const [, directive] = name.split("-"); //分割属性 text,bind,html,on:click
				const [dirName, event] = directive.split(":"); //分割事件text,bind,click
				compileUtils[dirName](value, node, this.vm, event);

				//删除v-开头的属性
				node.removeAttribute("v-" + directive)
			} else if (this.isEventName(name)) {
				const [, event] = name.split("@");
				compileUtils['on'](value, node, this.vm, event);
			}

		})
	}

	isEventName(name) {
		return name.startsWith("@")
	}

	//判断是否以v-开头
	isDirective(name) {
		return name.startsWith("v-")
	}

	//编译文本元素
	compileText(node) {
		const content = node.textContent; //{{msg}}
		let result = /\{\{(.+?)\}\}/.test(content);
		if (result) {
			compileUtils['text'](content, node, this.vm)
		}
	}

	//将所有的子元素添加到文档碎片上
	node2Fragemts(node) {
		const f = document.createDocumentFragment()
		let child;
		//如果child被append后，node.firstChild会指向下一步子节点
		while (child = node.firstChild) {
			f.appendChild(child)
		}
		return f
	}

	//判断是否是节点元素
	isElementNode(node) {
		return node.nodeType === 1;
	}
}


class Mvue {
	//每一个构造函数都有一个prototype属性，指向另一个对象
	//这意味着，我们可以把那些不变的属性和方法，直接定义在prototype对象上。
	constructor(options) {
		this.$el = options.el;
		this.$data = options.data;
		this.$option = options;

		if (this.$el) {
			//1.实现一个观察者
			new Observer(this.$data);

			//2.实现一个指令解析器
			new Compile(this.$el, this)

			this.proxy(this.$data)
		}
	}
	
	proxy(data) {
		for (const key in data) {
			Object.defineProperty(this, key, {
				get() {
					return data[key];
				},
				set(newVal) {
					data[key] = newVal;
				}
			})
		}
	}
}
