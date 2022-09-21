// Panel view actions

import { v4 } from 'uuid'
import { URL } from 'url'

let trayInitial = true

export function updateAccountModule(u, id, update) {
  u('panel.account.modules', id, (module = {}) => {
    return Object.assign(module, update)
  })
}
export function setSigner(u, signer) {
  u('selected.current', (_) => signer.id)
  u('selected.minimized', (_) => false)
  u('selected.open', (_) => true)
}
export function setSettingsView(u, index, subindex = 0) {
  u('selected.settings.viewIndex', () => index)
  u('selected.settings.subIndex', () => subindex)
}
export function setAddress(u, address) {
  return u('address', () => address)
}
export function togglePanel(u) {
  return u('panel.show', (show) => !show)
}
export function panelRequest(u, request) {
  request.host = request.host || new URL(request.url).host
  u('panel.request', (v) => request)
  u('panel.show', (v) => true)
}
export function setBalance(u, account, balance) {
  return u('balances', account, (b) => balance)
}
export function notify(u, type, data = {}) {
  u('view.notify', (_) => type)
  u('view.notifyData', (_) => data)
}
export function clickGuard(u, on) {
  return u('view.clickGuard', () => on)
}
export function toggleAddAccount(u) {
  return u('view.addAccount', (show) => !show)
}
export function toggleAddNetwork(u) {
  return u('view.addNetwork', (show) => !show)
}
export function updateBadge(u, type, version) {
  return u('view.badge', () => ({ type, version }))
}
export function toggleSettings(u) {
  u('panel.view', (view) => (view === 'settings' ? 'default' : 'settings'))
}
export function setPanelView(u, view) {
  return u('panel.view', () => view)
}
export function trayOpen(u, open) {
  u('tray.open', (_) => open)
  if (open && trayInitial) {
    trayInitial = false
    setTimeout(() => {
      u('tray.initial', (_) => false)
    }, 30)
  }
}
export function setSignerView(u, view) {
  u('selected.showAccounts', (_) => false)
  u('selected.view', (_) => view)
}
export function accountPage(u, page) {
  u('selected.accountPage', () => page)
}
export function toggleShowAccounts(u) {
  return u('selected.showAccounts', (_) => !_)
}
export function addProviderEvent(u, payload) {
  u('provider.events', (events) => {
    events.push(payload.method)
    return events
  })
}
export function setView(u, view) {
  return u('selected.view', (_) => view)
}
export function toggleDataView(u, id) {
  u('selected.requests', id, 'viewData', (view) => !view)
}
export function updateExternalRates(u, rates) {
  return u('main.rates', () => rates)
}
export function resetSigner(u) {
  u('selected.view', (_) => 'default')
  u('selected.showAccounts', (_) => false)
}
export function unsetSigner(u) {
  u('selected.minimized', (_) => true)
  u('selected.open', (_) => false)
  resetSigner(u)
  setTimeout((_) => {
    u('selected', (signer) => {
      signer.last = signer.current
      signer.current = ''
      signer.requests = {}
      signer.view = 'default'
      return signer
    })
  }, 520)
}
export function nodeProvider(u, connected) {
  return u('node.provider', (_) => connected)
}
export function setCurrent(u, id) {
  return u('view.current', (_) => id)
}
export function updateUrl(u, id, url) {
  return u('view.data', id, 'url', () => url)
}
export function updateTitle(u, id, title) {
  return u('view.data', id, 'title', (_) => title)
}
export function reorderTabs(u, from, to) {
  u('view.list', (list) => {
    const _from = list[from]
    list[from] = list[to]
    list[to] = _from
    return list
  })
}
export function newView(u) {
  const id = v4()
  u('view.current', (_) => id)
  u('view.list', (list) => {
    list.push(id)
    return list
  })
  u('view.data', id, (view) => ({
    url: 'https://www.google.com/',
    title: 'New Tab',
  }))
}
export function removeView(u, id, isCurrent) {
  u('view', (view) => {
    const index = view.list.indexOf(id)
    if (isCurrent) {
      if (index < view.list.length - 1) {
        view.current = view.list[index + 1]
      } else {
        view.current = view.list[index - 1]
      }
    }
    if (index > -1) view.list.splice(index, 1)
    delete view.data[id]
    return view
  })
}
export function initialSignerPos(u, pos) {
  return u('selected.position.initial', (_) => pos)
}
export function initialScrollPos(u, pos) {
  return u('selected.position.scrollTop', (_) => pos)
}
