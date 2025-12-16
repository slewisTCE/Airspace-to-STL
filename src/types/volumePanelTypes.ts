import type { OpenAirAirspace } from "../openAir"

export interface VolumePanelProps {
    volumes: OpenAirAirspace[]
    setVolumes: React.Dispatch<React.SetStateAction<OpenAirAirspace[]>>
}