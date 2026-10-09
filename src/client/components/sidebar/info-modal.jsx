import {
  UserOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { Tabs } from 'antd'
import Modal from '../common/modal'
import Link from '../common/external-link'
import LogoElem from '../common/logo-elem'
import Placeholder from '../common/placeholder'
import RunningTime from './app-running-time'
import { auto } from 'manate/react'
import { useState } from 'react'

import {
  packInfo,
  infoTabs
} from '../../common/constants'
import './info.styl'

const e = window.translate

// Upstream project this build is derived from. Kept here (and in the about tab
// below) so the original authorship/attribution stays visible in the UI.
const upstreamRepo = 'https://github.com/electerm/electerm'

export default auto(function InfoModal (props) {
  const [runtimeEnv, setRuntimeEnv] = useState(null)

  const handleChangeTab = key => {
    window.store.infoModalTab = key
    if (key === infoTabs.env && !runtimeEnv) {
      window.pre.runGlobalAsync('getEnv').then(env => setRuntimeEnv(env))
    }
  }

  const { infoModalTab, commandLineHelp } = props
  const {
    showInfoModal
  } = window.store
  function onCloseAbout () {
    window.store.showInfoModal = false
  }
  if (!showInfoModal) {
    return null
  }
  const {
    name,
    version,
    devDependencies,
    dependencies,
    author: {
      name: authorName,
      email
    }
  } = packInfo
  const { versions } = window.pre
  const deps = {
    ...devDependencies,
    ...dependencies
  }
  const envs = {
    ...versions,
    ...(runtimeEnv || {})
  }
  const title = (
    <div className='custom-modal-close-confirm-title font16'>
      <InfoCircleOutlined className='font20 mg1r' /> {e('about')} {name}
    </div>
  )
  const attrs = {
    title,
    width: window.innerWidth - 100,
    maskClosable: true,
    onCancel: onCloseAbout,
    open: true,
    wrapClassName: 'info-modal'
  }
  const items = [
    {
      key: infoTabs.info,
      label: e('about'),
      children: (
        <>
          <LogoElem />
          <p className='mg2b'>{e('desc')}</p>
          <RunningTime />
          <p className='mg1b'>
            <b className='mg1r'>Version:</b>
            <span className='mg1l'>{version}</span>
          </p>
          <p className='mg1b'>
            <InfoCircleOutlined /> <b className='mg1r'>本工具基于 electerm 构建</b>
            <Link to={upstreamRepo} className='mg1l'>
              {upstreamRepo}
            </Link>
          </p>
          <p className='mg1b'>
            <UserOutlined /> <b className='mg1r'>{e('author')} ➾</b>
            <span className='mg1l'>{authorName}{email ? ` (${email})` : ''}</span>
          </p>
          <p className='mg1b'>
            <InfoCircleOutlined /> <b className='mg1r'>{window.store.installSrc}</b>
          </p>
          <Placeholder />
        </>
      )
    },
    {
      key: infoTabs.deps,
      label: e('dependencies'),
      children: Object.keys(deps).map((k, i) => {
        const v = deps[k]
        return (
          <div className='pd1b' key={i + '_dp_' + k}>
            <b className='bold'>{k}</b>:
            <span className='mg1l'>
              {v}
            </span>
          </div>
        )
      })
    },
    {
      key: infoTabs.env,
      label: e('env'),
      children: Object.keys(envs).map((k, i) => {
        const v = envs[k]
        return (
          <div className='pd1b' key={i + '_env_' + k}>
            <b className='bold'>{k}</b>:
            <span className='mg1l'>
              {v}
            </span>
          </div>
        )
      })
    }
  ]

  if (!window.et.isWebApp) {
    items.push({
      key: infoTabs.cmd,
      label: e('commandLineUsage'),
      children: (
        <pre>
          <code>{commandLineHelp}</code>
        </pre>
      )
    })
  }

  return (
    <Modal
      {...attrs}
    >
      <div className='about-wrap'>
        <Tabs
          activeKey={infoModalTab}
          onChange={handleChangeTab}
          items={items}
        />
      </div>
    </Modal>
  )
})
