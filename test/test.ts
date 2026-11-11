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
  t.plan(2)
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
      // timeout: the watcher checks every DU and rejects once more than 2 DU passed,
      // so it fires around 3 DU after the last beacon. Wait well beyond that (DU * 3 raced with it on CI).
      await delay(DU * 6)
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