import type { OpenAirAirspace, OpenAirAirspaces, Volume } from "../openAir"

export interface ControlPanelProps {
    airspaces: OpenAirAirspaces
    volumes: Volume[]
    setVolumes: React.Dispatch<React.SetStateAction<Volume[]>>
    airspaceSelect: OpenAirAirspace | undefined
    setAirspaceSelect: React.Dispatch<React.SetStateAction<OpenAirAirspace | undefined>>
}