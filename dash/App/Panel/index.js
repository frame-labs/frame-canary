import React from 'react'
import Restore from 'react-restore'
import svg from '../../../resources/svg'
import link from '../../../resources/link'

import Main from './Main'
// import Local from './Local'
import Networks from './Networks'
import Notify from './Notify'
// import Phase from './Phase'
import Badge from './Badge'

import Dropdown from '../Components/Dropdown'

// import DevTools from 'restore-devtools'
// <DevTools />

class Panel extends React.Component {

  indicator (connection) {
    const status = [connection.primary.status, connection.secondary.status]
    if (status.indexOf('connected') > -1) {
      if (this.store('selected.current')) {
        return <div className='panelDetailIndicatorInner panelDetailIndicatorGood' />
      } else {
        return <div className='panelDetailIndicatorInner panelDetailIndicatorWaiting' />
      }
    } else {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorBad' />
    }
  }
  
  // componentDidMount () {
  //   console.log('did mount')
  //   document.addEventListener('keydown', (event) => {
  //     console.log('event ky', event.key, this.store('panel.view'))
  //     const view = this.store('panel.view')
  //     if (event.key === 'ArrowRight') {
  //       if (view === 'networks') this.store.setPanelView('settings')
  //       if (view === 'settings') this.store.setPanelView('default')
  //       if (view === 'default') this.store.setPanelView('networks')
  //     } else if (event.key === 'ArrowLeft') {
  //       if (view === 'networks') this.store.setPanelView('default')
  //       if (view === 'settings') this.store.setPanelView('networks')
  //       if (view === 'default') this.store.setPanelView('settings')
  //     }
  //     // const key = event.key; // "ArrowRight", "ArrowLeft", "ArrowUp", or "ArrowDown"
  //   })
  // }

  selectNetwork (network) {
    const [type, id] = network.split(':')
    if (network.type !== type || network.id !== id) link.send('tray:action', 'selectNetwork', type, id)
  }
  
  hexToDisplayGwei (weiHex) {
    return parseInt(weiHex, 'hex') / 1e9 < 1 ? '‹1' : Math.round(parseInt(weiHex, 'hex') / 1e9)
  }
  
  render () {
    const opacity = this.store('tray.initial') ? 0 : 1 // open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'
    // const { type, id } = this.store('main.currentNetwork')

    // const nativeCurrency = this.store('main.networksMeta', type, id, 'nativeCurrency')

    // const chainLayer = this.store('main.networks', type, id, 'layer')
    // const baseRate = chainLayer === 'testnet' ? 'TEST' : 
    //   nativeCurrency && nativeCurrency.usd ? (
    //     nativeCurrency.usd.price < 100 ? 
    //       (Math.round(nativeCurrency.usd.price * 100) / 100).toFixed(2)
    //     :
    //       Math.floor(nativeCurrency.usd.price).toLocaleString()
    // ) : '---'

    // let gasPrice = this.store('main.networksMeta', type, id, 'gas.price.levels.fast')
    // if (!gasPrice) gasPrice = this.store('main.networksMeta', type, id, 'gas.price.fees.maxFeePerGas')
    // if (gasPrice) gasPrice = this.hexToDisplayGwei(gasPrice)
    const networks = this.store('main.networks')
    const networkOptions = []
    Object.keys(networks).forEach(type => {
      Object.keys(networks[type]).forEach(id => {
        const net = networks[type][id]
        const status = [net.connection.primary.status, net.connection.secondary.status]
        if (net.on) {
          networkOptions.push({ 
            text: net.name, 
            value: type + ':' + id,
            indicator: net.on && status.indexOf('connected') > -1 ? 'good' : 'bad'
          })
        }
      })
    })
    let markLeft = 11
    if (this.store('panel.view') === 'networks') markLeft = 68
    if (this.store('panel.view') === 'settings') markLeft = 122
    return (
      <div id='panel' style={{ opacity }}>
        <div className='panelMenu'>
          <div className='mainWindowMarker'>
            {this.store('dash.showing') ? (
              <div className='panelMenuMark panelMenuMarkGood' style={{ transform: `translateX(8px)` }} />
            ) : null}
          </div>
          <div className='panelMenuMarker'>
            <div className='panelMenuMark' style={{ transform: `translateX(${markLeft}px)` }} />
          </div>
          <div className='panelMenuItem panelMenuItemOpen' onMouseDown={() => link.send('tray:action', 'openDash', 'default')}>
            {svg.window(15)}
          </div>
          <div key={this.store('panel.view')} className='panelTitle'>
            {this.store('panel.view') === 'default' ? (
              'Accounts' 
            ) : this.store('panel.view') === 'networks' ? (
              'Chains'
            ) : this.store('panel.view') === 'settings' ? (
              'Settings'
            ) : null}
          </div>
          {/* <div className='panelMenuItemNetwork'>
            <Dropdown
              syncValue={type + ':' + id}
              onChange={(network) => this.selectNetwork(network)}
              options={networkOptions}
            />
          </div> */}
          <div className='panelMenuItem panelMenuItemAccounts' onMouseDown={() => this.store.setPanelView('default')}>
            {svg.accounts(15)}
            {/* <div className='panelDetailIndicator'>
              {this.indicator(this.store('main.networks', type, id, 'connection'))}
            </div> */}
          </div>
          <div className='panelMenuItem panelMenuItemConnections' onMouseDown={() => this.store.setPanelView('networks')}>
            {svg.chain(16)}
          </div>
          <div className='panelMenuItem panelMenuItemSettings' onMouseDown={() => this.store.setPanelView('settings')}>
            {svg.settings(15)}
          </div>
          {/* {type === 'ethereum' ? (
            <div className='panelMenuData' style={{ opacity: this.store('view.addAccount') ? 0 : 1 }}>
              <div className='panelMenuDataItem'>
                {gasPrice || '---'}
                <div className='svg'>{svg.gas(9)}</div>
              </div>
              <div className='panelMenuDataDivide' />
              <div className='panelMenuDataItem'>
                <div className='usd'>{svg.usd(10.5)}</div>
                <div>{baseRate}</div>
              </div>
            </div>
          ) : null} */}
        </div>
        <Notify />
        <Main />
        <Networks />
        <Badge />
      </div>
    )
  }
}

export default Restore.connect(Panel)
