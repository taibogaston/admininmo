import multer from "multer";
import { HttpError } from "../utils/errors";
import { ensureUploadsDir, sanitizeFileName } from "../utils/files";

const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const makeStorage = (type: "contracts" | "proofs", paramKey: string) =>
  multer.diskStorage({
    destination: (req, _file, cb) => {
      const id = req.params[paramKey];
      if (!id) {
        cb(new HttpError(400, "Identificador no provisto"), "");
        return;
      }
      const targetDir = ensureUploadsDir(type, id);
      cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
      cb(null, sanitizeFileName(file.originalname));
    },
  });

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new HttpError(400, "Tipo de archivo no permitido"));
  }
};

export const contractUpload = multer({
  storage: makeStorage("contracts", "id"),
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

export const transferenciaUpload = multer({
  storage: makeStorage("proofs", "pagoId"),
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

export const transferenciaDualUpload = multer({
  storage: makeStorage("proofs", "pagoId"),
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).fields([
  { name: 'comprobantePropietario', maxCount: 1 },
  { name: 'comprobanteInmobiliaria', maxCount: 1 }
]);
