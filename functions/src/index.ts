import { beforeUserSignedIn } from "firebase-functions/v2/identity";
import { isAdminEmail } from "./admins";

const SERVICE_ACCOUNT = "ekireq-fn@utaha-io.iam.gserviceaccount.com";

export const setAdminClaim = beforeUserSignedIn(
  { serviceAccount: SERVICE_ACCOUNT },
  (event) => {
    const email = event.data?.email;
    const admin = isAdminEmail(email);

    const existing = event.data?.customClaims ?? {};
    const next = { ...existing, admin };

    return { customClaims: next };
  },
);
