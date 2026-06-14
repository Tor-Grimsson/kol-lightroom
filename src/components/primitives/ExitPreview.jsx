import { Link, useLocation } from 'react-router-dom'

export default function ExitPreview() {
  const { pathname: _pathname } = useLocation()

  return (
    <Link to="/" className="kol-exit-preview" aria-label="Exit preview">
      <span className="kol-exit-preview-icon" aria-hidden="true">×</span>
      <span className="kol-exit-preview-label">Exit</span>
    </Link>
  )
}
