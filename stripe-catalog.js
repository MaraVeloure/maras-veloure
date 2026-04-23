const STRIPE_CATALOG = {
  'mv-disciplined-progress-tee': {
    name: 'DISCIPLINED PROGRESS TSHIRT',
    subtitle: '',
    description: 'A special tee built around discipline, growth, consistency, faith, and fitness.',
    images: {
      Black: 'assets/images/disciplined-progress-black.svg',
      White: 'assets/images/disciplined-progress-white.svg'
    },
    priceBySize: {
      S: 16,
      M: 16,
      L: 16,
      XL: 16,
      '1XL': 20,
      '2XL': 20,
      '3XL': 20,
      '4XL': 25
    }
  },
  'mv-serve-the-lord-tee': {
    name: 'I WILL SERVE THE LORD WITH SINCERITY AND TRUTH',
    subtitle: 'Joshua 24:14',
    description: 'Declare that you will serve the Lord with sincerity in prayer and sincerity in truth. This unisex cotton tee is made to wear your faith boldly.',
    images: {
      Black: 'assets/images/serve-the-lord-black.svg',
      White: 'assets/images/serve-the-lord-white.svg',
      'Light Pink': 'assets/images/serve-the-lord-pink.svg',
      Purple: 'assets/images/serve-the-lord-purple.svg',
      Red: 'assets/images/serve-the-lord-red.svg',
      Blue: 'assets/images/serve-the-lord-blue.svg'
    },
    priceBySize: {
      S: 16,
      M: 16,
      L: 16,
      XL: 16,
      '1XL': 20,
      '2XL': 20,
      '3XL': 20,
      '4XL': 25,
      '5XL': 25
    }
  }
};

module.exports = { STRIPE_CATALOG };
