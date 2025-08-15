import { register } from '@adobe/uix-guest'
import React, { useEffect } from 'react'

export default function ExtensionRegistration(props) {

  useEffect(() => {
    (async () => {
      const extensionId = 'comwrap-feed-generator'

      await register({
        id: extensionId,
        methods: {
        }
      })

    })()
  }, [])

  return <Home ims={props.ims} runtime={props.runtime} />
}
