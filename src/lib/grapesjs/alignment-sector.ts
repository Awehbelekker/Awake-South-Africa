/**
 * Style Manager sector for common marketing-page layout tweaks (flow layout, not absolute).
 */
export const diggAlignmentSector = {
  id: 'digg-alignment',
  name: 'Alignment & width',
  open: false,
  properties: [
    {
      property: 'max-width',
      type: 'select',
      defaults: 'none',
      options: [
        { id: 'none', label: 'None' },
        { id: '40rem', label: 'Narrow (~640px)' },
        { id: '48rem', label: 'Readable (~768px)' },
        { id: '64rem', label: 'Content (~1024px)' },
        { id: '72rem', label: 'Wide (~1152px)' },
        { id: '80rem', label: 'XL (~1280px)' },
        { id: '100%', label: 'Full width' },
      ],
    },
    {
      property: 'margin-left',
      type: 'select',
      defaults: '0',
      options: [
        { id: '0', label: 'Default' },
        { id: 'auto', label: 'Auto (use with right)' },
      ],
    },
    {
      property: 'margin-right',
      type: 'select',
      defaults: '0',
      options: [
        { id: '0', label: 'Default' },
        { id: 'auto', label: 'Auto (use with left)' },
      ],
    },
    {
      property: 'text-align',
      type: 'select',
      defaults: 'left',
      options: [
        { id: 'left', label: 'Left' },
        { id: 'center', label: 'Center' },
        { id: 'right', label: 'Right' },
        { id: 'justify', label: 'Justify' },
      ],
    },
    {
      property: 'align-self',
      type: 'select',
      defaults: 'auto',
      options: [
        { id: 'auto', label: 'Auto (flex)' },
        { id: 'stretch', label: 'Stretch' },
        { id: 'flex-start', label: 'Start' },
        { id: 'center', label: 'Center' },
        { id: 'flex-end', label: 'End' },
      ],
    },
  ],
}
