"use client";

// Base64URL conversion helpers for WebAuthn binary rawId
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function enrollBiometrics(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return { success: false, error: "Biometrics and WebAuthn are not supported on this browser" };
  }

  try {
    const isPlatformAvailable =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!isPlatformAvailable) {
      return {
        success: false,
        error: "No platform biometric sensor (Fingerprint / FaceID / Screen lock) detected on this device",
      };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "RupeePulse Vault",
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: "vault-owner",
          displayName: "Vault Owner",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential || !credential.rawId) {
      return { success: false, error: "Biometric registration was not completed" };
    }

    const base64Id = bufferToBase64url(credential.rawId);
    localStorage.setItem("rupeepulse_webauthn_id", base64Id);
    return { success: true };
  } catch (e: any) {
    console.error("WebAuthn enroll error:", e);
    if (e.name === "NotAllowedError" || e.name === "AbortError") {
      return { success: false, error: "Biometric registration was cancelled or dismissed" };
    }
    return { success: false, error: e.message || "Failed to register device passkey" };
  }
}

export async function promptBiometricAuth(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;

  try {
    const storedId = localStorage.getItem("rupeepulse_webauthn_id");
    if (!storedId) {
      return false;
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: "required",
      rpId: window.location.hostname,
    };

    if (storedId) {
      publicKeyOptions.allowCredentials = [
        {
          id: base64urlToBuffer(storedId),
          type: "public-key",
        },
      ];
    }

    const credential = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    });

    return !!credential;
  } catch (e: any) {
    console.warn("Biometric verification note:", e);
    return false;
  }
}
