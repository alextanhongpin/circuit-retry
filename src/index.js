const errorMaxRetryExceeded = new Error('max retry exceeded')

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

export default Retry
