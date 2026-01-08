import type { Mesh } from "three"
import type { Volume } from "../openAir"

export interface VolumePanelProps {
    volumes: Volume[]
    setVolumes: React.Dispatch<React.SetStateAction<Volume[]>>
    meshes: Mesh[]
}