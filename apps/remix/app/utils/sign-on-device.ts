import { useEffect, useState } from 'react';

/**
 * Scriptia: "Sign on this device" mode.
 *
 * When several people sign on one shared tablet, the device page remembers itself here so the
 * signing complete page can send the tablet back to the list of signers. sessionStorage keeps it
 * to this browser tab only.
 */
const SIGN_ON_DEVICE_KEY = 'scriptia.signOnDevice';

export const setSignOnDeviceReturnPath = (path: string) => {
  try {
    sessionStorage.setItem(SIGN_ON_DEVICE_KEY, path);
  } catch {
    // Storage can be unavailable (private mode); the signer then just sees the normal page.
  }
};

export const getSignOnDeviceReturnPath = () => {
  try {
    const path = sessionStorage.getItem(SIGN_ON_DEVICE_KEY);

    // Only ever return to a page inside this app.
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
  } catch {
    return null;
  }
};

export const clearSignOnDeviceReturnPath = () => {
  try {
    sessionStorage.removeItem(SIGN_ON_DEVICE_KEY);
  } catch {
    // Nothing to clear.
  }
};

/**
 * True while this tab is a shared signing tablet. Used to hide the account owner's menus from
 * the people signing. Only known after mount, since sessionStorage is client-side.
 */
export const useIsSignOnDevice = () => {
  const [isSignOnDevice, setIsSignOnDevice] = useState(false);

  useEffect(() => {
    setIsSignOnDevice(getSignOnDeviceReturnPath() !== null);
  }, []);

  return isSignOnDevice;
};
