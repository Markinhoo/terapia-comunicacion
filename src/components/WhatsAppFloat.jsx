import { FaWhatsapp } from 'react-icons/fa';
import { useClinica } from '../contexts/clinica';

function WhatsAppFloat() {
  const clinica = useClinica();
  const telefono = clinica.telefono_whatsapp;

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
