const asyncHooks = require('async_hooks')
// const fs = require('fs')
let namespace = {}
function emptyObject(object) {
	if (object) {
		let keys = Object.keys(object)
		for (let key of keys) {
			if (/\d/i.test(key)) {
				if (object[key]) {
					emptyObject(object[key])
				}
				delete namespace[key]
			}
		}
	}
}
class SnakeNamespace {
	static async run (cb) {
		let rootAsyncId = asyncHooks.executionAsyncId()
		if (rootAsyncId === 0) {
			console.warn('may your node version not support async_hooks fine')
		}
		namespace[rootAsyncId] = namespace[rootAsyncId] || {}
		let hook = asyncHooks.createHook({
			init (asyncId, type, triggerAsyncId, resource) {
				// fs.writeSync(1, `init: asyncId-${asyncId},type-${type},triggerAsyncId-${triggerAsyncId}, ${resource}\n`);
				if (namespace[triggerAsyncId]) {
					namespace[triggerAsyncId][asyncId] = namespace[triggerAsyncId][asyncId] ||  {__parent_snake_namespace_object__: namespace[triggerAsyncId]}
					namespace[asyncId] = namespace[triggerAsyncId][asyncId]
				}
			},
			// before(asyncId) {
			// 	fs.writeSync(1, `before: asyncId-${asyncId}\n`);
			// },
			// after(asyncId) {
			// 	fs.writeSync(1, `after: asyncId-${asyncId}\n`);
			// },
			destroy(asyncId) {
				// fs.writeSync(1, `destroy: asyncId-${asyncId}\n`);
				if (asyncId !== rootAsyncId) {
					// Node 10.4.0 test, some init asyncId can not get destroy. delete from parent, asyncId children may memory leak
					// So if asyncId no children can delete from parent, Or later delete by rootAsync, here use rootAsync delete
					// if (namespace[asyncId]) {
					// 	if (namespace[asyncId]['__parent_snake_namespace_object__']) {
					// 		delete namespace[asyncId]['__parent_snake_namespace_object__'][asyncId]
					// 	}
					// }
					delete namespace[asyncId]
				}
			}
		});
		hook.enable()
		let result = undefined
		let error = null
		try {
			result = await cb()
			hook.disable()
		} catch (err) {
			error = err
		} finally {
			emptyObject(namespace[rootAsyncId])
			delete namespace[rootAsyncId]
		}
		if (error) {
			throw error
		}
		return result
	}
	
	static set (key, value) {
		let asyncId = asyncHooks.executionAsyncId()
		if (asyncId === 0) {
			console.warn('may your node version not support async_hooks fine')
		}
		if (namespace[asyncId]) {
			namespace[asyncId][key] = value
		}
	}
	
	static get (key) {
		let asyncId = asyncHooks.executionAsyncId()
		if (asyncId === 0) {
			console.warn('may your node version not support async_hooks fine')
		}
		let object = namespace[asyncId]
		let value = undefined
		while (object) {
			if (object[key] !== undefined) {
				value = object[key]
				break
			}
			object = object['__parent_snake_namespace_object__']
		}
		return value
	}
	
	static get _namesapce () {
		return namespace
	}
}
module.exports = SnakeNamespace
