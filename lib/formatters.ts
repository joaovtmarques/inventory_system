export function formatName(name: string): string {
  if (!name) return "-";

  return name
    .toLowerCase()
    .split(" ")
    .map((word) => {
      const lowerCaseWords = ["de", "da", "do", "das", "dos", "e"];
      if (lowerCaseWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function formatCPF(document: string): string {
  if (!document) return "-";

  const cleaned = document.replace(/\D/g, "");

  if (cleaned.length !== 11) {
    return document;
  }

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
