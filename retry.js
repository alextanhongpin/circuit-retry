const Promise = require('bluebird')
const errorMaxRetryExceeded = new Error('RetryError: max retry exceeded')

function Retry ({ max = 3, logError = false, timeout = 'exponential', timeoutInterval = 300 }) {
  let tries = 0 // Current tries
  const timeoutType = {
    exponential: (i) => (Math.pow(2, i) + 1) * timeoutInterval, // in ms
    linear: (i) => (i + 1) * timeoutInterval,
    constant: () => timeoutInterval
  }
  const type = timeoutType[timeout] ? timeoutType[timeout] : timeoutType['constant']

  const _do = (p, opts) => {
    return p(opts)
    .then((result) => {
      tries = 0
      return result
    })
    .catch((error) => {
      tries += 1
      if (logError) {
        console.log(`tries=${tries} retrying=${opts} error=${error.message}`)
      }
      if (tries > max) {
        return Promise.reject(errorMaxRetryExceeded)
      }
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(_do(p, opts))
        }, type(tries))
      })
    })
  }
  return {
    do: _do
  }
}

module.exports = Retry

// function doWork (i) {
//   return new Promise((resolve, reject) => {
//     Math.random() > 0.5 ? reject(new Error('bad error')) : resolve(i)
//   })
// }

// async function main () {
//   const retry = Retry({ logError: true, max: 10, timeout: 'linear', timeoutInterval: 2000 })
//   try {
//     // Retry 10 times
//     const ok = await retry.do(doWork, 1)
//     console.log('success:', ok)

//     // Retry pipeline
//     let counter = 0
//     const promises = Promise.all(Array(20).fill(0)).map((_, i) => {
//       counter += 1
//       console.log('counter:', counter)
//       return retry.do(doWork, i)
//     }, { concurrency: 5 })
//     const res = await Promise.all(promises)
//     console.log('res:', res)
//   } catch (error) {
//     console.log('error:', error)
//   }
//   return true
// }

// main().then(console.log).catch(console.error)
