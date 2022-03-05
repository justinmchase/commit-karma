import { Services } from "../services/mod.ts"
import { InstallationManager } from "./installation.manager.ts"
import { InteractionManager } from "./interaction.manager.ts"

export {
  InstallationManager,
  InteractionManager
}

export type Managers = {
  installations: InstallationManager
  interactions: InteractionManager
}

export function initManagers(services: Services) {
  const { mongo } = services
  const installations = new InstallationManager(mongo)
  const interactions = new InteractionManager(mongo)
  return {
    installations,
    interactions,
  }
}
