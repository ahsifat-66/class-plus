/**
 * Utility functions for serializing and parsing multi-format assignment submissions.
 * Supports written text/markdown, Google Drive links, and attached files (images, PDFs, documents).
 */

export interface SubmissionData {
  text?: string;
  driveUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

export function parseSubmissionContent(raw: string | null | undefined): SubmissionData {
  if (!raw) return { text: "" };
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        return {
          text:
            typeof parsed.text === "string"
              ? parsed.text
              : typeof parsed.content === "string"
              ? parsed.content
              : "",
          driveUrl:
            typeof parsed.driveUrl === "string" && parsed.driveUrl.trim()
              ? parsed.driveUrl.trim()
              : undefined,
          fileUrl:
            typeof parsed.fileUrl === "string" && parsed.fileUrl.trim()
              ? parsed.fileUrl.trim()
              : undefined,
          fileName:
            typeof parsed.fileName === "string" && parsed.fileName.trim()
              ? parsed.fileName.trim()
              : undefined,
          fileSize:
            typeof parsed.fileSize === "string" && parsed.fileSize.trim()
              ? parsed.fileSize.trim()
              : undefined,
          fileType:
            typeof parsed.fileType === "string" && parsed.fileType.trim()
              ? parsed.fileType.trim()
              : undefined,
        };
      }
    } catch (e) {
      // Fallback to plain text if JSON parse failed
    }
  }

  return { text: raw };
}

export function formatSubmissionContent(data: SubmissionData): string {
  return JSON.stringify({
    text: data.text?.trim() || "",
    driveUrl: data.driveUrl?.trim() || undefined,
    fileUrl: data.fileUrl?.trim() || undefined,
    fileName: data.fileName?.trim() || undefined,
    fileSize: data.fileSize?.trim() || undefined,
    fileType: data.fileType?.trim() || undefined,
  });
}
