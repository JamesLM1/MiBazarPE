import { parseWorkbook, verifyWorkbookArchive } from "./parser";

self.onmessage = async (event: MessageEvent<{ buffer: ArrayBuffer; fileName: string }>) => {
  try {
    await verifyWorkbookArchive(event.data.buffer, event.data.fileName);
    const workbook = parseWorkbook(event.data.buffer, event.data.fileName);
    self.postMessage({ ok: true, workbook });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : "No se pudo leer el archivo." });
  }
};
