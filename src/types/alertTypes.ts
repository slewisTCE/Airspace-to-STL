import type { AlertColor, AlertPropsColorOverrides } from "@mui/material";
import type { OverridableStringUnion } from '@mui/types';

export type AlertSeverity = OverridableStringUnion<AlertColor, AlertPropsColorOverrides>
