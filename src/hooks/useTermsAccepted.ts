import { useEffect, useState } from 'react';

/**
 * Hook to check if user has accepted the terms and conditions
 * @returns {boolean} true if terms are accepted, false otherwise
 */
export function useTermsAccepted(): boolean {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAcceptance = localStorage.getItem('terms_accepted');
    const acceptanceDate = localStorage.getItem('terms_accepted_date');
    
    if (storedAcceptance === 'true' && acceptanceDate) {
      setIsAccepted(true);
    } else {
      setIsAccepted(false);
    }
    setIsLoading(false);
  }, []);

  return isAccepted;
}

/**
 * Hook to get detailed terms acceptance info
 * @returns {object} Object containing acceptance status, date, and version
 */
export function useTermsAcceptanceInfo() {
  const [info, setInfo] = useState({
    isAccepted: false,
    acceptedDate: null as string | null,
    version: '1.0',
    isLoading: true,
  });

  useEffect(() => {
    const storedAcceptance = localStorage.getItem('terms_accepted');
    const acceptanceDate = localStorage.getItem('terms_accepted_date');
    const version = localStorage.getItem('terms_version') || '1.0';

    setInfo({
      isAccepted: storedAcceptance === 'true' && !!acceptanceDate,
      acceptedDate: acceptanceDate,
      version,
      isLoading: false,
    });
  }, []);

  return info;
}

/**
 * Function to programmatically accept terms
 */
export function acceptTerms(): void {
  localStorage.setItem('terms_accepted', 'true');
  localStorage.setItem('terms_accepted_date', new Date().toISOString());
  localStorage.setItem('terms_version', '1.0');
}

/**
 * Function to revoke terms acceptance
 */
export function revokeTermsAcceptance(): void {
  localStorage.removeItem('terms_accepted');
  localStorage.removeItem('terms_accepted_date');
  localStorage.removeItem('terms_version');
}

/**
 * Function to check if terms need to be re-accepted (version check)
 */
export function needsTermsReAcceptance(requiredVersion: string = '1.0'): boolean {
  const acceptedVersion = localStorage.getItem('terms_version');
  return !acceptedVersion || acceptedVersion !== requiredVersion;
}
