import { useEffect, useRef } from "react";
import { capabilityRegistry } from "../utils/CapabilityRegistry";

interface GuidanceTargetProps {
  capability: string;
  children: React.ReactNode;
  /** Extra classes applied to the wrapper span. Defaults keep w-fit h-fit. */
  className?: string;
}

export function GuidanceTarget({ capability, children, className }: GuidanceTargetProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      console.log(`[Guidance] Registered: ${capability}`, {
        rect: ref.current.getBoundingClientRect(),
        isVisible: ref.current.offsetParent !== null
      });
      capabilityRegistry.register(capability, ref.current);
      return () => {
        console.log(`[Guidance] Unregistered: ${capability}`);
        capabilityRegistry.unregister(capability);
      };
    }
  }, [capability]);

  return (
    <span ref={ref} className={className ?? "block w-fit h-fit"}>
      {children}
    </span>
  );
}
