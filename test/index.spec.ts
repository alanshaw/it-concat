import { expect } from 'aegir/chai'
import randomBytes from 'iso-random-stream/src/random.js'
import randomInt from 'random-int'
import { Uint8ArrayList } from 'uint8arraylist'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import concat from '../src/index.js'

const randomBuffers = async (max: number) => await Promise.all(Array.from(Array(max), () => randomBytes(randomInt(1, 128))))
const randomStrings = async (max: number) => {
  const bufs = await randomBuffers(max)
  return bufs.map(b => b.toString('hex'))
}

describe('it-concat', () => {
  it('should concat buffers', async () => {
    const input = await randomBuffers(10)
    const output = await concat(input)
    expect(output.slice()).to.deep.equal(uint8ArrayConcat(input))
  })

  it('should concat buffer lists', async () => {
    const input = (await randomBuffers(10)).map(b => new Uint8ArrayList(b))
    const output = await concat(input)
    expect(output.slice()).to.deep.equal(new Uint8ArrayList(...input).subarray())
  })

  it('should concat no buffers', async () => {
    const output = await concat([])
    expect(output.slice()).to.deep.equal(new Uint8Array(0))
  })

  it('should concat strings', async () => {
    const input = await randomStrings(10)
    const output = await concat(input)
    expect(output).to.deep.equal(input.join(''))
  })

  it('should concat buffers to strings', async () => {
    const input = (await randomStrings(10)).map(s => uint8ArrayFromString(s))
    const output = await concat(input, { type: 'string' })
    expect(output).to.deep.equal(uint8ArrayToString(uint8ArrayConcat(input)))
  })

  it('should concat strings to buffers', async () => {
    const input = await randomStrings(10)
    const output = await concat(input, { type: 'buffer' })
    expect(uint8ArrayToString(output.subarray())).to.deep.equal(input.join(''))
  })

  it('should concat no strings', async () => {
    const output = await concat([], { type: 'string' })
    expect(output).to.deep.equal('')
  })

  it('should throw for invalid type', async () => {
    const input = await randomBuffers(10)

    // @ts-expect-error type cannot be donkey
    await expect(concat(input, { type: 'donkey' }))
      .to.eventually.be.rejected()
      .with.property('message', 'invalid output type "donkey"')
  })

  it('should concat buffers as buffers', async () => {
    const input = [Uint8Array.from([0xA0])]
    const output = await concat(input, { type: 'buffer' })
    expect(uint8ArrayToString(output.subarray(), 'hex')).to.equal('a0')
  })
})
