import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatoPesos = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
});

export function generarReporteFinanzasPDF({ pagos, totales, rango }) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const fechaReporte = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date());

  doc.setFillColor(107, 79, 155);
  doc.rect(0, 0, 297, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Clínica Casas', 14, 12);
  doc.setFontSize(11);
  doc.text('Reporte de ingresos', 14, 20);

  doc.setTextColor(45, 35, 58);
  doc.setFontSize(10);
  doc.text(`Generado: ${fechaReporte}`, 14, 38);
  doc.text(`Periodo consultado: ${rango.inicio || 'Sin inicio'} a ${rango.fin || 'Sin fin'}`, 14, 45);

  autoTable(doc, {
    startY: 54,
    head: [['Periodo', 'Total']],
    body: [
      ['Hoy', formatoPesos.format(totales.dia)],
      ['Semana', formatoPesos.format(totales.semana)],
      ['Quincena', formatoPesos.format(totales.quincena)],
      ['Mes', formatoPesos.format(totales.mes)],
      ['Rango visible', formatoPesos.format(totales.rango)]
    ],
    theme: 'grid',
    headStyles: { fillColor: [107, 79, 155] },
    styles: { fontSize: 10 }
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Fecha de pago', 'Paciente', 'Responsable', 'Terapia', 'Cantidad']],
    body: pagos.map((pago) => [
      pago.fecha_pago || '',
      pago.paciente || '',
      pago.responsable || '',
      pago.fecha_terapia || '',
      formatoPesos.format(Number(pago.cantidad || 0))
    ]),
    theme: 'striped',
    headStyles: { fillColor: [107, 79, 155] },
    styles: { fontSize: 9 }
  });

  doc.save(`Reporte_ingresos_${rango.inicio || 'inicio'}_${rango.fin || 'fin'}.pdf`);
}
