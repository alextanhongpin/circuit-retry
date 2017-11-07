const errorMaxRetryExceeded: Error = new Error('max retry exceeded')

import ms = require('ms')

export interface RetryOptions {
  maxRetry?: number;
  enableLogging?: boolean;
  verbose?: boolean;
  timeout?: string;
  timeoutInterval?: string;
}

export interface TimeoutFunc {
  (i: number): number;
}

export interface TimeoutFactory {
  [index: string]: TimeoutFunc;
}


function Timeout (type: string, interval: number): TimeoutFunc {
  if (interval <= 0) {
    console.error('Interval cannot be less than zero. Defaults to 300ms.')
    interval = 300
  }
  const timeoutType: TimeoutFactory = {
    exponential: (i: number): number => (Math.pow(2, i) + 1) * interval,
    linear: (i: number): number => (i + 1) * 2 * interval,
    constant: (): number => interval
  }
  if (!timeoutType[type]) {
    console.error('Timeout can only be either exponential, linear, or constant. Defaults to constant.')
    return timeoutType['constant']
  }
  return timeoutType[type]
}

export async function delay (duration: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, duration))
}

class CircuitRetry {
  private counter: number;
  private maxRetry: number;
  private enableLogging: boolean;
  private verbose: boolean;
  private timeout: TimeoutFunc;

  constructor({ maxRetry = 3, enableLogging = false, timeout = 'exponential', timeoutInterval = '300ms', verbose = false }: RetryOptions) {
    this.counter = 0
    if (maxRetry < 0) {
      console.error('maxRetry must be greater than or equal 0. Defaults to 0.')
      maxRetry = 0
    }
    this.maxRetry = maxRetry
    this.enableLogging = enableLogging
    this.verbose = verbose
    this.timeout = Timeout(timeout, ms(timeoutInterval))
  }

  private reset () {
    this.counter = 0
  }

  private increment () {
    this.counter += 1
  }

  private get thresholdExceeded () {
    return this.counter > this.maxRetry
  }

  private get duration (): number {
    return this.timeout(this.counter)
  }

  private async retry (promise: any, opts: any): Promise<any> {
    try {
      const done = await promise(opts)
      this.reset()
      return done
    } catch (error) {
      this.increment()
      if (this.enableLogging && this.verbose) {
        console.error(error)
      } else if (this.enableLogging) {
        console.log(`count=${this.counter} error=${error.message}`)
      }
      if (this.thresholdExceeded) {
        return errorMaxRetryExceeded
      }
      await delay(this.duration)
      return this.retry(promise, opts)
    }
  }

  do (promise: any, opts: any) {
    return this.retry(promise, opts)
  }

  extrapolate({type='exponential', interval='300ms', times=10}: { type: string, interval: string, times: number }): Array<string|number>[] {
    if (times <= 0) {
      console.error('times must be more than 0')
      times = 10
    }
    const timeout: TimeoutFunc = Timeout(type, ms(interval))
    return Array(times).fill(0).map((_, i) => [i + 1, ms(timeout(i))])
  }

  get count() {
    return this.counter
  }
}

export default function Retry(options: RetryOptions): any { 
  return new CircuitRetry(options) 
}
