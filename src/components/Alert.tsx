import { Fragment, type Dispatch, type MouseEventHandler, type SetStateAction, type SyntheticEvent } from "react";
import type {AlertSeverity} from "../types/alertTypes"
import { Alert, IconButton, Snackbar, type SnackbarCloseReason } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close'


export function AlertWithSeverity(props: {
  open: boolean, 
  setOpen: Dispatch<SetStateAction<boolean>>,
  message: string,
  severity: AlertSeverity
}){

  function handleCloseAlert(
    _event: SyntheticEvent | Event,
    reason?: SnackbarCloseReason) {
      if (reason === 'clickaway') {
        return
      }
      props.setOpen(false);
    }

  return (
    <Snackbar
      open={props.open}
      autoHideDuration={6000}
      onClose={handleCloseAlert}
      action={<SnackAction handleCloseAlert={handleCloseAlert}/>}
      >
      <Alert
        onClose={handleCloseAlert}
        severity={props.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {props.message}
      </Alert>
    </Snackbar>
  )
}

function SnackAction(props: {handleCloseAlert: MouseEventHandler<HTMLButtonElement>}){
  return (
    <Fragment>
      <IconButton
        size="medium"
        aria-label="close"
        color="inherit"
        onClick={props.handleCloseAlert}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  )
}
