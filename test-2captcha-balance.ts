import 'dotenv/config'
import { TwoCaptchaSolver } from './src/lib/captcha/2captcha-solver'

async function main() {
  const solver = new TwoCaptchaSolver()
  const balance = await solver.getBalance()
  console.log(`2captcha balance: $${balance}`)
}

main()
