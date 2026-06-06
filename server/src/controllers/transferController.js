import {
  createTransfer,
  getTransferDashboard,
  getTransferShell,
  lookupTransfer,
  retrieveTextTransfer,
  sendTransferDownload,
  verifyTransferWithRequest
} from "../services/transferService.js";

export async function createSecureTransfer(req, res) {
  const transfer = await createTransfer({
    req,
    files: req.files || [],
    expiry: req.body.expiry,
    password: req.body.password,
    oneTimeDownload: req.body.oneTimeDownload,
    oneTimeView: req.body.oneTimeView,
    transferType: req.body.transferType,
    senderName: req.body.senderName,
    messageTitle: req.body.messageTitle,
    textContent: req.body.textContent
  });
  res.status(201).json({ transfer });
}

export async function transferShell(req, res) {
  res.json({ transfer: await getTransferShell(req.params.transferId) });
}

export async function verifySecureTransfer(req, res) {
  const transfer = await verifyTransferWithRequest({
    req,
    transferId: req.params.transferId,
    accessKey: req.body.accessKey,
    password: req.body.password
  });
  res.json({ transfer });
}

export async function lookupSecureTransfer(req, res) {
  const transfer = await lookupTransfer({
    req,
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

export async function retrieveSecureTextTransfer(req, res) {
  const transfer = await retrieveTextTransfer({
    req,
    transferId: req.params.transferId,
    accessKey: req.body.accessKey,
    password: req.body.password
  });
  res.json({ transfer });
}

export async function secureTransferDashboard(req, res) {
  res.json(await getTransferDashboard(req));
}
