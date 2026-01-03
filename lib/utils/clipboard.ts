/**
 * Copy text to clipboard with fallback for older browsers
 * @param text - The text to copy to clipboard
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern browsers
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Make the textarea invisible but still part of the DOM
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);

    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
