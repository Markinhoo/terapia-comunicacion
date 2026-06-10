import { FaWhatsapp } from 'react-icons/fa';

function WhatsAppFloat() {
  const telefono = '526182363755';

  const mensaje = encodeURIComponent(
    'Hola, me gustaría solicitar información sobre terapia de comunicación humana.'
  );

  return (
    <a
      href={`https://wa.me/${telefono}?text=${mensaje}`}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      title="Enviar mensaje por WhatsApp"
    >
      <FaWhatsapp size={34} />
    </a>
  );
}

export default WhatsAppFloat;