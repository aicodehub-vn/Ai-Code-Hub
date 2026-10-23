const EXTRA_STYLE=String.raw`
.extra-faq{background:var(--card)}
.faq-items{max-width:920px;margin-top:35px;border-top:1px solid var(--line)}
.faq-items details{border-bottom:1px solid var(--line);padding:18px 0}
.faq-items summary{cursor:pointer;font-size:20px;font-weight:600;letter-spacing:-.025em}
.faq-items summary:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
.faq-items details p{margin:13px 0 0}
.pricing-grid,.team-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:40px}
.price-plan,.team-member{background:var(--card);border:1px solid var(--line);padding:30px;min-height:170px}
.price-plan small{font-size:10px;letter-spacing:.12em;color:var(--accent)}
.price-plan h3,.team-member h3{font-size:24px;letter-spacing:-.04em;margin:20px 0 12px}
.price-plan p,.team-member p{font-size:14px}
.team-member span{font-size:32px;color:var(--accent)}
.motion-off *, .motion-off *::before,.motion-off *::after{animation:none!important;transition:none!important}
.motion-subtle .hero-copy{animation:enter-simple .5s ease-out both}
.motion-expressive .hero-copy{animation:enter-expressive .85s cubic-bezier(.17,.75,.2,1) both}
.motion-expressive .tile{animation:enter-simple .55s ease-out both}
.motion-expressive .tile:nth-child(2){animation-delay:.09s}
.motion-expressive .tile:nth-child(3){animation-delay:.18s}
@keyframes enter-simple{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes enter-expressive{from{opacity:0;transform:translateY(28px) scale(.975)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:760px){.pricing-grid,.team-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important}}
`;
export {EXTRA_STYLE};
