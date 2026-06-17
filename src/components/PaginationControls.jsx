function crearPaginas(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const paginas = [1];
  const inicio = Math.max(2, page - 1);
  const fin = Math.min(totalPages - 1, page + 1);

  if (inicio > 2) paginas.push('start-ellipsis');

  for (let pagina = inicio; pagina <= fin; pagina += 1) {
    paginas.push(pagina);
  }

  if (fin < totalPages - 1) paginas.push('end-ellipsis');

  paginas.push(totalPages);
  return paginas;
}

function PaginationControls({ page, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  const paginas = crearPaginas(page, totalPages);

  return (
    <nav className="pagination-controls" aria-label="Paginacion de tabla">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        Anterior
      </button>

      <div className="pagination-pages">
        {paginas.map((pagina) => (
          typeof pagina === 'number' ? (
            <button
              type="button"
              key={pagina}
              className={pagina === page ? 'active' : ''}
              onClick={() => onPageChange(pagina)}
              aria-current={pagina === page ? 'page' : undefined}
            >
              {pagina}
            </button>
          ) : (
            <span key={pagina}>...</span>
          )
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Siguiente
      </button>

      <small>
        Pagina {page} de {totalPages} - {totalItems} registros
      </small>
    </nav>
  );
}

export default PaginationControls;
