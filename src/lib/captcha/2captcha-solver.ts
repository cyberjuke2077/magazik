import 'dotenv/config'

interface CaptchaResult {
  success: boolean
  token?: string
  error?: string
}

interface CaptchaTask {
  taskId: string
  status: 'processing' | 'ready' | 'error'
  solution?: string
  errorDescription?: string
}

export class TwoCaptchaSolver {
  private apiKey: string
  private baseUrl = 'https://2captcha.com'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CAPTCHA_2CAPTCHA_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('2captcha API key not provided')
    }
  }

  /**
   * Solve hCaptcha
   */
  async solveHCaptcha(sitekey: string, pageUrl: string): Promise<CaptchaResult> {
    try {
      console.log('🔐 Sending hCaptcha to 2captcha...')
      
      // Step 1: Submit captcha
      const submitUrl = `${this.baseUrl}/in.php?key=${this.apiKey}&method=hcaptcha&sitekey=${sitekey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`
      const submitResponse = await fetch(submitUrl)
      const submitData = await submitResponse.json()

      if (submitData.status !== 1) {
        return {
          success: false,
          error: submitData.request || 'Failed to submit captcha'
        }
      }

      const taskId = submitData.request
      console.log(`📝 Task ID: ${taskId}`)

      // Step 2: Wait and check result
      return await this.waitForResult(taskId)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Solve reCaptcha v2
   */
  async solveReCaptchaV2(sitekey: string, pageUrl: string): Promise<CaptchaResult> {
    try {
      console.log('🔐 Sending reCaptcha v2 to 2captcha...')
      
      const submitUrl = `${this.baseUrl}/in.php?key=${this.apiKey}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`
      const submitResponse = await fetch(submitUrl)
      const submitData = await submitResponse.json()

      if (submitData.status !== 1) {
        return {
          success: false,
          error: submitData.request || 'Failed to submit captcha'
        }
      }

      const taskId = submitData.request
      console.log(`📝 Task ID: ${taskId}`)

      return await this.waitForResult(taskId)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Solve Yandex SmartCaptcha
   */
  async solveYandexSmartCaptcha(sitekey: string, pageUrl: string): Promise<CaptchaResult> {
    try {
      console.log('🔐 Sending Yandex SmartCaptcha to 2captcha...')
      
      // Step 1: Submit captcha
      const submitUrl = `${this.baseUrl}/in.php?key=${this.apiKey}&method=yandex&sitekey=${sitekey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`
      const submitResponse = await fetch(submitUrl)
      const submitData = await submitResponse.json()

      if (submitData.status !== 1) {
        return {
          success: false,
          error: submitData.request || 'Failed to submit Yandex SmartCaptcha'
        }
      }

      const taskId = submitData.request
      console.log(`📝 Task ID: ${taskId}`)

      // Step 2: Wait and check result
      return await this.waitForResult(taskId)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Solve Cloudflare Turnstile
   */
  async solveTurnstile(sitekey: string, pageUrl: string): Promise<CaptchaResult> {
    try {
      console.log('🔐 Sending Turnstile to 2captcha...')
      
      const submitUrl = `${this.baseUrl}/in.php?key=${this.apiKey}&method=turnstile&sitekey=${sitekey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`
      const submitResponse = await fetch(submitUrl)
      const submitData = await submitResponse.json()

      if (submitData.status !== 1) {
        return {
          success: false,
          error: submitData.request || 'Failed to submit captcha'
        }
      }

      const taskId = submitData.request
      console.log(`📝 Task ID: ${taskId}`)

      return await this.waitForResult(taskId)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Wait for captcha solution (polling)
   */
  private async waitForResult(taskId: string, maxAttempts = 60): Promise<CaptchaResult> {
    console.log('⏳ Waiting for captcha solution...')
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.sleep(5000) // Wait 5 seconds between checks

      const resultUrl = `${this.baseUrl}/res.php?key=${this.apiKey}&action=get&id=${taskId}&json=1`
      const resultResponse = await fetch(resultUrl)
      const resultData = await resultResponse.json()

      if (resultData.status === 1) {
        console.log('✅ Captcha solved!')
        return {
          success: true,
          token: resultData.request
        }
      }

      if (resultData.request === 'CAPCHA_NOT_READY') {
        console.log(`⏳ Attempt ${attempt}/${maxAttempts}: Still processing...`)
        continue
      }

      // Error occurred
      return {
        success: false,
        error: resultData.request || 'Unknown error'
      }
    }

    return {
      success: false,
      error: 'Timeout: Captcha not solved within 5 minutes'
    }
  }

  /**
   * Check account balance
   */
  async getBalance(): Promise<number> {
    try {
      const balanceUrl = `${this.baseUrl}/res.php?key=${this.apiKey}&action=getbalance&json=1`
      const response = await fetch(balanceUrl)
      const data = await response.json()

      if (data.status === 1) {
        return parseFloat(data.request)
      }

      throw new Error(data.request || 'Failed to get balance')
    } catch (error) {
      console.error('Failed to get balance:', error)
      return 0
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const captchaSolver = new TwoCaptchaSolver()
