const errorMaxRetryExceeded: Error = new Error('max retry exceeded')

export interface RetryOptions {
  max: number;
  logError: boolean;
  timeout: string;
  timeoutInterval: number;
}

export interface TimeoutFunc {
  (i: number): number;
}

export interface TimeoutFactory {
  [index: string]: TimeoutFunc;
}

function Timeout (type: string, interval: number): TimeoutFunc {
  const timeoutType: TimeoutFactory = {
    exponential: (i: number): number => (Math.pow(2, i) + 1) * interval,
    linear: (i: number): number => (i + 1) * interval,
    constant: (): number => interval
  }
  return timeoutType[type] ? timeoutType[type] : timeoutType['constant']
}


function Retry ({ max = 3, logError = false, timeout = 'exponential', timeoutInterval = 300 }: RetryOptions): any {
  let tries: number = 0
  const timeoutType: TimeoutFunc = Timeout(timeout, timeoutInterval)
  const _do = (p: any, opts: any) => {
    return p(opts)
    .then((result: any) => {
      tries = 0
      return result
    })
    .catch((error: Error) => {
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
        }, timeoutType(tries))
      })
    })
  }
  return {
    do: _do
  }
}

export default Retry
