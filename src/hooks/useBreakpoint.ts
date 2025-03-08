import { useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config";

const fullConfig = resolveConfig(tailwindConfig);

// Convert Tailwind breakpoints from "640px" to numbers (640)
const breakpoints = Object.fromEntries(
  Object.entries(fullConfig.theme.screens).map(([key, value]) => [
    key,
    parseInt(value, 10),
  ]),
);

export function useBreakpoint() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sm = useMediaQuery({ minWidth: breakpoints.sm });
  const md = useMediaQuery({ minWidth: breakpoints.md });
  const lg = useMediaQuery({ minWidth: breakpoints.lg });
  const xl = useMediaQuery({ minWidth: breakpoints.xl });
  const xxl = useMediaQuery({ minWidth: breakpoints["2xl"] });

  return {
    sm: isClient ? sm : false,
    md: isClient ? md : false,
    lg: isClient ? lg : false,
    xl: isClient ? xl : false,
    xxl: isClient ? xxl : false,
  };
}
