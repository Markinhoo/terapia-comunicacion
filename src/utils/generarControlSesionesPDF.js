import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generarControlSesionesPDF(paciente, sesiones) {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.text(`NOMBRE DEL PACIENTE: ${paciente.nombre_paciente}`, 14, 16);

  autoTable(doc, {
    startY: 24,
    head: [[
      'FECHA DE TERAPIA',
      'REAGENDA',
      'FECHA DE PAGO',
      'CANTIDAD',
      'FIRMA'
    ]],
    body: sesiones.map((sesion) => [
      sesion.fecha_terapia || '',
      sesion.reagendada
        ? `Sí${sesion.fecha_reagenda ? `: ${sesion.fecha_reagenda}` : ''}`
        : 'No',
      sesion.fecha_pago || '',
      sesion.cantidad != null ? `$${Number(sesion.cantidad).toFixed(2)}` : '',
      ''
    ]),
    styles: {
      minCellHeight: 18,
      valign: 'middle',
      halign: 'center',
      lineColor: [60, 60, 60],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [107, 79, 155],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      4: { cellWidth: 62 }
    },
    didDrawCell: ({ cell, column, row, section }) => {
      if (section !== 'body' || column.index !== 4) return;

      const firma = sesiones[row.index]?.firma_data_url;
      if (!firma) return;

      doc.addImage(
        firma,
        'PNG',
        cell.x + 3,
        cell.y + 2,
        cell.width - 6,
        cell.height - 4,
        undefined,
        'FAST'
      );
    }
  });

  doc.save(`Control_sesiones_${paciente.nombre_paciente}.pdf`);
}
