import type { OpenAirAirspace, OpenAirAirspaces } from "../openAir"

export interface ControlPanelProps {
    airspaces: OpenAirAirspaces
    volumes: OpenAirAirspace[]
    setVolumes: React.Dispatch<React.SetStateAction<OpenAirAirspace[]>>
    airspaceSelect: OpenAirAirspace | undefined
    setAirspaceSelect: React.Dispatch<React.SetStateAction<OpenAirAirspace | undefined>>
}