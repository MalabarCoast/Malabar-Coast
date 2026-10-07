import type {StructureResolver} from 'sanity/structure'

const singleton = (S: Parameters<StructureResolver>[0], title: string, schemaType: string, documentId: string) =>
  S.listItem().title(title).child(S.document().schemaType(schemaType).documentId(documentId))

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Malabar Coast content')
    .items([
      singleton(S, 'Site settings', 'siteSettings', 'siteSettings'),
      singleton(S, 'Menu page', 'menuPage', 'menuPage'),
      singleton(S, 'Booking route', 'bookingExperienceSettings', 'bookingExperienceSettings'),
      S.divider(),
      S.listItem().title('Menu items').schemaType('menuItem').child(S.documentTypeList('menuItem').title('Menu items').defaultOrdering([{field: 'displayOrder', direction: 'asc'}])),
      S.listItem().title('Menu categories').schemaType('menuCategory').child(S.documentTypeList('menuCategory').title('Menu categories').defaultOrdering([{field: 'orderRank', direction: 'asc'}])),
      S.divider(),
      S.listItem().title('Offers & carousel posters').schemaType('promotion').child(S.documentTypeList('promotion').title('Offers & carousel posters').defaultOrdering([{field: 'displayOrder', direction: 'asc'}])),
      S.listItem().title('Special-day booking pages').schemaType('specialDayCampaign').child(S.documentTypeList('specialDayCampaign').title('Special-day booking pages').defaultOrdering([{field: '_createdAt', direction: 'desc'}])),
      S.listItem().title("Today's specials · choose from menu").schemaType('dailySpecial').child(S.documentTypeList('dailySpecial').title("Today's specials · choose from menu").defaultOrdering([{field: 'displayOrder', direction: 'asc'}])),
      S.divider(),
      S.listItem().title('Website pages').schemaType('marketingPage').child(S.documentTypeList('marketingPage').title('Website pages')),
      S.listItem().title('FAQs').schemaType('faqItem').child(S.documentTypeList('faqItem').title('FAQs').defaultOrdering([{field: 'displayOrder', direction: 'asc'}])),
      S.listItem().title('Testimonials').schemaType('testimonial').child(S.documentTypeList('testimonial').title('Testimonials').defaultOrdering([{field: 'displayOrder', direction: 'asc'}])),
      S.listItem().title('Legal pages').schemaType('legalPage').child(S.documentTypeList('legalPage').title('Legal pages')),
    ])
