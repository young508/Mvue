class Watcher {
	constructor(vm, expr, cb) {
		this.vm = vm;
		this.expr = expr;
		this.cb = cb;

		//保存旧值
		this.oldVal = this.getOldVal();
	}

	getOldVal() {
		Dep.target = this;
		console.log("getOldVal before")
		const oldVal = compileUtils.getValue(this.expr, this.vm);
		console.log("getOldVal after")
		Dep.target = null;
		return oldVal;
	}

	notify() {
		const newVal = compileUtils.getValue(this.expr, this.vm);
		if (this.oldVal != newVal) {
			this.cb(newVal)
		}
	}
}


class Dep {
	constructor() {
		this.subs = [];
	}

	addSub(watcher) {
		this.subs.push(watcher);
	}

	notify() {
		this.subs.forEach(w => w.notify())
	}
}

class Observer {
	constructor(data) {
		// this.dep = new Dep()
		this.observer(data)
	}

	observer(data) {
		if (data && typeof data === 'object') {
			Object.keys(data).forEach(key => {
				this.defineReactive(data, key, data[key])
			})
		}
	}

	defineReactive(obj, key, value) {
		//递归遍历
		this.observer(value);
		let dep=new Dep()
		console.log("defineReactive"+key)
		Object.defineProperty(obj, key, {
			enumerable: true,
			configurable: false,
			set: (newVal) => {
				console.log("set"+newVal)
				//监听新的对象修改
				this.observer(newVal)
				//监听值的修改
				if (newVal != value) {
					value = newVal
				}
				dep.notify()
			},
			get() {
				// console.log("get"+key)
				console.log(Dep.target)
				Dep.target && dep.addSub(Dep.target)
				//订阅数据变化，王dep中添加观察者，dep是观察者集合
				return value;
			}
		})
	}

}
