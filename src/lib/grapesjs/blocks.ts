import type { Editor } from 'grapesjs'

export default function diggBlocksPlugin(editor: Editor) {
  const bm = editor.BlockManager

  bm.add('hero-section', {
    label: 'Hero Section',
    category: 'DIGG Sections',
    content: `
      <section class="digg-hero" style="position:relative;min-height:80vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1B2A6B 0%,#2a3d8f 100%);overflow:hidden;color:white;text-align:center;">
        <div style="position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=80') center/cover no-repeat;opacity:0.3;"></div>
        <div style="position:relative;z-index:1;max-width:800px;padding:2rem;">
          <h1 style="font-size:3.5rem;font-weight:700;margin-bottom:1rem;letter-spacing:-0.02em;line-height:1.1;">Your Property Should Be Working Harder</h1>
          <p style="font-size:1.25rem;opacity:0.9;margin-bottom:2rem;max-width:600px;margin-left:auto;margin-right:auto;">Great design generates real returns. We help property owners unlock potential inside their buildings.</p>
          <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
            <a href="#" style="display:inline-block;background:#F7941D;color:white;padding:0.875rem 2rem;border-radius:0.75rem;font-weight:600;text-decoration:none;">See What We Do</a>
            <a href="/contact" style="display:inline-block;border:2px solid rgba(255,255,255,0.5);color:white;padding:0.875rem 2rem;border-radius:0.75rem;font-weight:600;text-decoration:none;">Talk to Our Team</a>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="6" y1="9" x2="18" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><rect x1="9" y1="16" x2="15" y2="19" rx="1"/></svg>',
  })

  bm.add('text-section', {
    label: 'Text Block',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:48rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;margin-bottom:1rem;">Section Heading</h2>
          <p style="color:#555;line-height:1.7;font-size:1.05rem;">Add your content here. You can write paragraphs, add links, and style this text any way you like. The visual editor gives you full control over how your content looks.</p>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="16" y2="14"/><line x1="4" y1="18" x2="12" y2="18"/></svg>',
  })

  bm.add('two-column', {
    label: 'Two Columns',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:72rem;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;">
          <div>
            <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;margin-bottom:1rem;">About Us</h2>
            <p style="color:#555;line-height:1.7;">Tell your story here. This section pairs text with an image side by side, giving you a professional layout that works on all devices.</p>
          </div>
          <div style="border-radius:1rem;overflow:hidden;">
            <img src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80" alt="About" style="width:100%;height:auto;display:block;border-radius:1rem;" />
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="9" height="16" rx="1"/><rect x="13" y="4" width="9" height="16" rx="1"/></svg>',
  })

  bm.add('feature-grid', {
    label: 'Feature Grid',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:#FAFAFA;">
        <div style="max-width:72rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2.5rem;">Our Features</h2>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;">
            <div style="background:white;padding:1.5rem;border-radius:1rem;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
              <img src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80" alt="Feature" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:0.75rem;margin-bottom:1rem;" />
              <h3 style="font-size:1.25rem;font-weight:700;color:#1B2A6B;margin-bottom:0.5rem;">Feature One</h3>
              <p style="color:#666;font-size:0.9rem;">Short description of this feature and what it offers to your clients.</p>
            </div>
            <div style="background:white;padding:1.5rem;border-radius:1rem;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
              <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80" alt="Feature" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:0.75rem;margin-bottom:1rem;" />
              <h3 style="font-size:1.25rem;font-weight:700;color:#1B2A6B;margin-bottom:0.5rem;">Feature Two</h3>
              <p style="color:#666;font-size:0.9rem;">Short description of this feature and what it offers to your clients.</p>
            </div>
            <div style="background:white;padding:1.5rem;border-radius:1rem;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
              <img src="https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&q=80" alt="Feature" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:0.75rem;margin-bottom:1rem;" />
              <h3 style="font-size:1.25rem;font-weight:700;color:#1B2A6B;margin-bottom:0.5rem;">Feature Three</h3>
              <p style="color:#666;font-size:0.9rem;">Short description of this feature and what it offers to your clients.</p>
            </div>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="6" height="8" rx="1"/><rect x="9" y="3" width="6" height="8" rx="1"/><rect x="16" y="3" width="6" height="8" rx="1"/><rect x="2" y="13" width="6" height="8" rx="1"/><rect x="9" y="13" width="6" height="8" rx="1"/><rect x="16" y="13" width="6" height="8" rx="1"/></svg>',
  })

  bm.add('image-section', {
    label: 'Full Image',
    category: 'DIGG Sections',
    content: `
      <section style="padding:2rem 1rem;">
        <div style="max-width:72rem;margin:0 auto;">
          <div style="border-radius:1rem;overflow:hidden;">
            <img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80" alt="Section image" style="width:100%;height:auto;display:block;" />
          </div>
          <p style="text-align:center;color:#999;font-size:0.875rem;margin-top:0.75rem;">Optional caption for the image above</p>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  })

  bm.add('gallery-section', {
    label: 'Gallery',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:72rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2rem;">Gallery</h2>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;">
            <div style="border-radius:0.75rem;overflow:hidden;aspect-ratio:1;"><img src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80" alt="Gallery 1" style="width:100%;height:100%;object-fit:cover;" /></div>
            <div style="border-radius:0.75rem;overflow:hidden;aspect-ratio:1;"><img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80" alt="Gallery 2" style="width:100%;height:100%;object-fit:cover;" /></div>
            <div style="border-radius:0.75rem;overflow:hidden;aspect-ratio:1;"><img src="https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&q=80" alt="Gallery 3" style="width:100%;height:100%;object-fit:cover;" /></div>
            <div style="border-radius:0.75rem;overflow:hidden;aspect-ratio:1;"><img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80" alt="Gallery 4" style="width:100%;height:100%;object-fit:cover;" /></div>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>',
  })

  bm.add('stats-bar', {
    label: 'Stats Bar',
    category: 'DIGG Sections',
    content: `
      <section style="padding:3rem 1rem;background:linear-gradient(135deg,#1B2A6B,#2a3d8f);color:white;">
        <div style="max-width:72rem;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;text-align:center;">
          <div>
            <div style="font-size:3rem;font-weight:700;color:#5BC8E8;">50+</div>
            <div style="font-size:0.9rem;opacity:0.8;text-transform:uppercase;letter-spacing:0.05em;">Projects</div>
          </div>
          <div>
            <div style="font-size:3rem;font-weight:700;color:#F7941D;">10</div>
            <div style="font-size:0.9rem;opacity:0.8;text-transform:uppercase;letter-spacing:0.05em;">Years Experience</div>
          </div>
          <div>
            <div style="font-size:3rem;font-weight:700;color:#5BC8E8;">100+</div>
            <div style="font-size:0.9rem;opacity:0.8;text-transform:uppercase;letter-spacing:0.05em;">Happy Clients</div>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="12" width="4" height="8"/><rect x="10" y="8" width="4" height="12"/><rect x="16" y="4" width="4" height="16"/></svg>',
  })

  bm.add('testimonial-section', {
    label: 'Testimonial',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:#FAFAFA;">
        <div style="max-width:42rem;margin:0 auto;text-align:center;">
          <div style="font-size:3rem;color:#5BC8E8;margin-bottom:1rem;">&ldquo;</div>
          <blockquote style="font-size:1.25rem;color:#333;font-style:italic;line-height:1.8;margin:0 0 1.5rem 0;">Working with this team transformed how we think about our property portfolio. The results speak for themselves.</blockquote>
          <div style="font-weight:700;color:#1B2A6B;">Jane Smith</div>
          <div style="font-size:0.875rem;color:#666;">Property Developer, Smith Properties</div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>',
  })

  bm.add('cta-section', {
    label: 'Call to Action',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:#1B2A6B;color:white;text-align:center;">
        <div style="max-width:42rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;margin-bottom:1rem;color:white;">Ready to Get Started?</h2>
          <p style="font-size:1.1rem;opacity:0.9;margin-bottom:2rem;">Talk to our team about your project today.</p>
          <a href="/contact" style="display:inline-block;background:#F7941D;color:white;padding:0.875rem 2.5rem;border-radius:0.75rem;font-weight:600;text-decoration:none;font-size:1.05rem;">Contact Us</a>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 14h4"/><path d="M8 10h8"/></svg>',
  })

  bm.add('faq-section', {
    label: 'FAQ',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:48rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2.5rem;">Frequently Asked Questions</h2>
          <div style="border-top:1px solid #e5e7eb;">
            <div style="padding:1.25rem 0;border-bottom:1px solid #e5e7eb;">
              <h3 style="font-size:1.1rem;font-weight:600;color:#1B2A6B;margin-bottom:0.5rem;">What services do you offer?</h3>
              <p style="color:#666;line-height:1.6;">We offer a full range of architecture, property development, and design services tailored to your project needs.</p>
            </div>
            <div style="padding:1.25rem 0;border-bottom:1px solid #e5e7eb;">
              <h3 style="font-size:1.1rem;font-weight:600;color:#1B2A6B;margin-bottom:0.5rem;">How do I get started?</h3>
              <p style="color:#666;line-height:1.6;">Contact us through our form and we'll schedule a consultation to discuss your vision and requirements.</p>
            </div>
            <div style="padding:1.25rem 0;border-bottom:1px solid #e5e7eb;">
              <h3 style="font-size:1.1rem;font-weight:600;color:#1B2A6B;margin-bottom:0.5rem;">What is the typical timeline?</h3>
              <p style="color:#666;line-height:1.6;">Timelines vary based on scope, but most projects run between 3 to 12 months from initial concept to completion.</p>
            </div>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  })

  bm.add('video-section', {
    label: 'Video Embed',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:#FAFAFA;">
        <div style="max-width:56rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2rem;">Watch Our Story</h2>
          <div style="position:relative;padding-bottom:56.25%;height:0;border-radius:1rem;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10,8 16,12 10,16"/></svg>',
  })

  bm.add('logo-strip', {
    label: 'Logo Strip',
    category: 'DIGG Sections',
    content: `
      <section style="padding:3rem 1rem;background:white;border-top:1px solid #eee;border-bottom:1px solid #eee;">
        <div style="max-width:72rem;margin:0 auto;text-align:center;">
          <p style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:1.5rem;">Trusted By</p>
          <div style="display:flex;align-items:center;justify-content:center;gap:3rem;flex-wrap:wrap;opacity:0.5;">
            <div style="font-size:1.2rem;font-weight:700;color:#333;">Partner 1</div>
            <div style="font-size:1.2rem;font-weight:700;color:#333;">Partner 2</div>
            <div style="font-size:1.2rem;font-weight:700;color:#333;">Partner 3</div>
            <div style="font-size:1.2rem;font-weight:700;color:#333;">Partner 4</div>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="8" width="5" height="5" rx="0.5"/><rect x="9.5" y="8" width="5" height="5" rx="0.5"/><rect x="17" y="8" width="5" height="5" rx="0.5"/></svg>',
  })

  bm.add('contact-form', {
    label: 'Contact Form',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:#FAFAFA;">
        <div style="max-width:36rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2rem;">Get in Touch</h2>
          <form style="display:flex;flex-direction:column;gap:1rem;">
            <input type="text" placeholder="Your name" style="padding:0.75rem 1rem;border:1px solid #d1d5db;border-radius:0.75rem;font-size:1rem;" />
            <input type="email" placeholder="Email address" style="padding:0.75rem 1rem;border:1px solid #d1d5db;border-radius:0.75rem;font-size:1rem;" />
            <input type="tel" placeholder="Phone (optional)" style="padding:0.75rem 1rem;border:1px solid #d1d5db;border-radius:0.75rem;font-size:1rem;" />
            <textarea placeholder="Your message" rows="5" style="padding:0.75rem 1rem;border:1px solid #d1d5db;border-radius:0.75rem;font-size:1rem;resize:vertical;"></textarea>
            <button type="submit" style="background:#F7941D;color:white;padding:0.875rem;border-radius:0.75rem;font-weight:600;font-size:1rem;border:none;cursor:pointer;">Send Message</button>
          </form>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  })

  bm.add('divider-section', {
    label: 'Divider',
    category: 'DIGG Sections',
    content: `
      <div style="padding:2rem 1rem;">
        <hr style="max-width:72rem;margin:0 auto;border:none;border-top:1px solid #e5e7eb;" />
      </div>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="12" x2="21" y2="12"/></svg>',
  })

  bm.add('spacer', {
    label: 'Spacer',
    category: 'DIGG Sections',
    content: '<div style="height:4rem;"></div>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="4" x2="12" y2="20"/><polyline points="8,8 12,4 16,8"/><polyline points="8,16 12,20 16,16"/></svg>',
  })

  bm.add('pricing-table', {
    label: 'Pricing Table',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:#FAFAFA;">
        <div style="max-width:72rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:0.5rem;">Pricing</h2>
          <p style="text-align:center;color:#666;margin-bottom:2.5rem;">Choose the plan that fits your needs</p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;">
            <div style="background:white;padding:2rem;border-radius:1rem;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
              <h3 style="font-size:1.1rem;font-weight:700;color:#1B2A6B;margin-bottom:0.5rem;">Starter</h3>
              <div style="font-size:2.5rem;font-weight:700;color:#1B2A6B;margin-bottom:1rem;">R2,500<span style="font-size:0.9rem;font-weight:400;color:#999;">/mo</span></div>
              <ul style="text-align:left;color:#555;font-size:0.9rem;line-height:2;list-style:none;padding:0;margin-bottom:1.5rem;">
                <li>&#10003; Basic consultation</li><li>&#10003; Concept design</li><li>&#10003; Email support</li>
              </ul>
              <a href="#" style="display:block;padding:0.75rem;border:2px solid #1B2A6B;border-radius:0.75rem;color:#1B2A6B;font-weight:600;text-decoration:none;">Get Started</a>
            </div>
            <div style="background:#1B2A6B;padding:2rem;border-radius:1rem;box-shadow:0 4px 20px rgba(27,42,107,0.3);text-align:center;color:white;transform:scale(1.05);">
              <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;background:#F7941D;display:inline-block;padding:0.25rem 1rem;border-radius:2rem;margin-bottom:0.75rem;font-weight:700;">Most Popular</div>
              <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem;">Professional</h3>
              <div style="font-size:2.5rem;font-weight:700;margin-bottom:1rem;">R7,500<span style="font-size:0.9rem;font-weight:400;opacity:0.7;">/mo</span></div>
              <ul style="text-align:left;font-size:0.9rem;line-height:2;list-style:none;padding:0;margin-bottom:1.5rem;opacity:0.9;">
                <li>&#10003; Full design service</li><li>&#10003; 3D renders</li><li>&#10003; Priority support</li><li>&#10003; Project management</li>
              </ul>
              <a href="#" style="display:block;padding:0.75rem;background:#F7941D;border-radius:0.75rem;color:white;font-weight:600;text-decoration:none;">Get Started</a>
            </div>
            <div style="background:white;padding:2rem;border-radius:1rem;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">
              <h3 style="font-size:1.1rem;font-weight:700;color:#1B2A6B;margin-bottom:0.5rem;">Enterprise</h3>
              <div style="font-size:2.5rem;font-weight:700;color:#1B2A6B;margin-bottom:1rem;">Custom</div>
              <ul style="text-align:left;color:#555;font-size:0.9rem;line-height:2;list-style:none;padding:0;margin-bottom:1.5rem;">
                <li>&#10003; Everything in Pro</li><li>&#10003; Dedicated manager</li><li>&#10003; Custom integrations</li><li>&#10003; SLA guarantee</li>
              </ul>
              <a href="#" style="display:block;padding:0.75rem;border:2px solid #1B2A6B;border-radius:0.75rem;color:#1B2A6B;font-weight:600;text-decoration:none;">Contact Us</a>
            </div>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="1" width="6" height="22" rx="1"/><rect x="16" y="3" width="6" height="18" rx="1"/></svg>',
  })

  bm.add('team-grid', {
    label: 'Team Grid',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:72rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:0.5rem;">Our Team</h2>
          <p style="text-align:center;color:#666;margin-bottom:2.5rem;">Meet the people behind the projects</p>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2rem;">
            <div style="text-align:center;">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop" alt="Team" style="width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 1rem auto;display:block;" />
              <h3 style="font-size:1.1rem;font-weight:700;color:#1B2A6B;margin-bottom:0.25rem;">John Smith</h3>
              <p style="color:#F7941D;font-size:0.85rem;font-weight:500;">Director</p>
            </div>
            <div style="text-align:center;">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop" alt="Team" style="width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 1rem auto;display:block;" />
              <h3 style="font-size:1.1rem;font-weight:700;color:#1B2A6B;margin-bottom:0.25rem;">Sarah Williams</h3>
              <p style="color:#F7941D;font-size:0.85rem;font-weight:500;">Lead Architect</p>
            </div>
            <div style="text-align:center;">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop" alt="Team" style="width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 1rem auto;display:block;" />
              <h3 style="font-size:1.1rem;font-weight:700;color:#1B2A6B;margin-bottom:0.25rem;">Mike Johnson</h3>
              <p style="color:#F7941D;font-size:0.85rem;font-weight:500;">Project Manager</p>
            </div>
            <div style="text-align:center;">
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop" alt="Team" style="width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 1rem auto;display:block;" />
              <h3 style="font-size:1.1rem;font-weight:700;color:#1B2A6B;margin-bottom:0.25rem;">Lisa Chen</h3>
              <p style="color:#F7941D;font-size:0.85rem;font-weight:500;">Interior Designer</p>
            </div>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="6" r="3"/><circle cx="16" cy="6" r="3"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M10 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>',
  })

  bm.add('map-embed', {
    label: 'Map',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:72rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;text-align:center;margin-bottom:2rem;">Find Us</h2>
          <div style="border-radius:1rem;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3310.2!2d18.42!3d-33.92!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDU1JzEyLjAiUyAxOMKwMjUnMTIuMCJF!5e0!3m2!1sen!2sza!4v1600000000000" style="width:100%;height:400px;border:none;" allowfullscreen loading="lazy"></iframe>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  })

  bm.add('banner-strip', {
    label: 'Banner Strip',
    category: 'DIGG Sections',
    content: `
      <div style="background:#F7941D;padding:0.875rem 1rem;text-align:center;">
        <p style="color:white;font-weight:600;font-size:0.95rem;margin:0;">Special Offer: Get 20% off all services this month. <a href="#" style="color:white;text-decoration:underline;font-weight:700;">Learn more</a></p>
      </div>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="9" width="20" height="6" rx="1"/><line x1="6" y1="12" x2="18" y2="12"/></svg>',
  })

  bm.add('three-column-text', {
    label: '3-Col Text',
    category: 'DIGG Sections',
    content: `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:72rem;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:2.5rem;">
          <div>
            <div style="width:48px;height:48px;background:#5BC8E8;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;color:white;font-size:1.5rem;font-weight:700;">1</div>
            <h3 style="font-size:1.2rem;font-weight:700;color:#1B2A6B;margin-bottom:0.5rem;">First Step</h3>
            <p style="color:#666;line-height:1.6;font-size:0.95rem;">Describe the first step of your process or the first benefit you offer.</p>
          </div>
          <div>
            <div style="width:48px;height:48px;background:#F7941D;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;color:white;font-size:1.5rem;font-weight:700;">2</div>
            <h3 style="font-size:1.2rem;font-weight:700;color:#1B2A6B;margin-bottom:0.5rem;">Second Step</h3>
            <p style="color:#666;line-height:1.6;font-size:0.95rem;">Describe the second step of your process or another key benefit.</p>
          </div>
          <div>
            <div style="width:48px;height:48px;background:#1B2A6B;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;color:white;font-size:1.5rem;font-weight:700;">3</div>
            <h3 style="font-size:1.2rem;font-weight:700;color:#1B2A6B;margin-bottom:0.5rem;">Third Step</h3>
            <p style="color:#666;line-height:1.6;font-size:0.95rem;">Describe the third step to complete the flow for your users.</p>
          </div>
        </div>
      </section>
    `,
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="5" height="16" rx="1"/></svg>',
  })
}
