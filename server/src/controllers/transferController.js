import {
  createTransfer,
  getTransferDashboard,
  getTransferShell,
  lookupTransfer,
  sendTransferDownload,
  verifyTransfer
} from "../services/transferService.js";

export async function createSecureTransfer(req, res) {
  const transfer = await createTransfer({
    req,
    files: req.files || [],
    expiry: req.body.expiry,
    password: req.body.password,
    oneTimeDownload: req.body.oneTimeDownload
  });
  res.status(201).json({ transfer });
}

export async function transferShell(req, res) {
  res.json({ transfer: await getTransferShell(req.params.transferId) });
}

export async function verifySecureTransfer(req, res) {
  const transfer = await verifyTransfer({
    transferId: req.params.transferId,
    accessKey: req.body.accessKey,
    password: req.body.password
  });
  res.json({ transfer });
}

export async function lookupSecureTransfer(req, res) {
  const transfer = await lookupTransfer({
    accessKey: req.body.accessKey,
    password: req.body.password
  });
  res.json({ transfer });
}

export async function downloadSecureTransfer(req, res) {
  await sendTransferDownload({
    req,
    res,
    transferId: req.params.transferId,
    accessKey: req.body.accessKey,
    password: req.body.password
  });
}

export async function secureTransferDashboard(req, res) {
  res.json(await getTransferDashboard(req));
}
