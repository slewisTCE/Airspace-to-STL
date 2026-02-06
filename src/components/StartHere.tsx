import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@mui/system";

const pulse = keyframes`
  0% { transform: scale(1.3); opacity: 0.85; }
  100% { transform: scale(0.2); opacity: 0; }
`;

export function StartHere(props: { visible: boolean }) {
  return (
    <Box
      sx={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        width: 32,
        height: 32,
        pointerEvents: "none",
        opacity: props.visible ? 1 : 0,
        transition: "opacity 500ms ease"
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.25),
          boxShadow: (theme) => `0 0 12px ${alpha(theme.palette.primary.main, 0.6)}`,
          animation: `${pulse} 2s linear infinite`
        }}
      />
    </Box>
  );
}
