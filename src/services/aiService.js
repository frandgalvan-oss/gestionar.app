/**
 * Transcripción de audio - no disponible sin API key
 */
export async function transcribeAudio(audioFile) {
  return {
    success: false,
    error: 'La transcripción por voz no está disponible. Ingresá los datos manualmente.'
  }
}

/**
 * Procesamiento de transcripción - no disponible sin API key
 */
export async function processTranscriptionForMovement(transcription, movementType) {
  return {
    success: false,
    error: 'El procesamiento por IA no está disponible. Ingresá los datos manualmente.'
  }
}

/**
 * Procesa audio para un movimiento - no disponible sin API key
 */
export async function processAudioForMovement(audioFile, movementType) {
  return {
    success: false,
    error: 'La carga por audio no está disponible. Ingresá los datos manualmente.'
  }
}

/**
 * Verifica si la IA está configurada
 */
export function isOpenAIConfigured() {
  return false
}
