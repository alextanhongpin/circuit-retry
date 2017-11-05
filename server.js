const app = require('express')()

app.get('/', (req, res) => {
  const isError = Math.random() < 0.2
  if (isError) {
    return res.status(400).json({
      error: 400,
      message: 'something unexpected happen'
    })
  } else {
    return res.status(200).json({
      ok: true
    })
  }
})

app.listen(8000, () => {
  console.log('listening to port *:8000. press ctrl + c to cancel.')
})
