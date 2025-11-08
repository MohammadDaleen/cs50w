import { useState, useEffect } from "react";

/**
 * Custom hook to track whether a media query is matched.
 * This is synchronized with Bootstrap's 'lg' breakpoint.
 * @returns {boolean} True if the media query matches (i.e., is mobile view), false otherwise.
 */
export const useMediaQuery = (): boolean => {
  // The query matches screen widths less than 992px, aligning with Bootstrap's expand="lg" breakpoint.
  const query = "(max-width: 991.98px)";
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const documentChangeHandler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Listen for changes in the media query's match status.
    mediaQueryList.addEventListener("change", documentChangeHandler);

    // Cleanup listener on component unmount.
    return () => {
      mediaQueryList.removeEventListener("change", documentChangeHandler);
    };
  }, [query]);

  return matches;
};
