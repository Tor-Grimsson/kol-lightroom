/**
 * @kol/component - Canonical KOL design-system primitives
 *
 * Shared atoms/molecules consumed by both apps/web (via @kol/ui re-export)
 * and apps/brand. Components emit canonical kol-* classes; CSS lives in
 * @kol/theme (kol-components-*.css).
 */

export { default as Divider } from './atoms/Divider.jsx'
export { default as DropdownTagFilter } from './molecules/DropdownTagFilter.jsx'
export { default as QuantityInput } from './molecules/QuantityInput.jsx'
export { default as QuantityStepper } from './molecules/QuantityStepper.jsx'
export { default as Pill } from './molecules/Pill.jsx'
export { default as ToggleCheckbox } from './atoms/ToggleCheckbox.jsx'
export { default as ToggleSwitch } from './atoms/ToggleSwitch.jsx'
export { default as ToggleBracket } from './molecules/ToggleBracket.jsx'
export { Icon } from './loaders/index.js'
export { default as Tag } from './molecules/Tag.jsx'
export { default as Badge } from './molecules/Badge.jsx'
export { default as SectionLabel } from './molecules/SectionLabel.jsx'
export { default as Section } from './molecules/Section.jsx'
export { default as Button } from './atoms/Button.jsx'
export { default as Input } from './atoms/Input.jsx'
export { default as Slider } from './atoms/Slider.jsx'
export { default as Dropdown } from './molecules/Dropdown.jsx'
export { usePopover, PopoverPanel, Tooltip } from './molecules/Popover.jsx'
export { MenuItem, MenuDropdownItem, MenuDropdownDivider, MenuDropdownNest } from './molecules/MenuItem.jsx'

/* ── Folded from apps/brand (Phase 4 — brand is canonical, brand wins) ────── */
// atoms
export { default as Avatar } from './atoms/Avatar.jsx'
export { default as ColorSwatch } from './atoms/ColorSwatch.jsx'
export { default as Label } from './atoms/Label.jsx'
export { default as Stepper } from './atoms/Stepper.jsx'
export { default as Textarea } from './atoms/Textarea.jsx'
export { default as TransparentX } from './atoms/TransparentX.jsx'
// molecules
export { default as ContentFilters } from './molecules/ContentFilters.jsx'
export { default as LabeledControl } from './molecules/LabeledControl.jsx'
export { MenuPopover } from './molecules/MenuPopover.jsx'
export { ModalProvider, useModal } from './molecules/Modal.jsx'
export { default as PropertyInput } from './molecules/PropertyInput.jsx'
export { default as SegmentedToggle } from './molecules/SegmentedToggle.jsx'
export { default as ViewToggle } from './molecules/ViewToggle.jsx'
// primitives
export { Accordion, AccordionPanel } from './primitives/Accordion.jsx'
export { default as AssetPlaceholder } from './primitives/AssetPlaceholder.jsx'
export { default as Carousel } from './primitives/Carousel.jsx'
export { default as CodeBlock } from './primitives/CodeBlock.jsx'
export { default as ExitPreview } from './primitives/ExitPreview.jsx'
export { default as FullscreenOverlay } from './primitives/FullscreenOverlay.jsx'
export { default as Image } from './primitives/Image.jsx'
// graphics (SVG illustration loader — globs its own ./graphics/svg/**)
export { default as Graphic, GRAPHICS, GRAPHIC_RAW } from './graphics/Graphic.jsx'
// organisms
export { default as Table } from './organisms/Table.jsx'
// hooks
export { default as useReveal } from './hooks/useReveal.js'
export { default as useScrollSpy } from './hooks/useScrollSpy.js'
