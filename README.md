# Mvue

## 小马哥的视频代码

## 组成
### Observer
- data监听类，主要通过Object.defineProperty进行属性劫持，通过Dep和Watch类进行数据的notify操作。
这里需要注意的是，data中每个子对象都对应一个Dep，每个v-开头的属性对应一个Watcher，Dep是Watcher的数组集合

### Compile
- 对v-开头的属性进行编译
- 双向绑定通过input事件来处理的

### proxy
- 属性劫持实现获取data中的数据不需要写data
