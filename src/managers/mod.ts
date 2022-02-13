import { Services } from "../services/mod.ts"
import { InstallationManager } from "./installation.manager.ts"

export {
  InstallationManager
}

export type Managers = {
  installations: InstallationManager
}

export function initManagers(services: Services) {
  const { fauna } = services
  const installations = new InstallationManager(fauna)
  return {
    installations
  }
}
