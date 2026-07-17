/**
 * Low-Ticket Offers Library — shared data for all video nurture pages.
 * Each offer: { id, name, price, url, description }
 */
var UTM_PARAM = '?utm_source=YouTube+Embeds&utm_medium=cta_link&utm_campaign=cta_link';

var LOW_TICKET_OFFERS = [
  {
    id: 'rapid-scale-newsletter',
    name: 'Rapid Scale Newsletter',
    price: '$37/mo',
    url: 'https://rapidscaleframework.com/news-sp',
    tag: 'subscription',
    description: 'My monthly newsletter for advertisers, media buyers, and entrepreneurs. What\'s actually working in paid ads right now.'
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
    id: 'offer-validation',
    name: 'Offer Validation Workshop',
    price: '$27',
    url: 'https://rapidscaleframework.com/validate-of',
    description: 'Two ways to test whether people actually want your offer before you build a single thing.'
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
