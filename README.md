# node-retry

A simple retry pattern for nodejs with timeout.

## Usage

```javascript
const retry = Retry({ 
  logError: true, 
  max: 10,
  timeout: 'constant', // linear | exponential | constant
  timeoutInterval: 300 // ms 
})

const res = await retry.do(asyncFunction, params)
```

## Example with Bluebird

```javascript

const Promise = require('bluebird')
const Retry = require('./retry')

function doWork (i) {
  return new Promise((resolve, reject) => {
    Math.random() > 0.5 ? reject(new Error('bad error')) : resolve(i)
  })
}

async function main () {
  const retry = Retry({ logError: true, max: 10, timeout: 'constant', timeoutInterval: 300 })
  try {
    // Retry 10 times
    const ok = await retry.do(doWork, 1)
    console.log('success:', ok)

    // Retry pipeline
    let counter = 0
    const promises = Promise.all(Array(20).fill(0)).map((_, i) => {
      // We are using the bluebird promise library.
      // The max concurrency is set to 5, which means that only 5 items in the array
      // will be processed at once - if there are errors, it will retry until the max
      // retry before moving on to the next 5 items
      counter += 1
      console.log('counter:', counter)

      // Even after retrying for 10 items, there are still errors, catch them and return them
      return retry.do(doWork, i).catch((error) => {
        return error
      })
    }, { concurrency: 5 })

    const responses = await Promise.all(promises)
    console.log('items processed:', responses.length)

    // Filter only errors responses
    const errors = responses.filter((value) => value instanceof Error)
    console.log('errors:', errors.length)
    if (errors.length > 100) {
      throw new Error('pipeline has exceeded error threshold')
    }

    // Filter success responses to be processed by the next pipeline
    const successes = responses.filter((value) => !(value instanceof Error))
    console.log('successes:', successes.length, successes)
  } catch (error) {
    console.log('error:', error)
  }
  return true
}

main().then(console.log).catch(console.error)
```