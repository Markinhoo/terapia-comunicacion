import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarPDF = (
  paciente,
  detalle,
  expedientes,
  fotoUrl
) => {

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const primary = [107, 79, 155];
  const soft = [246, 244, 251];

  const cargarImagen = async (url) => {
    if (!url) return null;

    try {
      const respuesta = await fetch(url);
      const blob = await respuesta.blob();

      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const formatoImagen = (dataUrl) => {
    if (!dataUrl) return 'JPEG';
    if (dataUrl.startsWith('data:image/png')) return 'PNG';
    if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
    return 'JPEG';
  };

  return Promise.all([
    cargarImagen('/logo.png'),
    cargarImagen(fotoUrl)
  ]).then(([logoDataUrl, fotoDataUrl]) => {
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 34, 'F');

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, formatoImagen(logoDataUrl), 14, 7, 20, 20);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(
    'Clinica Casas',
    logoDataUrl ? 40 : 14,
    15
  );

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Terapia de la Comunicacion Humana', logoDataUrl ? 40 : 14, 22);

  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('EXPEDIENTE CLINICO', pageWidth - 14, 20, { align: 'right' });

  doc.setTextColor(38, 50, 56);

  doc.setFillColor(...soft);
  doc.roundedRect(14, 44, 182, 45, 4, 4, 'F');

  if (fotoDataUrl) {
    doc.addImage(fotoDataUrl, formatoImagen(fotoDataUrl), 158, 48, 28, 34);
  } else {
    doc.setFillColor(230, 222, 242);
    doc.roundedRect(158, 48, 28, 34, 4, 4, 'F');
    doc.setTextColor(...primary);
    doc.setFontSize(22);
    doc.text((paciente.nombre_paciente || 'P').charAt(0), 172, 69, { align: 'center' });
    doc.setTextColor(38, 50, 56);
  }

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...primary);
  doc.text('DATOS DEL PACIENTE', 20, 54);

  doc.setTextColor(38, 50, 56);
  doc.setFont(undefined, 'normal');

  doc.text(
    `Paciente: ${paciente.nombre_paciente}`,
    20,
    63
  );

  doc.text(
    `Edad: ${paciente.edad || ''}`,
    20,
    71
  );

  doc.text(
    `Responsable: ${paciente.nombre_responsable || ''}`,
    72,
    71
  );

  doc.text(
    `Telefono: ${paciente.telefono || ''}`,
    20,
    79
  );

  doc.text(
    `Correo: ${paciente.correo || ''}`,
    72,
    79
  );

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...primary);
  doc.text(
    'FICHA CLINICA',
    14,
    105
  );

  doc.setTextColor(38, 50, 56);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);

  let y = 115;

  doc.text(
    `Fecha nacimiento: ${detalle.fecha_nacimiento || ''}`,
    14,
    y
  );

  y += 8;

  doc.text(
    `Sexo: ${detalle.sexo || ''}`,
    14,
    y
  );

  y += 10;

  doc.text(
    `Antecedentes Perinatales:`,
    14,
    y
  );

  y += 6;

  doc.text(
    detalle.antecedentes_perinatales || '',
    18,
    y
  );

  y += 12;

  doc.text(
    `Antecedentes Medicos:`,
    14,
    y
  );

  y += 6;

  doc.text(
    detalle.antecedentes_medicos || '',
    18,
    y
  );

  y += 12;

  doc.text(
    `Antecedentes Familiares:`,
    14,
    y
  );

  y += 6;

  doc.text(
    detalle.antecedentes_familiares || '',
    18,
    y
  );

  y += 12;

  doc.text(
    `Diagnostico Inicial:`,
    14,
    y
  );

  y += 6;

  doc.text(
    detalle.diagnostico_inicial || '',
    18,
    y
  );

  autoTable(doc, {
    startY: y + 20,
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: primary,
      textColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: soft
    },
    head: [[
      'Fecha',
      'Diagnostico',
      'Evolucion'
    ]],
    body: expedientes.map(e => [
      e.fecha,
      e.diagnostico,
      e.evolucion
    ])
  });

  doc.save(
    `Expediente_${paciente.nombre_paciente}.pdf`
  );
  });
};
