export function getGmailErrorMessage(errorCode: string | null | undefined) {
  switch (errorCode) {
    case "GMAIL_NOT_CONNECTED":
      return "Najpierw podłącz Gmail, żeby użyć tej funkcji.";
    case "GMAIL_READ_SCOPE_REQUIRED":
      return "To połączenie Gmail nie ma dostępu do odczytu skrzynki. Połącz konto ponownie.";
    case "GMAIL_COMPOSE_SCOPE_REQUIRED":
      return "Masz już odczyt Gmaila, ale bez prawa do szkiców. Rozszerz dostęp, aby tworzyć drafty.";
    case "missing_compose_scope":
      return "Google nie przyznał jeszcze dostępu do szkiców Gmail. Spróbuj rozszerzyć autoryzację ponownie.";
    default:
      return null;
  }
}
