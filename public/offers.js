/**
 * Low-Ticket Offers Library — shared data for all video nurture pages.
 * Each offer: { id, name, price, url, description }
 */
var UTM_PARAM = '?utm_source=YouTube+Embeds&utm_medium=cta_link&utm_campaign=cta_link';

var LOW_TICKET_OFFERS = [
  {
    id: 'rapid-launch-scale',
    name: 'Rapid Launch And Scale Framework',
    price: '$5',
    url: 'https://rapidscaleframework.com/of',
    tag: 'best-seller',
    description: 'My simple system for launching and scaling Meta ads. The three-campaign setup I use to get profitable campaigns live in about 15 minutes.'
  },
  {
    id: 'rapid-scale-newsletter',
    name: 'Rapid Scale Newsletter',
    price: '$37/mo',
    url: 'https://rapidscaleframework.com/news-sp',
    tag: 'subscription',
    description: 'My monthly newsletter for advertisers, media buyers, and entrepreneurs. What\'s actually working in paid ads right now.'
  },
  {
    id: 'newsletter-trial',
    name: 'Rapid Scale Newsletter ($1 Trial)',
    price: '$1 trial',
    url: 'https://rapidscaleframework.com/news-spt',
    tag: 'trial',
    description: 'Test the newsletter for 30 days for a buck, then $37/mo. Zero risk to stick your toe in the water first.'
  },
  {
    id: 'dfy-ads',
    name: 'DFY Ads Package',
    price: '$197',
    url: 'https://rapidscaleframework.com/dfy-ads',
    description: 'My team builds your ads for you. 20 done-for-you images mixing AI ads and Ugly Ads, plus 5 copies and 5 headlines.'
  },
  {
    id: 'dfy-lto',
    name: 'DFY Low Ticket Offer Package',
    price: '$397',
    url: 'https://rapidscaleframework.com/dfy-lto',
    tag: 'popular',
    description: 'We hand you 10 front-end offer ideas based on your market, pre-select a winner, and write the sales page copy for you.'
  },
  {
    id: 'two-campaign',
    name: '2 Campaign Method',
    price: '$37',
    url: 'https://rapidscaleframework.com/method-of',
    description: 'The two-campaign setup I use to keep testing and scaling separate, so you know what\'s actually working before you scale.'
  },
  {
    id: 'andromeda',
    name: 'Andromeda Creatives Workshop',
    price: '$37',
    url: 'https://rapidscaleframework.com/andromeda-sp',
    description: 'A watch-over-my-shoulder workshop on making creatives for Meta\'s Andromeda algorithm.'
  },
  {
    id: 'creative-multiplication',
    name: 'Creative Multiplication Workshop',
    price: '$97',
    url: 'https://rapidscaleframework.com/mutiplication-of',
    tag: 'popular',
    description: 'How I take one winning creative and turn it into dozens of variations to beat fatigue without starting from scratch.'
  },
  {
    id: 'low-ticket-book',
    name: 'Low Ticket Profits Book (Digital)',
    price: '$4.95',
    url: 'https://lowticketbook.com/digital-sp',
    tag: 'best-seller',
    description: 'How I build a daily-buyer machine with cheap front-end offers that liquidate ad spend and feed people into the back end.'
  },
  {
    id: 'low-ticket-audit',
    name: 'Low Ticket Health Audit',
    price: '$27',
    url: 'https://rapidscaleframework.com/audit-of',
    description: 'A tool where you plug in your funnel numbers and it tells you exactly where your low-ticket funnel is leaking.'
  },
  {
    id: 'offer-validation',
    name: 'Offer Validation Workshop',
    price: '$27',
    url: 'https://rapidscaleframework.com/validate-of',
    description: 'Two ways to test whether people actually want your offer before you build a single thing.'
  },
  {
    id: 'branding-blueprint',
    name: 'Rapid Branding Blueprint',
    price: '$7',
    url: 'https://rapidscaleframework.com/branding-of',
    description: 'How I run cheap branding campaigns on Meta to build a warm audience of future buyers for a few bucks each.'
  },
  {
    id: 'reels-framework',
    name: 'Rapid Reels Framework',
    price: '$17',
    url: 'https://rapidscaleframework.com/reels-of',
    description: 'My framework for Reels ads that actually convert. Short-form video that sells, no studio required.'
  },
  {
    id: 'low-ticket-workshop',
    name: 'Low Ticket Workshop',
    price: '$27',
    url: 'https://rapidscaleframework.com/workshop-of',
    description: 'How I launch low-ticket offers that bring in daily leads and buyers, liquidate ad spend, and set up the back end.'
  },
  {
    id: 'rapid-scale-bundle',
    name: 'Rapid Scale Bundle',
    price: '$97',
    url: 'https://rapidscaleframework.com/bundle-sp',
    description: 'My complete advertising arsenal: Rapid Scale Framework, Rapid Creatives, Retargeting Playbook, Branding Playbook, and tracking workflow.'
  },
  {
    id: 'retargeting-playbook',
    name: 'Ultimate Retargeting Playbook',
    price: '$7',
    url: 'https://rapidscaleframework.com/retargeting-of',
    description: 'My three-tier cold, warm, and hot retargeting system. The exact audience setups that drop your CPAs.'
  },
  {
    id: 'tracking-crash-course',
    name: 'Tracking and Attribution Crash Course',
    price: '$47',
    url: 'https://rapidscaleframework.com/tracking-of',
    description: 'Set up real attribution in 60 minutes and recover the conversion data your pixel is missing.'
  },
  {
    id: 'rapid-scale-mastery',
    name: 'Rapid Scale Mastery',
    price: '$397/mo',
    url: 'https://rapidscalemastery.com/',
    tag: 'premium',
    description: 'My high-level Mastermind of Advertisers and Media Buyers. Weekly calls, live training, over-the-shoulder campaigns.'
  },
  {
    id: 'upsells-that-ascend',
    name: 'Upsells That Ascend',
    price: '$67',
    url: 'https://rapidscaleframework.com/upsells',
    description: 'How to create upsells that get higher AOVs but also get higher back-end high-ticket clients.'
  }
];

/**
 * Render the offer grid HTML into any element by ID.
 * Call after DOM is ready.
 */
function renderOfferGrid(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var html = '<div class="offer-grid">';
  for (var i = 0; i < LOW_TICKET_OFFERS.length; i++) {
    var o = LOW_TICKET_OFFERS[i];
    var tagHtml = o.tag
      ? '<span class="offer-tag offer-tag--' + o.tag + '">' + o.tag + '</span>'
      : '';
    html +=
      '<a href="' + o.url + (o.url.indexOf('?') === -1 ? UTM_PARAM : UTM_PARAM.replace('?', '&')) + '" class="offer-card" target="_blank" rel="noopener noreferrer" data-track="cta">' +
        '<div class="offer-card-body">' +
          '<div class="offer-card-top">' +
            '<h3 class="offer-name">' + o.name + '</h3>' +
            tagHtml +
          '</div>' +
          '<p class="offer-desc">' + o.description + '</p>' +
        '</div>' +
        '<div class="offer-card-footer">' +
          '<span class="offer-price">' + o.price + '</span>' +
          '<span class="offer-arrow">&rarr;</span>' +
        '</div>' +
      '</a>';
  }
  html += '</div>';
  container.innerHTML = html;
}
