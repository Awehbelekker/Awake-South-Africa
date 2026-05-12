/**
 * Style Manager sector for <img> framing: fit mode, focal position, aspect ratio.
 * This is CSS reframing (how the image fills its box), not bitmap/pixel cropping.
 * Works best when the image has a defined width and aspect-ratio (or fixed height).
 */
export const diggImageFramingSector = {
  id: 'image-framing',
  name: 'Image framing',
  open: true,
  properties: [
    {
      property: 'object-fit',
      type: 'select',
      defaults: 'cover',
      options: [
        { id: 'fill', label: 'Fill (stretch)' },
        { id: 'contain', label: 'Contain (fit inside)' },
        { id: 'cover', label: 'Cover (fill frame)' },
        { id: 'none', label: 'None (natural size)' },
        { id: 'scale-down', label: 'Scale down' },
      ],
    },
    {
      property: 'object-position',
      type: 'select',
      defaults: '50% 50%',
      options: [
        { id: '50% 50%', label: 'Center' },
        { id: '50% 0%', label: 'Top' },
        { id: '50% 100%', label: 'Bottom' },
        { id: '0% 50%', label: 'Left' },
        { id: '100% 50%', label: 'Right' },
        { id: '0% 0%', label: 'Top left' },
        { id: '100% 0%', label: 'Top right' },
        { id: '0% 100%', label: 'Bottom left' },
        { id: '100% 100%', label: 'Bottom right' },
      ],
    },
    {
      property: 'aspect-ratio',
      type: 'select',
      defaults: 'auto',
      options: [
        { id: 'auto', label: 'Auto (natural)' },
        { id: '1 / 1', label: '1:1 Square' },
        { id: '4 / 3', label: '4:3' },
        { id: '3 / 2', label: '3:2' },
        { id: '16 / 9', label: '16:9' },
        { id: '21 / 9', label: '21:9 Ultra-wide' },
        { id: '2 / 1', label: '2:1 Banner' },
        { id: '3 / 4', label: '3:4 Portrait' },
        { id: '9 / 16', label: '9:16 Story' },
      ],
    },
  ],
}

/** Default inline styles for images added via upload / drop (easy reframing in Style → Image framing). */
export const diggNewImageStyle = {
  width: '100%',
  'max-width': '800px',
  'aspect-ratio': '16 / 9',
  'object-fit': 'cover',
  'object-position': '50% 50%',
  height: 'auto',
  display: 'block',
  margin: '1rem auto',
  'border-radius': '0.75rem',
} as const
