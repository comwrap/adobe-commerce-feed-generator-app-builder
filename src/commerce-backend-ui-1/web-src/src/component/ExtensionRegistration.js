import { useEffect } from 'react'
import { MainPage } from './App'
import { register } from '@adobe/uix-guest'

const extensionId = 'feedGenerator'

export default function ExtensionRegistration(props) {

  useEffect(() => {
    (async () => {
      await register({
        id: extensionId,
        methods: {
        }
      })
    })()
  }, [])

  return <MainPage ims={props.ims} runtime={props.runtime} />
}