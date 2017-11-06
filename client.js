const circuitBreaker = require('opossum')

const request = require('request-promise')
const Promise = require('bluebird')
const Retry = require('./retry')

function fire (i) {
  const breaker = circuitBreaker(request, {
    timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
    resetTimeout: 10000 // After 30 seconds, try again.
  })
  return breaker.fire('http://localhost:8000/')
}

async function main () {
  let count = 0
  const retry = Retry({ logError: true, max: 10, timeout: 'linear', timeoutInterval: 2000 })
  const results = await Promise.resolve(Array(20).fill(0)).map((_, i) => {
    count += 1
    console.log('iterations:', count)
    return retry.do(request, 'http://localhost:8000/')
  }, { concurrency: 5 })
  console.log(results.length + ' succeeded', results)
  return true

  // try {
  //   let count = 0
  //   const results = await Promise.resolve(Array(20).fill(0)).map((_, i) => {
  //     count += 1
  //     console.log('iterations:', count)
  //     return fire()
  //   }, { concurrency: 5 })
  //   console.log(results.length + ' succeeded', results)
  //   return true
  // } catch (error) {
  //   console.log('error:', error.message)
  //   return false
  // }
}

main().then(console.log).catch(console.error)

const app = require('express')()
app.get('/', (req, res) => {
  res.status(200).json({
    ok: true
  })
})

app.listen(4000, () => {
  console.log('listening to port *:4000. press ctrl + c to cancel.')
})
// // retry pattern
