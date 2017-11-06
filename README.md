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