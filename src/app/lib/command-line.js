/**
 * command line support
 */

const { packInfo, isTest } = require('../common/app-props')
const { findVvFile } = require('../common/vv-file')
const { version } = packInfo

let helpInfo
let options
let program

function parseCommandLine (argv, options) {
  const { Command } = require('commander')
  const prog = new Command()

  prog
    .version(version)
    .name('vis-remote-tool')
    .usage('[options] sshServer')
    .description(`
### Connect ssh server from command line examples:
- vis-remote-tool user@xx.com
- vis-remote-tool user@xx.com:22
- vis-remote-tool --password password --set-env "SECRET=xxx USER=hhhh" user@xx.com:22
- vis-remote-tool -l user -P 22 -i /path/to/private-key -pw password xx.com -T -t "XX Server"

### Other params examples:
- server port:
vis-remote-tool -sp 30976
- load and run batch operation from json file:
vis-remote-tool -bo "/home/root/works.json"

### other connection types
- telnet:
vis-remote-tool -tp "telnet" -opts '{"host":"192.168.1.1","port":21","username":"root","password":"123456"}'
- rdp: vis-remote-tool -tp "rdp" -opts '{"host":"192.168.1.1","port":3389","username":"root","password":"123456"}'
- vnc: vis-remote-tool -tp "vnc" -opts '{"host":"192.168.1.1","port":3389","username":"root","password":"123456"}'
- serial: vis-remote-tool -tp "serial" -opts '{"port":"COM1","baudRate":115200,"dataBits":8,"stopBits":1,"parity":"none"}'
- local: vis-remote-tool -tp "local" -opts '{"title": "local terminal"}'

### Environment variables:
- DATA_PATH:
DATA_PATH=/custom/path/to/vis-remote-tool-data vis-remote-tool

- NO_PROXY_SERVER:
NO_PROXY_SERVER=1 vis-remote-tool

- PROXY_BYPASS_LIST:
PROXY_BYPASS_LIST="127.0.0.1, 127.0.0.1" vis-remote-tool

- PROXY_PAC_URL:
PROXY_PAC_URL="http://proxy.example.com/pac" vis-remote-tool

- PROXY_SERVER:
PROXY_SERVER="socks5://127.0.0.1:1080" vis-remote-tool
`)
    .option('-t, --title [Tab Name]', 'Specify the title of the new tab')
    .option('-l, --user <user>', 'specify a login name')
    .option('-P, --port <port>', 'specify ssh port')
    .option('-bo, --batch-op <batchOpFile>', 'load and run batch operation from json file')
    .option('-sp, --server-port <serverPort>', 'specify server port, default is')
    .option('-i, --private-key-path <path>', 'specify an SSH private key path')
    .option('-ps, --passphrase <passphrase>', 'specify an SSH private key passphrase')
    .option('-pw, --password <password>', 'specify ssh server password')
    .option('-se, --set-env <setEnv>', 'specify envs')
    .option('-so, --sftp-only', 'only show sftp panel')
    .option('-d, --init-folder <initFolder>', 'init folder got init terminal')
    .option('-tp, --tp <tp>', 'specify connection type')
    .option('-opts, --opts <opts>', 'specify connection options, json string')
    .allowUnknownOption()
    .exitOverride()

  try {
    prog.parse(argv, options)
  } catch (err) {
    if (err.message.includes('outputHelp')) {
      process.exit(0)
    }
  }
  return prog
}

if (!isTest) {
  program = parseCommandLine()
  options = program.opts()
  helpInfo = program.helpInformation()
}

exports.initCommandLine = function () {
  if (isTest) {
    return false
  }
  return {
    options,
    argv: program.args,
    vvFile: findVvFile(process.argv),
    helpInfo
  }
}
