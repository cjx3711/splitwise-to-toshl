import { Link, Typography } from "@mui/material";

export function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary">
      {"Copyright © "}
      <Link color="inherit" href="https://chaijiaxun.com/">
        CJX3711
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
      <Typography variant="caption" marginLeft={2}>
        v2.0.0
      </Typography>
    </Typography>
  );
}
