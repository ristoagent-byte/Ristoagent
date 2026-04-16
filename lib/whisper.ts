/**
 * Trascrizione messaggi vocali Telegram con Groq Whisper (gratuito).
 * Flusso: file_id Telegram → download file → trascrizione Groq Whisper → testo
 */

export async function transcribeVoice(
  botToken: string,
  fileId: string
): Promise<string | null> {
  try {
    // 1. Recupera il percorso del file da Telegram
    console.log("[Whisper] Step 1: getFile for file_id:", fileId);
    const fileInfoRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    const fileInfo = await fileInfoRes.json();

    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      console.error("[Whisper] getFile failed:", JSON.stringify(fileInfo));
      return null;
    }

    const filePath: string = fileInfo.result.file_path;
    console.log("[Whisper] Step 2: downloading audio from path:", filePath);

    // 2. Scarica il file audio (formato OGG/Opus da Telegram)
    const audioRes = await fetch(
      `https://api.telegram.org/file/bot${botToken}/${filePath}`
    );
    if (!audioRes.ok) {
      console.error("[Whisper] Audio download failed, status:", audioRes.status);
      return null;
    }

    const audioBuffer = await audioRes.arrayBuffer();
    console.log("[Whisper] Step 3: audio downloaded, size:", audioBuffer.byteLength, "bytes. Sending to Groq...");

    // 3. Invia a Groq Whisper per la trascrizione
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([audioBuffer], { type: "audio/ogg" }),
      "voice.ogg"
    );
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "it");

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error("[Whisper] GROQ_API_KEY is not set!");
      return null;
    }

    const whisperRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey.trim()}`,
      },
      body: formData,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      console.error("[Whisper] Groq API error, status:", whisperRes.status, err);
      return null;
    }

    const result = await whisperRes.json();
    console.log("[Whisper] Transcription success:", result.text?.slice(0, 50));
    return result.text?.trim() || null;

  } catch (err) {
    console.error("[Whisper] Transcription error:", err);
    return null;
  }
}
