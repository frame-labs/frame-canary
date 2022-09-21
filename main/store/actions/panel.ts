// Panel view actions

import { v4 } from 'uuid'
import { URL } from 'url'

let trayInitial = true

export function updateAccountModule(u: any, id: any, update: any) {
  u('panel.account.modules', id, (module = {}) => {
    return Object.assign(module, update)
  })
}
export function setSigner(u: any, signer: any) {
  u('selected.current', (_: any) => signer.id)
  u('selected.minimized', (_: any) => false)
  u('selected.open', (_: any) => true)
}
export function setSettingsView(u: any, index: any, subindex = 0) {
  u('selected.settings.viewIndex', () => index)
  u('selected.settings.subIndex', () => subindex)
}
export function setAddress(u: any, address: any) {
  return u('address', () => address)
}
export function togglePanel(u: any) {
  return u('panel.show', (show: any) => !show)
}
export function panelRequest(u: any, request: any) {
  request.host = request.host || new URL(request.url).host
  u('panel.request', (v: any) => request)
  u('panel.show', (v: any) => true)
}
export function setBalance(u: any, account: any, balance: any) {
  return u('balances', account, (b: any) => balance)
}
export function notify(u: any, type: any, data = {}) {
  u('view.notify', (_: any) => type)
  u('view.notifyData', (_: any) => data)
}
export function clickGuard(u: any, on: any) {
  return u('view.clickGuard', () => on)
}
export function toggleAddAccount(u: any) {
  return u('view.addAccount', (show: any) => !show)
}
export function toggleAddNetwork(u: any) {
  return u('view.addNetwork', (show: any) => !show)
}
export function updateBadge(u: any, type: any, version: any) {
  return u('view.badge', () => ({ type, version }))
}
export function toggleSettings(u: any) {
  u('panel.view', (view: any) => (view === 'settings' ? 'default' : 'settings'))
}
export function setPanelView(u: any, view: any) {
  return u('panel.view', () => view)
}
export function trayOpen(u: any, open: any) {
  u('tray.open', (_: any) => open)
  if (open && trayInitial) {
    trayInitial = false
    setTimeout(() => {
      u('tray.initial', (_: any) => false)
    }, 30)
  }
}
export function setSignerView(u: any, view: any) {
  u('selected.showAccounts', (_: any) => false)
  u('selected.view', (_: any) => view)
}
export function accountPage(u: any, page: any) {
  u('selected.accountPage', () => page)
}
export function toggleShowAccounts(u: any) {
  return u('selected.showAccounts', (_: any) => !_)
}
export function addProviderEvent(u: any, payload: any) {
  u('provider.events', (events: any) => {
    events.push(payload.method)
    return events
  })
}
export function setView(u: any, view: any) {
  return u('selected.view', (_: any) => view)
}
export function toggleDataView(u: any, id: any) {
  u('selected.requests', id, 'viewData', (view: any) => !view)
}
export function updateExternalRates(u: any, rates: any) {
  return u('main.rates', () => rates)
}
export function resetSigner(u: any) {
  u('selected.view', (_: any) => 'default')
  u('selected.showAccounts', (_: any) => false)
}
export function unsetSigner(u: any) {
  u('selected.minimized', (_: any) => true)
  u('selected.open', (_: any) => false)
  resetSigner(u)
  setTimeout((_) => {
    u('selected', (signer: any) => {
      signer.last = signer.current
      signer.current = ''
      signer.requests = {}
      signer.view = 'default'
      return signer
    })
  }, 520)
}
export function nodeProvider(u: any, connected: any) {
  return u('node.provider', (_: any) => connected)
}
export function setCurrent(u: any, id: any) {
  return u('view.current', (_: any) => id)
}
export function updateUrl(u: any, id: any, url: any) {
  return u('view.data', id, 'url', () => url)
}
export function updateTitle(u: any, id: any, title: any) {
  return u('view.data', id, 'title', (_: any) => title)
}
export function reorderTabs(u: any, from: any, to: any) {
  u('view.list', (list: any) => {
    const _from = list[from]
    list[from] = list[to]
    list[to] = _from
    return list
  })
}
export function newView(u: any) {
  const id = v4()
  u('view.current', (_: any) => id)
  u('view.list', (list: any) => {
    list.push(id)
    return list
  })
  u('view.data', id, (view: any) => ({
    url: 'https://www.google.com/',
    title: 'New Tab',
  }))
}
export function removeView(u: any, id: any, isCurrent: any) {
  u('view', (view: any) => {
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
export function initialSignerPos(u: any, pos: any) {
  return u('selected.position.initial', (_: any) => pos)
}
export function initialScrollPos(u: any, pos: any) {
  return u('selected.position.scrollTop', (_: any) => pos)
}
