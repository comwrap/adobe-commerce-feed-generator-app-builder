import { register } from '@adobe/uix-guest';

export default function ExtensionRegistration() {
  init().catch(console.error);
  return <></>;
 }

 const extensionId = 'comwrap-feed-generator'
 
 const init = async () => {
   await register({
     id: extensionId,
     methods: {
     }
   }
 )
}
