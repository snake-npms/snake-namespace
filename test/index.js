const assert = require("assert");
const asyncHooks = require('async_hooks')
const SnakeNamespace = require('../index')

function testKeyValue(key, value) {
	// sync use main asyncId
	// namespace.set(key, value)
	return new Promise(resolve => {
		// sync use main asyncId
		SnakeNamespace.set(key, value)
		setTimeout(() => {
			// async use new asyncId
			// namespace.set(key, value)
			resolve(SnakeNamespace.get(key))
		})
	})
}

function testKeyValue2(key, value) {
	return new Promise(resolve => {
		setTimeout(() => {
			// async use new asyncId
			SnakeNamespace.set(key, value)
			setTimeout(() => {
				// console.log(SnakeNamespace.get(key), 'testKeyValue2............', asyncHooks.executionAsyncId(), asyncHooks.triggerAsyncId())
				// async use new asyncId
				SnakeNamespace.set(key, value)
				resolve(SnakeNamespace.get(key))
			})
		})
	})
}
async function testKey(key) {
	return SnakeNamespace.get(key)
}


describe('test Namespace', function(){
	it('test 1', async function () {
		await SnakeNamespace.run(async () => {
			SnakeNamespace.set('age', 1)
			assert.equal(1, SnakeNamespace.get('age'))

			// 覆盖主 age的1 为2，访问统一属性，因为赋值前没有异步
			let value = await testKeyValue('age', 2)
			assert.equal(value, 2)
			assert.equal(SnakeNamespace.get('age'), 2)

			// 前面有异步，主创建新的从对象，设置age为3
			value = await testKeyValue('age', 3)
			assert.equal(value, 3)
			// 前面有异步，重新创建新对象， 新对象向上遍历取主 age 2
			assert.equal(SnakeNamespace.get('age'), 2)

			// 前面有异步，主创建新新对象， 冒泡取主age为1
			value = await testKey('age')
			assert.equal(value, 2)
		})
	})


	it('test 2', async function () {
		await SnakeNamespace.run(async () => {
			SnakeNamespace.set('age', 1)
			assert.equal(1, SnakeNamespace.get('age'))

			// 赋值在异步里面写的，所以会创建新的对象
			let value = await testKeyValue2('age', 2)
			assert.equal(value, 2)
			// 前面有异步，主创建新新对象， 冒泡取主age为1
			assert.equal(SnakeNamespace.get('age'), 1)

			// 前面有异步，主创建新的从对象，设置age为3
			value = await testKeyValue('age', 3)
			assert.equal(value, 3)
			// 前面有异步，主创建新新对象， 冒泡取主age为1
			assert.equal(SnakeNamespace.get('age'), 1)

			// 前面有异步，主创建新新对象， 冒泡取主age为1
			value = await testKey('age')
			assert.equal(value, 1)
		})
	})
	
	it('test 3', async function () {
		let value = undefined
		let result = await SnakeNamespace.run(async () => {
			// console.log('---- 11111', asyncHooks.executionAsyncId(), asyncHooks.triggerAsyncId())
			SnakeNamespace.set('age', 0)
			// console.log('---- 22222', asyncHooks.executionAsyncId(), asyncHooks.triggerAsyncId())
			value = SnakeNamespace.get('age')
			// console.log(value, '=============', SnakeNamespace._namesapce)
			assert.equal(value, 0)
			
			function test1(key, value) {
				return new Promise(resolve => {
					SnakeNamespace.set(key, value)
					setTimeout(() => {resolve()})
				})
			}
			await test1('age', 1)
			// because test1 has setTimeout, it's async function, below will in new Namespace
			value = SnakeNamespace.get('age')
			assert.equal(value, 1)
			
			function test2(key, value) {
				return new Promise(resolve => {
					SnakeNamespace.set(key, value)
					setTimeout(() => {
						resolve()
					})
				})
			}
			await test2('age', 2)
			value = SnakeNamespace.get('age')
			assert.equal(value, 1)

			function test3(key, value) {
				return new Promise(resolve => {
					setTimeout(() => {
						SnakeNamespace.set(key, value)
						let getVal = SnakeNamespace.get('age')
						assert.equal(getVal, value)
						resolve()
					})
				})
			}
			await test3('age', 3)
			value = SnakeNamespace.get('age')
			assert.equal(value, 1)

			function test4(key, value) {
				return new Promise(resolve => {
					setTimeout(() => {
						SnakeNamespace.set(key, value)
						let getVal = SnakeNamespace.get('age')
						assert.equal(getVal, value)
						setTimeout(() => {
							let getVal = SnakeNamespace.get('age')
							assert.equal(getVal, value)
							// in async, new namespace
							SnakeNamespace.set(key, value + 1)
							let getVal2 = SnakeNamespace.get('age')
							assert.equal(getVal2, 5)
							resolve()
						})
					})
				})
			}
			await test4('age', 4)
			value = SnakeNamespace.get('age')
			assert.equal(value, 1)
			
			function test5(key, value) {
				SnakeNamespace.set(key, value)
			}
			test5('age', 50)
			value = SnakeNamespace.get('age')
			assert.equal(value, 50)
			
			function test6(key, value) {
				SnakeNamespace.set(key, value)
				return new Promise(resolve => {
					setTimeout(() => {resolve()})
				})
			}
			await test6('age', 60)
			value = SnakeNamespace.get('age')
			assert.equal(value, 1)
			
			return 'end'
		})
		assert.equal(result, 'end')
	})
	
	it('test 4', async function () {
		let namespace = SnakeNamespace._namesapce
		assert.equal(Object.keys(namespace).length, 0)
	})
	
})


