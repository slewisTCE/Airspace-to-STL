import type { OpenAirAirspace, OpenAirAirspaces, Volume } from "../openAir"
import type { AlertSeverity } from "./alertTypes"

export interface ControlPanelProps {
    airspaces: OpenAirAirspaces
    volumes: Volume[]
    handleAddVolume: (volume: Volume) => void
    handleAlert: (message: string, severity: AlertSeverity) => void
    airspaceSelect: OpenAirAirspace | undefined
    setAirspaceSelect: React.Dispatch<React.SetStateAction<OpenAirAirspace | undefined>>
    zScale: number
    handleZScaleChange: (newZScale: number) => void
}