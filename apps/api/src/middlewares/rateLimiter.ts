import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  legacyHeaders: false,
});

export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  legacyHeaders: false,
});
