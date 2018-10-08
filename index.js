const asyncHooks = require('async_hooks')
// const fs = require('fs')
const ModeEnum = {
	SHARE: 0,
	STACK: 1
}
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
			} else if (key === '__asyncIds__' && Array.isArray(object[key])) {
				for (let asyncId of object[key]) {
					delete namespace[asyncId]
				}
			}
		}
	}
}
class SnakeNamespace {
	
	static async runInShareMode (cb) {
		return await this.run(cb, ModeEnum.SHARE)
	}
	
	static async runInStackMode (cb) {
		return await this.run(cb, ModeEnum.STACK)
	}
	
	static async run (cb, mode = ModeEnum.SHARE) {
		let rootAsyncId = asyncHooks.executionAsyncId()
		if (rootAsyncId !== 0) {
			namespace[rootAsyncId] = namespace[rootAsyncId] || {}
			if (mode === ModeEnum.SHARE) {
				namespace[rootAsyncId]['__asyncIds__'] = []
			}
		}
		let hook = asyncHooks.createHook({
			init (asyncId, type, triggerAsyncId, resource) {
				// fs.writeSync(1, `init: asyncId-${asyncId},type-${type},triggerAsyncId-${triggerAsyncId}, ${resource}\n`);
				if (rootAsyncId === 0 && asyncId !== 0) {
					rootAsyncId = asyncId
					namespace[rootAsyncId] = namespace[rootAsyncId] || {}
					if (mode === ModeEnum.SHARE) {
						namespace[rootAsyncId]['__asyncIds__'] = []
					}
				}
				if (triggerAsyncId === 0) {
					triggerAsyncId = rootAsyncId
				}
				if (namespace[triggerAsyncId] && triggerAsyncId !== asyncId) {
					if (mode === ModeEnum.SHARE) {
						if (namespace[triggerAsyncId]['__asyncIds__']) {
							namespace[triggerAsyncId]['__asyncIds__'].push(asyncId)
							namespace[asyncId] = namespace[triggerAsyncId]
						}
					} else {
						namespace[triggerAsyncId][asyncId] = namespace[triggerAsyncId][asyncId] ||  {__parent_snake_namespace_object__: namespace[triggerAsyncId]}
						namespace[asyncId] = namespace[triggerAsyncId][asyncId]
					}
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
					// if (namespace[asyncId] && Object.keys(namespace).length === 1 && Object.keys(namespace)[0] === '__parent_snake_namespace_object__') {
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
		console.assert(asyncId !== 0, '-- Error --: Node Version May Not support SnakeNamespace, Or Check Your Code.')
		if (namespace[asyncId]) {
			namespace[asyncId][key] = value
		}
	}
	
	static get (key) {
		let asyncId = asyncHooks.executionAsyncId()
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
