import * as React from "react"

const MOBILE_BREAKPOINT = 1100 // Covers Tablets/iPads

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent.toLowerCase();
      // Regex to detect Mobile, Android, iPhone, iPad
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) ||
        (navigator.maxTouchPoints > 0 && window.innerWidth < MOBILE_BREAKPOINT); // Catch-all for touch tablets

      setIsMobile(isMobileDevice);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [])

  return !!isMobile
}
