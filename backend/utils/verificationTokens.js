import crypto from "crypto";

export const generateVerificationToken = () => {
  const token = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit token
  const expiresAt = Date.now() + 3600 * 1000; // Set expiration to 1 hour from now

  return { token, expiresAt };
};
