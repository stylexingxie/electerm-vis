const fs = require('fs')
const dir = 'C:/Users/ZhuanZ/AppData/Roaming/vis-remote-tool/users/default_user/'
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.db')) continue
  const s = fs.readFileSync(dir + f, 'latin1')
  const m = s.match(/language[^,\n]{0,40}/g)
  console.log('===', f, m ? m.slice(0, 5) : 'no language field')
}
