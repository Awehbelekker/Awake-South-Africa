import type { PageSection } from '@/lib/types/pages'

function esc(s: unknown): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function sectionToHtml(section: PageSection): string {
  const { type, data } = section
  if (!data) return ''

  if (type === 'hero') {
    const bg = (data.backgroundImageUrl as string) || ''
    return `
      <section style="position:relative;min-height:80vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1B2A6B 0%,#2a3d8f 100%);overflow:hidden;color:white;text-align:center;">
        ${bg ? `<div style="position:absolute;inset:0;background:url('${esc(bg)}') center/cover no-repeat;opacity:0.3;"></div>` : ''}
        <div style="position:relative;z-index:1;max-width:800px;padding:2rem;">
          <h1 style="font-size:3.5rem;font-weight:700;margin-bottom:1rem;letter-spacing:-0.02em;line-height:1.1;">${esc(data.title)}</h1>
          <p style="font-size:1.25rem;opacity:0.9;margin-bottom:2rem;max-width:600px;margin-left:auto;margin-right:auto;">${esc(data.subtitle)}</p>
          <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
            <a href="${esc(data.primaryCTAhref || '#')}" style="display:inline-block;background:#F7941D;color:white;padding:0.875rem 2rem;border-radius:0.75rem;font-weight:600;text-decoration:none;">${esc(data.primaryCTAtext || 'Learn More')}</a>
            <a href="${esc(data.secondaryCTAhref || '/contact')}" style="display:inline-block;border:2px solid rgba(255,255,255,0.5);color:white;padding:0.875rem 2rem;border-radius:0.75rem;font-weight:600;text-decoration:none;">${esc(data.secondaryCTAtext || 'Contact')}</a>
          </div>
        </div>
      </section>`
  }

  if (type === 'text') {
    const align = (data.alignment as string) === 'center' ? 'center' : (data.alignment as string) === 'right' ? 'right' : 'left'
    return `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:48rem;margin:0 auto;text-align:${align};">
          ${(data.heading as string) ? `<h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;margin-bottom:1rem;">${esc(data.heading)}</h2>` : ''}
          <p style="color:#555;line-height:1.7;white-space:pre-wrap;">${esc(data.body)}</p>
        </div>
      </section>`
  }

  if (type === 'image') {
    const url = (data.imageUrl as string) || ''
    const alt = (data.alt as string) || ''
    const caption = (data.caption as string) || ''
    const full = (data.layout as string) === 'full'
    return `
      <section style="padding:2rem 1rem;">
        <div style="${full ? 'width:100%' : 'max-width:72rem;margin:0 auto'};">
          <div style="${full ? '' : 'border-radius:1rem;overflow:hidden'};">
            <img src="${esc(url)}" alt="${esc(alt)}" style="width:100%;height:auto;display:block;" />
          </div>
          ${caption ? `<p style="text-align:center;color:#999;font-size:0.875rem;margin-top:0.75rem;">${esc(caption)}</p>` : ''}
        </div>
      </section>`
  }

  if (type === 'two_column') {
    return `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:72rem;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;">
          <div ${data.reversed ? 'style="order:2"' : ''}>
            <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;margin-bottom:1rem;">${esc(data.heading)}</h2>
            <p style="color:#555;line-height:1.7;">${esc(data.body)}</p>
          </div>
          <div style="border-radius:1rem;overflow:hidden;${data.reversed ? 'order:1' : ''}">
            <img src="${esc(data.imageUrl)}" alt="${esc(data.imageAlt)}" style="width:100%;height:auto;display:block;border-radius:1rem;" />
          </div>
        </div>
      </section>`
  }

  if (type === 'grid') {
    const items = (data.items as { title: string; description: string; imageUrl?: string }[]) ?? []
    return `
      <section style="padding:4rem 1rem;background:#FAFAFA;">
        <div style="max-width:72rem;margin:0 auto;">
          ${(data.title as string) ? `<h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2.5rem;">${esc(data.title)}</h2>` : ''}
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;">
            ${items.map(item => `
              <div style="background:white;padding:1.5rem;border-radius:1rem;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
                ${item.imageUrl ? `<img src="${esc(item.imageUrl)}" alt="${esc(item.title)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:0.75rem;margin-bottom:1rem;" />` : ''}
                <h3 style="font-size:1.25rem;font-weight:700;color:#1B2A6B;margin-bottom:0.5rem;">${esc(item.title)}</h3>
                <p style="color:#666;font-size:0.9rem;">${esc(item.description)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`
  }

  if (type === 'gallery') {
    const images = (data.images as { url: string; alt?: string }[]) ?? []
    return `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:72rem;margin:0 auto;">
          ${(data.title as string) ? `<h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2rem;">${esc(data.title)}</h2>` : ''}
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;">
            ${images.map(img => `<div style="border-radius:0.75rem;overflow:hidden;aspect-ratio:1;"><img src="${esc(img.url)}" alt="${esc(img.alt || '')}" style="width:100%;height:100%;object-fit:cover;" /></div>`).join('')}
          </div>
        </div>
      </section>`
  }

  if (type === 'stats') {
    const items = (data.items as { label: string; value: string }[]) ?? []
    return `
      <section style="padding:3rem 1rem;background:linear-gradient(135deg,#1B2A6B,#2a3d8f);color:white;">
        <div style="max-width:72rem;margin:0 auto;display:grid;grid-template-columns:repeat(${items.length},1fr);gap:2rem;text-align:center;">
          ${items.map((item, i) => `
            <div>
              <div style="font-size:3rem;font-weight:700;color:${i % 2 === 0 ? '#5BC8E8' : '#F7941D'};">${esc(item.value)}</div>
              <div style="font-size:0.9rem;opacity:0.8;text-transform:uppercase;letter-spacing:0.05em;">${esc(item.label)}</div>
            </div>
          `).join('')}
        </div>
      </section>`
  }

  if (type === 'products') {
    const items = (data.items as { title: string; description: string; link?: string; comingSoon?: boolean; imageUrl?: string }[]) ?? []
    return `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:72rem;margin:0 auto;">
          ${(data.title as string) ? `<h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:0.5rem;">${esc(data.title)}</h2>` : ''}
          ${(data.subtitle as string) ? `<p style="text-align:center;font-size:1.1rem;color:#666;margin-bottom:2.5rem;">${esc(data.subtitle)}</p>` : ''}
          <div style="display:grid;grid-template-columns:repeat(${Math.min(items.length, 4)},1fr);gap:1.5rem;">
            ${items.map(item => `
              <a href="${esc(item.link || '#')}" style="display:block;background:#FAFAFA;border-radius:1rem;border:1px solid #eee;overflow:hidden;text-decoration:none;color:inherit;transition:box-shadow 0.2s;">
                ${item.imageUrl ? `<div style="aspect-ratio:4/3;overflow:hidden;"><img src="${esc(item.imageUrl)}" alt="${esc(item.title)}" style="width:100%;height:100%;object-fit:cover;" /></div>` : ''}
                <div style="padding:1.5rem;">
                  ${item.comingSoon ? `<span style="background:#5BC8E8;color:#1B2A6B;padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:600;">Coming Soon</span>` : ''}
                  <h3 style="font-size:1.25rem;font-weight:700;color:#1B2A6B;margin-bottom:0.5rem;">${esc(item.title)}</h3>
                  <p style="color:#666;font-size:0.9rem;">${esc(item.description)}</p>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      </section>`
  }

  if (type === 'testimonial') {
    return `
      <section style="padding:4rem 1rem;background:#FAFAFA;">
        <div style="max-width:42rem;margin:0 auto;text-align:center;">
          <div style="font-size:3rem;color:#5BC8E8;margin-bottom:1rem;">&ldquo;</div>
          <blockquote style="font-size:1.25rem;color:#333;font-style:italic;line-height:1.8;margin:0 0 1.5rem 0;">${esc(data.quote)}</blockquote>
          <div style="font-weight:700;color:#1B2A6B;">${esc(data.author)}</div>
          <div style="font-size:0.875rem;color:#666;">${esc(data.role)}${(data.company as string) ? `, ${esc(data.company)}` : ''}</div>
        </div>
      </section>`
  }

  if (type === 'video') {
    const url = (data.videoUrl as string) || ''
    let embedUrl = url
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
    return `
      <section style="padding:4rem 1rem;background:#FAFAFA;">
        <div style="max-width:56rem;margin:0 auto;">
          ${(data.heading as string) ? `<h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2rem;">${esc(data.heading)}</h2>` : ''}
          <div style="position:relative;padding-bottom:56.25%;height:0;border-radius:1rem;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <iframe src="${esc(embedUrl)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe>
          </div>
          ${(data.caption as string) ? `<p style="text-align:center;color:#999;font-size:0.875rem;margin-top:1rem;">${esc(data.caption)}</p>` : ''}
        </div>
      </section>`
  }

  if (type === 'logos') {
    const logos = (data.logos as { name: string; imageUrl?: string }[]) ?? []
    return `
      <section style="padding:3rem 1rem;background:white;border-top:1px solid #eee;border-bottom:1px solid #eee;">
        <div style="max-width:72rem;margin:0 auto;text-align:center;">
          ${(data.title as string) ? `<p style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:1.5rem;">${esc(data.title)}</p>` : ''}
          <div style="display:flex;align-items:center;justify-content:center;gap:3rem;flex-wrap:wrap;opacity:0.5;">
            ${logos.map(l => l.imageUrl ? `<img src="${esc(l.imageUrl)}" alt="${esc(l.name)}" style="height:40px;object-fit:contain;" />` : `<div style="font-size:1.2rem;font-weight:700;color:#333;">${esc(l.name)}</div>`).join('')}
          </div>
        </div>
      </section>`
  }

  if (type === 'faq') {
    const items = (data.items as { question: string; answer: string }[]) ?? []
    return `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:48rem;margin:0 auto;">
          ${(data.title as string) ? `<h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2.5rem;">${esc(data.title)}</h2>` : ''}
          <div style="border-top:1px solid #e5e7eb;">
            ${items.map(item => `
              <div style="padding:1.25rem 0;border-bottom:1px solid #e5e7eb;">
                <h3 style="font-size:1.1rem;font-weight:600;color:#1B2A6B;margin-bottom:0.5rem;">${esc(item.question)}</h3>
                <p style="color:#666;line-height:1.6;">${esc(item.answer)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`
  }

  if (type === 'cta') {
    return `
      <section style="padding:4rem 1rem;background:#1B2A6B;color:white;text-align:center;">
        <div style="max-width:42rem;margin:0 auto;">
          ${(data.title as string) ? `<h2 style="font-size:2rem;font-weight:700;margin-bottom:1rem;color:white;">${esc(data.title)}</h2>` : ''}
          ${(data.description as string) ? `<p style="font-size:1.1rem;opacity:0.9;margin-bottom:2rem;">${esc(data.description)}</p>` : ''}
          <a href="${esc(data.buttonLink || '/contact')}" style="display:inline-block;background:#F7941D;color:white;padding:0.875rem 2.5rem;border-radius:0.75rem;font-weight:600;text-decoration:none;">${esc(data.buttonText || 'Contact Us')}</a>
        </div>
      </section>`
  }

  if (type === 'divider') {
    const size = (data.size as string) || 'md'
    const pad = size === 'sm' ? '1rem' : size === 'lg' ? '4rem' : '2rem'
    const show = data.showLine !== false
    return `<div style="padding:${pad} 1rem;">${show ? '<hr style="max-width:72rem;margin:0 auto;border:none;border-top:1px solid #e5e7eb;" />' : ''}</div>`
  }

  if (type === 'form') {
    const formType = (data.formType as string) || 'contact'
    return `
      <section style="padding:4rem 1rem;background:#FAFAFA;">
        <div style="max-width:36rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2rem;">${formType === 'agent' ? 'Agent Registration' : 'Get in Touch'}</h2>
          <form style="display:flex;flex-direction:column;gap:1rem;">
            <input type="text" placeholder="Your name" style="padding:0.75rem 1rem;border:1px solid #d1d5db;border-radius:0.75rem;font-size:1rem;" />
            <input type="email" placeholder="Email address" style="padding:0.75rem 1rem;border:1px solid #d1d5db;border-radius:0.75rem;font-size:1rem;" />
            ${formType === 'agent' ? '<input type="text" placeholder="Company name" style="padding:0.75rem 1rem;border:1px solid #d1d5db;border-radius:0.75rem;font-size:1rem;" />' : ''}
            <input type="tel" placeholder="Phone (optional)" style="padding:0.75rem 1rem;border:1px solid #d1d5db;border-radius:0.75rem;font-size:1rem;" />
            <textarea placeholder="Your message" rows="5" style="padding:0.75rem 1rem;border:1px solid #d1d5db;border-radius:0.75rem;font-size:1rem;resize:vertical;"></textarea>
            <button type="submit" style="background:#F7941D;color:white;padding:0.875rem;border-radius:0.75rem;font-weight:600;font-size:1rem;border:none;cursor:pointer;">Send Message</button>
          </form>
        </div>
      </section>`
  }

  return ''
}

export function sectionsToHtml(sections: PageSection[]): string {
  return sections.map(sectionToHtml).join('\n')
}
