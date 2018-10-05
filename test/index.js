const assert = require("assert");
const SnameNamespace = require('../index')

function testKeyValue(key, value) {
	// sync use main asyncId
	// namespace.set(key, value)
	return new Promise(resolve => {
		// sync use main asyncId
		SnameNamespace.set(key, value)
		setTimeout(() => {
			// async use new asyncId
			// namespace.set(key, value)
			resolve(SnameNamespace.get(key))
		})
	})
}

function testKeyValue2(key, value) {
	return new Promise(resolve => {
		setTimeout(() => {
			// async use new asyncId
			SnameNamespace.set(key, value)
			resolve(SnameNamespace.get(key))
		})
	})
}
async function testKey(key) {
	return SnameNamespace.get(key)
}


describe('test Namesapce', function(){
	it('test 1', async function () {
		await SnameNamespace.run(async () => {
			SnameNamespace.set('age', 1)
			assert.equal(1, SnameNamespace.get('age'))

			// 覆盖主 age的1 为2，访问统一属性，因为赋值前没有异步
			let value = await testKeyValue('age', 2)
			assert.equal(value, 2)
			assert.equal(SnameNamespace.get('age'), 2)

			// 前面有异步，主创建新的从对象，设置age为3
			value = await testKeyValue('age', 3)
			assert.equal(value, 3)
			// 前面有异步，重新创建新对象， 新对象向上遍历取主 age 2
			assert.equal(SnameNamespace.get('age'), 2)
			
			// 前面有异步，主创建新新对象， 冒泡取主age为1
			value = await testKey('age')
			assert.equal(value, 2)
		})
	})
	
	
	it('test 2', async function () {
		await SnameNamespace.run(async () => {
			SnameNamespace.set('age', 1)
			assert.equal(1, SnameNamespace.get('age'))
			
			// 赋值在异步里面写的，所以会创建新的对象
			let value = await testKeyValue2('age', 2)
			assert.equal(value, 2)
			// 前面有异步，主创建新新对象， 冒泡取主age为1
			assert.equal(SnameNamespace.get('age'), 1)
			
			// 前面有异步，主创建新的从对象，设置age为3
			value = await testKeyValue('age', 3)
			assert.equal(value, 3)
			// 前面有异步，主创建新新对象， 冒泡取主age为1
			assert.equal(SnameNamespace.get('age'), 1)
			
			// 前面有异步，主创建新新对象， 冒泡取主age为1
			value = await testKey('age')
			assert.equal(value, 1)
		})
	})
})


