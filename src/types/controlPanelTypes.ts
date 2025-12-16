import type { OpenAirAirspace } from "../openAir"

export interface ControlPanelProps {
    airspaces: OpenAirAirspace[]
    volumes: OpenAirAirspace[]
    setVolumes: React.Dispatch<React.SetStateAction<OpenAirAirspace[]>>
    airspaceSelect: OpenAirAirspace
    setAirspaceSelect: React.Dispatch<React.SetStateAction<OpenAirAirspace>>
}