# circuit-retry

A simple retry pattern for nodejs with timeout. Available on [NPM](https://www.npmjs.com/package/circuit-retry).

```bash
$ npm install circuit-retry
```

## Usage

```javascript 
const Retry = require('circuit-retry').default
// or import * as Retry from 'circuit-retry'

const retry: Retry = Retry({
  maxRetry: 10,
  timeout: 'constant', // linear | exponential | constant
  timeoutInterval: '300ms'
})

function doWork () {
  return Math.random() < 0.5 ? Promise.reject(new Error('something happened')) : Promise.resolve(1)
}

const errorId = retry.on('error', (error: Error) => {
  console.log('error:', error.message)
})

retry.off(errorId)
retry.do(doWork, null).then(console.log)
```

## Retry duration

Timeout type can be either `linear`, `exponential` or `constant`. `.extrapolate()` method prints out the delay duration:

```javascript
console.log('exponential:', retry.extrapolate({
  interval: '300ms',
  times: 10,
  type: 'exponential' // linear | exponential | constant
}))
```

Output:

```
exponential: [ [ 1, '600ms' ],
  [ 2, '900ms' ],
  [ 3, '2s' ],
  [ 4, '3s' ],
  [ 5, '5s' ],
  [ 6, '10s' ],
  [ 7, '20s' ],
  [ 8, '39s' ],
  [ 9, '1m' ],
  [ 10, '3m' ] ]

constant: [ [ 1, '300ms' ],
  [ 2, '300ms' ],
  [ 3, '300ms' ],
  [ 4, '300ms' ],
  [ 5, '300ms' ],
  [ 6, '300ms' ],
  [ 7, '300ms' ],
  [ 8, '300ms' ],
  [ 9, '300ms' ],
  [ 10, '300ms' ] ]

linear: [ [ 1, '600ms' ],
  [ 2, '1s' ],
  [ 3, '2s' ],
  [ 4, '2s' ],
  [ 5, '3s' ],
  [ 6, '4s' ],
  [ 7, '4s' ],
  [ 8, '5s' ],
  [ 9, '5s' ],
  [ 10, '6s' ] ]
```

## Example with Bluebird

```javascript

const Promise = require('bluebird')
const Retry = require('circuit-retry').default

function work (i) {
  return new Promise((resolve, reject) => {
    Math.random() > 0.5 ? reject(new Error('bad error')) : resolve(i)
  })
}

async function main () {
  const retry = Retry({
    maxRetry: 10,
    timeout: 'constant',
    timeoutInterval: '300ms'
  })
  try {
    // Apply retry to a task
    const ok = await retry.do(work, 1)
    console.log('success:', ok)

    // Apply retry to an array
    let counter = 0
    let errorCounter = 0
    retry.on('error', (error) => {
      // We accumulate the total errors occuring
      errorCounter += 1
    })

    const promises = Promise.all(Array(100).fill(0))
    .map((_, i) => {
      // We are using the bluebird promise library.
      // The max concurrency is set to 5, which means that only 5 items in the array
      // will be processed at once - if there are errors, it will retry until the max
      // retry before moving on to the next 5 items
      counter += 1
      console.log('counter:', counter)


      // If the error hits a certain threshold, stop the program
      if (errorCounter > 5) {
        console.log('exiting...', errorCounter, counter)
        throw new Error('pipeline has exceeded error threshold')
      }

      // Even after retrying for 10 items, there are still errors, catch them and return them
      return retry.do(work, i).catch((error) => {
        return error
      })
    }, { concurrency: 5 })

    try {
      const responses = await Promise.all(promises)
      console.log('items processed:', responses.length)

      // Filter only errors responses
      const errors = responses.filter((value) => value instanceof Error)
      console.log('errors:', errors.length)
      // Do something with the errors

      // Filter success responses to be processed by the next pipeline
      const successes = responses.filter((value) => !(value instanceof Error))
      console.log('successes:', successes.length, successes)
    } catch (error) {
      console.log('errors all:', error.message)
    }
  } catch (error) {
    console.log('error:', error.message)
  }
  return true
}

main().then(console.log).catch(console.error)
```
