import React, { useEffect, useRef } from "react";
import { capabilityRegistry } from "../utils/CapabilityRegistry";

interface GuidanceTargetProps {
  capability: string;
  children: React.ReactElement;
}

export function GuidanceTarget({ capability, children }: GuidanceTargetProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      capabilityRegistry.register(capability, element);
    }
    return () => {
      capabilityRegistry.unregister(capability);
    };
  }, [capability]);

  // Clone child to attach the ref
  return React.cloneElement(children, {
    ...children.props,
    ref: (node: HTMLElement) => {
      // Keep existing refs if any
      const { ref: oldRef } = children as any;
      if (typeof oldRef === "function") oldRef(node);
      else if (oldRef) oldRef.current = node;
      
      (ref as any).current = node;
    }
  });
}
