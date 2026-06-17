import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksImage extends Struct.ComponentSchema {
  collectionName: 'components_blocks_images';
  info: {
    displayName: 'Image';
    icon: 'landscape';
  };
  attributes: {
    ctaLink: Schema.Attribute.String;
    ctaText: Schema.Attribute.String;
    description: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    title: Schema.Attribute.String;
  };
}

export interface BlocksNote extends Struct.ComponentSchema {
  collectionName: 'components_blocks_notes';
  info: {
    displayName: 'Note';
    icon: 'message';
  };
  attributes: {
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['info', 'success', 'warning', 'danger']
    > &
      Schema.Attribute.DefaultTo<'info'>;
  };
}

export interface BlocksParagraph extends Struct.ComponentSchema {
  collectionName: 'components_blocks_paragraphs';
  info: {
    displayName: 'Paragraph';
    icon: 'message';
  };
  attributes: {
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
  };
}

export interface BlocksTable extends Struct.ComponentSchema {
  collectionName: 'components_blocks_tables';
  info: {
    displayName: 'Table';
    icon: 'apps';
  };
  attributes: {
    caption: Schema.Attribute.String;
    rows: Schema.Attribute.Component<'shared.row', true>;
  };
}

export interface BlocksVideo extends Struct.ComponentSchema {
  collectionName: 'components_blocks_videos';
  info: {
    displayName: 'Video';
    icon: 'monitor';
  };
  attributes: {
    ctaLink: Schema.Attribute.String;
    ctaText: Schema.Attribute.String;
    description: Schema.Attribute.String;
    video: Schema.Attribute.Media<'videos'> & Schema.Attribute.Required;
  };
}

export interface SectionsBestSeller extends Struct.ComponentSchema {
  collectionName: 'components_sections_best_sellers';
  info: {
    displayName: 'BestSeller';
    icon: 'folder';
  };
  attributes: {
    limit: Schema.Attribute.Integer;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heroes';
  info: {
    displayName: 'Hero';
    icon: 'folder';
  };
  attributes: {
    imageItems: Schema.Attribute.Component<'blocks.image', true> &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    primaryCtaLink: Schema.Attribute.String;
    primaryCtaText: Schema.Attribute.String;
    secondaryCtaLink: Schema.Attribute.String;
    secondaryCtaText: Schema.Attribute.String;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<['image', 'video']> &
      Schema.Attribute.DefaultTo<'video'>;
    video: Schema.Attribute.Media<'videos'> & Schema.Attribute.Required;
  };
}

export interface SectionsProductsByCategory extends Struct.ComponentSchema {
  collectionName: 'components_sections_products_by_categories';
  info: {
    displayName: 'ProductsByCategory';
    icon: 'folder';
  };
  attributes: {
    category: Schema.Attribute.Relation<'oneToOne', 'api::category.category'>;
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<5>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    displayName: 'Link';
    icon: 'folder';
  };
  attributes: {
    ctaLink: Schema.Attribute.String;
    ctaText: Schema.Attribute.String;
  };
}

export interface SharedLocation extends Struct.ComponentSchema {
  collectionName: 'components_shared_locations';
  info: {
    displayName: 'Location';
    icon: 'folder';
  };
  attributes: {
    address: Schema.Attribute.String;
    latitude: Schema.Attribute.Decimal;
    longitude: Schema.Attribute.Decimal;
  };
}

export interface SharedMenu extends Struct.ComponentSchema {
  collectionName: 'components_shared_menus';
  info: {
    displayName: 'Menu';
    icon: 'bulletList';
  };
  attributes: {
    items: Schema.Attribute.Component<'shared.menu-item', true>;
    logo: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedMenuItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_menu_items';
  info: {
    displayName: 'MenuItem';
  };
  attributes: {
    label: Schema.Attribute.String;
    link: Schema.Attribute.String;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedRow extends Struct.ComponentSchema {
  collectionName: 'components_shared_rows';
  info: {
    displayName: 'TableRow';
    icon: 'bulletList';
  };
  attributes: {
    cells: Schema.Attribute.JSON & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blocks.image': BlocksImage;
      'blocks.note': BlocksNote;
      'blocks.paragraph': BlocksParagraph;
      'blocks.table': BlocksTable;
      'blocks.video': BlocksVideo;
      'sections.best-seller': SectionsBestSeller;
      'sections.hero': SectionsHero;
      'sections.products-by-category': SectionsProductsByCategory;
      'shared.link': SharedLink;
      'shared.location': SharedLocation;
      'shared.menu': SharedMenu;
      'shared.menu-item': SharedMenuItem;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.row': SharedRow;
      'shared.seo': SharedSeo;
    }
  }
}
