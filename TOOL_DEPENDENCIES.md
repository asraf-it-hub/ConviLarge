# Tool Dependency Sources

Most ConviLarge tools run with the Node dependencies already in this project. These tools need an external service or native server support before they are fully production-ready.

## Remove Background

- Tool id: `remove-background`
- Required server package: `rembg`
- Optional config: `REMBG_COMMAND`
- Source: https://pypi.org/project/rembg/
- Notes: Install rembg on the server with `pip install "rembg[cli]"`. The backend runs `rembg i input output`, so no user API key or third-party upload is needed.

## Lock PDF and Unlock PDF

- Tool ids: `lock-pdf`, `unlock-pdf`
- Required config: `QPDF_PATH`
- Source: https://qpdf.readthedocs.io/en/latest/installation.html
- Notes: Install qpdf on the server and set `QPDF_PATH` if the binary is not available as `qpdf` on the system path.

## PDF to JPG

- Tool id: `pdf-to-jpg`
- Required server support: Sharp/libvips with PDF input support
- Sources:
  - https://sharp.pixelplumbing.com/install/
  - https://www.libvips.org/install
- Notes: The code uses Sharp to render PDF pages as JPG images. Deployment needs a libvips build/runtime with PDF loading support.
