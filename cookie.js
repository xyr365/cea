const Conf = require('conf')
const log = require('./interface/colorLog')
const login = require('./crawler/casLogIn')
const { signApp } = require('./campusphere/app')

const conf = new Conf()

// get|store|update cookie synchronizedly, prevent concurrent overlap writes to conf
conf.handleCookie = async () => {
  for (const i of conf.get('users')) {
    const storeCookiePath = `cookie.${i.alias}`
    await handleLogin(i, storeCookiePath)
  }
}

async function handleLogin(i, storeCookiePath) {
  /**
   * Keys of this cookie object:
   * @compusphere something about cp daliy's app
   * @swms continuing log into your school's swms [stu work magagement system]
   */
  let cookie = conf.get(storeCookiePath)
  const name = i.alias

  // Check if the cookie is stored, if not, login in to eat them
  if (!cookie) {
    cookie = await login(conf.get('school'), i)
    if (cookie) {
      conf.set(storeCookiePath, cookie)
      log.success(`用户${name}: 已成功获取并缓存 Cookie`)
    }
  }
  const sign = new signApp(conf.get('school'), i)
  // Check if the cookie is eligible, if not, reLogin 1 more time
  const isNeedLogIn = await sign.signInfo(cookie)
  if (isNeedLogIn) {
    log.warning(`用户${name}: Cookie 失效，正在重新获取`)
    cookie = await login(conf.get('school'), i)
    if (cookie) {
      conf.set(storeCookiePath, cookie)
      log.success(`用户${name}: 已成功刷新并缓存 Cookie`)
    }
  } else {
    log.success(`用户${name}: 尝试使用缓存中的 Cookie`)
  }
}

module.exports = conf
