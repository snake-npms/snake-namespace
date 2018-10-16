snake-namespace

set `vars` to sub stack

> To prevent errors, Node Version Best `>= 10.4.0+`, `9.11.2+`
> ~~Warning: Lower or equal than 8.12.0 Not Support~~

### Install
```
$ npm install snake-namespace
``` 
### Usage
```bash
const SnakeNamespace = require('snake-namespace')
# run() === runInShareMode()
SnakeNamespace.run(async () => {
  SnakeNamespace.set('age', 0)
  # in await function can get age value use SnakeNamespace.get('age')
  await ....
})

SnakeNamespace.runInStackMode(async () => {
  SnakeNamespace.set('age', 0)
  in await function can get age value use SnakeNamespace.get('age')
  await ....
})
```

### `share mode`  - `recommend`
```bash
await SnakeNamespace.run(async () => {
  SnakeNamespace.set('age', 0)
  # return 0
  SnakeNamespace.get('age')
    
  function test1(key, value) {
    return new Promise(resolve => {
      SnakeNamespace.set(key, value)
        setTimeout(() => {resolve()})
    })
  }
  await test1('age', 1)
  # return 1
  SnakeNamespace.get('age')
    
  function test2(key, value) {
    return new Promise(resolve => {
      SnakeNamespace.set(key, value)
      setTimeout(() => {
        resolve()
      })
    })
  }
  await test2('age', 2)
  # return 2
  SnakeNamespace.get('age')

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
  # return 3
  SnakeNamespace.get('age')
    
  function test4(key, value) {
    return new Promise(resolve => {
      setTimeout(() => {
        SnakeNamespace.set(key, value)
        # return 4
        SnakeNamespace.get('age')
        setTimeout(() => {
          # return 4        
          let getVal = SnakeNamespace.get('age')
            resolve()
        })
      })
    })
  }
  await test4('age', 4)
  # return 4
  SnakeNamespace.get('age')
    
  function test5(key, value) {
    SnakeNamespace.set(key, value)
  }
  test5('age', 50)
  # return 50
  SnakeNamespace.get('age')
    
  function test6(key, value) {
    SnakeNamespace.set(key, value)
      return new Promise(resolve => {
        setTimeout(() => {resolve()})
    })
  }
  await test6('age', 60)
  # return 60
  SnakeNamespace.get('age')
})
```

### `stack mode`  - `recommend`
``` bash
const SnakeNamespace = require('snake-namespace')
SnakeNamespace.runInStackMode(async () => {
  SnakeNamespace.set('age', 0)
  # return 0, main namespace
  SnakeNamespace.get('age')
  
  function test1(key, value) {
    return new Promise(resolve => {
       # not in async, will cover top value
       SnakeNamespace.set(key, value)
       setTimeout(() => {resolve()})
    })
  }
  
  await test1('age', 1)
  
  # --- because test1 has setTimeout, it's async function, below will in new Namespace ---
  # test1 set not in async, will cover age default value 0 -> 1
  # # because setTimeout, new namespace, inherit from main 
  
  # return 1
  SnakeNamespace.get('age')
  
  function test2(key, value) {
    return new Promise(resolve => {
      # not in async, will cover top value
      SnakeNamespace.set(key, value)
      setTimeout(() => {resolve()})
    })
  }
  await test2('age', 2)
  # # because setTimeout, new namespace, inherit from main 
  # return 1
  SnakeNamespace.get('age')
  
  function test3(key, value) {
    return new Promise(resolve => {
      setTimeout(() => {
        # in async, new namespace
        SnakeNamespace.set(key, value)
        # return 3
        SnakeNamespace.get('age')
        resolve()
      })     
    })
  }
  await test3('age', 3)
  # # because setTimeout, new namespace, inherit from main 
  # return 1
  SnakeNamespace.get('age')
  
  function test4(key, value) {
    return new Promise(resolve => {
      setTimeout(() => {
        # in async, new namespace
        SnakeNamespace.set(key, value)
        # return 4
        SnakeNamespace.get('age')
        setTimeout(() => {
          # return 4, from bubble up
          SnakeNamespace.get('age')
          // in async, new namespace
          SnakeNamespace.set(key, value + 1)
          # return 5
          SnakeNamespace.get('age')
          resolve()
        })
      })     
    })
  }
  await test4('age', 4)
  # because setTimeout, new namespace, inherit from main 
  # return 1
  SnakeNamespace.get('age')
  
  function test5(key, value) {
  	SnakeNamespace.set(key, value)
  }
  await test5('age', 50) 
  # after test5 setTimeout, below will new namespace inherit main namespace
  value = SnakeNamespace.get('age')
  assert.equal(value, 50)
  
  function test6(key, value) {
    SnakeNamespace.set(key, value)
    return new Promise(resolve => {
      setTimeout(() => {resolve()})
    })
  }
  await test6('age', 60)
  // after test6 setTimeout, below will new namespace inherit main namespace
  value = SnakeNamespace.get('age')
  assert.equal(value, 1)
})

```