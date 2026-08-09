/* eslint-disable @typescript-eslint/no-require-imports -- Node preload must use CommonJS. */
const os = require('node:os')

if (process.platform === 'win32') {
  os.userInfo = () => ({
    uid: -1,
    gid: -1,
    username: process.env.USERNAME || 'windows-user',
    homedir: process.env.USERPROFILE || process.cwd(),
    shell: null,
  })
}
