import test from 'ava'
import * as Keepalive from '../src/index.ts'

const delay = async (ms: number) => new Promise(r => setTimeout(r, ms))
const DU = parseInt(process.env.DURATION_UNIT || '50')

test('Beacon, beacon, and beacon', async t => {
  const res = await Keepalive.setKeepalive(async (beacon, keepalive) => {
    if (!keepalive) return

    keepalive.timeoutMessage = 'first'
    await delay(DU)
    beacon()

    keepalive.timeoutMessage = 'second'
    await delay(DU)
    beacon()

    keepalive.timeoutMessage = 'third'
    await delay(DU)
    return 'result'
  }, {
    interval: DU * 1,
    timeout: DU * 2,
  })

  t.is(res, 'result', 'returns the result.')
})

test('Beacon, beacon, and timeout', async t => {
  try {
    await Keepalive.setKeepalive(async (beacon, keepalive) => {
      if (!keepalive) return

      keepalive.timeoutMessage = 'first'
      await delay(DU)
      beacon()
  
      keepalive.timeoutMessage = 'second'
      await delay(DU)
      beacon()
  
      keepalive.timeoutMessage = 'third'
      // timeout
      await delay(DU * 3)
      return 'result'
    }, {
      interval: DU * 1,
      timeout: DU * 2,
    })
  } catch(error) {
    t.true(error instanceof Keepalive.KeepaliveTimeout)
    t.is(error.message, 'third', 'catch KeepaliveTimeout')
  }
})

test('Application error', async t => {
  try {
    await Keepalive.setKeepalive(async beacon => {
      throw new Error('app error')
    })
  } catch(error) {
    t.is(error.message, 'app error')
  }
})