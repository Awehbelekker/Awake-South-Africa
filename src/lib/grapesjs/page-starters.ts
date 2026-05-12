/** Pre-built layouts for “Page starters” in the visual builder (matches DIGG block markup). */

const HERO = `
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
    `

const TEXT_BLOCK = `
      <section style="padding:4rem 1rem;background:white;">
        <div style="max-width:48rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;color:#1B2A6B;margin-bottom:1rem;">Section Heading</h2>
          <p style="color:#555;line-height:1.7;font-size:1.05rem;">Add your content here. You can write paragraphs, add links, and style this text any way you like. The visual editor gives you full control over how your content looks.</p>
        </div>
      </section>
    `

const TWO_COL = `
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
    `

const FEATURE_GRID = `
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
    `

const CTA = `
      <section style="padding:4rem 1rem;background:#1B2A6B;color:white;text-align:center;">
        <div style="max-width:42rem;margin:0 auto;">
          <h2 style="font-size:2rem;font-weight:700;margin-bottom:1rem;color:white;">Ready to Get Started?</h2>
          <p style="font-size:1.1rem;opacity:0.9;margin-bottom:2rem;">Talk to our team about your project today.</p>
          <a href="/contact" style="display:inline-block;background:#F7941D;color:white;padding:0.875rem 2.5rem;border-radius:0.75rem;font-weight:600;text-decoration:none;font-size:1.05rem;">Contact Us</a>
        </div>
      </section>
    `

const CONTACT_FORM = `
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
    `

export type PageStarterId = 'landing' | 'about' | 'services-lead'

export interface PageStarter {
  id: PageStarterId
  title: string
  description: string
  html: string
}

export const PAGE_STARTERS: PageStarter[] = [
  {
    id: 'landing',
    title: 'Landing',
    description: 'Hero, story text, and call-to-action.',
    html: `${HERO}${TEXT_BLOCK}${CTA}`,
  },
  {
    id: 'about',
    title: 'About',
    description: 'Image + text columns and a CTA.',
    html: `${TWO_COL}${TEXT_BLOCK}${CTA}`,
  },
  {
    id: 'services-lead',
    title: 'Services & lead',
    description: 'Intro, three feature cards, form, and CTA.',
    html: `${TEXT_BLOCK}${FEATURE_GRID}${CONTACT_FORM}${CTA}`,
  },
]
