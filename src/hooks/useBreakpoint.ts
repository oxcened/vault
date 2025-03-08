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
  return {
    sm: useMediaQuery({ minWidth: breakpoints.sm }),
    md: useMediaQuery({ minWidth: breakpoints.md }),
    lg: useMediaQuery({ minWidth: breakpoints.lg }),
    xl: useMediaQuery({ minWidth: breakpoints.xl }),
    xxl: useMediaQuery({ minWidth: breakpoints["2xl"] }),
  };
}
