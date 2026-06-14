/**
 * Table — data table.
 * Styles: src/styles/kol-components-organisms.css.
 *
 * Variants:
 *   default — bordered, column dividers, header bg
 *   simple  — borderless, flush, no column dividers
 */
const Table = ({ caption, columns, rows, variant = 'default', className = '' }) => {
  const variantClass = variant === 'simple' ? 'kol-table--simple' : ''
  const wrapperClass = ['kol-table-wrapper', variantClass, className].filter(Boolean).join(' ')
  return (
  <div className={wrapperClass}>
    <table className="kol-table">
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <thead className="kol-table-thead">
        <tr>
          {columns.map((column) => (
            <th
              key={column.accessor}
              scope="col"
              className={column.headerClassName ?? 'kol-table-cell-title'}
              style={column.style}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.id ?? row.token ?? rowIndex} className="kol-table-row">
            {columns.map((column) => (
              <td key={column.accessor} className={(typeof column.className === 'function' ? column.className(row) : column.className) ?? 'kol-table-cell-text'} style={column.style}>
                {column.render ? column.render(row) : row[column.accessor] ?? '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  )
}

export default Table
