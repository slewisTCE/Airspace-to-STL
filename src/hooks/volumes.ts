import { useMemo } from "react";
import type { Volume } from "../openAir";

export function useVolumes(volumes: Volume[]){
  return useMemo(() => {
    return volumes;
  }, [volumes]);
}