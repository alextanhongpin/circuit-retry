const circuitBreaker = require('opossum')

const request = require('request-promise')
const Promise = require('bluebird')

function fire (i) {
  const getStuff = request('http://localhost:8000/')
  const breaker = circuitBreaker(getStuff, {
    timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
    resetTimeout: 1000 // After 30 seconds, try again.
  })
  return breaker.fire().then((res) => {
    console.log('success!')
    return i
  }).catch((err) => {
    console.log(err.message)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(fire(i))
      }, 5000)
    })
  })
}
async function main () {
  const results = await Promise.resolve(Array(10).fill(0)).map((_, i) => {
    return fire(i)
  }, { concurrency: 5 })
  console.log(results.length + ' succeeded', results)
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
// async function retry (p, { count, max }) {
//   try {
//     const r = await p()
//     return r
//   } catch (error) {
//     if (count > max) {
//       throw new Error('Max retry')
//     }
//     count += 1
//     return retry(p, { count, max })
//   }
// }
