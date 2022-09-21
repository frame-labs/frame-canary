const AutoLaunch = require('auto-launch')
const launch = new AutoLaunch({ name: 'Frame' })
module.exports = {
  enable: launch.enable,
  disable: launch.disable,
  status: (cb: any) =>
    launch
      .isEnabled()
      .then((enabled: any) => cb(null, enabled))
      .catch(cb),
}
