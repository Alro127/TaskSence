type CapabilityName = string;

class CapabilityRegistry {
  private targets = new Map<CapabilityName, HTMLElement>();
  private listeners = new Set<() => void>();

  register(name: CapabilityName, element: HTMLElement) {
    this.targets.set(name, element);
    this.notify();
  }

  unregister(name: CapabilityName) {
    this.targets.delete(name);
    this.notify();
  }

  getTarget(name: CapabilityName) {
    return this.targets.get(name);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const capabilityRegistry = new CapabilityRegistry();
