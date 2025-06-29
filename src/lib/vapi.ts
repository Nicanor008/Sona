import Vapi from '@vapi-ai/web';

const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

const vapi = new Vapi(vapiPublicKey);

declare global {
  interface Window {
    vapi?: Vapi;
  }
}

if (typeof window !== 'undefined') {
  window.vapi = vapi;
}

export default vapi;
