import Icon from '../loaders/Icon.jsx'

export default function SectionLabel({
  text,
  size = 'md',
  className = ''
}) {
  // Size variants: sm (16px), md (20px), lg (32px)
  const sizeConfig = {
    sm: {
      height: 'h-4',
      iconSize: 16,
      textClass: 'kol-label-compact-md'
    },
    md: {
      height: 'h-5',
      iconSize: 24,
      textClass: 'kol-label-compact-lg'
    },
    lg: {
      height: 'h-8',
      iconSize: 40,
      textClass: 'kol-heading-md'
    }
  }

  const config = sizeConfig[size] || sizeConfig.md

  return (
    <div className={`section-label-wrapper flex flex-row items-center gap-1 overflow-visible ${config.height} ${className}`}>
      <p className={`${config.textClass} text-auto`}>{text}</p>
      <span
        className="icon-swap-container"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: `${config.iconSize}px`,
          height: `${config.iconSize}px`,
          overflow: 'hidden'
        }}
      >
        <Icon
          name="arrow-downright"
          size={config.iconSize}
          className="icon-default"
          style={{ position: 'absolute' }}
        />
        <Icon
          name="arrow-downright"
          size={config.iconSize}
          className="icon-hover"
          style={{ position: 'absolute' }}
        />
      </span>
    </div>
  )
}
