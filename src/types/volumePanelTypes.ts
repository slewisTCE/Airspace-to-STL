import type { Mesh } from "three"
import type { Volume } from "../openAir"
import type { Envelope } from "../openAir/openAirTypes"
import type { AlertSeverity } from "./alertTypes"

export interface VolumePanelProps {
    volumes: Volume[]
    envelope: Envelope,
    handleEnvelopeChange: (newEnvelope: Envelope, volumeName: string) => void
    handleRemoveVolume: (name: string) => () => void
    handleClearAllVolumes: () => void
    handleAlert: (message: string, severity: AlertSeverity) => void
    meshes: Mesh[]
}