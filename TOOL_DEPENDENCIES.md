# Tool Dependency Sources

Most ConviLarge tools run with the Node dependencies already in this project. These tools need native server support before they are fully production-ready.

## PDF Lock and Unlock

- Tool ids: `lock-pdf`, `unlock-pdf`
- Required config: `QPDF_PATH`
- Source: https://qpdf.readthedocs.io/en/latest/installation.html
- Notes: Install qpdf on the server and set `QPDF_PATH` if the binary is not available as `qpdf` on the system path. On Render, keep `QPDF_PATH=qpdf` and confirm `/api/system/status` returns `"qpdf": true`.

## PDF to JPG

- Tool id: `pdf-to-jpg`
- Required server support: Sharp/libvips with PDF input support
- Sources:
  - https://sharp.pixelplumbing.com/install/
  - https://www.libvips.org/install
- Notes: The code uses Sharp to render PDF pages as JPG images. Deployment needs a libvips build/runtime with PDF loading support.
