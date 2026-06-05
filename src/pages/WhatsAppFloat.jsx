function WhatsAppFloat() {
  const telefono = '526181246005';

  const mensaje = encodeURIComponent(
    'Hola, me gustaría solicitar información sobre terapia de comunicación humana.'
  );

  return (
    <a
      href={`https://wa.me/${telefono}?text=${mensaje}`}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
    >
      WhatsApp
    </a>
  );
}

export default WhatsAppFloat;