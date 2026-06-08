import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarPDF = (
  paciente,
  detalle,
  expedientes
) => {

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(
    'EXPEDIENTE CLINICO',
    105,
    15,
    { align: 'center' }
  );

  doc.setFontSize(12);

  doc.text(
    'Lic. Sandra Estefania Vargas Casas',
    14,
    30
  );

  doc.text(
    'Terapia de la Comunicacion Humana',
    14,
    38
  );

  doc.line(14, 42, 195, 42);

  doc.text(
    `Paciente: ${paciente.nombre_paciente}`,
    14,
    55
  );

  doc.text(
    `Edad: ${paciente.edad || ''}`,
    14,
    63
  );

  doc.text(
    `Responsable: ${paciente.nombre_responsable || ''}`,
    14,
    71
  );

  doc.text(
    `Telefono: ${paciente.telefono || ''}`,
    14,
    79
  );

  doc.text(
    `Correo: ${paciente.correo || ''}`,
    14,
    87
  );

  doc.line(14, 92, 195, 92);

  doc.setFontSize(14);
  doc.text(
    'FICHA CLINICA',
    14,
    105
  );

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
};