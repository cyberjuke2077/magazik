import './_load-env'
import {
  isProductionConfigScope,
  validateProductionConfig,
} from '../src/lib/production-config'

const requestedScope = process.argv[2] ?? 'runtime'

if (!isProductionConfigScope(requestedScope)) {
  console.error('Unknown scope. Use runtime, migration, publish, r2 or telegram.')
  process.exitCode = 1
} else {
  const issues = validateProductionConfig(process.env, requestedScope)
  if (issues.length > 0) {
    console.error(`Production config ${requestedScope}: ${issues.length} issue(s)`)
    for (const issue of issues) console.error(`- ${issue.name}: ${issue.reason}`)
    process.exitCode = 1
  } else {
    console.log(`Production config ${requestedScope}: ready`)
  }
}
