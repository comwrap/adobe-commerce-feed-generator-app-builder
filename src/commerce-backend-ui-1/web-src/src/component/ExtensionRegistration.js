import React, { useEffect, useState } from 'react'
import App from './App'
import { attach, register } from '@adobe/uix-guest'

export default function ExtensionRegistration(props) {

  const [isLoading, setIsLoading] = useState(true)

  console.log("ExtensionRegistration")

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!props.ims.token) {
        const guestConnection = await attach({ id: 'feedGenerator' });
        props.ims.token = guestConnection?.sharedContext?.get('imsToken');
        props.ims.org = guestConnection?.sharedContext?.get('imsOrgId');
      }
      setIsLoading(false);
    };

    fetchCredentials();

    (async () => {
      const extensionId = 'feedGenerator'

      await register({
        id: extensionId,
        methods: {
        }
      })

    })()
  }, [])

  return <App ims={props.ims} runtime={props.runtime} />
}