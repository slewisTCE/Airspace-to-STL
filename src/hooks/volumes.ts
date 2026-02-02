import { useMemo } from "react";
import type { Volume } from "../openAir";

export function useVolumes(volumes: Volume[]){
  return useMemo(() => {
    console.log('Volumes hook initialized');
    return volumes;
  }, [volumes]);
}