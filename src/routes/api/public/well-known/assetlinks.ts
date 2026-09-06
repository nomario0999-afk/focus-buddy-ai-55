import { createFileRoute } from "@tanstack/react-router";

/**
 * Android Digital Asset Links for the Google Play Trusted Web Activity.
 * After generating the Android package with Bubblewrap, paste the signing
 * key's SHA-256 fingerprint below (Bubblewrap prints it) so Google Play
 * can verify this domain owns the app.
 */
const SHA256_FINGERPRINT = "";

export const Route = createFileRoute("/api/public/well-known/assetlinks")({
  server: {
    handlers: {
      GET: async () => {
        const body = SHA256_FINGERPRINT
          ? [
              {
                relation: ["delegate_permission/common.handle_all_urls"],
                target: {
                  namespace: "android_app",
                  package_name: "app.lovable.focuser",
                  sha256_cert_fingerprints: [SHA256_FINGERPRINT],
                },
              },
            ]
          : [];
        return new Response(JSON.stringify(body), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
